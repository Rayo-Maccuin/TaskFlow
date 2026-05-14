/**
 * MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
 * Usa patrón Bridge para flexibilidad en estrategias de autenticación
 */

import User from '../models/User.js';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import AuthServiceFactory from '../patterns/Bridge.js';

const authService = AuthServiceFactory.crear('JWT', { secret: process.env.JWT_SECRET });
export { authService };

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const resultado = await authService.verificarToken(token);

    if (!resultado.success) {
      return res.status(401).json({ success: false, message: resultado.error });
    }

    req.usuario = resultado.usuario;
    req.usuarioId = resultado.usuarioId;
    req.rol = resultado.rol;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: `Error de autenticación: ${error.message}` });
  }
};

export const roleMiddleware = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuarioId) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.rol)) {
      return res.status(403).json({ success: false, message: `Acceso denegado. Roles requeridos: ${rolesPermitidos.join(', ')}` });
    }

    next();
  };
};

export const isAdmin = roleMiddleware('ADMIN');
export const isProjectManager = roleMiddleware('ADMIN', 'PROJECT_MANAGER');

const buscarProyectoPorColumna = (boards, idColumna) => {
  for (const board of boards) {
    const columna = (board.columnas || []).find((col) => col.id == idColumna);
    if (columna) {
      return board.proyectoId;
    }
  }
  return null;
};

const resolverProyectoDesdeRequest = async (req) => {
  if (req.params?.idProyecto) return req.params.idProyecto;
  if (req.body?.proyecto) return req.body.proyecto;

  if (req.baseUrl.includes('/proyectos') && req.params?.id) {
    return req.params.id;
  }

  if (req.baseUrl.includes('/tableros') && req.params?.idTablero) {
    const tablero = await Board.findByPk(req.params.idTablero, { attributes: ['proyectoId'] });
    return tablero?.proyectoId?.toString() || null;
  }

  if (req.baseUrl.includes('/tareas')) {
    if (req.params?.idColumna) {
      const boards = await Board.findAll({ attributes: ['proyectoId', 'columnas'] });
      const proyectoId = buscarProyectoPorColumna(boards, req.params.idColumna);
      return proyectoId?.toString() || null;
    }

    if (req.params?.id) {
      const tarea = await Task.findByPk(req.params.id, { attributes: ['proyectoId'] });
      return tarea?.proyectoId?.toString() || null;
    }
  }

  return null;
};

export const readOnlyMiddleware = async (req, res, next) => {
  const metodosLectura = ['GET', 'HEAD', 'OPTIONS'];
  if (metodosLectura.includes(req.method)) {
    return next();
  }

  if (req.rol === 'ADMIN') {
    return next();
  }

  if (req.usuario?.soloLectura) {
    return res.status(403).json({ success: false, message: 'Tu cuenta está en modo solo lectura. Contacta a un administrador.' });
  }

  // Permitir siempre operaciones de archivos adjuntos
  if (req.path.includes('/adjuntos') || req.path.includes('/archivos')) {
    console.log('[readOnlyMiddleware] Operación de archivo permitida:', req.method, req.path);
    return next();
  }

  try {
    const proyectoObjetivo = await resolverProyectoDesdeRequest(req);
    const proyectosSoloLectura = (req.usuario?.proyectosSoloLectura || []).map((p) => p.toString());

    if (proyectoObjetivo && proyectosSoloLectura.includes(proyectoObjetivo.toString())) {
      return res.status(403).json({ success: false, message: 'No puedes modificar este proyecto: tienes acceso de solo lectura para este proyecto.' });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'No se pudo validar permisos de solo lectura' });
  }

  return next();
};

export const errorHandler = (err, req, res, next) => {
  console.error('? Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Error de validación', errors: messages });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const campo = err.errors?.[0]?.path || 'campo';
    return res.status(400).json({ success: false, message: `El campo "${campo}" ya existe` });
  }

  res.status(err.status || 500).json({ success: false, message: err.message || 'Error interno del servidor' });
};

export default {
  authMiddleware,
  roleMiddleware,
  isAdmin,
  isProjectManager,
  readOnlyMiddleware,
  errorHandler,
};
