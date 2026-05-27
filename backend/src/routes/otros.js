const express = require('express');
const app = express.Router();

// Auditoria
const aR = express.Router();
const { listar, resumen } = require('../controllers/auditoriaController');
const { verificarToken, soloRoles } = require('../middleware/auth');
const { ROLES } = require('../models/User');
const { Hito } = require('../models/Hito');
const { Proyecto } = require('../models/Proyecto');
const { Auditoria } = require('../models/Auditoria');

aR.use(verificarToken);
aR.use(soloRoles(ROLES.QA, ROLES.DIRECCION));
aR.get('/', listar);
aR.get('/resumen', resumen);

// Dashboard
const dR = express.Router();
const { stats } = require('../controllers/dashboardController');
dR.use(verificarToken);
dR.get('/', stats);

// Proyectos
const pR = express.Router();
pR.use(verificarToken);
pR.get('/', async (req, res) => {
  const proyectos = await Proyecto.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ proyectos });
});
pR.post('/', soloRoles(ROLES.DIRECCION), async (req, res) => {
  try {
    const p = await Proyecto.create(req.body);
    await Auditoria.registrar({ usuario: req.user, accion: 'CREAR_PROYECTO', modulo: 'PROYECTOS', detalle: { nombre: p.nombre }, ip: req.ip });
    res.status(201).json({ proyecto: p });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Hitos
const hR = express.Router();
hR.use(verificarToken);
hR.get('/', async (req, res) => {
  const where = req.query.proyecto_id ? { proyecto_id: req.query.proyecto_id } : {};
  const hitos = await Hito.findAll({ where, order: [['fecha_limite', 'ASC']] });
  res.json({ hitos });
});
hR.post('/', soloRoles(ROLES.DIRECCION, ROLES.QA), async (req, res) => {
  try {
    const h = await Hito.create(req.body);
    await Auditoria.registrar({ usuario: req.user, accion: 'CREAR_HITO', modulo: 'HITOS', detalle: { nombre: h.nombre }, ip: req.ip });
    res.status(201).json({ hito: h });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
hR.patch('/:id', soloRoles(ROLES.DIRECCION, ROLES.QA), async (req, res) => {
  const h = await Hito.findByPk(req.params.id);
  if (!h) return res.status(404).json({ error: 'Hito no encontrado.' });
  await h.update(req.body);
  res.json({ hito: h });
});

// Admin usuarios
const uR = express.Router();
uR.use(verificarToken, soloRoles(ROLES.DIRECCION));
uR.get('/', async (req, res) => {
  const { User } = require('../models/User');
  const usuarios = await User.findAll({ attributes: ['id','nombre','email','rol','activo','createdAt'] });
  res.json({ usuarios });
});

module.exports = { auditoriaRouter: aR, dashboardRouter: dR, proyectosRouter: pR, hitosRouter: hR, usuariosRouter: uR };
