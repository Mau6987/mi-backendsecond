import { DataTypes } from "sequelize";
import { bd } from "../database/database.js";
import { cargaAgua } from "./cargaAgua.js";
import { usuario } from "./usuarios.js";

export const pagoCargaAgua = bd.define('pagos_carga_agua', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  cargaAguaIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false
  }
});

// Define las asociaciones
pagoCargaAgua.belongsTo(usuario, { foreignKey: 'usuarioId', as: 'usuario' });
usuario.hasMany(pagoCargaAgua, { foreignKey: 'usuarioId', as: 'pagos' });

pagoCargaAgua.belongsToMany(cargaAgua, {
  through: 'pago_carga_agua_cargas',
  foreignKey: 'pagoId',
  otherKey: 'cargaId',
  as: 'cargas'
});

cargaAgua.belongsToMany(pagoCargaAgua, {
  through: 'pago_carga_agua_cargas',
  foreignKey: 'cargaId',
  otherKey: 'pagoId',
  as: 'pagos'
});