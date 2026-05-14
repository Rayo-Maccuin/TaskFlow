// Adapter para integración con servicios de notificación
// Permite adaptar diferentes servicios de notificación (email, push, SMS)

class NotificationAdapter {
  constructor(service) {
    this.service = service;
  }

  async enviarNotificacion(tipo, destinatario, mensaje) {
    // Método abstracto que debe ser implementado por adaptadores concretos
    throw new Error('Método enviarNotificacion debe ser implementado');
  }
}

class EmailNotificationAdapter extends NotificationAdapter {
  async enviarNotificacion(tipo, destinatario, mensaje) {
    // Simula envío de email
    console.log(`Enviando email a ${destinatario}: ${mensaje}`);
    // Aquí iría la lógica real de envío de email
    return { success: true, tipo: 'email' };
  }
}

class PushNotificationAdapter extends NotificationAdapter {
  async enviarNotificacion(tipo, destinatario, mensaje) {
    // Simula envío de notificación push
    console.log(`Enviando push a ${destinatario}: ${mensaje}`);
    // Aquí iría la lógica real de envío de push
    return { success: true, tipo: 'push' };
  }
}

class SMSNotificationAdapter extends NotificationAdapter {
  async enviarNotificacion(tipo, destinatario, mensaje) {
    // Simula envío de SMS
    console.log(`Enviando SMS a ${destinatario}: ${mensaje}`);
    // Aquí iría la lógica real de envío de SMS
    return { success: true, tipo: 'sms' };
  }
}

class NotificationAdapterFactory {
  static crearAdapter(tipoServicio) {
    switch (tipoServicio) {
      case 'email':
        return new EmailNotificationAdapter();
      case 'push':
        return new PushNotificationAdapter();
      case 'sms':
        return new SMSNotificationAdapter();
      default:
        throw new Error(`Tipo de servicio no soportado: ${tipoServicio}`);
    }
  }
}

module.exports = {
  NotificationAdapter,
  EmailNotificationAdapter,
  PushNotificationAdapter,
  SMSNotificationAdapter,
  NotificationAdapterFactory
};