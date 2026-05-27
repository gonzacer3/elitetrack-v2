const express = require('express');
const r = express.Router();
const { subir, listar, revisar, detalle } = require('../controllers/evidenciasController');
const { verificarToken, requierePermiso, soloRoles } = require('../middleware/auth');
const { upload, manejarErrorUpload } = require('../middleware/upload');
const { ROLES } = require('../models/User');

r.use(verificarToken);

// CP02/CP03 — subir evidencia (solo Consultores)
r.post('/', soloRoles(ROLES.CONSULTOR), upload.single('archivo'), manejarErrorUpload, subir);

// Listar
r.get('/', requierePermiso('evidencias:leer'), listar);

// Detalle
r.get('/:id', requierePermiso('evidencias:leer'), detalle);

// Revisar (QA y Dirección)
r.patch('/:id/revisar', soloRoles(ROLES.QA, ROLES.DIRECCION), revisar);

module.exports = r;
