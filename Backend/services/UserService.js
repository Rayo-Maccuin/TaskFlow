/**
 * SERVICIO DE USUARIOS
 * Contiene la lógica de negocio relacionada con usuarios
 */

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';

export class UserService {
  async validarPoliticaPassword(password) {
    const config = await SystemSetting.findOne({
      where: { clave: 'GLOBAL' },
    });

    const politica = config?.politicaPassword || {
      minLength: 6,
      requiereMayuscula: false,
      requiereNumero: false,
    };

    if ((password || '').length < politica.minLength) {
      throw new Error(
        `La contraseña debe tener al menos ${politica.minLength} caracteres`
      );
    }

    if (politica.requiereMayuscula && !/[A-Z]/.test(password)) {
      throw new Error(
        'La contraseña debe incluir al menos una letra mayúscula'
      );
    }

    if (politica.requiereNumero && !/[0-9]/.test(password)) {
      throw new Error(
        'La contraseña debe incluir al menos un número'
      );
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async registrar(nombre, email, password, rol = 'DEVELOPER') {
    try {
      await this.validarPoliticaPassword(password);

      // Verificar si el usuario ya existe
      const usuarioExistente = await User.findOne({
        where: { email },
      });

      if (usuarioExistente) {
        throw new Error('El email ya está registrado');
      }

      // Hash de contraseña
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(password, salt);

      // Crear usuario
      const nuevoUsuario = await User.create({
        nombre,
        email,
        password: passwordHash,
        rol,
      });

      return {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login
   */
  async login(email, password) {
    try {
      const usuario = await User.findOne({
        where: { email },
        attributes: [
          'id',
          'nombre',
          'email',
          'password',
          'rol',
          'activo',
          'soloLectura',
          'proyectosSoloLectura',
          'avatar',
          'descripcion',
          'ultimoAcceso',
          'preferenciasNotificacion',
        ],
      });

      if (!usuario) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      // Validar password
      const esValida = await bcryptjs.compare(
        password,
        usuario.password
      );

      if (!esValida) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado en el servidor');
      }

      // Actualizar último acceso
      await usuario.update({
        ultimoAcceso: new Date(),
      });

      // Generar JWT
      const token = jwt.sign(
        { id: usuario.id },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d',
        }
      );

      return {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo,
          soloLectura: usuario.soloLectura,
          proyectosSoloLectura: usuario.proyectosSoloLectura || [],
          avatar: usuario.avatar,
          descripcion: usuario.descripcion,
          ultimoAcceso: usuario.ultimoAcceso,
          preferenciasNotificacion: usuario.preferenciasNotificacion,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async obtenerPorId(id) {
    try {
      const usuario = await User.findByPk(id, {
        attributes: {
          exclude: ['password'],
        },
      });

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return usuario;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async obtenerTodos(incluirInactivos = false) {
    try {
      const whereClause = incluirInactivos
        ? {}
        : { activo: true };

      return await User.findAll({
        where: whereClause,
        attributes: {
          exclude: ['password'],
        },
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar usuario desde admin
   */
  async actualizarPorAdmin(id, datos) {
    try {
      const payload = {
        nombre: datos.nombre,
        email: datos.email,
        descripcion: datos.descripcion,
        avatar: datos.avatar,
      };

      if (datos.rol) {
        payload.rol = datos.rol;
      }

      if (typeof datos.soloLectura === 'boolean') {
        payload.soloLectura = datos.soloLectura;
      }

      if (Array.isArray(datos.proyectosSoloLectura)) {
        payload.proyectosSoloLectura =
          datos.proyectosSoloLectura;
      }

      if (typeof datos.activo === 'boolean') {
        payload.activo = datos.activo;
      }

      // Eliminar undefined
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) {
          delete payload[k];
        }
      });

      await User.update(payload, {
        where: { id },
      });

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async actualizar(id, datos) {
    try {
      delete datos.password;
      delete datos.rol;

      await User.update(datos, {
        where: { id },
      });

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async cambiarPassword(
    id,
    passwordActual,
    passwordNueva
  ) {
    try {
      const usuario = await User.findByPk(id);

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const esValida = await bcryptjs.compare(
        passwordActual,
        usuario.password
      );

      if (!esValida) {
        throw new Error(
          'Contraseña actual incorrecta'
        );
      }

      await this.validarPoliticaPassword(
        passwordNueva
      );

      const salt = await bcryptjs.genSalt(10);

      const nuevaPasswordHash =
        await bcryptjs.hash(passwordNueva, salt);

      await usuario.update({
        password: nuevaPasswordHash,
      });

      return {
        message:
          'Contraseña actualizada correctamente',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async desactivar(id) {
    try {
      await User.update(
        { activo: false },
        {
          where: { id },
        }
      );

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reactivar usuario
   */
  async reactivar(id) {
    try {
      await User.update(
        { activo: true },
        {
          where: { id },
        }
      );

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();