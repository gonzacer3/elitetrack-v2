const { Auditoria } = require('../models/Auditoria');
const { Op } = require('sequelize');

// GET /api/auditoria — historial (solo QA y Dirección)
const listar = async (req, res) => {
  try {
    const { modulo, accion, desde, hasta, page = 1, limit = 50 } = req.query;
    const where = {};

    if (modulo) where.modulo = modulo;
    if (accion) where.accion = { [Op.like]: `%${accion}%` };
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) where.createdAt[Op.lte] = new Date(hasta);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Auditoria.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      total: count,
      pagina: parseInt(page),
      total_paginas: Math.ceil(count / parseInt(limit)),
      registros: rows,
    });
  } catch (err) {
    console.error('[AUDITORIA] listar:', err);
    return res.status(500).json({ error: 'Error al obtener el historial.' });
  }
};

// GET /api/auditoria/resumen — para el dashboard
const resumen = async (req, res) => {
  try {
    const total = await Auditoria.count();
    const fallidos = await Auditoria.count({ where: { resultado: 'fallido' } });
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const hoy_count = await Auditoria.count({ where: { createdAt: { [Op.gte]: hoy } } });

    const ultimos = await Auditoria.findAll({ order: [['createdAt', 'DESC']], limit: 5 });

    return res.json({ total, fallidos, exitosos: total - fallidos, hoy: hoy_count, ultimos });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener resumen.' });
  }
};

module.exports = { listar, resumen };
