import Notification from '../models/Notification.js';
import User from '../models/User.js';
import NotificationPreferenceService from './NotificationPreferenceService.js';
import notificationBus from '../utils/notificationBus.js';
import { NotificationAdapterFactory, DatabaseNotificationAdapter, DemoNotificationAdapter } from '../patterns/NotificationChannelAdapter.js';

class NotificationServiceClass {
  constructor() {
    this.inicializados = false;
    this.initPromise = null;
  }

  async inicializar() {
    if (this.inicializados) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Registrar adaptador de base de datos (SSE) - siempre disponible
        const dbAdapter = new DatabaseNotificationAdapter(notificationBus);
        NotificationAdapterFactory.registrar('DATABASE', dbAdapter);
        console.log('✅ Adaptador DATABASE registrado');

        // En desarrollo, registrar adaptadores DEMO para visualización
        if (process.env.NODE_ENV !== 'production') {
          NotificationAdapterFactory.registrar('EMAIL', new DemoNotificationAdapter('EMAIL'));
          NotificationAdapterFactory.registrar('SMS', new DemoNotificationAdapter('SMS'));
          NotificationAdapterFactory.registrar('WHATSAPP', new DemoNotificationAdapter('WHATSAPP'));
          console.log('✅ Adaptadores DEMO registrados: EMAIL, SMS, WHATSAPP');
        }

        // Intentar registrar adaptadores externos reales (sobrescriben demo si están configurados)
        try {
          const { EmailNotificationAdapter, SlackNotificationAdapter, SMSNotificationAdapter } = await import('../patterns/NotificationChannelAdapter.js');

          // Email real (sobrescribe demo)
          if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const nodemailer = await import('nodemailer');
            const emailAdapter = new EmailNotificationAdapter(nodemailer.default);
            NotificationAdapterFactory.registrar('EMAIL', emailAdapter);
            console.log('✅ Adaptador EMAIL real registrado');
          }

          // Slack
          if (process.env.SLACK_WEBHOOK_URL) {
            const slackAdapter = new SlackNotificationAdapter(process.env.SLACK_WEBHOOK_URL);
            NotificationAdapterFactory.registrar('SLACK', slackAdapter);
            console.log('✅ Adaptador SLACK registrado');
          }

          // SMS real (sobrescribe demo)
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const twilio = await import('twilio');
            const twilioClient = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const smsAdapter = new SMSNotificationAdapter(twilioClient);
            NotificationAdapterFactory.registrar('SMS', smsAdapter);
            console.log('✅ Adaptador SMS real registrado');
          }
        } catch (e) {
          console.warn('No se pudieron cargar adaptadores externos:', e.message);
        }

        this.inicializados = true;
        console.log('Adaptadores de notificación disponibles:', NotificationAdapterFactory.getCanalesDisponibles());
      } catch (error) {
        console.error('Error inicializando adaptadores de notificación:', error);
      }
    })();

    return this.initPromise;
  }

  async crear({ usuarioId, tipo, titulo, mensaje, entidadTipo, entidadId }) {
    await this.inicializar();

    // Verificar preferencias
    const debeRecibir = await NotificationPreferenceService.debeRecibirNotificacion(usuarioId, tipo);
    if (!debeRecibir) {
      console.log(`[NotificationService] Usuario ${usuarioId} NO recibe notificaciones de tipo ${tipo}`);
      return null;
    }

    console.log(`[NotificationService] Creando notificación para usuario ${usuarioId}, tipo: ${tipo}`);

    try {
      // Obtener adaptador de base de datos
      const dbAdapter = NotificationAdapterFactory.obtener('DATABASE');
      const resultadoBD = await dbAdapter.enviar(usuarioId, titulo, mensaje, { tipo, entidadTipo, entidadId });
      console.log(`[NotificationService] Notificación guardada en BD ID: ${resultadoBD.id}, canal: DATABASE`);

      // ID de la notificación creada en BD
      const notificacionId = resultadoBD.id;
      const canalesUsados = ['DATABASE']; // Siempre se guarda en BD

      // Obtener preferencias del usuario para canales adicionales
      const preferencias = await NotificationPreferenceService.obtenerPreferencias(usuarioId);

      // Enviar por canales externos según preferencias
      const canalesExternos = [];
      if (preferencias.canalEmail) canalesExternos.push('EMAIL');

      // En modo desarrollo, agregar SMS y WhatsApp demo
      if (process.env.NODE_ENV !== 'production') {
        canalesExternos.push('SMS');
        canalesExternos.push('WHATSAPP');
      }

      if (canalesExternos.length > 0) {
        const resultados = await Promise.allSettled(
          canalesExternos.map(async canal => {
            try {
              const adapter = NotificationAdapterFactory.obtener(canal);
              await adapter.enviar(usuarioId, titulo, mensaje, { tipo, entidadTipo, entidadId });
              console.log(`✅ [NotificationService] Enviada por ${canal} a usuario ${usuarioId}`);
              return canal;
            } catch (error) {
              console.error(`❌ [NotificationService] Error ${canal}:`, error.message);
              return null;
            }
          })
        );

        // Agregar canales exitosos
        resultados.forEach((resultado, idx) => {
          if (resultado.status === 'fulfilled' && resultado.value) {
            canalesUsados.push(canalesExternos[idx]);
          }
        });
      }

      // Actualizar notificación en BD con todos los canales usados (si hay más de uno)
      if (notificacionId && canalesUsados.length > 1) {
        try {
          const NotificationModel = (await import('../models/Notification.js')).default;
          await NotificationModel.update(
            { canales: canalesUsados },
            { where: { id: notificacionId } }
          );
          console.log('📋 [NotificationService] Canales actualizados en BD:', canalesUsados);
        } catch (err) {
          console.error('Error actualizando canales en BD:', err.message);
        }
      }

      // Asegurar que la instancia tenga los canales finales (para la emisión SSE)
      resultadoBD.canales = canalesUsados;

      // Emitir notificación en tiempo real (SSE) con los canales finales
      try {
        notificationBus.emit(`notif:${usuarioId}`, resultadoBD.toJSON());
        console.log(`📡 [NotificationService] Evento SSE emitido para usuario ${usuarioId}`);
      } catch (err) {
        console.error('Error emitiendo evento SSE:', err.message);
      }

      console.log(`[NotificationService] Notificación completada. Canales: ${canalesUsados.join(', ')}`);
      return resultadoBD;
    } catch (error) {
      console.error('❌ [NotificationService] Error creando notificación:', error);
      throw error;
    }
  }

  // Método legacy para compatibilidad con código existente
  async crearNotificacion(usuarioId, mensaje, tipo, entidadId, entidadTipo) {
    return this.crear({
      usuarioId,
      tipo,
      titulo: tipo,
      mensaje,
      entidadTipo,
      entidadId
    });
  }

  async listar(usuarioId) {
    await this.inicializar();
    const NotificationModel = (await import('../models/Notification.js')).default;
    return NotificationModel.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
  }

  async marcarLeida(id, usuarioId) {
    await this.inicializar();
    const NotificationModel = (await import('../models/Notification.js')).default;
    await NotificationModel.update({ leida: true }, { where: { id, usuarioId } });
    return await NotificationModel.findByPk(id);
  }

  async marcarTodasLeidas(usuarioId) {
    await this.inicializar();
    const NotificationModel = (await import('../models/Notification.js')).default;
    await NotificationModel.update({ leida: true }, { where: { usuarioId, leida: false } });
    return { ok: true };
  }
}

// Exportar instancia singleton
const notificationService = new NotificationServiceClass();
export default notificationService;
export { NotificationServiceClass };
