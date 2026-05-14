/**
 * MODELO: Tarea
 * Define la estructura de las tareas del tablero Kanban
 * Prioridades: BAJA, MEDIA, ALTA, URGENTE
 * Tipos: BUG, FEATURE, TASK, IMPROVEMENT
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
      validate: {
        notEmpty: { msg: 'El título de la tarea es obligatorio' },
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    prioridad: {
      type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'),
      defaultValue: 'MEDIA',
    },
    tipo: {
      type: DataTypes.ENUM('BUG', 'FEATURE', 'TASK', 'IMPROVEMENT'),
      defaultValue: 'TASK',
    },
    proyectoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id',
      },
    },
    columnaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de la columna dentro del tablero (valor que existe en Board.columnas[].id, no es una FK)',
      // NO es una clave foránea - se refiere a una columna dentro de la estructura JSON del tablero
    },
    creadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    responsables: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    fechaLimite: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    estimacionHoras: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    completada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    vencimientoNotificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    etiquetas: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    subtareas: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    comentarios: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    adjuntos: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    registrosTiempo: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    historialCambios: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    tableName: 'Tasks',
  }
);

export default Task;
