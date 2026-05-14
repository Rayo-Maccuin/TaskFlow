/**
 * PATRÓN BRIDGE (ESTRUCTURAL)
 * Separa la abstracción de autenticación de su implementación
 * Permite cambiar estrategias sin modificar el middleware
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export class AuthImplementation {
  async autenticar(token) {
    throw new Error('Método autenticar() debe ser implementado');
  }

  async validarUsuario(usuarioId) {
    throw new Error('Método validarUsuario() debe ser implementado');
  }
}

export class JWTAuthImplementation extends AuthImplementation {
  constructor(secret = process.env.JWT_SECRET) {
    super();
    this.secret = secret;
  }

  async autenticar(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded;
    } catch (error) {
      throw new Error(`JWT inválido: ${error.message}`);
    }
  }

  async validarUsuario(usuarioId) {
    const user = await User.findByPk(usuarioId);
    if (!user || !user.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }
    return user;
  }
}

export class BasicAuthImplementation extends AuthImplementation {
  async autenticar(credentials) {
    try {
      const [email, password] = Buffer.from(credentials, 'base64').toString().split(':');
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const bcrypt = await import('bcryptjs');
      const esValido = await bcrypt.default.compare(password, user.password);

      if (!esValido) {
        throw new Error('Contraseña inválida');
      }

      return { id: user.id, email: user.email };
    } catch (error) {
      throw new Error(`Basic Auth fallido: ${error.message}`);
    }
  }

  async validarUsuario(usuarioId) {
    const user = await User.findByPk(usuarioId);
    if (!user || !user.activo) {
      throw new Error('Usuario no encontrado o inactivo');
    }
    return user;
  }
}

export class AuthenticationService {
  constructor(implementation) {
    this.implementation = implementation;
  }

  async verificarToken(token) {
    try {
      const decoded = await this.implementation.autenticar(token);
      const usuario = await this.implementation.validarUsuario(decoded.id);
      return { success: true, usuario, usuarioId: decoded.id, rol: usuario.rol };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verificarCredenciales(credentials) {
    try {
      const decoded = await this.implementation.autenticar(credentials);
      const usuario = await this.implementation.validarUsuario(decoded.id);
      return { success: true, usuario, usuarioId: decoded.id, rol: usuario.rol };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  cambiarImplementacion(nuevaImplementacion) {
    this.implementation = nuevaImplementacion;
  }
}

export class AuthServiceFactory {
  static crear(tipo = 'JWT', config = {}) {
    let implementation;

    switch (tipo.toUpperCase()) {
      case 'JWT':
        implementation = new JWTAuthImplementation(config.secret);
        break;
      case 'BASIC':
        implementation = new BasicAuthImplementation();
        break;
      default:
        throw new Error(`Tipo de autenticación no soportado: ${tipo}`);
    }

    return new AuthenticationService(implementation);
  }
}

export default AuthServiceFactory;
