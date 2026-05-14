/**
 * MODELO: Proyecto
 * Define la estructura de los proyectos en la base de datos
 * Estados: PLANIFICADO, EN_PROGRESO, PAUSADO, COMPLETADO, ARCHIVADO
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const Project = sequelize.define(
  'Project',
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
        notEmpty: { msg: 'El nombre del proyecto es obligatorio' },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    estado: {
      type: DataTypes.ENUM('PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO'),
      defaultValue: 'PLANIFICADO',
    },
    fechaInicio: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fechaFin: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    propietarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    miembros: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6',
    },
  },
  {
    timestamps: true,
    tableName: 'Projects',
  }
);

export default Project;
