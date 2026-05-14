/**
 * MODELO: Tablero Kanban
 * Define la estructura del tablero con sus columnas
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const Board = sequelize.define(
  'Board',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      defaultValue: 'Tablero Principal',
    },
    proyectoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'Projects',
        key: 'id',
      },
    },
    columnas: {
      type: DataTypes.JSON,
      defaultValue: [
        {
          id: 1,
          nombre: 'Por Hacer',
          orden: 0,
          color: '#e5e7eb',
          limiteWip: 0,
          tareas: [],
        },
        {
          id: 2,
          nombre: 'En Progreso',
          orden: 1,
          color: '#fbbf24',
          limiteWip: 5,
          tareas: [],
        },
        {
          id: 3,
          nombre: 'Hecho',
          orden: 2,
          color: '#86efac',
          limiteWip: 0,
          tareas: [],
        },
      ],
    },
  },
  {
    timestamps: true,
    tableName: 'Boards',
  }
);

export default Board;
