const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { Auditoria } = require('../models/Auditoria');
require('dotenv').config();

const MAX_INTENTOS = parseInt(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const BLOQUEO_MIN  = parseInt(process.env.LOGIN_BLOCK_MINUTES) || 15;

const login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;

  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos.' });

  try {
    const user = await User.findOne({ where: { email, activo: true } });
    if (!user) {
      await Auditoria.registrar({ accion: 'LOGIN_FALLIDO', modulo: 'AUTH', detalle: `Email no encontrado: ${email}`, ip, resultado: 'fallido' });
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (user.estaBloqueado()) {
      const min = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 60000);
      await Auditoria.registrar({ usuario: user, accion: 'LOGIN_BLOQUEADO', modulo: 'AUTH', ip, resultado: 'fallido' });
      return res.status(423).json({ error: 'Cuenta bloqueada.', detalle: `Intentá en ${min} minuto(s).` });
    }

    const ok = await user.verificarPassword(password);
    if (!ok) {
      const intentos = user.intentos_fallidos + 1;
      const bloqueadoHasta = intentos >= MAX_INTENTOS ? new Date(Date.now() + BLOQUEO_MIN * 60000) : null;
      await user.update({ intentos_fallidos: intentos, bloqueado_hasta: bloqueadoHasta });
      await Auditoria.registrar({ usuario: user, accion: 'LOGIN_FALLIDO', modulo: 'AUTH', detalle: `Intento ${intentos}/${MAX_INTENTOS}`, ip, resultado: 'fallido' });
      if (intentos >= MAX_INTENTOS) return res.status(423).json({ error: 'Cuenta bloqueada.', detalle: `Superaste ${MAX_INTENTOS} intentos. Esperá ${BLOQUEO_MIN} minutos.` });
      return res.status(401).json({ error: 'Credenciales inválidas.', detalle: `Te quedan ${MAX_INTENTOS - intentos} intento(s).` });
    }

    await user.update({ intentos_fallidos: 0, bloqueado_hasta: null });
    const token = jwt.sign({ id: user.id, rol: user.rol, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    await Auditoria.registrar({ usuario: user, accion: 'LOGIN_EXITOSO', modulo: 'AUTH', ip });

    return res.json({ token, usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) {
    console.error('[AUTH] login:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'nombre', 'email', 'rol', 'createdAt'] });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({ usuario: user });
  } catch { return res.status(500).json({ error: 'Error interno.' }); }
};

const logout = async (req, res) => {
  await Auditoria.registrar({ usuario: req.user, accion: 'LOGOUT', modulo: 'AUTH', ip: req.ip });
  return res.json({ mensaje: 'Sesión cerrada.' });
};

module.exports = { login, me, logout };
