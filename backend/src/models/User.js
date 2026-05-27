const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const ROLES = {
  CONSULTOR: 'Consultor Interno',
  QA:        'Equipo de QA',
  DIRECCION: 'Dirección',
  CLIENTE:   'Cliente Externo',
};

const PERMISOS = {
  [ROLES.CONSULTOR]: ['evidencias:leer', 'evidencias:subir', 'hitos:leer', 'proyectos:leer'],
  [ROLES.QA]:        ['evidencias:leer', 'evidencias:revisar', 'hitos:leer', 'proyectos:leer', 'reportes:leer', 'auditoria:leer'],
  [ROLES.DIRECCION]: ['evidencias:leer', 'hitos:leer', 'hitos:aprobar', 'proyectos:leer', 'proyectos:aprobar', 'reportes:leer', 'admin:leer', 'auditoria:leer'],
  [ROLES.CLIENTE]:   ['proyectos:leer', 'hitos:leer'],
};

const User = sequelize.define('User', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:           { type: DataTypes.STRING, allowNull: false },
  email:            { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash:    { type: DataTypes.STRING, allowNull: false },
  rol:              { type: DataTypes.ENUM(...Object.values(ROLES)), allowNull: false, defaultValue: ROLES.CONSULTOR },
  intentos_fallidos:{ type: DataTypes.INTEGER, defaultValue: 0 },
  bloqueado_hasta:  { type: DataTypes.DATE, allowNull: true },
  activo:           { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'usuarios', timestamps: true });

User.beforeCreate(async (u) => { u.password_hash = await bcrypt.hash(u.password_hash, 10); });
User.beforeUpdate(async (u) => { if (u.changed('password_hash')) u.password_hash = await bcrypt.hash(u.password_hash, 10); });

User.prototype.verificarPassword = function (p) { return bcrypt.compare(p, this.password_hash); };
User.prototype.estaBloqueado     = function ()  { return this.bloqueado_hasta && new Date() < new Date(this.bloqueado_hasta); };
User.prototype.tienePermiso      = function (p) { return (PERMISOS[this.rol] || []).includes(p); };

module.exports = { User, ROLES, PERMISOS };
