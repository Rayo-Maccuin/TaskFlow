/**
 * CONTROLADOR DE BÚSQUEDA Y FILTROS
 * Maneja las peticiones de búsqueda y filtrado de tareas
 */

import { validationResult } from 'express-validator';
import SearchService from '../services/SearchService.js';

class SearchController {
  // Búsqueda básica por texto
  async buscarTareas(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { termino, proyectoId } = req.query;
      const data = await SearchService.buscarTareas(termino, req.usuarioId, proyectoId);

      res.status(200).json({
        success: true,
        data,
        mensaje: `${data.length} tareas encontradas`
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Filtrado avanzado de tareas
  async filtrarTareas(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const filtros = req.body;
      const data = await SearchService.filtrarTareas(filtros, req.usuarioId);

      res.status(200).json({
        success: true,
        data,
        mensaje: `${data.tareas.length} tareas filtradas de ${data.total} total`
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Búsqueda avanzada con múltiples criterios
  async busquedaAvanzada(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const criterios = req.body;
      const data = await SearchService.busquedaAvanzada(criterios, req.usuarioId);

      res.status(200).json({
        success: true,
        data,
        mensaje: `${data.tareas.length} tareas encontradas de ${data.total} total`
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Guardar filtro personalizado
  async guardarFiltro(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { nombre, filtros, proyectoId } = req.body;
      const data = await SearchService.guardarFiltro(req.usuarioId, nombre, filtros, proyectoId);

      res.status(201).json({
        success: true,
        data,
        mensaje: 'Filtro guardado correctamente'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Obtener filtros guardados
  async obtenerFiltrosGuardados(req, res) {
    try {
      const { proyectoId } = req.query;
      const data = await SearchService.obtenerFiltrosGuardados(req.usuarioId, proyectoId);

      res.status(200).json({
        success: true,
        data,
        mensaje: `${data.length} filtros encontrados`
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Eliminar filtro guardado
  async eliminarFiltro(req, res) {
    try {
      const data = await SearchService.eliminarFiltro(req.params.id, req.usuarioId);

      res.status(200).json({
        success: true,
        data,
        mensaje: 'Filtro eliminado correctamente'
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Aplicar filtro guardado
  async aplicarFiltroGuardado(req, res) {
    try {
      const { overrides } = req.body;
      const data = await SearchService.aplicarFiltroGuardado(
        req.params.id,
        req.usuarioId,
        overrides
      );

      res.status(200).json({
        success: true,
        data,
        mensaje: `${data.tareas.length} tareas encontradas aplicando filtro`
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new SearchController();