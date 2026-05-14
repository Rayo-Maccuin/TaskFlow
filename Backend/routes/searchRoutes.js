import express from 'express';
import SearchController from '../controllers/SearchController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { body, query } from 'express-validator';

const router = express.Router();
router.use(authMiddleware);

// Búsqueda básica por texto
router.get('/search', [
  query('termino', 'El término de búsqueda es requerido').notEmpty(),
  query('proyectoId').optional().isInt()
], SearchController.buscarTareas.bind(SearchController));

// Filtrado avanzado de tareas
router.post('/filter', [
  body('proyectoId').optional().isInt(),
  body('responsables').optional().isArray(),
  body('etiquetas').optional().isArray(),
  body('prioridad').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
  body('tipo').optional().isIn(['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT']),
  body('fechaDesde').optional().isISO8601(),
  body('fechaHasta').optional().isISO8601(),
  body('columna').optional().isString(),
  body('completada').optional().isBoolean(),
  body('vencidas').optional().isBoolean(),
  body('ordenarPor').optional().isIn(['titulo', 'prioridad', 'fechaLimite', 'createdAt', 'updatedAt']),
  body('ordenDireccion').optional().isIn(['ASC', 'DESC']),
  body('limite').optional().isInt({ min: 1, max: 500 }),
  body('offset').optional().isInt({ min: 0 })
], SearchController.filtrarTareas.bind(SearchController));

// Búsqueda avanzada con múltiples criterios
router.post('/advanced', [
  body('texto').optional().isString(),
  body('prioridades').optional().isArray(),
  body('prioridades.*').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
  body('tipos').optional().isArray(),
  body('tipos.*').optional().isIn(['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT']),
  body('completadas').optional(),
  body('fechaCreacionDesde').optional().isISO8601(),
  body('fechaCreacionHasta').optional().isISO8601(),
  body('fechaLimiteDesde').optional().isISO8601(),
  body('fechaLimiteHasta').optional().isISO8601(),
  body('limite').optional().isInt({ min: 1, max: 500 }),
  body('offset').optional().isInt({ min: 0 })
], SearchController.busquedaAvanzada.bind(SearchController));

// Gestión de filtros guardados
router.post('/filters', [
  body('nombre', 'El nombre del filtro es requerido').notEmpty(),
  body('filtros', 'Los filtros son requeridos').isObject(),
  body('proyectoId').optional().isInt()
], SearchController.guardarFiltro.bind(SearchController));

router.get('/filters', [
  query('proyectoId').optional().isInt()
], SearchController.obtenerFiltrosGuardados.bind(SearchController));

router.delete('/filters/:id', SearchController.eliminarFiltro.bind(SearchController));

router.post('/filters/:id/apply', [
  body('overrides').optional().isObject()
], SearchController.aplicarFiltroGuardado.bind(SearchController));

export default router;