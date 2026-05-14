/**
 * PATRÓN ABSTRACT FACTORY
 * Define la creación de familias de objetos (temas) sin especificar sus clases concretas
 * Base de temas que pueden ser extendidos en el frontend
 */

// INTERFAZ ABSTRACTA (emulada en JavaScript)
export class ColorTheme {
  constructor() {
    if (new.target === ColorTheme) {
      throw new TypeError('ColorTheme es una clase abstracta y no puede ser instanciada');
    }
  }

  getPrimaryColor() {
    throw new Error('getPrimaryColor() debe ser implementado');
  }

  getSecondaryColor() {
    throw new Error('getSecondaryColor() debe ser implementado');
  }

  getBackgroundColor() {
    throw new Error('getBackgroundColor() debe ser implementado');
  }

  getTextColor() {
    throw new Error('getTextColor() debe ser implementado');
  }
}

// TEMA CLARO (Light Theme)
export class LightTheme extends ColorTheme {
  constructor() {
    super();
    this.name = 'light';
  }

  getPrimaryColor() {
    return '#3B82F6'; // Azul
  }

  getSecondaryColor() {
    return '#10B981'; // Verde
  }

  getBackgroundColor() {
    return '#FFFFFF'; // Blanco
  }

  getTextColor() {
    return '#1F2937'; // Gris oscuro
  }

  getCardBackground() {
    return '#F3F4F6'; // Gris claro
  }

  getBorderColor() {
    return '#E5E7EB'; // Gris muy claro
  }
}

// TEMA OSCURO (Dark Theme)
export class DarkTheme extends ColorTheme {
  constructor() {
    super();
    this.name = 'dark';
  }

  getPrimaryColor() {
    return '#60A5FA'; // Azul claro
  }

  getSecondaryColor() {
    return '#34D399'; // Verde claro
  }

  getBackgroundColor() {
    return '#111827'; // Gris casi negro
  }

  getTextColor() {
    return '#F3F4F6'; // Gris claro
  }

  getCardBackground() {
    return '#1F2937'; // Gris oscuro
  }

  getBorderColor() {
    return '#374151'; // Gris más oscuro
  }
}

// TEMA PROFESIONAL
export class ProfessionalTheme extends ColorTheme {
  constructor() {
    super();
    this.name = 'professional';
  }

  getPrimaryColor() {
    return '#1E40AF'; // Azul profesional
  }

  getSecondaryColor() {
    return '#7C3AED'; // Púrpura
  }

  getBackgroundColor() {
    return '#F8FAFC'; // Gris muy claro
  }

  getTextColor() {
    return '#0F172A'; // Casi negro
  }

  getCardBackground() {
    return '#FFFFFF'; // Blanco puro
  }

  getBorderColor() {
    return '#CBD5E1'; // Gris
  }
}

/**
 * ABSTRACT FACTORY - Factory de Temas
 * Crea instancias de temas según lo solicitado
 */
export class ThemeFactory {
  static crearTema(tipo) {
    switch (tipo.toLowerCase()) {
      case 'dark':
      case 'oscuro':
        return new DarkTheme();
      case 'professional':
      case 'profesional':
        return new ProfessionalTheme();
      case 'light':
      case 'claro':
      default:
        return new LightTheme();
    }
  }

  static obtenerTemasDisponibles() {
    return ['light', 'dark', 'professional'];
  }
}

export default { ThemeFactory, LightTheme, DarkTheme, ProfessionalTheme };
