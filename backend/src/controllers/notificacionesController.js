const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { Hito } = require('../models/Hito');
const { User } = require('../models/User');
const { Auditoria } = require('../models/Auditoria');
const { Op } = require('sequelize');
require('dotenv').config();

// ── Transporter de email ──
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT) || 2525,
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
  },
});

// Enviar alerta de hito próximo a vencer (RF03)
const enviarAlertaHito = async (hito, destinatarios) => {
  const fecha = new Date(hito.fecha_limite).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <div style="background:#1A6B5A;color:#fff;padding:20px 28px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">⏰ Hito próximo a vencer</h2>
        <p style="margin:6px 0 0;opacity:0.85">EliteTrack QP — Notificación automática</p>
      </div>
      <div style="border:1px solid #E8ECEE;padding:24px 28px;border-radius:0 0 8px 8px">
        <p>El siguiente hito vence en <strong>menos de 48 horas</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#5A6A74;width:140px">Hito</td><td style="padding:8px;font-weight:bold">${hito.nombre}</td></tr>
          <tr style="background:#F5F6F7"><td style="padding:8px;color:#5A6A74">Fecha límite</td><td style="padding:8px;font-weight:bold;color:#C0392B">${fecha}</td></tr>
          <tr><td style="padding:8px;color:#5A6A74">Estado</td><td style="padding:8px">${hito.estado}</td></tr>
        </table>
        <p style="color:#5A6A74;font-size:13px">Ingresá al sistema para cargar la evidencia correspondiente antes del vencimiento.</p>
      </div>
    </div>
  `;

  for (const dest of destinatarios) {
    await transporter.sendMail({
      from:    `"EliteTrack QP" <${process.env.MAIL_FROM || 'noreply@elitetrack.com'}>`,
      to:      dest,
      subject: `⏰ Hito "${hito.nombre}" vence en menos de 48hs`,
      html,
    });
  }

  await Auditoria.registrar({
    accion: 'NOTIFICACION_ENVIADA',
    modulo: 'NOTIFICACIONES',
    detalle: { hito_id: hito.id, hito_nombre: hito.nombre, destinatarios },
  });
};

// ── Cron job: se ejecuta cada hora — RF03 ──
const iniciarCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Verificando hitos próximos a vencer...');
    try {
      const ahora = new Date();
      const en48hs = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);

      // Hitos que vencen en las próximas 48hs y aún no enviaron alerta
      const hitos = await Hito.findAll({
        where: {
          fecha_limite:    { [Op.between]: [ahora, en48hs] },
          estado:          { [Op.in]: ['pendiente', 'en_progreso'] },
          alerta_enviada:  false,
        },
      });

      for (const hito of hitos) {
        // Notificar a Consultores y QA
        const destinatarios = await User.findAll({
          where: { rol: ['Consultor Interno', 'Equipo de QA'], activo: true },
          attributes: ['email'],
        });

        const emails = destinatarios.map(u => u.email);
        if (emails.length > 0) {
          await enviarAlertaHito(hito, emails);
          await hito.update({ alerta_enviada: true });
          console.log(`[CRON] Alerta enviada: hito #${hito.id} "${hito.nombre}"`);
        }
      }
    } catch (err) {
      console.error('[CRON] Error:', err.message);
    }
  });
  console.log('✓ Cron de notificaciones activo (cada hora).');
};

// GET /api/notificaciones/hitos-proximos — para el dashboard
const hitosProximos = async (req, res) => {
  try {
    const ahora = new Date();
    const en48hs = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);
    const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    const hitos = await Hito.findAll({
      where: { fecha_limite: { [Op.lte]: en7dias }, estado: { [Op.in]: ['pendiente', 'en_progreso'] } },
      order: [['fecha_limite', 'ASC']],
    });

    const mapeados = hitos.map(h => ({
      ...h.toJSON(),
      urgente: new Date(h.fecha_limite) <= en48hs,
    }));

    return res.json({ hitos: mapeados });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener hitos.' });
  }
};

// POST /api/notificaciones/test — dispara manualmente la verificación
const dispararManual = async (req, res) => {
  try {
    const ahora = new Date();
    const en48hs = new Date(ahora.getTime() + 48 * 60 * 60 * 1000);
    const hitos = await Hito.findAll({
      where: { fecha_limite: { [Op.between]: [ahora, en48hs] }, alerta_enviada: false, estado: { [Op.in]: ['pendiente', 'en_progreso'] } },
    });
    return res.json({ mensaje: `${hitos.length} hito(s) próximos a vencer encontrados.`, hitos });
  } catch (err) {
    return res.status(500).json({ error: 'Error.' });
  }
};

module.exports = { iniciarCron, hitosProximos, dispararManual, enviarAlertaHito };
