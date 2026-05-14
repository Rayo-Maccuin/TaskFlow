/**
 * CONTROLADOR DE TABLERO KANBAN
 * Maneja las peticiones HTTP relacionadas con tableros y columnas
 */

import Board from '../models/Board.js';
import Project from '../models/Project.js';

class BoardController {
  extraerId(valor) {
    if (!valor) return null;
    if (typeof valor === 'string') return valor;
    if (valor.id) return valor.id.toString();
    if (valor.toString) return valor.toString();
    return null;
  }

  esMiembroProyecto(proyecto, usuarioId) {
    return (proyecto.miembros || []).some((m) => {
      const miembroId = this.extraerId(m?.usuarioId ?? m?.usuario ?? m);
      return miembroId === usuarioId;
    });
  }

  puedeVerProyecto(proyecto, req) {
    if (req.rol === 'ADMIN') return true;
    if (this.extraerId(proyecto.propietarioId) === req.usuarioId) return true;
    return this.esMiembroProyecto(proyecto, req.usuarioId);
  }

  puedeGestionarProyecto(proyecto, req) {
    if (req.rol === 'ADMIN') return true;
    if (this.extraerId(proyecto.propietarioId) === req.usuarioId) return true;
    return req.rol === 'PROJECT_MANAGER' && this.esMiembroProyecto(proyecto, req.usuarioId);
  }

  async obtenerProyectoAccesible(idProyecto, req, gestion = false) {
    const proyecto = await Project.findByPk(idProyecto, {
      attributes: ['estado', 'propietarioId', 'miembros'],
    });

    if (!proyecto) {
      return { error: { status: 404, message: 'Proyecto no encontrado' } };
    }

    const tieneAcceso = gestion
      ? this.puedeGestionarProyecto(proyecto, req)
      : this.puedeVerProyecto(proyecto, req);

    if (!tieneAcceso) {
      return {
        error: {
          status: 403,
          message: gestion
            ? 'No tienes permisos para gestionar el tablero de este proyecto'
            : 'No tienes permisos para ver este tablero',
        },
      };
    }

    return { proyecto };
  }

  async obtener(req, res) {
    try {
      const { error } = await this.obtenerProyectoAccesible(req.params.idProyecto, req, false);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      const tablero = await Board.findOne({ where: { proyectoId: req.params.idProyecto } });
      if (!tablero) {
        return res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      }

      res.status(200).json({ success: true, data: tablero });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async crearColumna(req, res) {
    try {
      const { nombre, orden, color, limiteWip } = req.body;
      const { proyecto, error } = await this.obtenerProyectoAccesible(req.params.idProyecto, req, true);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      if (proyecto?.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const tablero = await Board.findOne({ where: { proyectoId: req.params.idProyecto } });
      if (!tablero) {
        return res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      }

      const columnas = tablero.columnas || [];
      const nuevaColumna = {
        id: Date.now(),
        nombre: nombre || 'Nueva columna',
        orden: orden ?? columnas.length,
        color: color || '#e5e7eb',
        limiteWip: limiteWip || 0,
        tareas: [],
      };

      columnas.push(nuevaColumna);
      await tablero.update({ columnas });

      res.status(201).json({ success: true, message: 'Columna creada correctamente', data: tablero });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async actualizarColumna(req, res) {
    try {
      const { nombre, color, orden, limiteWip } = req.body;
      const { idTablero, idColumna } = req.params;

      const tablero = await Board.findByPk(idTablero);
      if (!tablero) {
        return res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      }

      const { proyecto, error } = await this.obtenerProyectoAccesible(tablero.proyectoId, req, true);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      if (proyecto?.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const columnas = tablero.columnas || [];
      const columnaIndex = columnas.findIndex((col) => col.id == idColumna);
      if (columnaIndex === -1) {
        return res.status(404).json({ success: false, message: 'Columna no encontrada' });
      }

      columnas[columnaIndex] = {
        ...columnas[columnaIndex],
        nombre: nombre ?? columnas[columnaIndex].nombre,
        color: color ?? columnas[columnaIndex].color,
        orden: orden ?? columnas[columnaIndex].orden,
        limiteWip: limiteWip ?? columnas[columnaIndex].limiteWip,
      };

      await tablero.update({ columnas });

      res.status(200).json({ success: true, message: 'Columna actualizada correctamente', data: tablero });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async eliminarColumna(req, res) {
    try {
      const { idTablero, idColumna } = req.params;
      const tablero = await Board.findByPk(idTablero);
      if (!tablero) {
        return res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      }

      const { proyecto, error } = await this.obtenerProyectoAccesible(tablero.proyectoId, req, true);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      if (proyecto?.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const columnas = tablero.columnas || [];
      const columna = columnas.find((col) => col.id == idColumna);
      if (!columna) {
        return res.status(404).json({ success: false, message: 'Columna no encontrada' });
      }

      if ((columna.tareas || []).length > 0) {
        return res.status(400).json({ success: false, message: 'No se puede eliminar una columna con tareas' });
      }

      const nuevasColumnas = columnas.filter((col) => col.id != idColumna);
      await tablero.update({ columnas: nuevasColumnas });

      res.status(200).json({ success: true, message: 'Columna eliminada correctamente', data: tablero });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async reordenarColumnas(req, res) {
    try {
      const { columnasOrdenadas } = req.body;
      const { idTablero } = req.params;

      const tablero = await Board.findByPk(idTablero);
      if (!tablero) {
        return res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      }

      const { proyecto, error } = await this.obtenerProyectoAccesible(tablero.proyectoId, req, true);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      if (proyecto?.estado === 'ARCHIVADO') {
        return res.status(400).json({ success: false, message: 'El proyecto archivado es solo lectura' });
      }

      const columnas = tablero.columnas || [];
      const nuevasColumnas = columnas.map((col) => ({
        ...col,
        orden: columnasOrdenadas.indexOf(col.id) >= 0 ? columnasOrdenadas.indexOf(col.id) : col.orden,
      }));

      await tablero.update({ columnas: nuevasColumnas });

      res.status(200).json({ success: true, message: 'Columnas reordenadas correctamente', data: tablero });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new BoardController();
