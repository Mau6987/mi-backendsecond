import app from "./app.js";
import { bd } from "./database/database.js";

let isConnected = false;

async function connectDB() {
    if (!isConnected) {
        try {
            await bd.authenticate(); // Solo autenticamos la conexión
            console.log("✅ Base de datos conectada correctamente");
            isConnected = true;
        } catch (error) {
            console.error("❌ Error al conectar con la base de datos:", error);
        }
    }
}

const PORT = 3000; // Puerto definido directamente

connectDB().then(async () => {
    await bd.sync(); // Sincronizamos modelos con la base de datos
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
});
