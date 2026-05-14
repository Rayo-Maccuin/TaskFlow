/**
 * CONTROLADOR DE PROYECTOS
 * Maneja las peticiones HTTP relacionadas con proyectos
 */

import ProjectService from '../services/ProjectService.js';
import NotificationService from '../services/NotificationService.js';
import { validationResult } from 'express-validator';
import Project from '../models/Project.js';
import User from '../models/User.js';

class ProjectController {
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

  async obtenerProyectoBase(idProyecto) {
    return Project.findByPk(idProyecto, {
      attributes: ['propietarioId', 'miembros', 'estado'],
    });
  }

  async crear(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({ success: false, errors: errores.array() });
      }

      const { nombre, descripcion, fechaInicio, fechaFin } = req.body;
      if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ success: false, message: 'El nombre del proyecto no puede estar vac�o' });
      }

      const resultado = await ProjectService.crear(
        nombre.trim(),
        descripcion || '',
        req.usuarioId,
        fechaInicio || null,
        fechaFin || null
      );

      // Notificar al creador
      try {
        const proyectoCreado = resultado.proyecto;
        await NotificationService.crearNotificacion(
          req.usuarioId,
          `Proyecto "${proyectoCreado.nombre}" creado exitosamente`,
          'PROYECTO_CREADO',
          proyectoCreado.id,
          'PROYECTO'
        );
      } catch (notifErr) {
        console.error('Error creando notificación de proyecto:', notifErr);
        // No interrumpir el flujo principal
      }

      res.status(201).json({ success: true, message: 'Proyecto creado correctamente', data: { proyecto: resultado.proyecto, tablero: resultado.tablero } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message || 'Error al crear el proyecto' });
    }
  }

  async obtenerPorId(req, res) {
    try {
      const proyectoBase = await this.obtenerProyectoBase(req.params.id);
      if (!proyectoBase) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeVerProyecto(proyectoBase, req)) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para ver este proyecto' });
      }

      const proyecto = await ProjectService.obtenerPorId(req.params.id);
      res.status(200).json({ success: true, data: proyecto });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async obtenerMisProyectos(req, res) {
    try {
      const proyectos = await ProjectService.obtenerPorUsuario(req.usuarioId);
      res.status(200).json({ success: true, data: proyectos });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      const actual = await this.obtenerProyectoBase(req.params.id);
      if (!actual) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeGestionarProyecto(actual, req)) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario o PROJECT_MANAGER del proyecto puede editar' });
      }

      if (actual.estado === 'ARCHIVADO' && req.body.estado !== 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const { nombre, descripcion, estado, color, fechaInicio, fechaFin } = req.body;
      const proyectoActualizado = await ProjectService.actualizar(req.params.id, { nombre, descripcion, estado, color, fechaInicio, fechaFin });

      res.status(200).json({ success: true, message: 'Proyecto actualizado correctamente', data: proyectoActualizado });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

async invitarMiembro(req, res) {
    try {
      const actual = await this.obtenerProyectoBase(req.params.id);
      if (!actual) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeGestionarProyecto(actual, req)) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario o PROJECT_MANAGER del proyecto puede invitar' });
      }

      if (actual.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const { idUsuario, rol } = req.body;
      if (req.rol === 'PROJECT_MANAGER') {
        if (idUsuario === req.usuarioId) {
          return res.status(400).json({ success: false, message: 'No puedes asignarte acceso a ti mismo' });
        }

        const usuarioObjetivo = await User.findByPk(idUsuario, { attributes: ['rol', 'activo'] });
        if (!usuarioObjetivo || !usuarioObjetivo.activo) {
          return res.status(404).json({ success: false, message: 'Usuario no encontrado o inactivo' });
        }

        if (usuarioObjetivo.rol === 'ADMIN') {
          return res.status(403).json({ success: false, message: 'No puedes asignar acceso a usuarios ADMIN' });
        }
      }

      const proyecto = await ProjectService.invitarMiembro(req.params.id, idUsuario, rol);

      if (req.rol === 'PROJECT_MANAGER') {
        try {
          const proyectoNombre = proyecto?.nombre || 'un proyecto';
          const actorNombre = req.usuario?.nombre || 'Un PROJECT_MANAGER';

          await NotificationService.crear({
            usuarioId: idUsuario,
            tipo: 'ASIGNACION',
            titulo: 'Acceso a proyecto asignado',
            mensaje: `${actorNombre} te asignó acceso al proyecto "${proyectoNombre}".`,
            entidadTipo: 'PROJECT',
            entidadId: req.params.id,
          });
        } catch (notifError) {
          console.error('No se pudo crear notificación de asignación a proyecto:', notifError);
        }
      }

      res.status(200).json({ success: true, message: 'Usuario invitado correctamente', data: proyecto });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async invitarPorEmail(req, res) {
    try {
      const actual = await this.obtenerProyectoBase(req.params.id);
      if (!actual) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeGestionarProyecto(actual, req)) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario o PROJECT_MANAGER del proyecto puede invitar' });
      }

      if (actual.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const { email, rol } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'El email es requerido' });
      }

      const proyecto = await ProjectService.invitarPorEmail(req.params.id, email, rol);

      const usuarioInvitado = await User.findOne({ where: { email } });
      if (usuarioInvitado && req.rol === 'PROJECT_MANAGER') {
        try {
          await NotificationService.crear({
            usuarioId: usuarioInvitado.id,
            tipo: 'ASIGNACION',
            titulo: 'Acceso a proyecto asignado',
            mensaje: `Fuiste asignado al proyecto "${proyecto.nombre}".`,
            entidadTipo: 'PROJECT',
            entidadId: req.params.id,
          });
        } catch (notifError) {
          console.error('No se pudo crear notificación:', notifError);
        }
      }

      res.status(200).json({ success: true, message: 'Usuario invitado correctamente', data: proyecto });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async eliminarMiembro(req, res) {
    try {
      const actual = await this.obtenerProyectoBase(req.params.id);
      if (!actual) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeGestionarProyecto(actual, req)) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario o PROJECT_MANAGER del proyecto puede remover miembros' });
      }

      if (actual.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const proyecto = await ProjectService.eliminarMiembro(req.params.id, req.params.idMiembro);
      res.status(200).json({ success: true, message: 'Miembro eliminado correctamente', data: proyecto });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const proyecto = await this.obtenerProyectoBase(req.params.id);
      if (!proyecto) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeGestionarProyecto(proyecto, req)) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario o PROJECT_MANAGER del proyecto puede eliminar' });
      }

      await ProjectService.eliminar(req.params.id);
      res.status(200).json({ success: true, message: 'Proyecto eliminado correctamente' });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async cambiarEstado(req, res) {
    try {
      const actual = await this.obtenerProyectoBase(req.params.id);
      if (!actual) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeGestionarProyecto(actual, req)) {
        return res.status(403).json({ success: false, message: 'Solo ADMIN, propietario o PROJECT_MANAGER del proyecto puede cambiar el estado' });
      }

      const { estado } = req.body;
      if (!estado) {
        return res.status(400).json({ success: false, message: 'El estado es requerido' });
      }

      const proyectoActualizado = await ProjectService.actualizar(req.params.id, { estado });

      // Notificar cambio de estado
      try {
        const proyecto = await Project.findByPk(req.params.id, {
          attributes: ['id', 'nombre', 'propietarioId', 'miembros']
        });
        if (proyecto) {
          const usuariosNotificar = new Set([req.usuarioId, proyecto.propietarioId]);
          (proyecto.miembros || []).forEach(m => usuariosNotificar.add(m.usuarioId));
          
          const mensaje = `Proyecto "${proyecto.nombre}" cambiado a estado "${estado}"`;
          await Promise.all(
            Array.from(usuariosNotificar).map(uid => 
              NotificationService.crearNotificacion(
                uid,
                mensaje,
                'PROYECTO_ESTADO_CAMBIADO',
                proyecto.id,
                'PROYECTO'
              )
            )
          );
        }
      } catch (notifErr) {
        console.error('Error notificando cambio de estado:', notifErr);
      }

      res.status(200).json({ success: true, message: 'Estado del proyecto actualizado correctamente', data: proyectoActualizado });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }

  async clonar(req, res) {
    try {
      const proyecto = await this.obtenerProyectoBase(req.params.id);
      if (!proyecto) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }

      if (!this.puedeVerProyecto(proyecto, req)) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para ver este proyecto' });
      }

      const proyectoClonado = await ProjectService.clonar(req.params.id, req.usuarioId);

      res.status(201).json({ success: true, message: 'Proyecto clonado correctamente', data: proyectoClonado });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
  }
}

export default new ProjectController();
