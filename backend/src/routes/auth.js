// routes/auth.js
const express = require('express');
const r = express.Router();
const { login, me, logout } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
r.post('/login', login);
r.get('/me', verificarToken, me);
r.post('/logout', verificarToken, logout);
module.exports = r;
