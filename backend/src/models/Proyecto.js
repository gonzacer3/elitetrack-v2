const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proyecto = sequelize.define('Proyecto', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:      { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  estado:      { type: DataTypes.ENUM('activo', 'pausado', 'cerrado'), defaultValue: 'activo' },
  cliente:     { type: DataTypes.STRING },
}, { tableName: 'proyectos', timestamps: true });

module.exports = { Proyecto };
