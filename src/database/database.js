import { Sequelize } from "sequelize";

// Seleccionar la URL de conexión según el entorno
const isRender = process.env.RENDER || false;
const DATABASE_URL = isRender
  ? "postgresql://sistemapinos_user:OSzfOUkXaCKLRw4wu82TIacOyG7sm4vp@dpg-cu4827tumphs738518sg-a/sistemapinos" // Internal URL
  : "postgresql://sistemapinos_user:OSzfOUkXaCKLRw4wu82TIacOyG7sm4vp@dpg-cu4827tumphs738518sg-a.oregon-postgres.render.com/sistemapinos"; // External URL

// Configurar la conexión a la base de datos
export const bd = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true, // Requerir SSL
      rejectUnauthorized: false, // Permitir certificados no autorizados (Render usa esto por defecto)
    },
  },
  logging: false, // Desactiva logs de Sequelize (opcional)
});
