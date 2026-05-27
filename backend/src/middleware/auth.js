const jwt = require('jsonwebtoken');
const { PERMISOS } = require('../models/User');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token no provisto.' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Sesión expirada. Iniciá sesión nuevamente.' });
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

const requierePermiso = (permiso) => (req, res, next) => {
  if (!(PERMISOS[req.user?.rol] || []).includes(permiso)) {
    return res.status(403).json({ error: 'Acceso denegado.', detalle: `El rol "${req.user?.rol}" no tiene permiso para "${permiso}".` });
  }
  next();
};

const soloRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.rol)) return res.status(403).json({ error: 'Acceso denegado.' });
  next();
};

module.exports = { verificarToken, requierePermiso, soloRoles };
