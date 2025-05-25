import { DataTypes } from "sequelize";
import { bd } from "../database/database.js";
import { usuario } from "./usuarios.js";

export const precioCargaAgua = bd.define("precios_carga_agua", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  fechaModificacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usuarioCreacionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuarioModificacionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Relaciones
precioCargaAgua.belongsTo(usuario, { foreignKey: "usuarioCreacionId", as: "usuarioCreacion" });
precioCargaAgua.belongsTo(usuario, { foreignKey: "usuarioModificacionId", as: "usuarioModificacion" });
