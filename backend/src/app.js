const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const path    = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes          = require('./routes/auth');
const evidenciasRoutes    = require('./routes/evidencias');
const notifRoutes         = require('./routes/notificaciones');
const { auditoriaRouter, dashboardRouter, proyectosRouter, hitosRouter, usuariosRouter } = require('./routes/otros');
const { iniciarCron }     = require('./controllers/notificacionesController');

const app = express();

// ── Middlewares ──
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Demasiadas solicitudes.' } }));

// ── Rutas ──
app.use('/api/auth',           authRoutes);
app.use('/api/evidencias',     evidenciasRoutes);
app.use('/api/notificaciones', notifRoutes);
app.use('/api/auditoria',      auditoriaRouter);
app.use('/api/dashboard',      dashboardRouter);
app.use('/api/proyectos',      proyectosRouter);
app.use('/api/hitos',          hitosRouter);
app.use('/api/usuarios',       usuariosRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '2.0', modulos: ['RF01','RF02','RF03','RF04'] }));
app.use((_, res) => res.status(404).json({ error: 'Endpoint no encontrado.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno.' }); });

// ── Inicialización ──
const PORT = process.env.PORT || 3001;

const seed = async () => {
  const { User, ROLES } = require('./models/User');
  const { Proyecto }    = require('./models/Proyecto');
  const { Hito }        = require('./models/Hito');

  // Usuarios de prueba
  const usuarios = [
    { nombre: 'Admin Dirección', email: 'admin@elitetrack.com',     password_hash: 'Admin1234!',     rol: ROLES.DIRECCION },
    { nombre: 'Ana QA',          email: 'qa@elitetrack.com',         password_hash: 'QA1234!',        rol: ROLES.QA },
    { nombre: 'Carlos Consultor',email: 'consultor@elitetrack.com',  password_hash: 'Consultor1234!', rol: ROLES.CONSULTOR },
    { nombre: 'Cliente Test',    email: 'cliente@elitetrack.com',    password_hash: 'Cliente1234!',   rol: ROLES.CLIENTE },
  ];

  for (const u of usuarios) {
    const existe = await User.findOne({ where: { email: u.email } });
    if (!existe) { await User.create(u); console.log(`  ✓ Usuario: ${u.email}`); }
  }

  // Proyecto de ejemplo
  let proyecto = await Proyecto.findOne({ where: { nombre: 'EliteTrack QP' } });
  if (!proyecto) {
    proyecto = await Proyecto.create({ nombre: 'EliteTrack QP', descripcion: 'Sistema de Gestión de Calidad', cliente: 'EliteCorp Consulting Group' });
    console.log('  ✓ Proyecto: EliteTrack QP');
  }

  // Hitos de ejemplo (uno próximo a vencer para probar RF03)
  const hitos = [
    { proyecto_id: proyecto.id, nombre: 'Entrega Paquete de Despliegue', descripcion: 'RF01 + RF02 listos', fecha_limite: new Date(Date.now() + 20 * 60 * 60 * 1000), estado: 'en_progreso' }, // 20hs → urgente
    { proyecto_id: proyecto.id, nombre: 'Entrega Manuales de Operación',  descripcion: 'Documentación completa', fecha_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), estado: 'pendiente' },
    { proyecto_id: proyecto.id, nombre: 'Firma Acta de Pruebas (UAT)',    descripcion: 'Firmas del cliente', fecha_limite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), estado: 'pendiente' },
  ];

  for (const h of hitos) {
    const existe = await Hito.findOne({ where: { nombre: h.nombre } });
    if (!existe) { await Hito.create(h); console.log(`  ✓ Hito: ${h.nombre}`); }
  }
};

const iniciar = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✓ Base de datos lista.');
    console.log('✓ Creando datos de ejemplo...');
    await seed();
    iniciarCron();
    app.listen(PORT, () => console.log(`\n✓ EliteTrack QP API → http://localhost:${PORT}\n`));
  } catch (err) {
    console.error('✗ Error al iniciar:', err);
    process.exit(1);
  }
};

iniciar();
module.exports = app;
