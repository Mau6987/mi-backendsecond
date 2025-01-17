import { DataTypes } from "sequelize";
import { bd } from "../database/database.js";
import { tipoDeCamion } from "./tipoDeCamion.js";
import { usuario } from "./usuarios.js";

export const cargaAgua = bd.define('cargas_agua',{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fechaHora: { type: DataTypes.DATE, allowNull: false },
    estado: { type: DataTypes.ENUM('pagado', 'deuda'), allowNull: false },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    tipoCamionId: { type: DataTypes.INTEGER, allowNull: false } // Clave foránea para el tipo de camión
});

tipoDeCamion.hasMany(cargaAgua, { foreignKey: 'tipoCamionId', sourceKey: 'id' });
cargaAgua.belongsTo(tipoDeCamion, { foreignKey: 'tipoCamionId', sourceKey: 'id' });

usuario.hasMany(cargaAgua, { foreignKey: 'usuarioId', sourceKey: 'id' });
cargaAgua.belongsTo(usuario, { foreignKey: 'usuarioId', sourceKey: 'id' });