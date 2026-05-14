import express from 'express';
import { body } from 'express-validator';
import AdminController from '../controllers/AdminController.js';
import { authMiddleware, isAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(authMiddleware, isAdmin);

router.get('/usuarios', AdminController.listarUsuarios.bind(AdminController));
router.post(
  '/usuarios',
  [
    body('nombre', 'Nombre requerido').notEmpty(),
    body('email', 'Email inválido').isEmail(),
    body('password', 'Password mínimo 6 caracteres').isLength({ min: 6 }),
  ],
  AdminController.crearUsuario.bind(AdminController)
);
router.put('/usuarios/:id', AdminController.editarUsuario.bind(AdminController));
router.patch('/usuarios/:id/desactivar', AdminController.desactivarUsuario.bind(AdminController));
router.patch('/usuarios/:id/reactivar', AdminController.reactivarUsuario.bind(AdminController));
router.get('/proyectos', AdminController.listarProyectos.bind(AdminController));

export default router;
