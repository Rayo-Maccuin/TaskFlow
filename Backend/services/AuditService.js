import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export class AuditService {
  async registrar({ proyecto, usuario, accion, entidadTipo, entidadId = null, detalles = {} }) {
    try {
      return await AuditLog.create({
        proyectoId: proyecto,
        usuarioId: usuario,
        accion,
        entidadTipo,
        entidadId,
        detalles,
      });
    } catch (error) {
      return null;
    }
  }

  async listarPorProyecto(idProyecto, limite = 100) {
    return AuditLog.findAll({
      where: { proyectoId: idProyecto },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        { model: User, as: 'usuario', attributes: ['nombre', 'email'] },
      ],
    });
  }
}

export default new AuditService();
