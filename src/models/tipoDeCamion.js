import { DataTypes } from "sequelize";
import { bd } from "../database/database.js";

export const tipoDeCamion = bd.define('tiposDeCamion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cantidadDeAgua: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});