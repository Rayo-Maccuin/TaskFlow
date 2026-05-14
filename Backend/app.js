/**
 * PUNTO DE ENTRADA - TaskFlow Backend
 * Configuración de Express, middlewares, rutas y conexión a BD con Sequelize
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import DatabaseConnection from './config/database.js';

// Importar modelos configurados con sus asociaciones
import './models/index.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

// Importar middlewares
import { errorHandler } from './middlewares/auth.js';

// Importar NotificationService (singleton)
import notificationService from './services/NotificationService.js';

// Inicializar aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * MIDDLEWARES GLOBALES
 */

// Parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use('/uploads', express.static('uploads'));

/**
 * RUTAS DE LA API
 */

app.use('/api/auth', authRoutes);
app.use('/api/proyectos', projectRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/tableros', boardRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/configuracion', systemRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/busqueda', searchRoutes);

/**
 * RUTAS DE PRUEBA
 */

app.get('/api/', (req, res) => {
  res.json({
    message: 'API TaskFlow funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      autenticación: '/api/auth',
      proyectos: '/api/proyectos',
      tareas: '/api/tareas',
      tableros: '/api/tableros',
      notificaciones: '/api/notificaciones',
      admin: '/api/admin',
      configuracion: '/api/configuracion',
      reportes: '/api/reportes',
    },
  });
});

/**
 * MANEJO DE ERRORES GLOBAL
 */

app.use(errorHandler);

/**
 * RUTA NO ENCONTRADA (404)
 */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

/**
 * CONEXIÓN A BASE DE DATOS E INICIO DEL SERVIDOR
 */

const iniciar = async () => {
  try {
    // Usar el patrón Singleton para conectar a BD
    const db = DatabaseConnection.getInstance();
    await db.connect();

    // Inicializar NotificationService (carga adaptadores)
    await notificationService.inicializar();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║         TaskFlow API Backend              ║
╠════════════════════════════════════════════╣
║  Servidor corriendo en puerto: ${PORT}           ║
║  Modo: ${process.env.NODE_ENV || 'development'}          ║
║  Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}   ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

iniciar();

export default app;
