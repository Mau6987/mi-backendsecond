import { DataTypes } from "sequelize";
import { bd } from "../database/database.js";

export const usuario = bd.define('usuarios', {
  id: {
    type: DataTypes.BIGINT,
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
    type: DataTypes.BIGINT,
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
    allowNull: true,
    unique: true,
  },
  propietarioId: {
    type: DataTypes.BIGINT,
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
  // Nuevos campos
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  // Nuevos campos para el bloqueo de usuarios
  bloqueado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  motivoBloqueo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fechaBloqueo: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

usuario.hasMany(usuario, { as: 'Conductores', foreignKey: 'propietarioId' });
usuario.belongsTo(usuario, { as: 'Propietario', foreignKey: 'propietarioId' });