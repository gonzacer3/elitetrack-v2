const express = require('express');
const r = express.Router();
const { hitosProximos, dispararManual } = require('../controllers/notificacionesController');
const { verificarToken, soloRoles } = require('../middleware/auth');
const { Hito } = require('../models/Hito');
const { Proyecto } = require('../models/Proyecto');
const { ROLES } = require('../models/User');

r.use(verificarToken);

// RF03 — hitos próximos para el dashboard
r.get('/hitos-proximos', hitosProximos);

// Trigger manual (para pruebas)
r.post('/test', soloRoles(ROLES.QA, ROLES.DIRECCION), dispararManual);

module.exports = r;
