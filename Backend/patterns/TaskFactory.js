/**
 * PATRÓN FACTORY METHOD
 * Crea instancias de tareas según su tipo
 * Cada tipo de tarea (BUG, FEATURE, TASK, IMPROVEMENT) tiene comportamiento específico
 */

export class Task {
  constructor(titulo, descripcion, prioridad, proyecto, columna, creador) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.prioridad = prioridad;
    this.proyecto = proyecto;
    this.columna = columna;
    this.creador = creador;
    this.responsables = [];
    this.subtareas = [];
    this.comentarios = [];
    this.completada = false;
    this.fechaLimite = null;
    this.etiquetas = [];
  }

  agregarResponsable(usuarioId) {
    if (!this.responsables.includes(usuarioId)) {
      this.responsables.push(usuarioId);
    }
  }

  agregarSubtarea(titulo) {
    this.subtareas.push({
      titulo,
      completada: false,
    });
  }

  agregarComentario(autorId, contenido) {
    this.comentarios.push({
      autor: autorId,
      contenido,
      fecha: new Date(),
    });
  }

  marcarCompletada() {
    this.completada = true;
  }
}

// Clase concreta para BUGS
export class BugTask extends Task {
  constructor(titulo, descripcion, prioridad, proyecto, columna, creador) {
    super(titulo, descripcion, prioridad, proyecto, columna, creador);
    this.tipo = 'BUG';
    this.prioridad = prioridad || 'ALTA'; // Los bugs suelen ser de prioridad alta
    this.etiquetas = ['bug', 'crítico'];
  }

  reportarError(detallesError) {
    this.descripcion = `${this.descripcion}\n\n**Detalles del error:**\n${detallesError}`;
  }
}

// Clase concreta para FEATURES
export class FeatureTask extends Task {
  constructor(titulo, descripcion, prioridad, proyecto, columna, creador) {
    super(titulo, descripcion, prioridad, proyecto, columna, creador);
    this.tipo = 'FEATURE';
    this.etiquetas = ['feature', 'nueva-funcionalidad'];
    this.requisitos = [];
  }

  agregarRequisito(requisito) {
    if (!this.requisitos.includes(requisito)) {
      this.requisitos.push(requisito);
    }
  }
}

// Clase concreta para TASKS
export class RegularTask extends Task {
  constructor(titulo, descripcion, prioridad, proyecto, columna, creador) {
    super(titulo, descripcion, prioridad, proyecto, columna, creador);
    this.tipo = 'TASK';
    this.etiquetas = ['tarea'];
  }
}

// Clase concreta para IMPROVEMENTS
export class ImprovementTask extends Task {
  constructor(titulo, descripcion, prioridad, proyecto, columna, creador) {
    super(titulo, descripcion, prioridad, proyecto, columna, creador);
    this.tipo = 'IMPROVEMENT';
    this.etiquetas = ['mejora', 'optimización'];
    this.areaDeImpacto = '';
  }

  setAreaDeImpacto(area) {
    this.areaDeImpacto = area;
  }
}

/**
 * FACTORY PARA CREAR TAREAS
 * Encapsula la lógica de creación según el tipo
 */
export class TaskFactory {
  static crearTarea(tipo, titulo, descripcion, prioridad, proyecto, columna, creador) {
    switch (tipo) {
      case 'BUG':
        return new BugTask(titulo, descripcion, prioridad, proyecto, columna, creador);
      case 'FEATURE':
        return new FeatureTask(titulo, descripcion, prioridad, proyecto, columna, creador);
      case 'IMPROVEMENT':
        return new ImprovementTask(titulo, descripcion, prioridad, proyecto, columna, creador);
      case 'TASK':
      default:
        return new RegularTask(titulo, descripcion, prioridad, proyecto, columna, creador);
    }
  }
}

export default TaskFactory;
