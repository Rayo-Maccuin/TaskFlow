import express from 'express';
import NotificationController from '../controllers/NotificationController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Listar notificaciones con paginación (GET /api/notificaciones)
router.get('/', NotificationController.listar.bind(NotificationController));

// Obtener notificaciones no leídas (GET /api/notificaciones/unread)
router.get('/unread', NotificationController.obtenerNoLeidas.bind(NotificationController));

// Contar notificaciones no leídas (GET /api/notificaciones/unread/count)
router.get('/unread/count', NotificationController.contarNoLeidas.bind(NotificationController));

// Marcar notificación específica como leída (PATCH /api/notificaciones/:id/read)
router.patch('/:id/read', NotificationController.marcarLeida.bind(NotificationController));
// Compatibilidad con frontend que usa /leida
router.patch('/:id/leida', NotificationController.marcarLeida.bind(NotificationController));

// Marcar todas las notificaciones como leídas (PATCH /api/notificaciones/read-all)
router.patch('/read-all', NotificationController.marcarTodasLeidas.bind(NotificationController));
// Compatibilidad con frontend que usa /marcar-todas-leidas
router.patch('/marcar-todas-leidas', NotificationController.marcarTodasLeidas.bind(NotificationController));

// Obtener preferencias de notificación (GET /api/notificaciones/preferences)
router.get('/preferences', NotificationController.obtenerPreferencias.bind(NotificationController));

// Actualizar preferencias de notificación (PUT /api/notificaciones/preferences)
router.put('/preferences', NotificationController.actualizarPreferencias.bind(NotificationController));

// Stream de notificaciones en tiempo real (Server-Sent Events)
router.get('/stream', NotificationController.stream.bind(NotificationController));

export default router;
