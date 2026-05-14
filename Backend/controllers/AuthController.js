/**
 * CONTROLADOR DE AUTENTICACIÓN Y USUARIOS
 * Maneja las peticiones HTTP relacionadas con usuarios
 */

import UserService from '../services/UserService.js';
import { validationResult } from 'express-validator';

export class AuthController {
  /**
   * POST /registro
   * Registra un nuevo usuario
   */
  async registro(req, res) {
    try {
      // Validar que no haya errores de validación
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errores.array(),
        });
      }

      const { nombre, email, password, confirmPassword, rol = 'DEVELOPER' } = req.body;

      // Verificar que las contraseñas coincidan
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden',
        });
      }

      const usuario = await UserService.registrar(nombre, email, password, rol);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        usuario,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /login
   * Login de usuario - Retorna token JWT
   */
  async login(req, res) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errores.array(),
        });
      }

      const { email, password } = req.body;
      const resultado = await UserService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        ...resultado,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /perfil
   * Obtiene el perfil del usuario autenticado
   */
  async obtenerPerfil(req, res) {
    try {
      const usuario = await UserService.obtenerPorId(req.usuarioId);

      res.status(200).json({
        success: true,
        usuario,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /perfil
   * Actualiza el perfil del usuario autenticado
   */
  async actualizarPerfil(req, res) {
    try {
      const { nombre, avatar, descripcion, email } = req.body;

      const usuarioActualizado = await UserService.actualizar(req.usuarioId, {
        nombre,
        avatar,
        descripcion,
        email,
      });

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado correctamente',
        usuario: usuarioActualizado,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /cambiar-password
   * Cambia la contraseña del usuario
   */
  async cambiarPassword(req, res) {
    try {
      const { passwordActual, passwordNueva, confirmPassword } = req.body;

      if (passwordNueva !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden',
        });
      }

      await UserService.cambiarPassword(req.usuarioId, passwordActual, passwordNueva);

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /usuarios
   * Obtiene lista de todos los usuarios
   */
  async obtenerUsuarios(req, res) {
    try {
      const usuarios = await UserService.obtenerTodos();

      const usuariosFiltrados =
        req.rol === 'PROJECT_MANAGER'
          ? usuarios.filter(
              (u) => u.rol !== 'ADMIN' && u.id.toString() !== req.usuarioId
            )
          : usuarios;

      res.status(200).json({
        success: true,
        usuarios: usuariosFiltrados,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /usuarios/:id
   * Obtiene un usuario por ID
   */
  async obtenerUsuario(req, res) {
    try {
      const usuario = await UserService.obtenerPorId(req.params.id);

      res.status(200).json({
        success: true,
        usuario,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /logout
   * Logout del usuario (principalmente para limpiar en frontend)
   */
  async logout(req, res) {
    res.status(200).json({
      success: true,
      message: 'Logout exitoso',
    });
  }
}

export default new AuthController();
