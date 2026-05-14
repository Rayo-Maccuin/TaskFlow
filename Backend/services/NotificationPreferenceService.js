/**
 * SERVICIO DE PREFERENCIAS DE NOTIFICACIÓN
 * Maneja las preferencias de notificación de los usuarios
 */

import NotificationPreference from '../models/NotificationPreference.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationPreferenceService {
  // Crear preferencias por defecto para un usuario
  async crearPreferenciasPorDefecto(usuarioId) {
    try {
      const preferencias = await NotificationPreference.create({
        usuarioId: usuarioId
      });
      return preferencias;
    } catch (error) {
      console.error('Error creando preferencias por defecto:', error);
      throw error;
    }
  }

  // Obtener preferencias de un usuario
  async obtenerPreferencias(usuarioId) {
    try {
      let preferencias = await NotificationPreference.findOne({
        where: { usuarioId: usuarioId }
      });

      // Si no existen, crear con valores por defecto
      if (!preferencias) {
        preferencias = await this.crearPreferenciasPorDefecto(usuarioId);
      }

      return preferencias;
    } catch (error) {
      console.error('Error obteniendo preferencias:', error);
      throw error;
    }
  }

  // Actualizar preferencias de un usuario
  async actualizarPreferencias(usuarioId, nuevasPreferencias) {
    try {
      const [filasActualizadas] = await NotificationPreference.update(
        nuevasPreferencias,
        { where: { usuarioId: usuarioId } }
      );

      if (filasActualizadas === 0) {
        // Si no existían, crear nuevas
        const preferencias = await NotificationPreference.create({
          usuarioId: usuarioId,
          ...nuevasPreferencias
        });
        return preferencias;
      }

      return await this.obtenerPreferencias(usuarioId);
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async marcarComoLeida(idNotificacion, usuarioId) {
    try {
      const notificacion = await Notification.findOne({
        where: {
          id: idNotificacion,
          usuarioId: usuarioId
        }
      });

      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }

      notificacion.leida = true;
      await notificacion.save();

      return notificacion;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas(usuarioId) {
    try {
      const [filasActualizadas] = await Notification.update(
        { leida: true },
        {
          where: {
            usuarioId: usuarioId,
            leida: false
          }
        }
      );

      return { filasActualizadas };
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  // Obtener notificaciones no leídas
  async obtenerNotificacionesNoLeidas(usuarioId, limite = 50) {
    try {
      const notificaciones = await Notification.findAll({
        where: {
          usuarioId: usuarioId,
          leida: false
        },
        order: [['createdAt', 'DESC']],
        limit: limite
      });

      return notificaciones;
    } catch (error) {
      console.error('Error obteniendo notificaciones no leídas:', error);
      throw error;
    }
  }

  // Obtener todas las notificaciones con paginación
  async obtenerNotificaciones(usuarioId, pagina = 1, limite = 20) {
    try {
      const offset = (pagina - 1) * limite;

      const { count, rows } = await Notification.findAndCountAll({
        where: { usuarioId: usuarioId },
        order: [['createdAt', 'DESC']],
        limit: limite,
        offset: offset
      });

      return {
        notificaciones: rows,
        total: count,
        pagina: pagina,
        totalPaginas: Math.ceil(count / limite)
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // Verificar si un usuario debe recibir una notificación
  async debeRecibirNotificacion(usuarioId, tipoNotificacion) {
    try {
      const preferencias = await this.obtenerPreferencias(usuarioId);

      // Si no hay canal in-app habilitado, no enviar notificación en la app
      if (!preferencias.canalInApp) {
        return false;
      }

      // Verificar si el tipo específico está habilitado
      const mapaTipos = {
        'ASIGNACION': 'asignacionTarea',
        'VENCIMIENTO': 'vencimientoTarea',
        'COMENTARIO': 'comentarioTarea',
        'CAMBIO_ESTADO': 'cambioEstadoTarea',
        'TAREA_CREADA': 'asignacionTarea', // Mapear a preferencia de asignación
      };

      const campoPreferencia = mapaTipos[tipoNotificacion];
      if (campoPreferencia && !preferencias[campoPreferencia]) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verificando preferencias de notificación:', error);
      // En caso de error, permitir la notificación por defecto
      return true;
    }
  }

  // Contar notificaciones no leídas
  async contarNoLeidas(usuarioId) {
    try {
      const count = await Notification.count({
        where: {
          usuarioId: usuarioId,
          leida: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error contando notificaciones no leídas:', error);
      return 0;
    }
  }
}

export default new NotificationPreferenceService();