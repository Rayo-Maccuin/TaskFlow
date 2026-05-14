/**
 * PATRÓN PROTOTYPE
 * Permite clonar tareas y proyectos sin necesidad de crear nuevas instancias desde cero
 * Útil para duplicar tareas o proyectos manteniendo la estructura
 */

export class Prototype {
  clone() {
    // Retorna una copia profunda del objeto
    return JSON.parse(JSON.stringify(this));
  }
}

/**
 * CLONADOR DE TAREAS
 * Permite duplicar una tarea existente con todas sus propiedades
 */
export class TaskCloner extends Prototype {
  constructor(tarea) {
    super();
    this.tarea = tarea;
  }

  /**
   * Clona una tarea preservando su estructura
   * Opcionalmente puede cambiar título y descripción
   */
  clonar(nuevoTitulo = null, nuevoCreador = null) {
    const clon = this.clone();
    
    // Cambiar el título si se proporciona
    if (nuevoTitulo) {
      clon.titulo = `${nuevoTitulo} (Copia de ${this.tarea.titulo})`;
    } else {
      clon.titulo = `Copia de ${this.tarea.titulo}`;
    }

    // Cambiar el creador si se proporciona
    if (nuevoCreador) {
      clon.creador = nuevoCreador;
    }

    // Limpiar datos específicos
    delete clon.id;
    delete clon.createdAt;
    delete clon.updatedAt;
    clon.completada = false;
    clon.responsables = [];
    clon.comentarios = [];
    clon.subtareas = clon.subtareas.map(s => ({
      titulo: s.titulo,
      completada: false,
    }));

    return clon;
  }
}

/**
 * CLONADOR DE PROYECTOS
 * Permite duplicar un proyecto existente con todas sus configuraciones
 */
export class ProjectCloner extends Prototype {
  constructor(proyecto) {
    super();
    this.proyecto = proyecto;
  }

  /**
   * Clona un proyecto preservando su estructura
   * Los miembros y tablero se crean nuevos
   */
  clonar(nuevoNombre = null, nuevoPropietario = null) {
    const clon = this.clone();
    
    // Cambiar el nombre si se proporciona
    if (nuevoNombre) {
      clon.nombre = nuevoNombre;
    } else {
      clon.nombre = `Copia de ${this.proyecto.nombre}`;
    }

    // Cambiar el propietario si se proporciona
    if (nuevoPropietario) {
      clon.propietario = nuevoPropietario;
    }

    // Limpiar datos específicos
    delete clon.id;
    delete clon.createdAt;
    delete clon.updatedAt;
    clon.estado = 'PLANIFICADO';
    clon.fechaInicio = new Date();
    clon.fechaFin = null;
    clon.miembros = [];

    return clon;
  }
}

export default { TaskCloner, ProjectCloner };
