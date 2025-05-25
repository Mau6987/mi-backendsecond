import { Sequelize } from 'sequelize';

// Determinar si estamos en Render u otro entorno
const isRender = process.env.RENDER || false;

// URLs de conexión
const DATABASE_URL = isRender
  ? "postgresql://sistemapinosbf_user:7ttbd8mRU7NOGG9B8337vnj2DrByM7Av@dpg-d0i0k86mcj7s739j2q30-a/sistemapinosbf" // Internal URL (dentro de Render)
  : "postgresql://sistemapinosbf_user:7ttbd8mRU7NOGG9B8337vnj2DrByM7Av@dpg-d0i0k86mcj7s739j2q30-a.oregon-postgres.render.com/sistemapinosbf"; // External URL

// Evitar múltiples conexiones en entornos serverless
let sequelize;

if (!global.sequelize) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Permite certificados auto-firmados
      },
    },
    logging: false, // Desactiva logs SQL en producción
  });

  global.sequelize = sequelize;
} else {
  sequelize = global.sequelize;
}

// Verificar conexión
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión exitosa a la base de datos");
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error);
  }
})();

export { sequelize as bd };
