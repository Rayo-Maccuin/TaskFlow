// Bridge para generación de reportes con múltiples formatos
// Separa la abstracción de reporte de su implementación de formato

class ReporteAbstraccion {
  constructor(implementacion) {
    this.implementacion = implementacion;
  }

  setImplementacion(implementacion) {
    this.implementacion = implementacion;
  }

  async generar(datos) {
    return await this.implementacion.generar(datos);
  }
}

class ReporteProyecto extends ReporteAbstraccion {
  async generar(datos) {
    const datosProyecto = {
      titulo: 'Reporte de Proyecto',
      proyecto: datos.proyecto,
      tareas: datos.tareas,
      miembros: datos.miembros,
      fecha: new Date().toISOString()
    };
    return await this.implementacion.generar(datosProyecto);
  }
}

class ReporteUsuario extends ReporteAbstraccion {
  async generar(datos) {
    const datosUsuario = {
      titulo: 'Reporte de Usuario',
      usuario: datos.usuario,
      tareas: datos.tareas,
      proyectos: datos.proyectos,
      fecha: new Date().toISOString()
    };
    return await this.implementacion.generar(datosUsuario);
  }
}

class ReporteImplementacion {
  async generar(datos) {
    throw new Error('Método generar debe ser implementado');
  }
}

class ReporteJSON extends ReporteImplementacion {
  async generar(datos) {
    return {
      buffer: Buffer.from(JSON.stringify(datos, null, 2)),
      mimetype: 'application/json',
      filename: `${datos.titulo.replace(/\s+/g, '_')}.json`
    };
  }
}

class ReporteCSV extends ReporteImplementacion {
  async generar(datos) {
    let csv = 'Campo,Valor\n';
    for (const [key, value] of Object.entries(datos)) {
      csv += `"${key}","${JSON.stringify(value)}"\n`;
    }
    return {
      buffer: Buffer.from(csv),
      mimetype: 'text/csv',
      filename: `${datos.titulo.replace(/\s+/g, '_')}.csv`
    };
  }
}

class ReporteXML extends ReporteImplementacion {
  async generar(datos) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${datos.titulo.replace(/\s+/g, '_')}>\n`;
    for (const [key, value] of Object.entries(datos)) {
      xml += `  <${key}>${JSON.stringify(value)}</${key}>\n`;
    }
    xml += `</${datos.titulo.replace(/\s+/g, '_')}>\n`;
    return {
      buffer: Buffer.from(xml),
      mimetype: 'application/xml',
      filename: `${datos.titulo.replace(/\s+/g, '_')}.xml`
    };
  }
}

class ReporteBridgeFactory {
  static crearAbstraccion(tipoReporte, formato) {
    let implementacion;
    switch (formato) {
      case 'json':
        implementacion = new ReporteJSON();
        break;
      case 'csv':
        implementacion = new ReporteCSV();
        break;
      case 'xml':
        implementacion = new ReporteXML();
        break;
      default:
        throw new Error(`Formato no soportado: ${formato}`);
    }

    switch (tipoReporte) {
      case 'proyecto':
        return new ReporteProyecto(implementacion);
      case 'usuario':
        return new ReporteUsuario(implementacion);
      default:
        throw new Error(`Tipo de reporte no soportado: ${tipoReporte}`);
    }
  }
}

module.exports = {
  ReporteAbstraccion,
  ReporteProyecto,
  ReporteUsuario,
  ReporteImplementacion,
  ReporteJSON,
  ReporteCSV,
  ReporteXML,
  ReporteBridgeFactory
};