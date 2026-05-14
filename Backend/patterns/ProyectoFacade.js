// Facade para simplificar operaciones complejas en la gestión de proyectos
// Proporciona una interfaz unificada para operaciones complejas de proyectos

const { Project } = require('../models/Project');
const { Task } = require('../models/Task');
const { User } = require('../models/User');
const { Board } = require('../models/Board');
const { NotificationService } = require('../services/NotificationService');
const { AuditService } = require('../services/AuditService');

class ProyectoFacade {
  constructor() {
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  // Crear proyecto completo con tablero por defecto y miembros iniciales
  async crearProyectoCompleto(datosProyecto, creadorId) {
    try {
      // 1. Crear el proyecto
      const proyecto = new Project({
        ...datosProyecto,
        creador: creadorId,
        miembros: [creadorId],
        estado: 'PLANIFICADO'
      });
      await proyecto.save();

      // 2. Crear tablero por defecto
      const tablero = new Board({
        nombre: 'Tablero Principal',
        descripcion: 'Tablero Kanban por defecto del proyecto',
        proyecto: proyecto._id,
        creador: creadorId,
        columnas: [
          { nombre: 'Por hacer', orden: 1, color: '#ef4444' },
          { nombre: 'En progreso', orden: 2, color: '#f59e0b' },
          { nombre: 'En revisión', orden: 3, color: '#3b82f6' },
          { nombre: 'Completado', orden: 4, color: '#10b981' }
        ]
      });
      await tablero.save();

      // 3. Actualizar proyecto con referencia al tablero
      proyecto.tableros = [tablero._id];
      await proyecto.save();

      // 4. Registrar en auditoría
      await this.auditService.registrarAccion(creadorId, 'CREAR_PROYECTO', proyecto._id, {
        nombre: proyecto.nombre,
        tableroId: tablero._id
      });

      // 5. Notificar al creador
      await this.notificationService.notificarUsuario(
        creadorId,
        'PROYECTO_CREADO',
        `Proyecto "${proyecto.nombre}" creado exitosamente`
      );

      return { proyecto, tablero };
    } catch (error) {
      console.error('Error creando proyecto completo:', error);
      throw error;
    }
  }

  // Clonar proyecto como plantilla
  async clonarProyectoComoPlantilla(proyectoId, nuevoNombre, nuevoCreadorId) {
    try {
      // 1. Obtener proyecto original
      const proyectoOriginal = await Project.findById(proyectoId).populate('tableros');
      if (!proyectoOriginal) {
        throw new Error('Proyecto no encontrado');
      }

      // 2. Crear nuevo proyecto
      const proyectoClonado = new Project({
        nombre: nuevoNombre,
        descripcion: proyectoOriginal.descripcion,
        creador: nuevoCreadorId,
        miembros: [nuevoCreadorId],
        estado: 'PLANIFICADO'
      });
      await proyectoClonado.save();

      // 3. Clonar tableros (sin tareas)
      const tablerosClonados = [];
      for (const tableroOriginal of proyectoOriginal.tableros) {
        const tableroClonado = new Board({
          nombre: tableroOriginal.nombre,
          descripcion: tableroOriginal.descripcion,
          proyecto: proyectoClonado._id,
          creador: nuevoCreadorId,
          columnas: tableroOriginal.columnas.map(col => ({
            nombre: col.nombre,
            orden: col.orden,
            color: col.color,
            limiteWIP: col.limiteWIP
          }))
        });
        await tableroClonado.save();
        tablerosClonados.push(tableroClonado._id);
      }

      // 4. Actualizar proyecto clonado
      proyectoClonado.tableros = tablerosClonados;
      await proyectoClonado.save();

      // 5. Registrar en auditoría
      await this.auditService.registrarAccion(nuevoCreadorId, 'CLONAR_PROYECTO', proyectoClonado._id, {
        originalId: proyectoId,
        nombre: nuevoNombre
      });

      return { proyecto: proyectoClonado, tableros: tablerosClonados };
    } catch (error) {
      console.error('Error clonando proyecto:', error);
      throw error;
    }
  }

  // Archivar proyecto completado
  async archivarProyecto(proyectoId, usuarioId) {
    try {
      // 1. Verificar permisos
      const proyecto = await Project.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      if (proyecto.creador.toString() !== usuarioId && !proyecto.miembros.includes(usuarioId)) {
        throw new Error('No tienes permisos para archivar este proyecto');
      }

      // 2. Cambiar estado a ARCHIVADO
      proyecto.estado = 'ARCHIVADO';
      proyecto.fechaArchivado = new Date();
      await proyecto.save();

      // 3. Marcar todas las tareas como completadas
      await Task.updateMany(
        { proyecto: proyectoId, completada: false },
        { completada: true, fechaCompletada: new Date() }
      );

      // 4. Registrar en auditoría
      await this.auditService.registrarAccion(usuarioId, 'ARCHIVAR_PROYECTO', proyectoId, {
        nombre: proyecto.nombre,
        estadoAnterior: proyecto.estado
      });

      // 5. Notificar miembros
      for (const miembroId of proyecto.miembros) {
        await this.notificationService.notificarUsuario(
          miembroId,
          'PROYECTO_ARCHIVADO',
          `Proyecto "${proyecto.nombre}" ha sido archivado`
        );
      }

      return proyecto;
    } catch (error) {
      console.error('Error archivando proyecto:', error);
      throw error;
    }
  }

  // Obtener dashboard completo del proyecto
  async obtenerDashboardProyecto(proyectoId, usuarioId) {
    try {
      // 1. Verificar acceso
      const proyecto = await Project.findById(proyectoId).populate('miembros', 'nombre email');
      if (!proyecto || !proyecto.miembros.includes(usuarioId)) {
        throw new Error('Proyecto no encontrado o sin acceso');
      }

      // 2. Obtener estadísticas
      const totalTareas = await Task.countDocuments({ proyecto: proyectoId });
      const tareasCompletadas = await Task.countDocuments({ proyecto: proyectoId, completada: true });
      const tareasVencidas = await Task.countDocuments({
        proyecto: proyectoId,
        completada: false,
        fechaLimite: { $lt: new Date() }
      });

      // 3. Tareas por estado (columna)
      const tareasPorEstado = await Task.aggregate([
        { $match: { proyecto: proyecto._id } },
        { $group: { _id: '$columna', count: { $sum: 1 } } }
      ]);

      // 4. Tareas por usuario
      const tareasPorUsuario = await Task.aggregate([
        { $match: { proyecto: proyecto._id } },
        { $unwind: '$responsables' },
        { $group: { _id: '$responsables', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'usuario' } },
        { $unwind: '$usuario' },
        { $project: { nombre: '$usuario.nombre', email: '$usuario.email', count: 1 } }
      ]);

      // 5. Progreso semanal
      const fechaHaceUnaSemana = new Date();
      fechaHaceUnaSemana.setDate(fechaHaceUnaSemana.getDate() - 7);

      const progresoSemanal = await Task.aggregate([
        {
          $match: {
            proyecto: proyecto._id,
            fechaCompletada: { $gte: fechaHaceUnaSemana }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaCompletada' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      return {
        proyecto: {
          id: proyecto._id,
          nombre: proyecto.nombre,
          descripcion: proyecto.descripcion,
          estado: proyecto.estado,
          fechaCreacion: proyecto.fechaCreacion,
          miembros: proyecto.miembros
        },
        estadisticas: {
          totalTareas,
          tareasCompletadas,
          tareasVencidas,
          progresoGeneral: totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0
        },
        tareasPorEstado,
        tareasPorUsuario,
        progresoSemanal
      };
    } catch (error) {
      console.error('Error obteniendo dashboard:', error);
      throw error;
    }
  }

  // Invitar miembros al proyecto
  async invitarMiembros(proyectoId, emails, invitadorId) {
    try {
      const proyecto = await Project.findById(proyectoId);
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      if (proyecto.creador.toString() !== invitadorId) {
        throw new Error('Solo el creador puede invitar miembros');
      }

      const miembrosAgregados = [];
      for (const email of emails) {
        const usuario = await User.findOne({ email });
        if (usuario && !proyecto.miembros.includes(usuario._id)) {
          proyecto.miembros.push(usuario._id);
          miembrosAgregados.push(usuario);

          // Notificar al invitado
          await this.notificationService.notificarUsuario(
            usuario._id,
            'INVITACION_PROYECTO',
            `Has sido invitado al proyecto "${proyecto.nombre}"`
          );
        }
      }

      await proyecto.save();

      // Registrar en auditoría
      await this.auditService.registrarAccion(invitadorId, 'INVITAR_MIEMBROS', proyectoId, {
        emails,
        miembrosAgregados: miembrosAgregados.length
      });

      return { proyecto, miembrosAgregados };
    } catch (error) {
      console.error('Error invitando miembros:', error);
      throw error;
    }
  }
}

module.exports = { ProyectoFacade };