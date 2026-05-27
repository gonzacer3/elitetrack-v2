const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evidencia = sequelize.define('Evidencia', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  hito_id:     { type: DataTypes.INTEGER, allowNull: false },
  usuario_id:  { type: DataTypes.INTEGER, allowNull: false },
  nombre_archivo: { type: DataTypes.STRING, allowNull: false },
  ruta_archivo:   { type: DataTypes.STRING, allowNull: false },
  tamanio_bytes:  { type: DataTypes.INTEGER, allowNull: false },
  tipo_mime:      { type: DataTypes.STRING },
  estado:      { type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'), defaultValue: 'pendiente' },
  comentario:  { type: DataTypes.TEXT },
  revisado_por:{ type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'evidencias', timestamps: true });

module.exports = { Evidencia };
