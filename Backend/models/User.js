/**
 * MODELO: Usuario
 * Define la estructura de los usuarios en la base de datos
 * Roles: ADMIN, PROJECT_MANAGER, DEVELOPER
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
      validate: {
        notEmpty: { msg: 'El nombre es obligatorio' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      lowercase: true,
      validate: {
        isEmail: { msg: 'Email inválido' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100],
      },
    },
    rol: {
      type: DataTypes.ENUM('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'),
      defaultValue: 'DEVELOPER',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    soloLectura: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: 'https://via.placeholder.com/150',
    },
    descripcion: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    ultimoAcceso: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    preferenciasNotificacion: {
      type: DataTypes.JSON,
      defaultValue: {
        asignacion: true,
        vencimiento: true,
        comentarios: true,
        cambioEstado: true,
      },
    },
    proyectosSoloLectura: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    tableName: 'Users',
  }
);

export default User;
