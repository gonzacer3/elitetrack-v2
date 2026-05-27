const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Auditoria = sequelize.define('Auditoria', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id:  { type: DataTypes.INTEGER, allowNull: true },
  usuario_email: { type: DataTypes.STRING },
  usuario_rol: { type: DataTypes.STRING },
  accion:      { type: DataTypes.STRING, allowNull: false },  // 'LOGIN', 'SUBIR_EVIDENCIA', etc.
  modulo:      { type: DataTypes.STRING, allowNull: false },  // 'AUTH', 'EVIDENCIAS', 'HITOS'
  detalle:     { type: DataTypes.TEXT },
  ip:          { type: DataTypes.STRING },
  resultado:   { type: DataTypes.ENUM('exitoso', 'fallido'), defaultValue: 'exitoso' },
}, {
  tableName: 'auditoria',
  timestamps: true,
  updatedAt: false, // inmutable: solo createdAt
});

// RF04: el historial es inmutable — nunca se actualiza ni elimina
Auditoria.beforeUpdate(() => { throw new Error('Los registros de auditoría son inmutables.'); });
Auditoria.beforeDestroy(() => { throw new Error('Los registros de auditoría no pueden eliminarse.'); });

// Helper para registrar desde cualquier parte del sistema
Auditoria.registrar = async ({ usuario, accion, modulo, detalle, ip, resultado = 'exitoso' }) => {
  try {
    await Auditoria.create({
      usuario_id:    usuario?.id    || null,
      usuario_email: usuario?.email || 'sistema',
      usuario_rol:   usuario?.rol   || 'sistema',
      accion,
      modulo,
      detalle: typeof detalle === 'object' ? JSON.stringify(detalle) : detalle,
      ip,
      resultado,
    });
  } catch (err) {
    // Auditoría no debe romper el flujo principal
    console.error('[AUDITORIA] Error al registrar:', err.message);
  }
};

module.exports = { Auditoria };
