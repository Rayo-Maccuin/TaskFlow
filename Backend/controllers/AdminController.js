import UserService from '../services/UserService.js';
import Project from '../models/Project.js';

class AdminController {
  async crearUsuario(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;
      const usuario = await UserService.registrar(nombre, email, password, rol || 'DEVELOPER');
      res.status(201).json({ success: true, data: usuario });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async editarUsuario(req, res) {
    try {
      const usuario = await UserService.actualizarPorAdmin(req.params.id, req.body);
      res.status(200).json({ success: true, data: usuario });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async desactivarUsuario(req, res) {
    try {
      const usuario = await UserService.desactivar(req.params.id);
      res.status(200).json({ success: true, data: usuario });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async listarUsuarios(req, res) {
    try {
      const data = await UserService.obtenerTodos(true);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async reactivarUsuario(req, res) {
    try {
      const usuario = await UserService.reactivar(req.params.id);
      res.status(200).json({ success: true, data: usuario });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async listarProyectos(req, res) {
    try {
      const data = await Project.findAll({
        attributes: ['id', 'nombre', 'estado'],
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
