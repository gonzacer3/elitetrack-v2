const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hito = sequelize.define('Hito', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  proyecto_id:  { type: DataTypes.INTEGER, allowNull: false },
  nombre:       { type: DataTypes.STRING, allowNull: false },
  descripcion:  { type: DataTypes.TEXT },
  fecha_limite: { type: DataTypes.DATE, allowNull: false },
  estado:       { type: DataTypes.ENUM('pendiente', 'en_progreso', 'completado', 'vencido'), defaultValue: 'pendiente' },
  alerta_enviada: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'hitos', timestamps: true });

module.exports = { Hito };
