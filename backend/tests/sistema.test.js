const request = require('supertest');
const app     = require('../src/app');
const sequelize = require('../src/config/database');
const { User, ROLES } = require('../src/models/User');
const { Proyecto } = require('../src/models/Proyecto');
const { Hito }     = require('../src/models/Hito');
const { Auditoria }= require('../src/models/Auditoria');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs   = require('fs');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'elitetrack_jwt_secret_change_in_prod';

let tokenConsultor, tokenQA, tokenDireccion, tokenCliente, proyectoId, hitoId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Crear usuarios
  await User.create({ nombre: 'Consultor Test', email: 'consultor@test.com', password_hash: 'Pass1234!', rol: ROLES.CONSULTOR });
  await User.create({ nombre: 'QA Test',        email: 'qa@test.com',        password_hash: 'Pass1234!', rol: ROLES.QA });
  await User.create({ nombre: 'Dir Test',       email: 'dir@test.com',       password_hash: 'Pass1234!', rol: ROLES.DIRECCION });
  await User.create({ nombre: 'Cliente Test',   email: 'cliente@test.com',   password_hash: 'Pass1234!', rol: ROLES.CLIENTE });

  // Crear proyecto e hito
  const p = await Proyecto.create({ nombre: 'Proyecto Test', cliente: 'Cliente Test' });
  proyectoId = p.id;
  const h = await Hito.create({ proyecto_id: p.id, nombre: 'Hito Test', fecha_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) });
  hitoId = h.id;

  // Obtener tokens
  const loginYToken = async (email) => {
    const r = await request(app).post('/api/auth/login').send({ email, password: 'Pass1234!' });
    return r.body.token;
  };
  tokenConsultor = await loginYToken('consultor@test.com');
  tokenQA        = await loginYToken('qa@test.com');
  tokenDireccion = await loginYToken('dir@test.com');
  tokenCliente   = await loginYToken('cliente@test.com');
});

afterAll(async () => {
  // Limpiar uploads de test
  const uploadDir = path.join(__dirname, '../uploads');
  if (fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach(f => fs.unlinkSync(path.join(uploadDir, f)));
  }
  await sequelize.close();
});

// ════════════════════════════════
// RF01 — Auth & RBAC (CP-SEC01 a CP-SEC06)
// ════════════════════════════════
describe('RF01 — Auth / RBAC', () => {

  test('CP-SEC01: password almacenada como hash bcrypt ($2b$)', async () => {
    const u = await User.findOne({ where: { email: 'consultor@test.com' } });
    expect(u.password_hash).toMatch(/^\$2b\$/);
    expect(u.password_hash).not.toBe('Pass1234!');
  });

  test('CP-SEC02: JWT contiene rol y expiración ≤ 15 min', () => {
    const d = jwt.decode(tokenConsultor);
    expect(d.rol).toBe(ROLES.CONSULTOR);
    expect(d.exp).toBeDefined();
    expect((d.exp - d.iat) / 60).toBeLessThanOrEqual(15);
  });

  test('CP-SEC03: Cliente Externo recibe 403 en endpoint de Dirección', async () => {
    const r = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(403);
  });

  test('CP-SEC03: Sin token recibe 401', async () => {
    const r = await request(app).get('/api/dashboard');
    expect(r.status).toBe(401);
  });

  test('CP-SEC04: bloqueo tras 5 intentos fallidos → HTTP 423', async () => {
    await User.create({ nombre: 'Bloqueo', email: 'bloqueo@test.com', password_hash: 'Pass1234!', rol: ROLES.CONSULTOR });
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'bloqueo@test.com', password: 'MAL' });
    }
    const r = await request(app).post('/api/auth/login').send({ email: 'bloqueo@test.com', password: 'MAL' });
    expect(r.status).toBe(423);
  });

  test('CP-SEC05: token expirado → HTTP 401', async () => {
    const exp = jwt.sign({ id: 99, rol: ROLES.CONSULTOR }, SECRET, { expiresIn: '0s' });
    await new Promise(r => setTimeout(r, 100));
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${exp}`);
    expect(r.status).toBe(401);
    expect(r.body.error).toMatch(/expir/i);
  });

  test('CP-SEC06: cuenta con bloqueo_hasta expirado puede entrar', async () => {
    await User.create({ nombre: 'Desbloqueado', email: 'desbloqueo@test.com', password_hash: 'Pass1234!', rol: ROLES.CONSULTOR, intentos_fallidos: 5, bloqueado_hasta: new Date(Date.now() - 1000) });
    const r = await request(app).post('/api/auth/login').send({ email: 'desbloqueo@test.com', password: 'Pass1234!' });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
  });

  test('Login sin body → 400', async () => {
    const r = await request(app).post('/api/auth/login').send({});
    expect(r.status).toBe(400);
  });

  test('GET /api/auth/me con token válido → 200', async () => {
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenConsultor}`);
    expect(r.status).toBe(200);
    expect(r.body.usuario.rol).toBe(ROLES.CONSULTOR);
  });
});

// ════════════════════════════════
// RF02 — Evidencias (CP02 / CP03)
// ════════════════════════════════
describe('RF02 — Evidencias', () => {

  test('CP02: Consultor sube archivo < 20MB → 201', async () => {
    // Crear archivo de prueba temporal
    const tmpFile = path.join(__dirname, 'test_file.pdf');
    fs.writeFileSync(tmpFile, 'Contenido de prueba PDF');

    const r = await request(app)
      .post('/api/evidencias')
      .set('Authorization', `Bearer ${tokenConsultor}`)
      .field('hito_id', hitoId)
      .attach('archivo', tmpFile, { contentType: 'application/pdf' });

    fs.unlinkSync(tmpFile);
    expect(r.status).toBe(201);
    expect(r.body.evidencia).toBeDefined();
    expect(r.body.evidencia.estado).toBe('pendiente');
  });

  test('CP03: Archivo > 20MB → 400', async () => {
    // Crear archivo de 21MB
    const tmpFile = path.join(__dirname, 'big_file.bin');
    const buf = Buffer.alloc(21 * 1024 * 1024, 'x');
    fs.writeFileSync(tmpFile, buf);

    const r = await request(app)
      .post('/api/evidencias')
      .set('Authorization', `Bearer ${tokenConsultor}`)
      .field('hito_id', hitoId)
      .attach('archivo', tmpFile);

    fs.unlinkSync(tmpFile);
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/grande/i);
  });

  test('CP02: sin archivo → 400', async () => {
    const r = await request(app)
      .post('/api/evidencias')
      .set('Authorization', `Bearer ${tokenConsultor}`)
      .send({ hito_id: hitoId });
    expect(r.status).toBe(400);
  });

  test('QA puede listar evidencias', async () => {
    const r = await request(app).get('/api/evidencias').set('Authorization', `Bearer ${tokenQA}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.evidencias)).toBe(true);
  });

  test('Cliente NO puede listar evidencias → 403', async () => {
    const r = await request(app).get('/api/evidencias').set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(403);
  });
});

// ════════════════════════════════
// RF03 — Notificaciones
// ════════════════════════════════
describe('RF03 — Notificaciones', () => {

  test('GET /api/notificaciones/hitos-proximos → 200 con array', async () => {
    const r = await request(app).get('/api/notificaciones/hitos-proximos').set('Authorization', `Bearer ${tokenConsultor}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.hitos)).toBe(true);
  });

  test('Hito en menos de 48hs marcado como urgente', async () => {
    // Crear hito a 10hs
    await Hito.create({ proyecto_id: proyectoId, nombre: 'Hito Urgente Test', fecha_limite: new Date(Date.now() + 10 * 60 * 60 * 1000), estado: 'pendiente' });
    const r = await request(app).get('/api/notificaciones/hitos-proximos').set('Authorization', `Bearer ${tokenConsultor}`);
    const urgentes = r.body.hitos.filter(h => h.urgente);
    expect(urgentes.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/notificaciones/test solo QA/Dirección → 200', async () => {
    const r = await request(app).post('/api/notificaciones/test').set('Authorization', `Bearer ${tokenQA}`);
    expect(r.status).toBe(200);
  });
});

// ════════════════════════════════
// RF04 — Auditoría
// ════════════════════════════════
describe('RF04 — Auditoría', () => {

  test('Registros de auditoría se crean automáticamente al loguearse', async () => {
    const r = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${tokenQA}`);
    expect(r.status).toBe(200);
    expect(r.body.total).toBeGreaterThan(0);
  });

  test('Los registros tienen usuario, acción, módulo y timestamp', async () => {
    const r = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${tokenQA}`);
    const reg = r.body.registros[0];
    expect(reg.accion).toBeDefined();
    expect(reg.modulo).toBeDefined();
    expect(reg.createdAt).toBeDefined();
  });

  test('Historial es inmutable — update lanza error', async () => {
    const reg = await Auditoria.create({ accion: 'TEST', modulo: 'TEST', resultado: 'exitoso' });
    await expect(reg.update({ accion: 'MODIFICADO' })).rejects.toThrow(/inmutables/);
  });

  test('Historial es inmutable — destroy lanza error', async () => {
    const reg = await Auditoria.create({ accion: 'TEST2', modulo: 'TEST', resultado: 'exitoso' });
    await expect(reg.destroy()).rejects.toThrow(/eliminar/);
  });

  test('Consultor NO puede ver auditoría → 403', async () => {
    const r = await request(app).get('/api/auditoria').set('Authorization', `Bearer ${tokenConsultor}`);
    expect(r.status).toBe(403);
  });

  test('GET /api/auditoria/resumen para QA → 200', async () => {
    const r = await request(app).get('/api/auditoria/resumen').set('Authorization', `Bearer ${tokenQA}`);
    expect(r.status).toBe(200);
    expect(r.body.total).toBeDefined();
  });
});

// ════════════════════════════════
// Dashboard
// ════════════════════════════════
describe('Dashboard — stats por rol', () => {
  test('Dirección recibe stats completas', async () => {
    const r = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenDireccion}`);
    expect(r.status).toBe(200);
    expect(r.body.total_usuarios).toBeDefined();
    expect(r.body.proyectos_activos).toBeDefined();
  });

  test('Consultor recibe stats limitadas a sus evidencias', async () => {
    const r = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenConsultor}`);
    expect(r.status).toBe(200);
    expect(r.body.mis_evidencias).toBeDefined();
    expect(r.body.total_usuarios).toBeUndefined(); // no debería ver esto
  });

  test('Cliente recibe solo proyectos e hitos', async () => {
    const r = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenCliente}`);
    expect(r.status).toBe(200);
    expect(r.body.proyectos_activos).toBeDefined();
    expect(r.body.total_auditoria).toBeUndefined();
  });
});
