/**
 * RUTAS DE AUTENTICACIÓN Y USUARIOS
 */

import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

/**
 * RUTAS PÚBLICAS (sin autenticación)
 */

// POST /registro
// Registra un nuevo usuario
router.post(
  '/registro',
  [
    body('nombre', 'El nombre es obligatorio').trim().notEmpty(),
    body('email', 'El email es inválido').isEmail(),
    body('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    body('confirmPassword', 'Las contraseñas debe coincidir'),
    body('rol', 'El rol debe ser DEVELOPER, PROJECT_MANAGER o ADMIN').optional().isIn(['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']),
  ],
  AuthController.registro.bind(AuthController)
);

// POST /login
// Login de usuario - Retorna JWT
router.post(
  '/login',
  [
    body('email', 'El email es inválido').isEmail(),
    body('password', 'La contraseña es requerida').notEmpty(),
  ],
  AuthController.login.bind(AuthController)
);

/**
 * RUTAS PROTEGIDAS (requieren autenticación)
 */

// GET /perfil
// Obtiene el perfil del usuario autenticado
router.get('/perfil', authMiddleware, AuthController.obtenerPerfil.bind(AuthController));

// PUT /perfil
// Actualiza el perfil del usuario autenticado
router.put('/perfil', authMiddleware, AuthController.actualizarPerfil.bind(AuthController));

// POST /cambiar-password
// Cambia la contraseña del usuario
router.post(
  '/cambiar-password',
  authMiddleware,
  AuthController.cambiarPassword.bind(AuthController)
);

// GET /usuarios
// Obtiene lista de todos los usuarios
router.get('/usuarios', authMiddleware, AuthController.obtenerUsuarios.bind(AuthController));

// GET /usuarios/:id
// Obtiene un usuario por ID
router.get('/usuarios/:id', authMiddleware, AuthController.obtenerUsuario.bind(AuthController));

// POST /logout
// Logout del usuario
router.post('/logout', authMiddleware, AuthController.logout.bind(AuthController));

export default router;
