// Decorator para tablero Kanban con decoradores visuales
// Decoración de tareas con etiquetas, archivos adjuntos

class ComponenteVisual {
  render() {
    throw new Error('Método render debe ser implementado');
  }

  obtenerEstilos() {
    return {};
  }
}

class TableroKanbanBasico extends ComponenteVisual {
  constructor(id, nombre, color = '#3b82f6') {
    super();
    this.id = id;
    this.nombre = nombre;
    this.color = color;
    this.columnas = [];
  }

  agregarColumna(columna) {
    this.columnas.push(columna);
  }

  render() {
    return {
      id: this.id,
      nombre: this.nombre,
      color: this.color,
      columnas: this.columnas.map(col => col.render()),
      tipo: 'tablero-basico'
    };
  }

  obtenerEstilos() {
    return {
      backgroundColor: this.color,
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    };
  }
}

class TareaBasica extends ComponenteVisual {
  constructor(id, titulo, descripcion = '') {
    super();
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.prioridad = 'MEDIA';
    this.tipo = 'TASK';
    this.completada = false;
  }

  render() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      tipo: this.tipo,
      completada: this.completada,
      tipo: 'tarea-basica'
    };
  }

  obtenerEstilos() {
    return {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px'
    };
  }
}

// Decoradores para tablero
class DecoradorTablero extends ComponenteVisual {
  constructor(componenteVisual) {
    super();
    this.componenteVisual = componenteVisual;
  }

  render() {
    return this.componenteVisual.render();
  }

  obtenerEstilos() {
    return this.componenteVisual.obtenerEstilos();
  }
}

class DecoradorTableroTema extends DecoradorTablero {
  constructor(componenteVisual, tema) {
    super(componenteVisual);
    this.tema = tema; // 'claro', 'oscuro', 'profesional'
  }

  obtenerEstilos() {
    const estilosBase = super.obtenerEstilos();
    const temas = {
      claro: { backgroundColor: '#ffffff', color: '#000000' },
      oscuro: { backgroundColor: '#1f2937', color: '#ffffff' },
      profesional: { backgroundColor: '#f3f4f6', color: '#374151', border: '2px solid #d1d5db' }
    };
    return { ...estilosBase, ...temas[this.tema] };
  }

  render() {
    const datos = super.render();
    return { ...datos, tema: this.tema, tipo: 'tablero-decorado-tema' };
  }
}

class DecoradorTableroFondo extends DecoradorTablero {
  constructor(componenteVisual, imagenFondo) {
    super(componenteVisual);
    this.imagenFondo = imagenFondo;
  }

  obtenerEstilos() {
    const estilosBase = super.obtenerEstilos();
    return {
      ...estilosBase,
      backgroundImage: `url(${this.imagenFondo})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }

  render() {
    const datos = super.render();
    return { ...datos, imagenFondo: this.imagenFondo, tipo: 'tablero-decorado-fondo' };
  }
}

// Decoradores para tareas
class DecoradorTarea extends ComponenteVisual {
  constructor(componenteVisual) {
    super();
    this.componenteVisual = componenteVisual;
  }

  render() {
    return this.componenteVisual.render();
  }

  obtenerEstilos() {
    return this.componenteVisual.obtenerEstilos();
  }
}

class DecoradorTareaEtiquetas extends DecoradorTarea {
  constructor(componenteVisual, etiquetas = []) {
    super(componenteVisual);
    this.etiquetas = etiquetas;
  }

  render() {
    const datos = super.render();
    return { ...datos, etiquetas: this.etiquetas, tipo: 'tarea-decorada-etiquetas' };
  }

  obtenerEstilos() {
    const estilosBase = super.obtenerEstilos();
    return {
      ...estilosBase,
      position: 'relative'
    };
  }
}

class DecoradorTareaArchivos extends DecoradorTarea {
  constructor(componenteVisual, archivos = []) {
    super(componenteVisual);
    this.archivos = archivos;
  }

  render() {
    const datos = super.render();
    return { ...datos, archivos: this.archivos, tipo: 'tarea-decorada-archivos' };
  }

  obtenerEstilos() {
    const estilosBase = super.obtenerEstilos();
    return {
      ...estilosBase,
      borderLeft: this.archivos.length > 0 ? '4px solid #10b981' : estilosBase.borderLeft
    };
  }
}

class DecoradorTareaPrioridad extends DecoradorTarea {
  constructor(componenteVisual, prioridad) {
    super(componenteVisual);
    this.prioridad = prioridad;
  }

  obtenerEstilos() {
    const estilosBase = super.obtenerEstilos();
    const coloresPrioridad = {
      BAJA: '#10b981',
      MEDIA: '#3b82f6',
      ALTA: '#f59e0b',
      URGENTE: '#ef4444'
    };
    return {
      ...estilosBase,
      borderLeft: `4px solid ${coloresPrioridad[this.prioridad] || '#6b7280'}`
    };
  }

  render() {
    const datos = super.render();
    return { ...datos, prioridadDecorada: this.prioridad, tipo: 'tarea-decorada-prioridad' };
  }
}

class DecoradorFactory {
  static decorarTablero(tablero, decoradores) {
    let tableroDecorado = tablero;
    decoradores.forEach(decorador => {
      switch (decorador.tipo) {
        case 'tema':
          tableroDecorado = new DecoradorTableroTema(tableroDecorado, decorador.valor);
          break;
        case 'fondo':
          tableroDecorado = new DecoradorTableroFondo(tableroDecorado, decorador.valor);
          break;
      }
    });
    return tableroDecorado;
  }

  static decorarTarea(tarea, decoradores) {
    let tareaDecorada = tarea;
    decoradores.forEach(decorador => {
      switch (decorador.tipo) {
        case 'etiquetas':
          tareaDecorada = new DecoradorTareaEtiquetas(tareaDecorada, decorador.valor);
          break;
        case 'archivos':
          tareaDecorada = new DecoradorTareaArchivos(tareaDecorada, decorador.valor);
          break;
        case 'prioridad':
          tareaDecorada = new DecoradorTareaPrioridad(tareaDecorada, decorador.valor);
          break;
      }
    });
    return tareaDecorada;
  }
}

module.exports = {
  ComponenteVisual,
  TableroKanbanBasico,
  TareaBasica,
  DecoradorTablero,
  DecoradorTableroTema,
  DecoradorTableroFondo,
  DecoradorTarea,
  DecoradorTareaEtiquetas,
  DecoradorTareaArchivos,
  DecoradorTareaPrioridad,
  DecoradorFactory
};