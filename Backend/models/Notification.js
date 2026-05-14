import { DataTypes } from 'sequelize';
import DatabaseConnection from '../config/database.js';

const db = DatabaseConnection.getInstance();
const sequelize = db.getSequelize();

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    tipo: {
      type: DataTypes.ENUM(
        'ASIGNACION',
        'VENCIMIENTO',
        'COMENTARIO',
        'CAMBIO_ESTADO',
        'TAREA_CREADA'
      ),
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    entidadTipo: {
      type: DataTypes.ENUM('TASK', 'PROJECT'),
      defaultValue: 'TASK',
    },
    entidadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
     leida: {
       type: DataTypes.BOOLEAN,
       defaultValue: false,
     },
     canales: {
       type: DataTypes.JSON,
       defaultValue: [],
       comment: 'Canales por los que se envió la notificación: ["DATABASE", "EMAIL", "SLACK", "SMS"]'
     },
   },
  {
    timestamps: true,
    tableName: 'Notifications',
  }
);

export default Notification;


