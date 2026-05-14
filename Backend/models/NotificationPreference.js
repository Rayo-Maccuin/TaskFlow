/**
 * MODELO: Preferencias de Notificación
 * Define las preferencias de notificación de cada usuario
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const NotificationPreference = sequelize.define(
  'NotificationPreference',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    asignacionTarea: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Notificar cuando se asigna una tarea'
    },
    vencimientoTarea: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Notificar cuando una tarea está próxima a vencer'
    },
    comentarioTarea: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Notificar cuando alguien comenta en una tarea asignada'
    },
    cambioEstadoTarea: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Notificar cuando cambia el estado de una tarea asignada'
    },
    invitacionProyecto: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Notificar cuando se recibe invitación a proyecto'
    },
    cambioProyecto: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Notificar cambios en proyectos donde soy miembro'
    },
    canalEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Enviar notificaciones por email'
    },
    canalInApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Mostrar notificaciones en la aplicación'
    },
    frecuenciaEmail: {
      type: DataTypes.ENUM('INMEDIATO', 'DIARIO', 'SEMANAL'),
      defaultValue: 'INMEDIATO',
      comment: 'Frecuencia de envío de emails'
    }
  },
  {
    tableName: 'notification_preferences',
    timestamps: true,
  }
);

// Asociación con User
NotificationPreference.associate = (models) => {
  NotificationPreference.belongsTo(models.User, {
    foreignKey: 'usuarioId',
    as: 'usuario',
    onDelete: 'CASCADE'
  });
};

export default NotificationPreference;