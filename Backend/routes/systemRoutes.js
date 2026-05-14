import express from 'express';
import SystemController from '../controllers/SystemController.js';
import { authMiddleware, isAdmin, authService } from '../middlewares/auth.js';
import { AuthServiceFactory } from '../patterns/Bridge.js';

const router = express.Router();

router.get('/', authMiddleware, SystemController.obtener.bind(SystemController));
router.put('/', authMiddleware, isAdmin, SystemController.actualizar.bind(SystemController));

// Diagnostic endpoints for Bridge Pattern
router.get('/debug/auth-strategy', authMiddleware, isAdmin, (req, res) => {
  try {
    const implementacionNombre = authService.implementation.constructor.name;
    res.json({
      success: true,
      data: {
        implementacionActual: implementacionNombre,
        implementacionesDisponibles: ['JWTAuthImplementation', 'BasicAuthImplementation'],
        usuario: req.usuario?.nombre || req.usuarioId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/debug/auth-strategy', authMiddleware, isAdmin, (req, res) => {
  try {
    const { tipo } = req.body;
    if (!tipo) {
      return res.status(400).json({ success: false, message: 'Campo "tipo" requerido (JWT o BASIC)' });
    }
    const tipoUpper = tipo.toUpperCase();
    // Crear nueva implementación usando el Bridge
    const nuevaImplementacion = AuthServiceFactory.crear(tipoUpper, { secret: process.env.JWT_SECRET });
    // Cambiar la implementación en el servicio en tiempo real (sin reiniciar)
    authService.implementation = nuevaImplementacion.implementation;
    console.log(`[Bridge] Usuario ${req.usuario?.nombre || req.usuarioId} cambió implementación a: ${tipoUpper}`);
    res.json({
      success: true,
      message: `Implementación cambiada a ${tipoUpper}`,
      data: {
        nuevaImplementacion: authService.implementation.constructor.name,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Bridge] Error cambiando implementación:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
