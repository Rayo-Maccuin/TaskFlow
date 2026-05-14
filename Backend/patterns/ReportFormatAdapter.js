// Patrón Adapter: adapta reportes a diferentes formatos (PDF, CSV, JSON, Excel)

import PDFDocument from 'pdfkit';

// Clase base para adaptadores
export class ReportFormatAdapter {
  // Exportar reporte - implementar en subclases
  async exportar(datos, nombreArchivo) {
    throw new Error('Método exportar() debe ser implementado en la clase concreta');
  }

  // Convertir clave a formato legible
  formatearClave(clave) {
    return clave
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

// Adaptador para formato PDF
export class PDFReportAdapter extends ReportFormatAdapter {
  async exportar(datos, nombreArchivo) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            mimetype: 'application/pdf',
            filename: `${nombreArchivo}.pdf`
          });
        });

        // Encabezado
        doc.fontSize(20).font('Helvetica-Bold').text(datos.titulo, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'right' });
        doc.moveDown();

        // Información del proyecto
        if (datos.proyecto?.nombre) {
          doc.fontSize(14).font('Helvetica-Bold').text(`Proyecto: ${datos.proyecto.nombre}`);
          doc.moveDown();
        }

        // Sección de resumen
        if (datos.resumen && Object.keys(datos.resumen).length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Resumen');
          doc.fontSize(10).font('Helvetica');
          Object.entries(datos.resumen).forEach(([clave, valor]) => {
            doc.text(`  • ${this.formatearClave(clave)}: ${valor}`);
          });
          doc.moveDown();
        }

        // Sección de tareas
        if (datos.tareas && datos.tareas.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Tareas');
          doc.fontSize(9).font('Helvetica');
          datos.tareas.forEach((tarea, idx) => {
            doc.text(`  ${idx + 1}. ${tarea.titulo} [${tarea.estado}] - ${tarea.prioridad}`);
          });
          doc.moveDown();
        }

        // Sección de distribución
        if (datos.distribucion && Object.keys(datos.distribucion).length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Distribución');
          doc.fontSize(10).font('Helvetica');
          Object.entries(datos.distribucion).forEach(([categoria, valor]) => {
            if (typeof valor === 'object') {
              doc.text(`${categoria}:`);
              Object.entries(valor).forEach(([subcat, subval]) => {
                doc.text(`  • ${subcat}: ${subval}`);
              });
            } else {
              doc.text(`  • ${categoria}: ${valor}`);
            }
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Adaptador para formato CSV
export class CSVReportAdapter extends ReportFormatAdapter {
  async exportar(datos, nombreArchivo) {
    try {
      let csv = '';

      // Encabezado
      csv += `${datos.titulo}\n`;
      csv += `"Generado","${new Date().toLocaleString('es-ES')}"\n\n`;

      // Información del proyecto
      if (datos.proyecto?.nombre) {
        csv += `"Proyecto","${datos.proyecto.nombre}"\n\n`;
      }

      // Resumen
      if (datos.resumen && Object.keys(datos.resumen).length > 0) {
        csv += '"RESUMEN"\n';
        csv += '"Métrica","Valor"\n';
        Object.entries(datos.resumen).forEach(([clave, valor]) => {
          csv += `"${this.formatearClave(clave)}","${valor}"\n`;
        });
        csv += '\n';
      }

      // Tareas
      if (datos.tareas && datos.tareas.length > 0) {
        csv += '"TAREAS"\n';
        csv += '"Título","Estado","Prioridad","Responsable","Fecha Límite"\n';
        datos.tareas.forEach(tarea => {
          csv += `"${tarea.titulo}","${tarea.estado}","${tarea.prioridad}","${tarea.responsable || 'N/A'}","${tarea.fechaLimite || 'N/A'}"\n`;
        });
        csv += '\n';
      }

      // Distribución
      if (datos.distribucion && Object.keys(datos.distribucion).length > 0) {
        csv += '"DISTRIBUCIÓN"\n';
        Object.entries(datos.distribucion).forEach(([categoria, valor]) => {
          if (typeof valor === 'object') {
            csv += `"${categoria}",""\n`;
            Object.entries(valor).forEach(([subcat, subval]) => {
              csv += `"  ${subcat}","${subval}"\n`;
            });
          } else {
            csv += `"${categoria}","${valor}"\n`;
          }
        });
      }

      const buffer = Buffer.from(csv, 'utf-8');
      return {
        buffer,
        mimetype: 'text/csv; charset=utf-8',
        filename: `${nombreArchivo}.csv`
      };
    } catch (error) {
      throw error;
    }
  }
}

// Adaptador para formato JSON
export class JSONReportAdapter extends ReportFormatAdapter {
  async exportar(datos, nombreArchivo) {
    try {
      const reporteJSON = {
        titulo: datos.titulo,
        fechaGeneracion: new Date().toISOString(),
        proyecto: datos.proyecto || null,
        resumen: datos.resumen || {},
        tareas: datos.tareas || [],
        distribucion: datos.distribucion || {}
      };

      const json = JSON.stringify(reporteJSON, null, 2);
      const buffer = Buffer.from(json, 'utf-8');

      return {
        buffer,
        mimetype: 'application/json; charset=utf-8',
        filename: `${nombreArchivo}.json`
      };
    } catch (error) {
      throw error;
    }
  }
}

// Adaptador para formato Excel
export class ExcelReportAdapter extends ReportFormatAdapter {
  async exportar(datos, nombreArchivo) {
    try {
      let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>';
      html += 'body { font-family: Arial, sans-serif; } ';
      html += 'table { border-collapse: collapse; width: 100%; margin: 20px 0; } ';
      html += 'th, td { border: 1px solid #000; padding: 8px; text-align: left; } ';
      html += 'th { background-color: #4CAF50; color: white; font-weight: bold; } ';
      html += 'h1, h2 { color: #333; } ';
      html += '</style></head><body>';

      // Encabezado
      html += `<h1>${datos.titulo}</h1>`;
      html += `<p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>`;

      // Información del proyecto
      if (datos.proyecto?.nombre) {
        html += `<h2>Proyecto: ${datos.proyecto.nombre}</h2>`;
      }

      // Tabla de resumen
      if (datos.resumen && Object.keys(datos.resumen).length > 0) {
        html += '<h3>Resumen</h3>';
        html += '<table><tr><th>Métrica</th><th>Valor</th></tr>';
        Object.entries(datos.resumen).forEach(([clave, valor]) => {
          html += `<tr><td>${this.formatearClave(clave)}</td><td>${valor}</td></tr>`;
        });
        html += '</table>';
      }

      // Tabla de tareas
      if (datos.tareas && datos.tareas.length > 0) {
        html += '<h3>Tareas</h3>';
        html += '<table><tr><th>#</th><th>Título</th><th>Estado</th><th>Prioridad</th><th>Responsable</th><th>Fecha Límite</th></tr>';
        datos.tareas.forEach((tarea, idx) => {
          html += `<tr><td>${idx + 1}</td><td>${tarea.titulo}</td><td>${tarea.estado}</td><td>${tarea.prioridad}</td><td>${tarea.responsable || 'N/A'}</td><td>${tarea.fechaLimite || 'N/A'}</td></tr>`;
        });
        html += '</table>';
      }

      // Sección de distribución
      if (datos.distribucion && Object.keys(datos.distribucion).length > 0) {
        html += '<h3>Distribución</h3>';
        Object.entries(datos.distribucion).forEach(([categoria, valor]) => {
          if (typeof valor === 'object') {
            html += `<h4>${categoria}</h4>`;
            html += '<table><tr><th>Categoría</th><th>Cantidad</th></tr>';
            Object.entries(valor).forEach(([subcat, subval]) => {
              html += `<tr><td>${subcat}</td><td>${subval}</td></tr>`;
            });
            html += '</table>';
          }
        });
      }

      html += '</body></html>';

      const buffer = Buffer.from(html, 'utf-8');
      return {
        buffer,
        mimetype: 'application/vnd.ms-excel',
        filename: `${nombreArchivo}.xls`
      };
    } catch (error) {
      throw error;
    }
  }
}

// Factory para crear adaptadores según formato
export class ReportAdapterFactory {
  // Obtener adaptador según formato
  static getAdapter(formato) {
    const formato_lower = formato.toLowerCase();

    switch (formato_lower) {
      case 'pdf':
        return new PDFReportAdapter();
      case 'csv':
        return new CSVReportAdapter();
      case 'json':
        return new JSONReportAdapter();
      case 'excel':
      case 'xls':
        return new ExcelReportAdapter();
      default:
        throw new Error(`Formato de reporte no soportado: ${formato}. Formatos disponibles: ${this.getFormatosDisponibles().join(', ')}`);
    }
  }

  // Retornar formatos disponibles
  static getFormatosDisponibles() {
    return ['PDF', 'CSV', 'JSON', 'EXCEL'];
  }
}

export default ReportAdapterFactory;
