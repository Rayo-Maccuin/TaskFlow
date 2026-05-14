/**
 * RUTAS DEL TABLERO KANBAN
 */

import express from 'express';
import { body } from 'express-validator';
import BoardController from '../controllers/BoardController.js';
import { authMiddleware, readOnlyMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);
router.use(readOnlyMiddleware);

/**
 * TABLERO
 */

// GET /proyectos/:idProyecto/tablero
// Obtiene el tablero de un proyecto
router.get('/proyecto/:idProyecto', BoardController.obtener.bind(BoardController));

/**
 * COLUMNAS
 */

// POST /proyectos/:idProyecto/columnas
// Crea una nueva columna en el tablero
router.post(
  '/proyecto/:idProyecto/columnas',
  [body('nombre', 'El nombre de la columna es obligatorio').notEmpty().trim()],
  BoardController.crearColumna.bind(BoardController)
);

// PUT /tableros/:idTablero/columnas/:idColumna
// Actualiza una columna
router.put(
  '/:idTablero/columnas/:idColumna',
  BoardController.actualizarColumna.bind(BoardController)
);

// DELETE /tableros/:idTablero/columnas/:idColumna
// Elimina una columna del tablero
router.delete(
  '/:idTablero/columnas/:idColumna',
  BoardController.eliminarColumna.bind(BoardController)
);

// PATCH /tableros/:idTablero/reordenar
// Reordena las columnas del tablero
router.patch(
  '/:idTablero/reordenar',
  [body('columnasOrdenadas', 'Las columnas ordenadas son requeridas').isArray()],
  BoardController.reordenarColumnas.bind(BoardController)
);

export default router;
