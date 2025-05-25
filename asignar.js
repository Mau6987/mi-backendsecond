import { usuario } from './src/models/usuarios.js';  // Asegúrate de que la ruta sea correcta

const tarjetasRFID = [
  "0009046296",
  "0015592459",
  "0015590168",
  "0015613812",
  "0003690284",
  "0009722162"
];

async function asignarTarjetasRFID() {
  try {
    // Buscar todos los propietarios y conductores
    const usuarios = await usuario.findAll({
      where: { 
        rol: ['propietario', 'conductor']
      },
      order: [['id', 'ASC']] // Ordenar por ID para consistencia
    });

    // Asignar tarjetas RFID en el orden de la lista de tarjetas
    let asignaciones = [];
    usuarios.forEach(async (user, index) => {
      if (index < tarjetasRFID.length) {
        user.numeroTarjetaRFID = tarjetasRFID[index];
        await user.save();
        asignaciones.push({ nombre: user.nombre, tarjetaRFID: tarjetasRFID[index] });
      }
    });

    console.log('Tarjetas RFID asignadas correctamente');
    console.log('Asignaciones realizadas:');
    asignaciones.forEach(asign => console.log(`${asign.nombre} asignado tarjeta RFID: ${asign.tarjetaRFID}`));
  } catch (error) {
    console.error('Error asignando tarjetas RFID:', error);
  }
}

asignarTarjetasRFID();
