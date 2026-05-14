import NotificationService from '../services/NotificationService.js';
import NotificationPreferenceService from '../services/NotificationPreferenceService.js';
import notificationBus from '../utils/notificationBus.js';

export class NotificationController {
  // Listar notificaciones con paginación
  async listar(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = parseInt(req.query.limite) || 20;
      const notificaciones = await NotificationService.listar(req.usuarioId);
      // Aplicar paginación manualmente
      const offset = (pagina - 1) * limite;
      const data = notificaciones.slice(offset, offset + limite);
      res.status(200).json({ 
        success: true, 
        data,
        total: notificaciones.length,
        pagina,
        totalPaginas: Math.ceil(notificaciones.length / limite)
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Obtener notificaciones no leídas
  async obtenerNoLeidas(req, res) {
    try {
      const limite = parseInt(req.query.limite) || 50;
      const todas = await NotificationService.listar(req.usuarioId);
      const noLeidas = todas.filter(n => !n.leida).slice(0, limite);
      res.status(200).json({
        success: true,
        data: { notificaciones: noLeidas, totalNoLeidas: noLeidas.length }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Contar notificaciones no leídas (para badge)
  async contarNoLeidas(req, res) {
    try {
      const notificaciones = await NotificationService.listar(req.usuarioId);
      const count = notificaciones.filter(n => !n.leida).length;
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Marcar notificación específica como leída
  async marcarLeida(req, res) {
    try {
      const data = await NotificationService.marcarLeida(req.params.id, req.usuarioId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Marcar todas las notificaciones como leídas
  async marcarTodasLeidas(req, res) {
    try {
      const data = await NotificationService.marcarTodasLeidas(req.usuarioId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Obtener preferencias de notificación
  async obtenerPreferencias(req, res) {
    try {
      const data = await NotificationPreferenceService.obtenerPreferencias(req.usuarioId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Actualizar preferencias de notificación
  async actualizarPreferencias(req, res) {
    try {
      const data = await NotificationPreferenceService.actualizarPreferencias(
        req.usuarioId,
        req.body
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Stream de notificaciones en tiempo real (Server-Sent Events)
  stream(req, res) {
    console.log(`[SSE] Conexión stream para usuario: ${req.usuarioId}`);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const handler = (notif) => {
      console.log(`[SSE] Enviando notificación ${notif.id} a usuario ${req.usuarioId}`);
      res.write(`data: ${JSON.stringify(notif)}\n\n`);
    };

    notificationBus.on(`notif:${req.usuarioId}`, handler);

    const interval = setInterval(() => {
      res.write('event: ping\ndata: {}\n\n');
    }, 20000);

    req.on('close', () => {
      console.log(`[SSE] Conexión cerrada para usuario ${req.usuarioId}`);
      clearInterval(interval);
      notificationBus.off(`notif:${req.usuarioId}`, handler);
    });
  }
}

export default new NotificationController();
