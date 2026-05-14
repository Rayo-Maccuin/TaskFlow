/**
 * PATRÓN ADAPTER - NOTIFICACIONES
 * Adapta diferentes canales de notificación a una interfaz común
 */

export class NotificationChannelAdapter {
  async enviar(usuario, titulo, mensaje, opciones = {}) {
    throw new Error('Método enviar() debe ser implementado');
  }

  async validar() {
    throw new Error('Método validar() debe ser implementado');
  }
}

export class DatabaseNotificationAdapter extends NotificationChannelAdapter {
  constructor(notificationBus) {
    super();
    this.notificationBus = notificationBus;
  }

  async enviar(usuario, titulo, mensaje, opciones = {}) {
    try {
      const Notification = (await import('../models/Notification.js')).default;
      const notificacion = await Notification.create({
        usuarioId: usuario,
        tipo: opciones.tipo || 'INFO',
        titulo,
        mensaje,
        entidadTipo: opciones.entidadTipo,
        entidadId: opciones.entidadId,
        leida: false,
        canales: ['DATABASE'], // Marcar que se envió por base de datos (SSE)
      });

      // No emitir aquí; el servicio de notificación emitirá después de evaluar todos los canales
      return notificacion; // Devolver la instancia para que el servicio pueda usarla
    } catch (error) {
      console.error('Error en DatabaseNotificationAdapter:', error);
      throw error;
    }
  }

  async validar() {
    return { disponible: true, canal: 'DATABASE/SSE', estado: 'ACTIVO' };
  }
}

export class EmailNotificationAdapter extends NotificationChannelAdapter {
  constructor(nodemailer) {
    super();
    this.nodemailer = nodemailer;
  }

  async enviar(usuario, titulo, mensaje, opciones = {}) {
    try {
      const User = (await import('../models/User.js')).default;
      const usuarioDoc = await User.findByPk(usuario);
      if (!usuarioDoc?.email) {
        throw new Error('Usuario sin email');
      }

      const transporter = this.nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: usuarioDoc.email,
        subject: titulo,
        html: `
          <h2>${titulo}</h2>
          <p>${mensaje}</p>
          ${opciones.link ? `<a href="${opciones.link}">Ver detalles</a>` : ''}
          <hr>
          <small>TaskFlow - Plataforma de Gestión de Tareas</small>
        `,
      };

      await transporter.sendMail(mailOptions);
      return { exitoso: true, email: usuarioDoc.email, canal: 'EMAIL' };
    } catch (error) {
      console.error('Error en EmailNotificationAdapter:', error);
      throw error;
    }
  }

  async validar() {
    return { disponible: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS, canal: 'EMAIL', estado: process.env.EMAIL_USER ? 'ACTIVO' : 'INACTIVO' };
  }
}

export class SlackNotificationAdapter extends NotificationChannelAdapter {
  constructor(webhookUrl) {
    super();
    this.webhookUrl = webhookUrl;
  }

  async enviar(usuario, titulo, mensaje) {
    try {
      const fetch = await import('node-fetch').then((m) => m.default);
      const payload = {
        text: titulo,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: titulo } },
          { type: 'section', text: { type: 'mrkdwn', text: mensaje } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: `Usuario: ${usuario} | ${new Date().toLocaleString('es-ES')}` }] },
        ],
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack error: ${response.statusText}`);
      }

      return { exitoso: true, canal: 'SLACK' };
    } catch (error) {
      console.error('Error en SlackNotificationAdapter:', error);
      throw error;
    }
  }

  async validar() {
    return { disponible: !!this.webhookUrl, canal: 'SLACK', estado: this.webhookUrl ? 'ACTIVO' : 'INACTIVO' };
  }
}

export class SMSNotificationAdapter extends NotificationChannelAdapter {
  constructor(twilioClient) {
    super();
    this.twilioClient = twilioClient;
  }

  async enviar(usuario, titulo, mensaje) {
    try {
      const User = (await import('../models/User.js')).default;
      const usuarioDoc = await User.findByPk(usuario);
      if (!usuarioDoc?.telefono) {
        throw new Error('Usuario sin teléfono');
      }

      const mensajeSMS = `${titulo}: ${mensaje}`.substring(0, 160);
      const mensaje_enviado = await this.twilioClient.messages.create({
        body: mensajeSMS,
        from: process.env.TWILIO_PHONE,
        to: usuarioDoc.telefono,
      });

      return { exitoso: true, sid: mensaje_enviado.sid, telefono: usuarioDoc.telefono, canal: 'SMS' };
    } catch (error) {
      console.error('Error en SMSNotificationAdapter:', error);
      throw error;
    }
  }

  async validar() {
    return { disponible: !!this.twilioClient, canal: 'SMS', estado: this.twilioClient ? 'ACTIVO' : 'INACTIVO' };
  }
}

/**
 * ADAPTADOR DE DEMO - SIMULA ENVÍOS PARA VISUALIZACIÓN
 * Este adaptador simula el envío de notificaciones por múltiples canales sin requerir credenciales.
 * Útil para demostrar el patrón Adapter en la UI.
 */
export class DemoNotificationAdapter extends NotificationChannelAdapter {
  constructor(canalDemo = 'DEMO') {
    super();
    this.canalDemo = canalDemo;
    this.canalesSimulados = ['EMAIL', 'SMS', 'WHATSAPP'];
  }

  async enviar(usuario, titulo, mensaje, opciones = {}) {
    // Simular delay de red para hacerlo más realista
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const canal = this.canalDemo;
    console.log(`[DEMO ${canal}] Enviando a usuario ${usuario}: "${titulo}"`);
    console.log(`[DEMO ${canal}] Mensaje: ${mensaje}`);
    
    return { 
      exitoso: true, 
      canal: canal,
      mensaje: `Simulado por ${canal}`,
      timestamp: new Date().toISOString()
    };
  }

  async validar() {
    return { 
      disponible: true, 
      canal: this.canalDemo, 
      estado: 'ACTIVO (simulado - demo)',
      canalesSoportados: this.canalesSimulados 
    };
  }
}

export class NotificationAdapterFactory {
  static adapters = new Map();

  static registrar(nombre, adaptador) {
    this.adapters.set(nombre.toLowerCase(), adaptador);
  }

  static obtener(canal) {
    const adaptador = this.adapters.get(canal.toLowerCase());
    if (!adaptador) {
      throw new Error(`Canal de notificación no soportado: ${canal}`);
    }
    return adaptador;
  }

  static getCanalesDisponibles() {
    return Array.from(this.adapters.keys()).map((canal) => canal.toUpperCase());
  }
}
