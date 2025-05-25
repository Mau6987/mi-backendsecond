import { tipoDeCamion } from './src/models/tipoDeCamion.js';  // Asegúrate de que la ruta sea correcta

const tiposCamion = [
    { descripcion: "Camión Cisterna Pequeño", cantidadDeAgua: 5000 },
    { descripcion: "Camión Cisterna Mediano", cantidadDeAgua: 10000 },
    { descripcion: "Camión Cisterna Grande", cantidadDeAgua: 20000 },
    { descripcion: "Camión Cisterna Extra Grande", cantidadDeAgua: 30000 },
];

async function crearTiposCamion() {
    try {
        for (const tipo of tiposCamion) {
            await tipoDeCamion.create(tipo);
        }
        console.log('🚛 Tipos de camión creados exitosamente');
    } catch (error) {
        console.error('❌ Error creando tipos de camión:', error);
    }
}

crearTiposCamion();
