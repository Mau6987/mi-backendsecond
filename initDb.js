import { bd } from './src/database/database.js';
import './src/models/usuarios.js';
import './src/models/tipoDeCamion.js';
import './src/models/cargaAgua.js';
import './src/models/pagodeCargaAgua.js';

const initDb = async () => {
    try {
        await bd.sync({ force: true }); // Utiliza { force: true } con cuidado, ya que esto eliminará todas las tablas existentes
        console.log('✅ Base de datos sincronizada correctamente.');
    } catch (error) {
        console.error('❌ Error al sincronizar la base de datos:', error);
    }
};

initDb();
