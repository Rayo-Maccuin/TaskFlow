/**
 * SERVICIO DE TAREAS
 * Contiene la l�gica de negocio relacionada con tareas
 * Migrado a Sequelize/MySQL
 */

import { Op } from 'sequelize';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import Project from '../models/Project.js';
import SavedFilter from '../models/SavedFilter.js';
import User from '../models/User.js';
import { TaskFactory } from '../patterns/TaskFactory.js';
import { TaskCloner } from '../patterns/Prototype.js';
import { TaskBuilder } from '../patterns/Builder.js';
import NotificationService from './NotificationService.js';
import AuditService from './AuditService.js';

class TaskService {
  async validarProyectoEditable(idProyecto) {
    const proyecto = await Project.findByPk(idProyecto, {
      attributes: ['estado'],
    });

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    if (proyecto.estado === 'ARCHIVADO') {
      throw new Error('El proyecto archivado es solo lectura');
    }
  }

  async validarWip(idProyecto, idColumna, incremento = 1) {
    const board = await Board.findOne({ where: { proyectoId: idProyecto } });
    const columna = board?.columnas?.find((c) => c.id == idColumna);

    if (!columna) {
      throw new Error('Columna no encontrada');
    }

    if (columna.limiteWip > 0 && (columna.tareas?.length || 0) + incremento > columna.limiteWip) {
      throw new Error('L�mite WIP alcanzado para la columna');
    }
  }

  async obtenerBoardPorProyecto(idProyecto) {
    const board = await Board.findOne({ where: { proyectoId: idProyecto } });
    if (!board) {
      throw new Error('Tablero no encontrado');
    }
    return board;
  }

  async crear(datosTarea, usuarioCreador) {
    await this.validarProyectoEditable(datosTarea.proyecto);
    await this.validarWip(datosTarea.proyecto, datosTarea.columna, 1);

    const tareaFactory = TaskFactory.crearTarea(
      datosTarea.tipo,
      datosTarea.titulo,
      datosTarea.descripcion,
      datosTarea.prioridad,
      datosTarea.proyecto,
      datosTarea.columna,
      usuarioCreador
    );

    const nuevaTarea = await Task.create({
      titulo: tareaFactory.titulo,
      descripcion: tareaFactory.descripcion,
      tipo: tareaFactory.tipo,
      prioridad: tareaFactory.prioridad,
      proyectoId: datosTarea.proyecto,
      columnaId: datosTarea.columna,
      creadorId: usuarioCreador,
      responsables: tareaFactory.responsables || [],
      subtareas: tareaFactory.subtareas || [],
      comentarios: tareaFactory.comentarios || [],
      etiquetas: datosTarea.etiquetas || tareaFactory.etiquetas || [],
      fechaLimite: datosTarea.fechaLimite || null,
      estimacionHoras: datosTarea.estimacionHoras || 0,
      orden: 0,
    });

    const board = await this.obtenerBoardPorProyecto(datosTarea.proyecto);
    const columnas = board.columnas || [];
    const columnaIndex = columnas.findIndex((c) => c.id == datosTarea.columna);
    if (columnaIndex !== -1) {
      columnas[columnaIndex].tareas = [...(columnas[columnaIndex].tareas || []), nuevaTarea.id];
      await board.update({ columnas });
    }

    await AuditService.registrar({
      proyecto: datosTarea.proyecto,
      usuario: usuarioCreador,
      accion: 'TASK_CREATED',
      entidadTipo: 'TASK',
      entidadId: nuevaTarea.id,
      detalles: { titulo: nuevaTarea.titulo },
    });

    return this.obtenerPorId(nuevaTarea.id);
  }

  async obtenerPorId(id) {
    const tarea = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creador',
          attributes: ['id', 'nombre', 'email', 'avatar'],
        },
      ],
    });

    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    // Resolver responsables a objetos de usuario completos
    const responsablesIds = (tarea.responsables || []).map((r) =>
      typeof r === 'object' ? r.id : r
    );
    let usuariosMap = {};
    try {
      const todosUsuarios = await User.findAll({
        attributes: ['id', 'nombre', 'email'],
      });
      todosUsuarios.forEach((u) => {
        usuariosMap[u.id] = { id: u.id, nombre: u.nombre, email: u.email };
      });
    } catch (e) {
      console.warn('Error obteniendo usuarios para responsables:', e.message);
    }

    const responsables = responsablesIds
      .map((rid) => usuariosMap[rid] || usuariosMap[String(rid)])
      .filter(Boolean);

    const subtareas = tarea.subtareas || [];
    const totalSubtareas = subtareas.length;
    const completadasSubtareas = subtareas.filter((s) => s.completada).length;
    const progresoSubtareas = totalSubtareas === 0 ? 0 : Math.round((completadasSubtareas / totalSubtareas) * 100);

    return {
      ...tarea.toJSON(),
      progresoSubtareas,
      responsables,
    };
  }

  async obtenerPorProyecto(idProyecto) {
    const tareas = await Task.findAll({
      where: { proyectoId: idProyecto },
      order: [['orden', 'ASC']],
      include: [
        {
          model: User,
          as: 'creador',
          attributes: ['id', 'nombre', 'email', 'avatar'],
        },
      ],
    });

    // Obtener el tablero para resolver nombres de columnas (no bloquear si falla)
    let columnasMap = {};
    try {
      const board = await Board.findOne({ where: { proyectoId: idProyecto } });
      if (board?.columnas) {
        board.columnas.forEach((col) => {
          const colId = col.id || col._id;
          columnasMap[String(colId)] = col.nombre || col.title || 'Sin columna';
        });
      }
    } catch (e) {
      console.warn('Error obteniendo tablero para columnas:', e.message);
    }

    // Obtener todos los usuarios para resolver responsables (no bloquear si falla)
    let usuariosMap = {};
    try {
      const todosUsuarios = await User.findAll({ attributes: ['id', 'nombre', 'email'] });
      todosUsuarios.forEach((u) => {
        usuariosMap[u.id] = { id: u.id, nombre: u.nombre, email: u.email };
      });
    } catch (e) {
      console.warn('Error obteniendo usuarios para responsables:', e.message);
    }

    const ahora = new Date();
    // Marcar vencimientos notificados sin bloquear si hay errores
    await Promise.all(
      tareas.map(async (tarea) => {
        if (
          tarea.fechaLimite &&
          !tarea.completada &&
          !tarea.vencimientoNotificado &&
          new Date(tarea.fechaLimite) < ahora
        ) {
          try {
            await tarea.update({ vencimientoNotificado: true });
          } catch (e) {
            console.warn('No se pudo actualizar vencimientoNotificado para tarea', tarea.id, e.message);
          }
        }
      })
    );

    return tareas.map((tarea) => {
      const subtareas = tarea.subtareas || [];
      const totalSubtareas = subtareas.length;
      const completadasSubtareas = subtareas.filter((s) => s.completada).length;
      const progresoSubtareas = totalSubtareas === 0 ? 0 : Math.round((completadasSubtareas / totalSubtareas) * 100);

      const columnaIdRaw = tarea.columnaId || tarea.columna;
      const columnaKey = String(columnaIdRaw);
      const columnaNombre = columnasMap[columnaKey] || 'Sin columna';

      // Resolver responsables a objetos de usuario completos
      const responsablesIds = (tarea.responsables || []).map((r) =>
        typeof r === 'object' ? r.id : r
      );
      const responsables = responsablesIds
        .map((rid) => usuariosMap[rid] || usuariosMap[String(rid)])
        .filter(Boolean);

      return {
        ...tarea.toJSON(),
        progresoSubtareas,
        columnaNombre,
        estado: tarea.completada ? 'COMPLETADO' : 'PENDIENTE',
        responsables,
      };
    });
   }

   async obtenerPorColumna(idColumna) {
    const tareas = await Task.findAll({
      where: { columnaId: idColumna },
      order: [['orden', 'ASC']],
      include: [
        {
          model: User,
          as: 'creador',
          attributes: ['id', 'nombre', 'email', 'avatar'],
        },
      ],
    });

    return tareas.map((tarea) => {
      const subtareas = tarea.subtareas || [];
      const totalSubtareas = subtareas.length;
      const completadasSubtareas = subtareas.filter((s) => s.completada).length;
      const progresoSubtareas = totalSubtareas === 0 ? 0 : Math.round((completadasSubtareas / totalSubtareas) * 100);

      return {
        ...tarea.toJSON(),
        progresoSubtareas,
      };
    });
  }

  async actualizar(id, datos) {
    console.log('TaskService.actualizar - id:', id, 'datos:', datos);
    const original = await Task.findByPk(id);
    if (!original) {
      console.error('Tarea no encontrada:', id);
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(original.proyectoId);

    // Campos que NO se pueden actualizar por este endpoint
    delete datos.creador;
    delete datos.proyecto;
    delete datos.proyectoId;
    delete datos.columnaId;
    delete datos.creadorId;

    const keysAuditables = [
      'titulo',
      'descripcion',
      'prioridad',
      'tipo',
      'fechaLimite',
      'estimacionHoras',
      'etiquetas',
      'subtareas',
      'completada',
    ];

    const cambios = keysAuditables
      .filter((k) => Object.prototype.hasOwnProperty.call(datos, k))
      .filter((k) => JSON.stringify(original[k]) !== JSON.stringify(datos[k]))
      .map((k) => ({ campo: k, anterior: original[k], nuevo: datos[k] }));

    const usuarioCambio = datos._usuarioCambio || null;
    delete datos._usuarioCambio;

    const historialCambios = original.historialCambios || [];
    datos.historialCambios = [...historialCambios, ...cambios.map((c) => ({ ...c, usuario: usuarioCambio, fecha: new Date() }))];

    await Task.update(datos, { where: { id } });

    const tareaActualizada = await this.obtenerPorId(id);

    if (cambios.some((c) => c.campo === 'completada')) {
      const responsables = tareaActualizada.responsables || [];
      for (const resp of responsables) {
        if (!resp) continue;
        await NotificationService.crear({
          usuarioId: resp,
          tipo: 'CAMBIO_ESTADO',
          titulo: 'Cambio de estado de tarea',
          mensaje: `La tarea "${tareaActualizada.titulo}" cambi� su estado`,
          entidadTipo: 'TASK',
          entidadId: tareaActualizada.id,
        });
      }
    }

    await AuditService.registrar({
      proyecto: tareaActualizada.proyectoId,
      usuario: usuarioCambio || tareaActualizada.creadorId,
      accion: 'TASK_UPDATED',
      entidadTipo: 'TASK',
      entidadId: tareaActualizada.id,
      detalles: { cambios },
    });

    await tareaActualizada.update({ _ultimaOperacion: { tipo: 'actualizar', datosOriginales: original.toJSON(), timestamp: new Date() } });

    return tareaActualizada;
  }

  async deshacerUltimoCambio(idTarea) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const historial = tarea.historialCambios || [];
    if (historial.length === 0) {
      throw new Error('No hay cambios que deshacer');
    }

    const ultimoCambio = historial[historial.length - 1];
    const campo = ultimoCambio.campo;
    const valorAnterior = ultimoCambio.anterior;

    const datosRestaurar = {};
    datosRestaurar[campo] = valorAnterior;

    const nuevoHistorial = historial.slice(0, -1);

    await tarea.update({
      ...datosRestaurar,
      historialCambios: nuevoHistorial,
    });

    return this.obtenerPorId(idTarea);
  }

  async moverAColumna(idTarea, idNuevaColumna, orden) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(tarea.proyectoId);
    await this.validarWip(tarea.proyectoId, idNuevaColumna, 1);

    const idAntiguaColumna = tarea.columnaId;

    const board = await this.obtenerBoardPorProyecto(tarea.proyectoId);
    const columnas = board.columnas || [];
    const nuevasColumnas = columnas.map((col) => {
      const tareas = col.tareas || [];
      if (col.id == idAntiguaColumna) {
        return { ...col, tareas: tareas.filter((t) => t !== tarea.id) };
      }
      if (col.id == idNuevaColumna) {
        return { ...col, tareas: [...tareas, tarea.id] };
      }
      return col;
    });

    await board.update({ columnas: nuevasColumnas });
    await tarea.update({ columnaId: idNuevaColumna, orden });
    await AuditService.registrar({
      proyecto: tarea.proyectoId,
      usuario: tarea.creadorId,
      accion: 'TASK_MOVED',
      entidadTipo: 'TASK',
      entidadId: tarea.id,
      detalles: { desde: idAntiguaColumna, hacia: idNuevaColumna },
    });

    return this.obtenerPorId(idTarea);
  }

  async clonar(idTarea, usuarioCreador) {
    const tareaOriginal = await Task.findByPk(idTarea);
    if (!tareaOriginal) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(tareaOriginal.proyectoId);
    await this.validarWip(tareaOriginal.proyectoId, tareaOriginal.columnaId, 1);

    const clonador = new TaskCloner(tareaOriginal.toJSON());
    const tareaClonada = clonador.clonar(null, usuarioCreador);

    const nuevaTarea = await Task.create({
      ...tareaClonada,
      proyectoId: tareaOriginal.proyectoId,
      columnaId: tareaOriginal.columnaId,
      creadorId: usuarioCreador,
      orden: tareaOriginal.orden || 0,
    });

    const board = await this.obtenerBoardPorProyecto(nuevaTarea.proyectoId);
    const columnas = board.columnas || [];
    const columnaIndex = columnas.findIndex((c) => c.id == nuevaTarea.columnaId);
    if (columnaIndex !== -1) {
      columnas[columnaIndex].tareas = [...(columnas[columnaIndex].tareas || []), nuevaTarea.id];
      await board.update({ columnas });
    }

    await AuditService.registrar({
      proyecto: nuevaTarea.proyectoId,
      usuario: usuarioCreador,
      accion: 'TASK_CLONED',
      entidadTipo: 'TASK',
      entidadId: nuevaTarea.id,
      detalles: { originalId: idTarea },
    });

    return this.obtenerPorId(nuevaTarea.id);
  }

  async crearConBuilder(titulo, proyecto, columna, usuarioCreador, configurador) {
    const builder = new TaskBuilder(titulo, proyecto, columna, usuarioCreador);
    if (typeof configurador === 'function') {
      configurador(builder);
    }

    const tareaData = builder.build();
    const nuevaTarea = await Task.create({
      ...tareaData,
      proyectoId: proyecto,
      columnaId: columna,
      creadorId: usuarioCreador,
      orden: tareaData.orden || 0,
    });

    const board = await this.obtenerBoardPorProyecto(proyecto);
    const columnas = board.columnas || [];
    const columnaIndex = columnas.findIndex((c) => c.id == columna);
    if (columnaIndex !== -1) {
      columnas[columnaIndex].tareas = [...(columnas[columnaIndex].tareas || []), nuevaTarea.id];
      await board.update({ columnas });
    }

    return this.obtenerPorId(nuevaTarea.id);
  }

  async completar(id) {
    await Task.update({ completada: true }, { where: { id } });
    return this.obtenerPorId(id);
  }

  async agregarComentario(idTarea, idAutor, contenido) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(tarea.proyectoId);

    const comentarios = tarea.comentarios || [];
    comentarios.push({
      id: Date.now().toString(),
      autor: idAutor,
      contenido,
      fecha: new Date(),
    });

    await tarea.update({ comentarios });

    const responsables = tarea.responsables || [];
    for (const resp of responsables) {
      if (resp == idAutor) continue;
      await NotificationService.crear({
        usuarioId: resp,
        tipo: 'COMENTARIO',
        titulo: 'Nuevo comentario en tarea',
        mensaje: `Se agreg� un comentario en "${tarea.titulo}"`,
        entidadTipo: 'TASK',
        entidadId: tarea.id,
      });
    }

    return this.obtenerPorId(idTarea);
  }

  async asignarResponsable(idTarea, idUsuario) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(tarea.proyectoId);

    const responsables = tarea.responsables || [];
    if (!responsables.includes(idUsuario)) {
      responsables.push(idUsuario);
      await tarea.update({ responsables });
      await NotificationService.crear({
        usuarioId: idUsuario,
        tipo: 'ASIGNACION',
        titulo: 'Nueva tarea asignada',
        mensaje: `Te asignaron la tarea "${tarea.titulo}"`,
        entidadTipo: 'TASK',
        entidadId: tarea.id,
      });
    }

    return this.obtenerPorId(idTarea);
  }

  async quitarResponsable(idTarea, idUsuario) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(tarea.proyectoId);

    const responsables = (tarea.responsables || []).filter((resp) => resp != idUsuario);
    await tarea.update({ responsables });

    return this.obtenerPorId(idTarea);
  }

  async eliminar(id) {
    const tarea = await Task.findByPk(id);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.validarProyectoEditable(tarea.proyectoId);

    await Task.destroy({ where: { id } });

    const board = await this.obtenerBoardPorProyecto(tarea.proyectoId);
    const columnas = board.columnas || [];
    const nuevasColumnas = columnas.map((col) => ({
      ...col,
      tareas: (col.tareas || []).filter((t) => t !== id),
    }));
    await board.update({ columnas: nuevasColumnas });

    return tarea;
  }

  async editarComentario(idTarea, idComentario, idAutor, contenido) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const comentarios = tarea.comentarios || [];
    const index = comentarios.findIndex((c) => c.id === idComentario);
    if (index === -1) {
      throw new Error('Comentario no encontrado');
    }

    if (comentarios[index].autor != idAutor) {
      throw new Error('Solo el autor puede editar el comentario');
    }

    comentarios[index] = {
      ...comentarios[index],
      contenido,
      fecha: new Date(),
    };

    await tarea.update({ comentarios });
    return this.obtenerPorId(idTarea);
  }

  async eliminarComentario(idTarea, idComentario, idAutor) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const comentarios = tarea.comentarios || [];
    const comentario = comentarios.find((c) => c.id === idComentario);
    if (!comentario) {
      throw new Error('Comentario no encontrado');
    }

    if (comentario.autor != idAutor) {
      throw new Error('Solo el autor puede eliminar el comentario');
    }

    const nuevosComentarios = comentarios.filter((c) => c.id !== idComentario);
    await tarea.update({ comentarios: nuevosComentarios });

    return this.obtenerPorId(idTarea);
  }

  async registrarTiempo(idTarea, idUsuario, horas, comentario = '') {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const registrosTiempo = tarea.registrosTiempo || [];
    const historialCambios = tarea.historialCambios || [];

    registrosTiempo.push({
      usuario: idUsuario,
      horas,
      comentario,
      fecha: new Date(),
    });

    historialCambios.push({
      campo: 'registrosTiempo',
      anterior: null,
      nuevo: { horas, comentario },
      usuario: idUsuario,
      fecha: new Date(),
    });

    await tarea.update({ registrosTiempo, historialCambios });

    await AuditService.registrar({
      proyecto: tarea.proyectoId,
      usuario: idUsuario,
      accion: 'TASK_TIME_LOGGED',
      entidadTipo: 'TIME',
      entidadId: tarea.id,
      detalles: { horas, comentario },
    });

    return this.obtenerPorId(idTarea);
  }

  async adjuntarArchivo(idTarea, archivo, idUsuario) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const adjuntos = tarea.adjuntos || [];
    adjuntos.push({
      nombre: archivo.originalname,
      url: `/uploads/${archivo.filename}`,
      size: archivo.size,
      mimeType: archivo.mimetype,
      subidoPor: idUsuario,
      fecha: new Date(),
    });

    await tarea.update({ adjuntos });
    return this.obtenerPorId(idTarea);
  }

  async buscarConFiltros(idProyecto, filtros = {}) {
    const where = { proyectoId: idProyecto };

    if (filtros.responsable) {
      where.responsables = { [Op.contains]: [filtros.responsable] };
    }
    if (filtros.prioridad) {
      where.prioridad = filtros.prioridad;
    }
    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fechaLimite = {};
      if (filtros.fechaDesde) {
        where.fechaLimite[Op.gte] = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        where.fechaLimite[Op.lte] = new Date(filtros.fechaHasta);
      }
    }
    if (filtros.texto) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${filtros.texto}%` } },
        { descripcion: { [Op.like]: `%${filtros.texto}%` } },
      ];
    }
    if (filtros.etiqueta) {
      where.etiquetas = { [Op.contains]: [{ nombre: filtros.etiqueta }] };
    }

    return Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creador',
          attributes: ['id', 'nombre', 'email', 'avatar'],
        },
      ],
    });
  }

async guardarFiltro(usuarioId, nombre, criterios) {
    return SavedFilter.create({ usuarioId, nombre, criterios });
  }

  async obtenerFiltrosGuardados(usuarioId) {
    return SavedFilter.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
    });
  }

  async toggleSubtarea(idTarea, idSubtarea) {
    const tarea = await Task.findByPk(idTarea);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    const subtareas = tarea.subtareas || [];
    const index = subtareas.findIndex((s) => s.id === idSubtarea);
    if (index === -1) {
      throw new Error('Subtarea no encontrada');
    }

    subtareas[index].completada = !subtareas[index].completada;
    await tarea.update({ subtareas });

    return this.obtenerPorId(idTarea);
  }
}

export default new TaskService();
