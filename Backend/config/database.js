/**
 * PATRÓN SINGLETON - Conexión a MySQL con Sequelize
 * Garantiza que solo exista una instancia de la conexión a la base de datos
 * Automáticamente sincroniza y crea las tablas según los modelos
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConnection {
  static instance = null;
  sequelize = null;

  constructor() {
    if (!this.sequelize) {
      if (!process.env.DB_HOST) throw new Error('DB_HOST no está definida en .env');
      if (!process.env.DB_USER) throw new Error('DB_USER no está definida en .env');
      if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD no está definida en .env');
      if (!process.env.DB_NAME) throw new Error('DB_NAME no está definida en .env');

      this.sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
          },
        }
      );
    }

  }

  /**
   * Obtiene la instancia única
   */
  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Conecta a MySQL usando variables del .env y crea las tablas automáticamente
   */
  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log('Conexión a MySQL exitosa');

      await this.sequelize.sync({ alter: true });
      console.log('Tablas sincronizadas/creadas automáticamente');

      return this.sequelize;
    } catch (error) {
      console.error('Error conectando a MySQL:', error.message);
      process.exit(1);
    }
  }

  /**
   * Obtiene la instancia de Sequelize
   */
  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Base de datos no conectada. Llama a connect() primero');
    }
    return this.sequelize;
  }

  /**
   * Cierra la conexión
   */
  async disconnect() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('Desconectado de MySQL');
    }
  }
}

export default DatabaseConnection;