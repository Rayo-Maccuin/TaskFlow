/**
 * RUTAS DE TAREAS
 */

import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import TaskController from '../controllers/TaskController.js';
import { authMiddleware, readOnlyMiddleware } from '../middlewares/auth.js';

// Asegurar que el directorio de uploads exista
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Directorio de uploads creado: ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);
router.use(readOnlyMiddleware);

/**
 * CRUD DE TAREAS
 */

// POST /tareas
// Crea una nueva tarea (usando Factory Method)
router.post(
  '/',
  [
    body('titulo', 'El título de la tarea es obligatorio').notEmpty().trim(),
    body('proyecto', 'El ID del proyecto es requerido').notEmpty(),
    body('columna', 'El ID de la columna es requerido').notEmpty(),
  ],
  TaskController.crear.bind(TaskController)
);

// POST /tareas/builder
// Crea una tarea compleja usando Builder
router.post(
  '/builder',
  [
    body('titulo', 'El título de la tarea es obligatorio').notEmpty().trim(),
    body('proyecto', 'El ID del proyecto es requerido').notEmpty(),
    body('columna', 'El ID de la columna es requerido').notEmpty(),
  ],
  TaskController.crearConBuilder.bind(TaskController)
);

// GET /tareas/buscar/proyecto/:idProyecto
router.get('/buscar/proyecto/:idProyecto', TaskController.buscar.bind(TaskController));

// POST /tareas/filtros
router.post('/filtros', TaskController.guardarFiltro.bind(TaskController));

// GET /tareas/filtros
router.get('/filtros', TaskController.obtenerFiltros.bind(TaskController));

// GET /tareas/:id
// Obtiene una tarea por ID
router.get('/:id', TaskController.obtenerPorId.bind(TaskController));

// GET /proyectos/:idProyecto/tareas
// Obtiene todas las tareas de un proyecto
router.get(
  '/proyecto/:idProyecto',
  TaskController.obtenerPorProyecto.bind(TaskController)
);

// GET /columnas/:idColumna/tareas
// Obtiene tareas de una columna específica
router.get(
  '/columna/:idColumna',
  TaskController.obtenerPorColumna.bind(TaskController)
);

// PUT /tareas/:id
// Actualiza una tarea
router.put('/:id', TaskController.actualizar.bind(TaskController));

// DELETE /tareas/:id
// Elimina una tarea
router.delete('/:id', TaskController.eliminar.bind(TaskController));

/**
 * OPERACIONES ESPECIALES
 */

// POST /tareas/:id/clonar
// Clona una tarea (patrón Prototype)
router.post('/:id/clonar', TaskController.clonar.bind(TaskController));

// PATCH /tareas/:id/mover
// Mueve una tarea a otra columna (Drag & Drop)
router.patch('/:id/mover', TaskController.moverAColumna.bind(TaskController));

// PATCH /tareas/:id/completar
// Marca una tarea como completada
router.patch('/:id/completar', TaskController.completar.bind(TaskController));

/**
 * COMENTARIOS Y RESPONSABLES
 */

// POST /tareas/:id/comentarios
// Agrega un comentario a una tarea
router.post(
  '/:id/comentarios',
  [body('contenido', 'El contenido del comentario es requerido').notEmpty()],
  TaskController.agregarComentario.bind(TaskController)
);

// POST /tareas/:id/asignar
// Asigna un responsable a una tarea
router.post(
  '/:id/asignar',
  [body('idUsuario', 'El ID del usuario es requerido').notEmpty()],
  TaskController.asignarResponsable.bind(TaskController)
);

// DELETE /tareas/:id/asignar/:idUsuario
// Quita un responsable de una tarea
router.delete(
  '/:id/asignar/:idUsuario',
  TaskController.quitarResponsable.bind(TaskController)
);

// PUT /tareas/:id/comentarios/:idComentario
router.put(
  '/:id/comentarios/:idComentario',
  [body('contenido', 'El contenido del comentario es requerido').notEmpty()],
  TaskController.editarComentario.bind(TaskController)
);

// DELETE /tareas/:id/comentarios/:idComentario
router.delete('/:id/comentarios/:idComentario', TaskController.eliminarComentario.bind(TaskController));

// POST /tareas/:id/adjuntos
router.post('/:id/adjuntos', upload.single('archivo'), TaskController.adjuntarArchivo.bind(TaskController));

// POST /tareas/:id/tiempo
router.post(
  '/:id/tiempo',
  [body('horas', 'Las horas son requeridas').isNumeric()],
  TaskController.registrarTiempo.bind(TaskController)
);

// POST /tareas/:id/undo
router.post('/:id/undo', TaskController.deshacerUltimoCambio.bind(TaskController));

// PATCH /tareas/:id/subtareas/:idSubtarea/toggle
router.patch('/:id/subtareas/:idSubtarea/toggle', TaskController.toggleSubtarea.bind(TaskController));

export default router;
