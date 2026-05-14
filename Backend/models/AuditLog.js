/**
 * MODELO: AuditLog
 * Define la estructura de registros de auditoría del sistema
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    proyectoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      index: true,
      references: {
        model: 'Projects',
        key: 'id',
      },
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    accion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entidadTipo: {
      type: DataTypes.ENUM('PROJECT', 'TASK', 'BOARD', 'COMMENT', 'TIME', 'SYSTEM'),
      allowNull: false,
    },
    entidadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    detalles: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    tableName: 'AuditLogs',
  }
);

export default AuditLog;
