/**
 * MODELO: SavedFilter
 * Define la estructura de filtros guardados por usuario
 */

import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const SavedFilter = sequelize.define(
  'SavedFilter',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      index: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
    },
    criterios: {
      type: DataTypes.JSON,
      defaultValue: {
        responsable: null,
        prioridad: null,
        tipo: null,
        etiqueta: null,
        texto: null,
        fechaDesde: null,
        fechaHasta: null,
      },
    },
  },
  {
    timestamps: true,
    tableName: 'SavedFilters',
  }
);

export default SavedFilter;
