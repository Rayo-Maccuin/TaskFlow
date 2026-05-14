/**
 * MODELO: SystemSetting
 * Define la estructura de configuraciones del sistema
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const SystemSetting = sequelize.define(
  'SystemSetting',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clave: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: 'GLOBAL',
    },
    nombreSistema: {
      type: DataTypes.STRING,
      defaultValue: 'TaskFlow',
    },
    limiteArchivoMB: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 1,
      },
    },
    politicaPassword: {
      type: DataTypes.JSON,
      defaultValue: {
        minLength: 6,
        requiereMayuscula: false,
        requiereNumero: false,
      },
    },
  },
  {
    timestamps: true,
    tableName: 'SystemSettings',
  }
);

export default SystemSetting;
