// Composite para tareas/subtareas con cálculo de progreso unificado
// Permite tratar tareas individuales y compuestas (con subtareas) de manera uniforme

class ComponenteTarea {
  constructor(id, titulo, descripcion = '') {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.completada = false;
    this.fechaCreacion = new Date();
  }

  agregar(componente) {
    throw new Error('Método agregar no soportado');
  }

  remover(componente) {
    throw new Error('Método remover no soportado');
  }

  obtenerHijo(indice) {
    throw new Error('Método obtenerHijo no soportado');
  }

  obtenerProgreso() {
    return this.completada ? 100 : 0;
  }

  marcarCompletada(completada = true) {
    this.completada = completada;
  }

  esCompuesta() {
    return false;
  }
}

class TareaCompuesta extends ComponenteTarea {
  constructor(id, titulo, descripcion = '') {
    super(id, titulo, descripcion);
    this.subtareas = [];
  }

  agregar(componente) {
    this.subtareas.push(componente);
  }

  remover(componente) {
    const indice = this.subtareas.indexOf(componente);
    if (indice !== -1) {
      this.subtareas.splice(indice, 1);
    }
  }

  obtenerHijo(indice) {
    return this.subtareas[indice];
  }

  obtenerProgreso() {
    if (this.subtareas.length === 0) {
      return this.completada ? 100 : 0;
    }

    const progresoTotal = this.subtareas.reduce((total, subtarea) => {
      return total + subtarea.obtenerProgreso();
    }, 0);

    return Math.round(progresoTotal / this.subtareas.length);
  }

  marcarCompletada(completada = true) {
    super.marcarCompletada(completada);
    // Marcar todas las subtareas como completadas
    this.subtareas.forEach(subtarea => subtarea.marcarCompletada(completada));
  }

  esCompuesta() {
    return true;
  }

  obtenerTodasLasTareas() {
    const tareas = [this];
    this.subtareas.forEach(subtarea => {
      if (subtarea.esCompuesta()) {
        tareas.push(...subtarea.obtenerTodasLasTareas());
      } else {
        tareas.push(subtarea);
      }
    });
    return tareas;
  }

  obtenerSubtareasCompletadas() {
    return this.subtareas.filter(subtarea => subtarea.completada).length;
  }

  obtenerTotalSubtareas() {
    return this.subtareas.length;
  }
}

class TareaSimple extends ComponenteTarea {
  constructor(id, titulo, descripcion = '', prioridad = 'MEDIA', tipo = 'TASK') {
    super(id, titulo, descripcion);
    this.prioridad = prioridad;
    this.tipo = tipo;
    this.fechaLimite = null;
    this.estimacionHoras = 0;
    this.responsables = [];
    this.etiquetas = [];
  }

  agregar(componente) {
    throw new Error('Tarea simple no puede contener subtareas');
  }

  remover(componente) {
    throw new Error('Tarea simple no puede contener subtareas');
  }

  obtenerHijo(indice) {
    throw new Error('Tarea simple no puede contener subtareas');
  }
}

class TareaCompositeFactory {
  static crearTareaSimple(id, titulo, descripcion = '', prioridad = 'MEDIA', tipo = 'TASK') {
    return new TareaSimple(id, titulo, descripcion, prioridad, tipo);
  }

  static crearTareaCompuesta(id, titulo, descripcion = '') {
    return new TareaCompuesta(id, titulo, descripcion);
  }

  static crearEstructuraDesdeDatos(datos) {
    const tarea = datos.subtareas && datos.subtareas.length > 0
      ? this.crearTareaCompuesta(datos.id || datos._id, datos.titulo, datos.descripcion)
      : this.crearTareaSimple(datos.id || datos._id, datos.titulo, datos.descripcion, datos.prioridad, datos.tipo);

    if (tarea instanceof TareaSimple) {
      tarea.prioridad = datos.prioridad || 'MEDIA';
      tarea.tipo = datos.tipo || 'TASK';
      tarea.fechaLimite = datos.fechaLimite;
      tarea.estimacionHoras = datos.estimacionHoras || 0;
      tarea.responsables = datos.responsables || [];
      tarea.etiquetas = datos.etiquetas || [];
      tarea.completada = datos.completada || false;
    }

    if (datos.subtareas && datos.subtareas.length > 0) {
      datos.subtareas.forEach(subtareaData => {
        const subtarea = this.crearEstructuraDesdeDatos(subtareaData);
        tarea.agregar(subtarea);
      });
    }

    return tarea;
  }
}

module.exports = {
  ComponenteTarea,
  TareaCompuesta,
  TareaSimple,
  TareaCompositeFactory
};