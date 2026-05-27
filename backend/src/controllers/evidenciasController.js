const { Evidencia } = require('../models/Evidencia');
const { Auditoria } = require('../models/Auditoria');
const { Hito } = require('../models/Hito');
const fs = require('fs');

// POST /api/evidencias — subir evidencia (CP02/CP03)
const subir = async (req, res) => {
  const { hito_id } = req.body;

  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  if (!hito_id)  return res.status(400).json({ error: 'hito_id es requerido.' });

  try {
    const hito = await Hito.findByPk(hito_id);
    if (!hito) return res.status(404).json({ error: 'Hito no encontrado.' });

    const evidencia = await Evidencia.create({
      hito_id,
      usuario_id:     req.user.id,
      nombre_archivo: req.file.originalname,
      ruta_archivo:   req.file.path,
      tamanio_bytes:  req.file.size,
      tipo_mime:      req.file.mimetype,
    });

    await Auditoria.registrar({
      usuario: req.user,
      accion:  'SUBIR_EVIDENCIA',
      modulo:  'EVIDENCIAS',
      detalle: { hito_id, archivo: req.file.originalname, tamanio: req.file.size },
      ip: req.ip,
    });

    return res.status(201).json({ mensaje: 'Evidencia cargada correctamente.', evidencia });
  } catch (err) {
    // Si falla la DB, eliminar el archivo subido
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[EVIDENCIAS] subir:', err);
    return res.status(500).json({ error: 'Error al guardar la evidencia.' });
  }
};

// GET /api/evidencias — listar
const listar = async (req, res) => {
  try {
    const where = {};
    if (req.query.hito_id) where.hito_id = req.query.hito_id;
    // Consultor solo ve sus propias evidencias
    if (req.user.rol === 'Consultor Interno') where.usuario_id = req.user.id;

    const evidencias = await Evidencia.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json({ evidencias });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener evidencias.' });
  }
};

// PATCH /api/evidencias/:id/revisar — QA aprueba o rechaza
const revisar = async (req, res) => {
  const { estado, comentario } = req.body;
  if (!['aprobada', 'rechazada'].includes(estado)) return res.status(400).json({ error: 'Estado inválido.' });

  try {
    const ev = await Evidencia.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ error: 'Evidencia no encontrada.' });

    await ev.update({ estado, comentario, revisado_por: req.user.id });

    await Auditoria.registrar({
      usuario: req.user,
      accion:  'REVISAR_EVIDENCIA',
      modulo:  'EVIDENCIAS',
      detalle: { evidencia_id: ev.id, estado, comentario },
      ip: req.ip,
    });

    return res.json({ mensaje: `Evidencia ${estado}.`, evidencia: ev });
  } catch (err) {
    return res.status(500).json({ error: 'Error al revisar evidencia.' });
  }
};

// GET /api/evidencias/:id — detalle
const detalle = async (req, res) => {
  try {
    const ev = await Evidencia.findByPk(req.params.id);
    if (!ev) return res.status(404).json({ error: 'Evidencia no encontrada.' });
    return res.json({ evidencia: ev });
  } catch { return res.status(500).json({ error: 'Error interno.' }); }
};

module.exports = { subir, listar, revisar, detalle };
