// Proxy para validaciones previas o posteriores a la gestión de tareas y/o proyectos
// Intercepta operaciones para agregar validaciones adicionales

class ServicioTareas {
  async crearTarea(datos) {
    throw new Error('Método crearTarea debe ser implementado');
  }

  async actualizarTarea(id, datos) {
    throw new Error('Método actualizarTarea debe ser implementado');
  }

  async eliminarTarea(id) {
    throw new Error('Método eliminarTarea debe ser implementado');
  }

  async moverTarea(id, nuevaColumnaId) {
    throw new Error('Método moverTarea debe ser implementado');
  }
}

class ServicioTareasReal extends ServicioTareas {
  constructor(taskModel) {
    super();
    this.Task = taskModel;
  }

  async crearTarea(datos) {
    const tarea = new this.Task(datos);
    return await tarea.save();
  }

  async actualizarTarea(id, datos) {
    return await this.Task.findByIdAndUpdate(id, datos, { new: true });
  }

  async eliminarTarea(id) {
    return await this.Task.findByIdAndDelete(id);
  }

  async moverTarea(id, nuevaColumnaId) {
    return await this.Task.findByIdAndUpdate(id, { columna: nuevaColumnaId }, { new: true });
  }
}

class ProxyValidacionTareas extends ServicioTareas {
  constructor(servicioReal, validador) {
    super();
    this.servicioReal = servicioReal;
    this.validador = validador;
  }

  async crearTarea(datos) {
    // Validaciones previas
    await this.validarDatosTarea(datos);
    await this.validarPermisosProyecto(datos.proyecto, datos.usuarioId, 'crear_tarea');

    const tarea = await this.servicioReal.crearTarea(datos);

    // Validaciones posteriores
    await this.registrarAuditoria('CREAR_TAREA', datos.usuarioId, tarea._id, datos);
    await this.notificarMiembrosProyecto(datos.proyecto, `Nueva tarea creada: ${datos.titulo}`);

    return tarea;
  }

  async actualizarTarea(id, datos) {
    // Validaciones previas
    const tareaExistente = await this.servicioReal.Task.findById(id);
    if (!tareaExistente) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarPermisosTarea(id, datos.usuarioId, 'actualizar');
    await this.validarDatosTarea(datos, true);

    const tarea = await this.servicioReal.actualizarTarea(id, datos);

    // Validaciones posteriores
    await this.registrarAuditoria('ACTUALIZAR_TAREA', datos.usuarioId, id, datos);
    if (datos.completada && !tareaExistente.completada) {
      await this.notificarMiembrosProyecto(tarea.proyecto, `Tarea completada: ${tarea.titulo}`);
    }

    return tarea;
  }

  async eliminarTarea(id, usuarioId) {
    // Validaciones previas
    const tarea = await this.servicioReal.Task.findById(id);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarPermisosTarea(id, usuarioId, 'eliminar');

    const resultado = await this.servicioReal.eliminarTarea(id);

    // Validaciones posteriores
    await this.registrarAuditoria('ELIMINAR_TAREA', usuarioId, id, { titulo: tarea.titulo });

    return resultado;
  }

  async moverTarea(id, nuevaColumnaId, usuarioId) {
    // Validaciones previas
    const tarea = await this.servicioReal.Task.findById(id);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarPermisosTarea(id, usuarioId, 'mover');
    await this.validarMovimientoTarea(id, nuevaColumnaId);

    const tareaActualizada = await this.servicioReal.moverTarea(id, nuevaColumnaId);

    // Validaciones posteriores
    await this.registrarAuditoria('MOVER_TAREA', usuarioId, id, {
      columnaAnterior: tarea.columna,
      columnaNueva: nuevaColumnaId
    });

    return tareaActualizada;
  }

  // Métodos de validación
  async validarDatosTarea(datos, esActualizacion = false) {
    if (!esActualizacion && !datos.titulo?.trim()) {
      throw new Error('El título de la tarea es obligatorio');
    }

    if (datos.prioridad && !['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].includes(datos.prioridad)) {
      throw new Error('Prioridad no válida');
    }

    if (datos.tipo && !['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT'].includes(datos.tipo)) {
      throw new Error('Tipo de tarea no válido');
    }

    if (datos.estimacionHoras < 0) {
      throw new Error('La estimación de horas no puede ser negativa');
    }
  }

  async validarPermisosProyecto(proyectoId, usuarioId, accion) {
    const { Project } = require('../models/Project');
    const proyecto = await Project.findById(proyectoId);

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    if (!proyecto.miembros.includes(usuarioId)) {
      throw new Error('No tienes permisos para realizar esta acción en el proyecto');
    }
  }

  async validarPermisosTarea(tareaId, usuarioId, accion) {
    const tarea = await this.servicioReal.Task.findById(tareaId).populate('proyecto');

    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    // Verificar si el usuario es miembro del proyecto
    if (!tarea.proyecto.miembros.includes(usuarioId)) {
      throw new Error('No tienes permisos para acceder a esta tarea');
    }

    // Para eliminación, solo el creador o ADMIN pueden eliminar
    if (accion === 'eliminar') {
      const { User } = require('../models/User');
      const usuario = await User.findById(usuarioId);
      if (tarea.creador.toString() !== usuarioId && usuario.rol !== 'ADMIN') {
        throw new Error('Solo el creador de la tarea o un administrador pueden eliminarla');
      }
    }
  }

  async validarMovimientoTarea(tareaId, nuevaColumnaId) {
    const { Board } = require('../models/Board');
    const tarea = await this.servicioReal.Task.findById(tareaId);

    // Verificar que la columna existe en el tablero del proyecto
    const tablero = await Board.findOne({
      proyecto: tarea.proyecto,
      'columnas._id': nuevaColumnaId
    });

    if (!tablero) {
      throw new Error('Columna no encontrada en el tablero del proyecto');
    }

    // Verificar límite WIP si existe
    const columna = tablero.columnas.id(nuevaColumnaId);
    if (columna.limiteWIP > 0) {
      const tareasEnColumna = await this.servicioReal.Task.countDocuments({
        proyecto: tarea.proyecto,
        columna: nuevaColumnaId,
        completada: false
      });

      if (tareasEnColumna >= columna.limiteWIP) {
        throw new Error(`La columna "${columna.nombre}" ha alcanzado su límite de trabajo en progreso (${columna.limiteWIP})`);
      }
    }
  }

  async registrarAuditoria(accion, usuarioId, entidadId, datos) {
    const { AuditService } = require('../services/AuditService');
    const auditService = new AuditService();
    await auditService.registrarAccion(usuarioId, accion, entidadId, datos);
  }

  async notificarMiembrosProyecto(proyectoId, mensaje) {
    const { NotificationService } = require('../services/NotificationService');
    const { Project } = require('../models/Project');
    const notificationService = new NotificationService();

    const proyecto = await Project.findById(proyectoId);
    for (const miembroId of proyecto.miembros) {
      await notificationService.notificarUsuario(miembroId, 'TAREA_ACTUALIZADA', mensaje);
    }
  }
}

class ServicioProyectos {
  async crearProyecto(datos) {
    throw new Error('Método crearProyecto debe ser implementado');
  }

  async actualizarProyecto(id, datos) {
    throw new Error('Método actualizarProyecto debe ser implementado');
  }

  async eliminarProyecto(id) {
    throw new Error('Método eliminarProyecto debe ser implementado');
  }
}

class ServicioProyectosReal extends ServicioProyectos {
  constructor(projectModel) {
    super();
    this.Project = projectModel;
  }

  async crearProyecto(datos) {
    const proyecto = new this.Project(datos);
    return await proyecto.save();
  }

  async actualizarProyecto(id, datos) {
    return await this.Project.findByIdAndUpdate(id, datos, { new: true });
  }

  async eliminarProyecto(id) {
    return await this.Project.findByIdAndDelete(id);
  }
}

class ProxyValidacionProyectos extends ServicioProyectos {
  constructor(servicioReal, validador) {
    super();
    this.servicioReal = servicioReal;
    this.validador = validador;
  }

  async crearProyecto(datos) {
    // Validaciones previas
    await this.validarDatosProyecto(datos);
    await this.validarPermisosUsuario(datos.creador, 'crear_proyecto');

    const proyecto = await this.servicioReal.crearProyecto(datos);

    // Validaciones posteriores
    await this.registrarAuditoria('CREAR_PROYECTO', datos.creador, proyecto._id, datos);

    return proyecto;
  }

  async actualizarProyecto(id, datos) {
    // Validaciones previas
    const proyectoExistente = await this.servicioReal.Project.findById(id);
    if (!proyectoExistente) {
      throw new Error('Proyecto no encontrado');
    }

    await this.validarPermisosProyecto(id, datos.usuarioId, 'actualizar');
    await this.validarDatosProyecto(datos, true);

    const proyecto = await this.servicioReal.actualizarProyecto(id, datos);

    // Validaciones posteriores
    await this.registrarAuditoria('ACTUALIZAR_PROYECTO', datos.usuarioId, id, datos);

    return proyecto;
  }

  async eliminarProyecto(id, usuarioId) {
    // Validaciones previas
    const proyecto = await this.servicioReal.Project.findById(id);
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    await this.validarPermisosProyecto(id, usuarioId, 'eliminar');

    // Verificar que no haya tareas activas
    const { Task } = require('../models/Task');
    const tareasActivas = await Task.countDocuments({
      proyecto: id,
      completada: false
    });

    if (tareasActivas > 0) {
      throw new Error('No se puede eliminar un proyecto con tareas activas');
    }

    const resultado = await this.servicioReal.eliminarProyecto(id);

    // Validaciones posteriores
    await this.registrarAuditoria('ELIMINAR_PROYECTO', usuarioId, id, { nombre: proyecto.nombre });

    return resultado;
  }

  // Métodos de validación
  async validarDatosProyecto(datos, esActualizacion = false) {
    if (!esActualizacion && !datos.nombre?.trim()) {
      throw new Error('El nombre del proyecto es obligatorio');
    }

    if (datos.fechaInicio && datos.fechaFin && new Date(datos.fechaInicio) > new Date(datos.fechaFin)) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
  }

  async validarPermisosUsuario(usuarioId, accion) {
    const { User } = require('../models/User');
    const usuario = await User.findById(usuarioId);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Validaciones adicionales según rol podrían ir aquí
  }

  async validarPermisosProyecto(proyectoId, usuarioId, accion) {
    const proyecto = await this.servicioReal.Project.findById(proyectoId);

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    // Para actualizar o eliminar, debe ser el creador o ADMIN
    if (['actualizar', 'eliminar'].includes(accion)) {
      const { User } = require('../models/User');
      const usuario = await User.findById(usuarioId);

      if (proyecto.creador.toString() !== usuarioId && usuario.rol !== 'ADMIN') {
        throw new Error(`Solo el creador del proyecto o un administrador pueden ${accion}lo`);
      }
    }
  }

  async registrarAuditoria(accion, usuarioId, entidadId, datos) {
    const { AuditService } = require('../services/AuditService');
    const auditService = new AuditService();
    await auditService.registrarAccion(usuarioId, accion, entidadId, datos);
  }
}

module.exports = {
  ServicioTareas,
  ServicioTareasReal,
  ProxyValidacionTareas,
  ServicioProyectos,
  ServicioProyectosReal,
  ProxyValidacionProyectos
};