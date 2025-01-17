import { DataTypes } from 'sequelize';
import { bd } from "../database/database.js";

export const usuario = bd.define('usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    unique: true,
  },
  ci: {
    type: DataTypes.INTEGER,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'conductor', 'propietario'),
  },
  numeroTarjetaRFID: {
    type: DataTypes.STRING,
    unique: true,
  },
  propietarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id',
    }
  },
  token: {
    type: DataTypes.STRING,
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
  },
});

usuario.hasMany(usuario, { as: 'Conductores', foreignKey: 'propietarioId' });
usuario.belongsTo(usuario, { as: 'Propietario', foreignKey: 'propietarioId' });
