// FlyWeight para elementos compartidos entre proyectos/tareas
// Optimiza memoria reutilizando objetos compartidos como etiquetas, prioridades, tipos

class FlyWeightFactory {
  constructor() {
    this.flyweights = {};
  }

  obtenerFlyWeight(clave, datos) {
    if (!this.flyweights[clave]) {
      this.flyweights[clave] = this.crearFlyWeight(clave, datos);
    }
    return this.flyweights[clave];
  }

  crearFlyWeight(clave, datos) {
    throw new Error('Método crearFlyWeight debe ser implementado por subclases');
  }

  obtenerEstadisticas() {
    return {
      totalFlyWeights: Object.keys(this.flyweights).length,
      flyWeights: Object.keys(this.flyweights)
    };
  }
}

// FlyWeight para etiquetas (compartidas entre tareas)
class EtiquetaFlyWeight {
  constructor(id, nombre, color, descripcion = '') {
    this.id = id;
    this.nombre = nombre;
    this.color = color;
    this.descripcion = descripcion;
  }

  obtenerEstilos() {
    return {
      backgroundColor: this.color,
      color: this.calcularColorTexto(),
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    };
  }

  calcularColorTexto() {
    // Algoritmo simple para determinar si usar texto claro u oscuro
    const hex = this.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminosidad = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminosidad > 0.5 ? '#000000' : '#ffffff';
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      color: this.color,
      descripcion: this.descripcion
    };
  }
}

class EtiquetaFlyWeightFactory extends FlyWeightFactory {
  crearFlyWeight(clave, datos) {
    return new EtiquetaFlyWeight(datos.id, datos.nombre, datos.color, datos.descripcion);
  }

  obtenerEtiqueta(nombre, color, descripcion = '') {
    const clave = `${nombre}-${color}`;
    return this.obtenerFlyWeight(clave, { nombre, color, descripcion, id: clave });
  }
}

// FlyWeight para prioridades (compartidas entre tareas)
class PrioridadFlyWeight {
  constructor(nivel, nombre, color, peso) {
    this.nivel = nivel;
    this.nombre = nombre;
    this.color = color;
    this.peso = peso; // Para ordenamiento
  }

  obtenerEstilos() {
    return {
      backgroundColor: this.color,
      color: '#ffffff',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase'
    };
  }

  esMasPrioritaria(otraPrioridad) {
    return this.peso > otraPrioridad.peso;
  }

  toJSON() {
    return {
      nivel: this.nivel,
      nombre: this.nombre,
      color: this.color,
      peso: this.peso
    };
  }
}

class PrioridadFlyWeightFactory extends FlyWeightFactory {
  constructor() {
    super();
    // Inicializar prioridades estándar
    this.inicializarPrioridadesEstandar();
  }

  inicializarPrioridadesEstandar() {
    const prioridades = [
      { nivel: 'BAJA', nombre: 'Baja', color: '#10b981', peso: 1 },
      { nivel: 'MEDIA', nombre: 'Media', color: '#3b82f6', peso: 2 },
      { nivel: 'ALTA', nombre: 'Alta', color: '#f59e0b', peso: 3 },
      { nivel: 'URGENTE', nombre: 'Urgente', color: '#ef4444', peso: 4 }
    ];

    prioridades.forEach(prioridad => {
      const clave = prioridad.nivel;
      this.flyweights[clave] = new PrioridadFlyWeight(
        prioridad.nivel,
        prioridad.nombre,
        prioridad.color,
        prioridad.peso
      );
    });
  }

  obtenerPrioridad(nivel) {
    return this.obtenerFlyWeight(nivel, { nivel });
  }
}

// FlyWeight para tipos de tarea (compartidas entre tareas)
class TipoTareaFlyWeight {
  constructor(codigo, nombre, color, icono, descripcion) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.color = color;
    this.icono = icono;
    this.descripcion = descripcion;
  }

  obtenerEstilos() {
    return {
      backgroundColor: this.color,
      color: '#ffffff',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    };
  }

  obtenerIcono() {
    const iconos = {
      TASK: 'TASK',
      BUG: 'BUG',
      FEATURE: 'FEATURE',
      IMPROVEMENT: 'IMPROVEMENT'
    };
    return iconos[this.codigo] || 'TASK';
  }

  toJSON() {
    return {
      codigo: this.codigo,
      nombre: this.nombre,
      color: this.color,
      icono: this.icono,
      descripcion: this.descripcion
    };
  }
}

class TipoTareaFlyWeightFactory extends FlyWeightFactory {
  constructor() {
    super();
    // Inicializar tipos estándar
    this.inicializarTiposEstandar();
  }

  inicializarTiposEstandar() {
    const tipos = [
      { codigo: 'TASK', nombre: 'Tarea', color: '#6366f1', icono: 'TASK', descripcion: 'Tarea general del proyecto' },
      { codigo: 'BUG', nombre: 'Bug', color: '#ef4444', icono: 'BUG', descripcion: 'Error o problema a corregir' },
      { codigo: 'FEATURE', nombre: 'Feature', color: '#14b8a6', icono: 'FEATURE', descripcion: 'Nueva funcionalidad' },
      { codigo: 'IMPROVEMENT', nombre: 'Mejora', color: '#a855f7', icono: 'IMPROVEMENT', descripcion: 'Mejora de funcionalidad existente' }
    ];

    tipos.forEach(tipo => {
      const clave = tipo.codigo;
      this.flyweights[clave] = new TipoTareaFlyWeight(
        tipo.codigo,
        tipo.nombre,
        tipo.color,
        tipo.icono,
        tipo.descripcion
      );
    });
  }

  obtenerTipo(codigo) {
    return this.obtenerFlyWeight(codigo, { codigo });
  }
}

// FlyWeight para estados de proyecto (compartidos entre proyectos)
class EstadoProyectoFlyWeight {
  constructor(codigo, nombre, color, permiteEdicion, esFinal) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.color = color;
    this.permiteEdicion = permiteEdicion;
    this.esFinal = esFinal;
  }

  obtenerEstilos() {
    return {
      backgroundColor: this.color,
      color: '#ffffff',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500'
    };
  }

  puedeTransitarA(otroEstado) {
    const transicionesPermitidas = {
      PLANIFICADO: ['EN_PROGRESO', 'PAUSADO', 'ARCHIVADO'],
      EN_PROGRESO: ['PAUSADO', 'COMPLETADO', 'ARCHIVADO'],
      PAUSADO: ['EN_PROGRESO', 'COMPLETADO', 'ARCHIVADO'],
      COMPLETADO: ['ARCHIVADO'],
      ARCHIVADO: []
    };

    return transicionesPermitidas[this.codigo]?.includes(otroEstado.codigo) || false;
  }

  toJSON() {
    return {
      codigo: this.codigo,
      nombre: this.nombre,
      color: this.color,
      permiteEdicion: this.permiteEdicion,
      esFinal: this.esFinal
    };
  }
}

class EstadoProyectoFlyWeightFactory extends FlyWeightFactory {
  constructor() {
    super();
    // Inicializar estados estándar
    this.inicializarEstadosEstandar();
  }

  inicializarEstadosEstandar() {
    const estados = [
      { codigo: 'PLANIFICADO', nombre: 'Planificado', color: '#6b7280', permiteEdicion: true, esFinal: false },
      { codigo: 'EN_PROGRESO', nombre: 'En Progreso', color: '#3b82f6', permiteEdicion: true, esFinal: false },
      { codigo: 'PAUSADO', nombre: 'Pausado', color: '#f59e0b', permiteEdicion: true, esFinal: false },
      { codigo: 'COMPLETADO', nombre: 'Completado', color: '#10b981', permiteEdicion: false, esFinal: true },
      { codigo: 'ARCHIVADO', nombre: 'Archivado', color: '#6b7280', permiteEdicion: false, esFinal: true }
    ];

    estados.forEach(estado => {
      const clave = estado.codigo;
      this.flyweights[clave] = new EstadoProyectoFlyWeight(
        estado.codigo,
        estado.nombre,
        estado.color,
        estado.permiteEdicion,
        estado.esFinal
      );
    });
  }

  obtenerEstado(codigo) {
    return this.obtenerFlyWeight(codigo, { codigo });
  }
}

// Factory principal que gestiona todos los FlyWeights
class FlyWeightManager {
  constructor() {
    this.etiquetas = new EtiquetaFlyWeightFactory();
    this.prioridades = new PrioridadFlyWeightFactory();
    this.tiposTarea = new TipoTareaFlyWeightFactory();
    this.estadosProyecto = new EstadoProyectoFlyWeightFactory();
  }

  // Métodos para acceder a cada factory
  obtenerEtiqueta(nombre, color, descripcion = '') {
    return this.etiquetas.obtenerEtiqueta(nombre, color, descripcion);
  }

  obtenerPrioridad(nivel) {
    return this.prioridades.obtenerPrioridad(nivel);
  }

  obtenerTipoTarea(codigo) {
    return this.tiposTarea.obtenerTipo(codigo);
  }

  obtenerEstadoProyecto(codigo) {
    return this.estadosProyecto.obtenerEstado(codigo);
  }

  // Estadísticas de uso de memoria
  obtenerEstadisticasMemoria() {
    return {
      etiquetas: this.etiquetas.obtenerEstadisticas(),
      prioridades: this.prioridades.obtenerEstadisticas(),
      tiposTarea: this.tiposTarea.obtenerEstadisticas(),
      estadosProyecto: this.estadosProyecto.obtenerEstadisticas(),
      totalObjetosCompartidos: 
        this.etiquetas.obtenerEstadisticas().totalFlyWeights +
        this.prioridades.obtenerEstadisticas().totalFlyWeights +
        this.tiposTarea.obtenerEstadisticas().totalFlyWeights +
        this.estadosProyecto.obtenerEstadisticas().totalFlyWeights
    };
  }
}

module.exports = {
  FlyWeightFactory,
  EtiquetaFlyWeight,
  EtiquetaFlyWeightFactory,
  PrioridadFlyWeight,
  PrioridadFlyWeightFactory,
  TipoTareaFlyWeight,
  TipoTareaFlyWeightFactory,
  EstadoProyectoFlyWeight,
  EstadoProyectoFlyWeightFactory,
  FlyWeightManager
};