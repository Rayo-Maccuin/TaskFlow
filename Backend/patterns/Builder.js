/**
 * PATRÓN BUILDER
 * Permite construir tareas complejas paso a paso mediante una interfaz fluida
 * Útil cuando una tarea tiene muchos atributos opcionales
 */

export class TaskBuilder {
  constructor(titulo, proyecto, columna, creador) {
    this.titulo = titulo;
    this.proyecto = proyecto;
    this.columna = columna;
    this.creador = creador;
    this.descripcion = '';
    this.prioridad = 'MEDIA';
    this.tipo = 'TASK';
    this.responsables = [];
    this.fechaLimite = null;
    this.etiquetas = [];
    this.subtareas = [];
  }

  /**
   * Establece la descripción de la tarea
   */
  setDescripcion(descripcion) {
    this.descripcion = descripcion;
    return this;
  }

  /**
   * Establece la prioridad de la tarea
   */
  setPrioridad(prioridad) {
    if (['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].includes(prioridad)) {
      this.prioridad = prioridad;
    }
    return this;
  }

  /**
   * Establece el tipo de tarea
   */
  setTipo(tipo) {
    if (['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT'].includes(tipo)) {
      this.tipo = tipo;
    }
    return this;
  }

  /**
   * Agrega un responsable a la tarea
   */
  agregarResponsable(usuarioId) {
    this.responsables.push(usuarioId);
    return this;
  }

  /**
   * Agrega múltiples responsables
   */
  agregarResponsables(usuarioIds) {
    this.responsables = [...this.responsables, ...usuarioIds];
    return this;
  }

  /**
   * Establece la fecha límite de la tarea
   */
  setFechaLimite(fecha) {
    this.fechaLimite = fecha;
    return this;
  }

  /**
   * Agrega una etiqueta a la tarea
   */
  agregarEtiqueta(etiqueta) {
    if (!this.etiquetas.includes(etiqueta)) {
      this.etiquetas.push(etiqueta);
    }
    return this;
  }

  /**
   * Agrega múltiples etiquetas
   */
  agregarEtiquetas(etiquetas) {
    this.etiquetas = [...this.etiquetas, ...etiquetas];
    return this;
  }

  /**
   * Agrega una subtarea
   */
  agregarSubtarea(titulo) {
    this.subtareas.push({
      titulo,
      completada: false,
    });
    return this;
  }

  /**
   * Agrega múltiples subtareas
   */
  agregarSubtareas(subtareas) {
    this.subtareas = [
      ...this.subtareas,
      ...subtareas.map(s => ({
        titulo: s,
        completada: false,
      })),
    ];
    return this;
  }

  /**
   * Construye y retorna el objeto de tarea
   */
  build() {
    return {
      titulo: this.titulo,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      tipo: this.tipo,
      proyecto: this.proyecto,
      columna: this.columna,
      creador: this.creador,
      responsables: this.responsables,
      fechaLimite: this.fechaLimite,
      etiquetas: this.etiquetas,
      subtareas: this.subtareas,
      completada: false,
      comentarios: [],
      orden: 0,
    };
  }
}

/**
 * BUILDER PARA PROYECTOS
 * Permite construir proyectos complejos paso a paso
 */
export class ProjectBuilder {
  constructor(nombre, propietario) {
    this.nombre = nombre;
    this.propietario = propietario;
    this.descripcion = '';
    this.estado = 'PLANIFICADO';
    this.fechaInicio = new Date();
    this.fechaFin = null;
    this.miembros = [];
    this.color = '#3B82F6';
  }

  setDescripcion(descripcion) {
    this.descripcion = descripcion;
    return this;
  }

  setEstado(estado) {
    if (['PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'ARCHIVADO'].includes(estado)) {
      this.estado = estado;
    }
    return this;
  }

  setFechaInicio(fecha) {
    this.fechaInicio = fecha;
    return this;
  }

  setFechaFin(fecha) {
    this.fechaFin = fecha;
    return this;
  }

  agregarMiembro(usuarioId, rol = 'MIEMBRO') {
    this.miembros.push({
      usuario: usuarioId,
      rol,
      fechaUnion: new Date(),
    });
    return this;
  }

  setColor(color) {
    this.color = color;
    return this;
  }

  build() {
    return {
      nombre: this.nombre,
      descripcion: this.descripcion,
      estado: this.estado,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      propietario: this.propietario,
      miembros: this.miembros,
      color: this.color,
    };
  }
}

export default { TaskBuilder, ProjectBuilder };
