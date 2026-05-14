/**
 * RUTAS DE PROYECTOS
 */

import express from 'express';
import { body } from 'express-validator';
import ProjectController from '../controllers/ProjectController.js';
import { authMiddleware, readOnlyMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);
router.use(readOnlyMiddleware);

/**
 * CRUD DE PROYECTOS
 */

// POST /proyectos
// Crea un nuevo proyecto
router.post(
  '/',
  [
    body('nombre', 'El nombre del proyecto es obligatorio')
      .notEmpty()
      .trim()
      .isLength({ min: 1 })
  ],
  ProjectController.crear.bind(ProjectController)
);

// GET /mis-proyectos
// Obtiene todos los proyectos del usuario autenticado
router.get('/mis-proyectos', ProjectController.obtenerMisProyectos.bind(ProjectController));

// GET /proyectos/:id
// Obtiene un proyecto por ID
router.get('/:id', ProjectController.obtenerPorId.bind(ProjectController));

// PUT /proyectos/:id
// Actualiza un proyecto
router.put('/:id', ProjectController.actualizar.bind(ProjectController));

// DELETE /proyectos/:id
// Elimina un proyecto (solo el propietario)
router.delete('/:id', ProjectController.eliminar.bind(ProjectController));

/**
 * GESTIÓN DE MIEMBROS
 */

// POST /proyectos/:id/invitar
// Invita un usuario a un proyecto
router.post(
  '/:id/invitar',
  [body('idUsuario', 'El ID del usuario es requerido').notEmpty()],
  ProjectController.invitarMiembro.bind(ProjectController)
);

// POST /proyectos/:id/invitar/email
// Invita un usuario por email a un proyecto
router.post(
  '/:id/invitar/email',
  [body('email', 'El email es requerido').isEmail()],
  ProjectController.invitarPorEmail.bind(ProjectController)
);

// DELETE /proyectos/:id/miembro/:idMiembro
// Elimina un miembro del proyecto
router.delete(
  '/:id/miembro/:idMiembro',
  ProjectController.eliminarMiembro.bind(ProjectController)
);

/**
 * ESTADOS
 */

// PATCH /proyectos/:id/estado
// Cambia el estado de un proyecto
router.patch(
  '/:id/estado',
  [body('estado', 'El estado es requerido').notEmpty()],
  ProjectController.cambiarEstado.bind(ProjectController)
);

// POST /proyectos/:id/clonar
// Clona un proyecto sin tareas
router.post('/:id/clonar', ProjectController.clonar.bind(ProjectController));

export default router;
