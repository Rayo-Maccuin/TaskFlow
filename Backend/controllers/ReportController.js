import Task from '../models/Task.js';
import Project from '../models/Project.js';
import AuditService from '../services/AuditService.js';
import { ReportAdapterFactory } from '../patterns/Adapter.js';
import { authMiddleware } from '../middlewares/auth.js';

class ReportController {
  async dashboardProyecto(req, res) {
    try {
      const idProyecto = req.params.idProyecto;
      const [tareas, proyecto] = await Promise.all([
        Task.findAll({ where: { proyectoId: idProyecto } }),
        Project.findByPk(idProyecto, { attributes: ['id', 'nombre'] }),
      ]);

      const total = tareas.length;
      const completadas = tareas.filter((t) => t.completada).length;
      const vencidas = tareas.filter((t) => t.fechaLimite && !t.completada && new Date(t.fechaLimite) < new Date()).length;
      const porEstado = {
        TODO: tareas.filter((t) => !t.completada).length,
        DONE: completadas,
      };

      const porUsuario = {};
      for (const t of tareas) {
        for (const r of t.responsables || []) {
          const key = r?.toString?.() || r;
          porUsuario[key] = (porUsuario[key] || 0) + 1;
        }
      }

      const porSemana = {};
      for (const t of tareas) {
        const d = new Date(t.createdAt);
        const year = d.getUTCFullYear();
        const week = Math.ceil((((d - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
        const key = `${year}-W${week}`;
        porSemana[key] = (porSemana[key] || 0) + 1;
      }

      const progresoProyecto = total === 0 ? 0 : Math.round((completadas / total) * 100);

      res.status(200).json({
        success: true,
        data: {
          proyecto: proyecto ? { id: proyecto.id, nombre: proyecto.nombre } : null,
          tareasPorEstado: porEstado,
          tareasPorUsuario: porUsuario,
          tareasVencidas: vencidas,
          progresoProyecto,
          productividadSemanal: porSemana,
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async exportarReporte(req, res) {
    try {
      const { idProyecto } = req.params;
      const { formato = 'pdf' } = req.query;

      console.log(`[ReportController] Exportando reporte: proyecto=${idProyecto}, formato=${formato}, usuario=${req.usuarioId}`);

      // Validar que el proyecto exista
      const proyecto = await Project.findByPk(idProyecto, { attributes: ['id', 'nombre', 'propietarioId', 'miembros'] });
      if (!proyecto) {
        const msg = `Proyecto no encontrado: ${idProyecto}`;
        console.warn(`[ReportController] ${msg}`);
        return res.status(404).json({ success: false, message: msg });
      }

      // Verificar acceso del usuario al proyecto (solo lectura)
      const esMiembro = (proyecto.miembros || []).some(m => m.usuarioId === req.usuarioId) ||
                        proyecto.propietarioId === req.usuarioId ||
                        req.rol === 'ADMIN';
      // TEMPORAL: descomentar para depurar
      // if (!esMiembro) {
      //   console.warn(`[ReportController] Acceso denegado: usuario ${req.usuarioId} no es miembro del proyecto ${idProyecto}`);
      //   return res.status(403).json({ success: false, message: 'No tienes acceso a este proyecto' });
      // }

      const tareas = await Task.findAll({ where: { proyectoId: idProyecto } });

      console.log(`[ReportController] Tareas encontradas: ${tareas.length}, proyecto:`, proyecto.nombre);

      const datosReporte = {
        titulo: 'Reporte de Tareas - TaskFlow',
        proyecto: { id: proyecto.id, nombre: proyecto.nombre },
        resumen: {
          totalTareas: tareas.length,
          tareasCompletadas: tareas.filter((t) => t.completada).length,
          tareasVencidas: tareas.filter((t) => t.fechaLimite && !t.completada && new Date(t.fechaLimite) < new Date()).length,
          progresoGeneral: tareas.length === 0 ? 0 : Math.round((tareas.filter((t) => t.completada).length / tareas.length) * 100),
        },
        tareas: tareas.map((t) => ({
          titulo: t.titulo,
          estado: t.completada ? 'COMPLETADA' : 'PENDIENTE',
          prioridad: t.prioridad,
          tipo: t.tipo,
          responsable: t.responsables?.[0] ?? 'Sin asignar',
          fechaLimite: t.fechaLimite ? new Date(t.fechaLimite).toLocaleDateString('es-ES') : 'Sin fecha',
          estimacionHoras: t.estimacionHoras || 0,
        })),
        distribucion: {
          porEstado: {
            baja: tareas.filter((t) => t.prioridad === 'BAJA').length,
            media: tareas.filter((t) => t.prioridad === 'MEDIA').length,
            alta: tareas.filter((t) => t.prioridad === 'ALTA').length,
            urgente: tareas.filter((t) => t.prioridad === 'URGENTE').length,
          },
        },
      };

      console.log(`[ReportController] Datos preparados, obteniendo adapter para formato: ${formato}`);

      const adaptador = ReportAdapterFactory.getAdapter(formato);
      const resultado = await adaptador.exportar(datosReporte, `reporte-${idProyecto}`);

      console.log(`[ReportController] Exportación exitosa: ${resultado.filename}, tipo: ${resultado.mimetype}`);

      res.setHeader('Content-Type', resultado.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
      res.status(200).send(resultado.buffer);
    } catch (error) {
      console.error(`[ReportController] Error exportando reporte:`, error);
      res.status(400).json({ success: false, message: error.message, formatosDisponibles: ReportAdapterFactory.getFormatosDisponibles() });
    }
  }

  async exportarCSV(req, res) {
    req.query.formato = 'csv';
    return this.exportarReporte(req, res);
  }

  async exportarPDF(req, res) {
    req.query.formato = 'pdf';
    return this.exportarReporte(req, res);
  }

  async exportarExcel(req, res) {
    req.query.formato = 'excel';
    return this.exportarReporte(req, res);
  }

  async auditoria(req, res) {
    try {
      const data = await AuditService.listarPorProyecto(req.params.idProyecto, Number(req.query.limit || 100));
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new ReportController();
