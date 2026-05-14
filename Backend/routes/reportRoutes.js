import express from 'express';
import ReportController from '../controllers/ReportController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/proyecto/:idProyecto/dashboard', ReportController.dashboardProyecto.bind(ReportController));

// Ruta genérica con patrón ADAPTER - permite cualquier formato
// Uso: /reportes/proyecto/123/exportar?formato=pdf|csv|json|excel
router.get('/proyecto/:idProyecto/exportar', ReportController.exportarReporte.bind(ReportController));

// Rutas específicas (compatibilidad hacia atrás)
router.get('/proyecto/:idProyecto/export/csv', (req, res) => {
  console.log('[reportRoutes] CSV solicitado, params:', req.params, 'query:', req.query);
  req.query.formato = 'csv';
  return ReportController.exportarReporte(req, res);
});

router.get('/proyecto/:idProyecto/export/pdf', (req, res) => {
  console.log('[reportRoutes] PDF solicitado, params:', req.params, 'query:', req.query);
  req.query.formato = 'pdf';
  return ReportController.exportarReporte(req, res);
});

router.get('/proyecto/:idProyecto/export/excel', (req, res) => {
  console.log('[reportRoutes] Excel solicitado, params:', req.params, 'query:', req.query);
  req.query.formato = 'excel';
  return ReportController.exportarReporte(req, res);
});

router.get('/proyecto/:idProyecto/auditoria', ReportController.auditoria.bind(ReportController));

export default router;
