/**
 * CONTROLADOR DE TAREAS
 * Maneja las peticiones HTTP relacionadas con tareas
 */

import { validationResult } from 'express-validator';
import TaskService from '../services/TaskService.js';
import { TaskBuilder } from '../patterns/Builder.js';
import SystemSetting from '../models/SystemSetting.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Board from '../models/Board.js';
import NotificationService from '../services/NotificationService.js';

class TaskController {
  extraerId(valor) {
    if (!valor) return null;
    if (typeof valor === 'string') return valor;
    if (valor.id) return valor.id.toString();
    if (valor.toString) return valor.toString();
    return null;
  }

  esMiembroProyecto(proyecto, usuarioId) {
    return (proyecto.miembros || []).some((m) => {
      const miembroId = this.extraerId(m?.usuarioId ?? m?.usuario ?? m);
      return miembroId === usuarioId;
    });
  }

  puedeVerProyecto(proyecto, req) {
    if (req.rol === 'ADMIN') return true;
    if (this.extraerId(proyecto.propietarioId) === req.usuarioId) return true;
    return this.esMiembroProyecto(proyecto, req.usuarioId);
  }

  puedeGestionarProyecto(proyecto, req) {
    if (req.rol === 'ADMIN') return true;
    if (this.extraerId(proyecto.propietarioId) === req.usuarioId) return true;
    return req.rol === 'PROJECT_MANAGER' && this.esMiembroProyecto(proyecto, req.usuarioId);
  }

  async validarAccesoProyecto(idProyecto, req, gestion = false) {
    const proyecto = await Project.findByPk(idProyecto, { attributes: ['propietarioId', 'miembros', 'estado'] });
    if (!proyecto) {
      const error = new Error('Proyecto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const permitido = gestion
      ? this.puedeGestionarProyecto(proyecto, req)
      : this.puedeVerProyecto(proyecto, req);

    if (!permitido) {
      const error = new Error(
        gestion
          ? 'No tienes permisos para gestionar tareas en este proyecto'
          : 'No tienes permisos para ver tareas de este proyecto'
      );
      error.statusCode = 403;
      throw error;
    }

    return proyecto;
  }

  async obtenerTareaConAcceso(idTarea, req) {
    const tarea = await Task.findByPk(idTarea, { attributes: ['proyectoId', 'creadorId'] });
    if (!tarea) {
      const error = new Error('Tarea no encontrada');
      error.statusCode = 404;
      throw error;
    }

    await this.validarAccesoProyecto(tarea.proyectoId, req, false);
    return { tarea };
  }

  async validarAccesoPorColumna(idColumna, req) {
    const boards = await Board.findAll({ attributes: ['proyectoId', 'columnas'] });
    const tablero = boards.find((board) => (board.columnas || []).some((col) => col.id == idColumna));

    if (!tablero) {
      const error = new Error('Columna no encontrada');
      error.statusCode = 404;
      throw error;
    }

    await this.validarAccesoProyecto(tablero.proyectoId, req, false);
  }

  async crear(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ success: false, errors: errores.array() });
      }

      const datosTarea = {
        titulo: req.body.titulo,
        descripcion: req.body.descripcion || '',
        tipo: req.body.tipo || 'TASK',
        prioridad: req.body.prioridad || 'MEDIA',
        proyecto: req.body.proyecto,
        columna: req.body.columna,
        fechaLimite: req.body.fechaLimite || null,
        estimacionHoras: req.body.estimacionHoras || 0,
        etiquetas: req.body.etiquetas || [],
      };

      await this.validarAccesoProyecto(datosTarea.proyecto, req, false);
      const tarea = await TaskService.crear(datosTarea, req.usuarioId);

      // Notificar a miembros del proyecto (incluido creador)
      try {
        console.log('[TaskController] Creando notificaciones para tarea:', tarea.id);
        const proyecto = await Project.findByPk(datosTarea.proyecto, {
          attributes: ['id', 'nombre', 'propietarioId', 'miembros']
        });
        
        if (proyecto) {
          const usuariosNotificar = new Set([req.usuarioId, proyecto.propietarioId]);
          (proyecto.miembros || []).forEach(m => usuariosNotificar.add(m.usuarioId));
          
          console.log('[TaskController] Usuarios a notificar:', Array.from(usuariosNotificar));
          
          const mensaje = `Nueva tarea "${tarea.titulo}" creada en proyecto "${proyecto.nombre}"`;
          const resultados = await Promise.allSettled(
            Array.from(usuariosNotificar).map(uid => 
              NotificationService.crearNotificacion(
                uid,
                mensaje,
                'TAREA_CREADA',
                tarea.id,
                'TAREA'
              )
            )
          );
          
          console.log('[TaskController] Resultados notificaciones:', resultados.map(r => r.status));
        } else {
          console.log('[TaskController] No se encontró proyecto para notificar');
        }
      } catch (notifErr) {
        console.error('? [TaskController] Error creando notificación de tarea:', notifErr);
      }

      res.status(201).json({ success: true, message: 'Tarea creada correctamente', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async crearConBuilder(req, res) {
    try {
      const { titulo, proyecto, columna, descripcion, tipo, prioridad, responsables, fechaLimite, etiquetas, subtareas } = req.body;
      await this.validarAccesoProyecto(proyecto, req, false);

      const tarea = await TaskService.crearConBuilder(titulo, proyecto, columna, req.usuarioId, (builder) => {
        builder
          .setDescripcion(descripcion || '')
          .setTipo(tipo || 'TASK')
          .setPrioridad(prioridad || 'MEDIA');

        if (responsables?.length > 0) builder.agregarResponsables(responsables);
        if (fechaLimite) builder.setFechaLimite(new Date(fechaLimite));
        if (etiquetas?.length > 0) builder.agregarEtiquetas(etiquetas);
        if (subtareas?.length > 0) builder.agregarSubtareas(subtareas);
      });

      res.status(201).json({ success: true, message: 'Tarea creada usando Builder', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async obtenerPorId(req, res) {
    try {
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.obtenerPorId(req.params.id);
      res.status(200).json({ success: true, data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async obtenerPorProyecto(req, res) {
    try {
      await this.validarAccesoProyecto(req.params.idProyecto, req, false);
      const tareas = await TaskService.obtenerPorProyecto(req.params.idProyecto);
      res.status(200).json({ success: true, data: tareas });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async obtenerPorColumna(req, res) {
    try {
      await this.validarAccesoPorColumna(req.params.idColumna, req);
      const tareas = await TaskService.obtenerPorColumna(req.params.idColumna);
      res.status(200).json({ success: true, data: tareas });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      console.log('actualizar - ID:', req.params.id, 'Usuario:', req.usuarioId, 'Body:', req.body);
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tareaActualizada = await TaskService.actualizar(req.params.id, { ...req.body, _usuarioCambio: req.usuarioId });
      console.log('Tarea actualizada exitosamente:', tareaActualizada.id);
      res.status(200).json({ success: true, message: 'Tarea actualizada correctamente', data: tareaActualizada });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      res.status(error.statusCode || 400).json({ success: false, message: error.message, errors: error.errors || [] });
    }
  }

  async clonar(req, res) {
    try {
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tareaClonada = await TaskService.clonar(req.params.id, req.usuarioId);
      res.status(201).json({ success: true, message: 'Tarea clonada correctamente', data: tareaClonada });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async moverAColumna(req, res) {
    try {
      const { idNuevaColumna, orden } = req.body;
      await this.obtenerTareaConAcceso(req.params.id, req);
      await this.validarAccesoPorColumna(idNuevaColumna, req);
      const tarea = await TaskService.moverAColumna(req.params.id, idNuevaColumna, orden || 0);
      res.status(200).json({ success: true, message: 'Tarea movida correctamente', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

   async completar(req, res) {
     try {
       await this.obtenerTareaConAcceso(req.params.id, req);
       const tarea = await TaskService.completar(req.params.id);
       
       // Notificar a miembros del proyecto
       try {
         const tareaCompleta = await Task.findByPk(req.params.id, {
           include: [{ model: Project, as: 'proyecto' }]
         });
         if (tareaCompleta?.proyecto) {
           const proyecto = tareaCompleta.proyecto;
           const usuariosNotificar = new Set([req.usuarioId, proyecto.propietarioId]);
           (proyecto.miembros || []).forEach(m => usuariosNotificar.add(m.usuarioId));
           
           const mensaje = `Tarea "${tareaCompleta.titulo}" marcada como completada en proyecto "${proyecto.nombre}"`;
           await Promise.all(
             Array.from(usuariosNotificar).map(uid => 
               NotificationService.crearNotificacion(
                 uid,
                 mensaje,
                 'TAREA_COMPLETADA',
                 tareaCompleta.id,
                 'TAREA'
               )
             )
           );
         }
       } catch (notifErr) {
         console.error('Error notificando completado:', notifErr);
       }

       res.status(200).json({ success: true, message: 'Tarea marcada como completada', data: tarea });
     } catch (error) {
       res.status(error.statusCode || 400).json({ success: false, message: error.message });
     }
   }

  async agregarComentario(req, res) {
    try {
      const { contenido } = req.body;
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.agregarComentario(req.params.id, req.usuarioId, contenido);
      res.status(201).json({ success: true, message: 'Comentario agregado correctamente', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async asignarResponsable(req, res) {
    try {
      const { idUsuario } = req.body;
      const tareaData = await this.obtenerTareaConAcceso(req.params.id, req);
      const proyecto = await Project.findByPk(tareaData.tarea.proyectoId, { attributes: ['propietarioId', 'miembros'] });
      const esPropietario = this.extraerId(proyecto.propietarioId) === idUsuario;
      const esMiembro = this.esMiembroProyecto(proyecto, idUsuario);

      if (!esPropietario && !esMiembro) {
        return res.status(400).json({ success: false, message: 'Solo puedes asignar usuarios que pertenezcan al proyecto' });
      }

      const tarea = await TaskService.asignarResponsable(req.params.id, idUsuario);
      res.status(200).json({ success: true, message: 'Responsable asignado correctamente', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async quitarResponsable(req, res) {
    try {
      const { idUsuario } = req.params;
      const tareaData = await this.obtenerTareaConAcceso(req.params.id, req);
      const proyecto = await Project.findByPk(tareaData.tarea.proyectoId, { attributes: ['propietarioId', 'miembros'] });
      const esPropietario = this.extraerId(proyecto.propietarioId) === idUsuario;
      const esMiembro = this.esMiembroProyecto(proyecto, idUsuario);

      if (!esPropietario && !esMiembro) {
        return res.status(400).json({ success: false, message: 'Solo puedes gestionar responsables que pertenezcan al proyecto' });
      }

      const tarea = await TaskService.quitarResponsable(req.params.id, idUsuario);
      res.status(200).json({ success: true, message: 'Responsable removido correctamente', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const { tarea } = await this.obtenerTareaConAcceso(req.params.id, req);
      const proyecto = await Project.findByPk(tarea.proyectoId, { attributes: ['propietarioId', 'miembros'] });
      const esAdmin = req.rol === 'ADMIN';
      const esPropietario = this.extraerId(proyecto.propietarioId) === req.usuarioId;
      const esProjectManager = req.rol === 'PROJECT_MANAGER' && this.esMiembroProyecto(proyecto, req.usuarioId);
      const esCreador = this.extraerId(tarea.creadorId) === req.usuarioId;

      if (!esAdmin && !esPropietario && !esProjectManager && !esCreador) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario, PROJECT_MANAGER del proyecto o creador puede eliminar la tarea' });
      }

      await TaskService.eliminar(req.params.id);
      res.status(200).json({ success: true, message: 'Tarea eliminada correctamente' });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async editarComentario(req, res) {
    try {
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.editarComentario(req.params.id, req.params.idComentario, req.usuarioId, req.body.contenido);
      res.status(200).json({ success: true, message: 'Comentario actualizado', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async eliminarComentario(req, res) {
    try {
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.eliminarComentario(req.params.id, req.params.idComentario, req.usuarioId);
      res.status(200).json({ success: true, message: 'Comentario eliminado', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async registrarTiempo(req, res) {
    try {
      console.log('registrarTiempo - ID tarea:', req.params.id, 'Usuario:', req.usuarioId, 'Datos:', req.body);
      const { horas, comentario } = req.body;
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.registrarTiempo(req.params.id, req.usuarioId, horas, comentario);
      console.log('Tiempo registrado. Nueva tarea:', tarea);
      res.status(200).json({ success: true, message: 'Tiempo registrado', data: tarea });
    } catch (error) {
      console.error('Error registrando tiempo:', error);
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async adjuntarArchivo(req, res) {
    try {
      console.log('[TaskController] Adjuntando archivo:', {
        tareaId: req.params.id,
        usuarioId: req.usuarioId,
        hasFile: !!req.file,
        fileInfo: req.file ? { filename: req.file.filename, originalname: req.file.originalname, size: req.file.size } : null
      });

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Archivo requerido. Asegúrate de que el formulario use enctype="multipart/form-data" y el campo se llame "archivo"' });
      }

      await this.obtenerTareaConAcceso(req.params.id, req);
      const config = await SystemSetting.findOne({ where: { clave: 'GLOBAL' } });
      const limiteMb = config?.limiteArchivoMB || 10;
      if (req.file.size > limiteMb * 1024 * 1024) {
        return res.status(400).json({ success: false, message: `El archivo excede el límite de ${limiteMb}MB` });
      }

      const tarea = await TaskService.adjuntarArchivo(req.params.id, req.file, req.usuarioId);
      console.log('[TaskController] Archivo adjuntado exitosamente:', req.file.filename);
      res.status(201).json({ success: true, message: 'Archivo adjuntado', data: tarea });
    } catch (error) {
      console.error('[TaskController] Error adjuntando archivo:', error);
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async buscar(req, res) {
    try {
      await this.validarAccesoProyecto(req.params.idProyecto, req, false);
      const tareas = await TaskService.buscarConFiltros(req.params.idProyecto, req.query);
      res.status(200).json({ success: true, data: tareas });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async guardarFiltro(req, res) {
    try {
      const { nombre, criterios } = req.body;
      const filtro = await TaskService.guardarFiltro(req.usuarioId, nombre, criterios || {});
      res.status(201).json({ success: true, data: filtro });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async obtenerFiltros(req, res) {
    try {
      const filtros = await TaskService.obtenerFiltrosGuardados(req.usuarioId);
      res.status(200).json({ success: true, data: filtros });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

async deshacerUltimoCambio(req, res) {
    try {
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.obtenerPorId(req.params.id);

      if (!tarea || !tarea.historialCambios?.length) {
        return res.status(400).json({ success: false, message: 'No hay cambios para deshacer' });
      }

const ultimo = tarea.historialCambios[tarea.historialCambios.length - 1];
      const payload = { [ultimo.campo]: ultimo.anterior, _usuarioCambio: req.usuarioId };
      const actualizada = await TaskService.actualizar(req.params.id, payload);
      res.status(200).json({ success: true, message: 'Último cambio deshecho', data: actualizada });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async toggleSubtarea(req, res) {
    try {
      await this.obtenerTareaConAcceso(req.params.id, req);
      const tarea = await TaskService.toggleSubtarea(req.params.id, req.params.idSubtarea);
      res.status(200).json({ success: true, message: 'Subtarea actualizada', data: tarea });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }
}

export default new TaskController();
