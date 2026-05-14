/**
 * ÍNDICE DE MODELOS - Sequelize
 * Importa y configura todas las relaciones (asociaciones) entre modelos
 */

import User from './User.js';
import Project from './Project.js';
import Task from './Task.js';
import Board from './Board.js';
import Notification from './Notification.js';
import AuditLog from './AuditLog.js';
import SavedFilter from './SavedFilter.js';
import SystemSetting from './SystemSetting.js';

/**
 * Definir asociaciones entre modelos
 * Las asociaciones conectan las tablas relacionales
 */

// USER -> PROJECT (One to Many)
User.hasMany(Project, {
  foreignKey: 'propietarioId',
  as: 'proyectosPropiedad',
  onDelete: 'CASCADE',
});
Project.belongsTo(User, {
  foreignKey: 'propietarioId',
  as: 'propietario',
});

// USER -> TASK (One to Many - Creador)
User.hasMany(Task, {
  foreignKey: 'creadorId',
  as: 'tareasCreadoras',
  onDelete: 'CASCADE',
});
Task.belongsTo(User, {
  foreignKey: 'creadorId',
  as: 'creador',
});

// USER -> NOTIFICATION (One to Many)
User.hasMany(Notification, {
  foreignKey: 'usuarioId',
  as: 'notificaciones',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario',
});

// USER -> AUDITLOG (One to Many)
User.hasMany(AuditLog, {
  foreignKey: 'usuarioId',
  as: 'auditLogsCreados',
  onDelete: 'CASCADE',
});
AuditLog.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario',
});

// USER -> SAVEDFILTER (One to Many)
User.hasMany(SavedFilter, {
  foreignKey: 'usuarioId',
  as: 'filtrosGuardados',
  onDelete: 'CASCADE',
});
SavedFilter.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'usuario',
});

// PROJECT -> TASK (One to Many)
Project.hasMany(Task, {
  foreignKey: 'proyectoId',
  as: 'tareas',
  onDelete: 'CASCADE',
});
Task.belongsTo(Project, {
  foreignKey: 'proyectoId',
  as: 'proyecto',
});

// PROJECT -> BOARD (One to One)
Project.hasOne(Board, {
  foreignKey: 'proyectoId',
  as: 'tablero',
  onDelete: 'CASCADE',
});
Board.belongsTo(Project, {
  foreignKey: 'proyectoId',
  as: 'proyecto',
});

// PROJECT -> NOTIFICATION (One to Many)
Project.hasMany(Notification, {
  foreignKey: 'entidadId',
  constraints: false,
  scope: { entidadTipo: 'PROJECT' },
  as: 'notificacionesProyecto',
});

// PROJECT -> AUDITLOG (One to Many)
Project.hasMany(AuditLog, {
  foreignKey: 'proyectoId',
  as: 'auditLogs',
  onDelete: 'CASCADE',
});
AuditLog.belongsTo(Project, {
  foreignKey: 'proyectoId',
  as: 'proyecto',
});

// TASK -> NOTIFICATION (One to Many)
Task.hasMany(Notification, {
  foreignKey: 'entidadId',
  constraints: false,
  scope: { entidadTipo: 'TASK' },
  as: 'notificacionesTarea',
});

/**
 * Exportar modelos configurados
 * Las asociaciones ya están definidas
 */
export {
  User,
  Project,
  Task,
  Board,
  Notification,
  AuditLog,
  SavedFilter,
  SystemSetting,
};

export default {
  User,
  Project,
  Task,
  Board,
  Notification,
  AuditLog,
  SavedFilter,
  SystemSetting,
};
