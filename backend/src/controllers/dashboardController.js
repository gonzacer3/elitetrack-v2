const { User } = require('../models/User');
const { Evidencia } = require('../models/Evidencia');
const { Hito } = require('../models/Hito');
const { Auditoria } = require('../models/Auditoria');
const { Proyecto } = require('../models/Proyecto');
const { Op } = require('sequelize');

// GET /api/dashboard — stats por rol
const stats = async (req, res) => {
  try {
    const ahora = new Date();
    const en48hs = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    // Stats comunes
    const proyectos_activos = await Proyecto.count({ where: { estado: 'activo' } });
    const hitos_proximos    = await Hito.count({ where: { fecha_limite: { [Op.between]: [ahora, en48hs] }, estado: { [Op.in]: ['pendiente', 'en_progreso'] } } });
    const evidencias_pendientes = await Evidencia.count({ where: { estado: 'pendiente' } });

    const base = { proyectos_activos, hitos_proximos, evidencias_pendientes };

    const rol = req.user.rol;

    if (rol === 'Consultor Interno') {
      const mis_evidencias = await Evidencia.count({ where: { usuario_id: req.user.id } });
      const mis_aprobadas  = await Evidencia.count({ where: { usuario_id: req.user.id, estado: 'aprobada' } });
      return res.json({ ...base, mis_evidencias, mis_aprobadas });
    }

    if (rol === 'Equipo de QA') {
      const evidencias_hoy = await Evidencia.count({ where: { createdAt: { [Op.gte]: hoy } } });
      const auditoria_hoy  = await Auditoria.count({ where: { createdAt: { [Op.gte]: hoy } } });
      return res.json({ ...base, evidencias_hoy, auditoria_hoy });
    }

    if (rol === 'Dirección') {
      const total_usuarios  = await User.count({ where: { activo: true } });
      const total_evidencias= await Evidencia.count();
      const total_auditoria = await Auditoria.count();
      const fallos_hoy      = await Auditoria.count({ where: { resultado: 'fallido', createdAt: { [Op.gte]: hoy } } });
      return res.json({ ...base, total_usuarios, total_evidencias, total_auditoria, fallos_hoy });
    }

    // Cliente Externo
    return res.json({ proyectos_activos, hitos_proximos });
  } catch (err) {
    console.error('[DASHBOARD] stats:', err);
    return res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
};

module.exports = { stats };
