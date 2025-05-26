import { DataTypes } from "sequelize";
import { bd } from "../database/database.js";
import { tipoDeCamion } from "./tipoDeCamion.js";
import { usuario } from "./usuarios.js";
import { precioCargaAgua } from "./precioCargaAgua.js"; // Importar el modelo de precios

export const cargaAgua = bd.define('cargas_agua', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pagado', 'deuda'),
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipoCamionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  costo: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Por defecto, la carga está activa
    allowNull: false
  }
});

// Relaciones
tipoDeCamion.hasMany(cargaAgua, { foreignKey: 'tipoCamionId', sourceKey: 'id' });
cargaAgua.belongsTo(tipoDeCamion, { foreignKey: 'tipoCamionId', sourceKey: 'id' });

usuario.hasMany(cargaAgua, { foreignKey: 'usuarioId', sourceKey: 'id' });
cargaAgua.belongsTo(usuario, { foreignKey: 'usuarioId', sourceKey: 'id' });

// Nueva relación entre cargaAgua y precioCargaAgua
precioCargaAgua.hasMany(cargaAgua, { foreignKey: 'precioId', sourceKey: 'id' });
cargaAgua.belongsTo(precioCargaAgua, { foreignKey: 'precioId', sourceKey: 'id' });

export default cargaAgua;
