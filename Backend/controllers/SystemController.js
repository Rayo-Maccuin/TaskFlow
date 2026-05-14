import SystemSetting from '../models/SystemSetting.js';

class SystemController {
  async obtener(req, res) {
    try {
      const [config] = await SystemSetting.findOrCreate({
        where: { clave: 'GLOBAL' },
        defaults: { clave: 'GLOBAL' },
      });

      res.status(200).json({ success: true, data: config });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      const valores = {
        ...req.body,
        clave: 'GLOBAL',
      };

      await SystemSetting.upsert(valores);
      const config = await SystemSetting.findOne({ where: { clave: 'GLOBAL' } });

      res.status(200).json({ success: true, data: config });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new SystemController();
