import { usuario } from './src/models/usuarios.js';  // Asegúrate de que la ruta sea correcta

const usuarios = [
    // Administradores
    { nombre: "Ana Torres", correo: "ana.torres@example.com", ci: 12345678, username: "anatorres", password: "admin123", rol: "admin" },
    { nombre: "Carlos Gómez", correo: "carlos.gomez@example.com", ci: 23456789, username: "carlosgomez", password: "admin123", rol: "admin" },
    { nombre: "Lucia Fernández", correo: "lucia.fernandez@example.com", ci: 34567890, username: "luciafernandez", password: "admin123", rol: "admin" },

    // Propietarios
    { nombre: "Mario Ruiz", correo: "mario.ruiz@example.com", ci: 45678901, username: "marioruiz", password: "prop123", rol: "propietario" },
    { nombre: "Julia Vidal", correo: "julia.vidal@example.com", ci: 56789012, username: "juliavidal", password: "prop123", rol: "propietario" },
    { nombre: "Pedro Marín", correo: "pedro.marin@example.com", ci: 67890123, username: "pedromarin", password: "prop123", rol: "propietario" },
];

// Conductores (asociados con propietarios)
const conductores = [
    { nombre: "Daniel Ortega", correo: "daniel.ortega@example.com", ci: 78901234, username: "danielortega", password: "con123", rol: "conductor" },
    { nombre: "Marta Saavedra", correo: "marta.saavedra@example.com", ci: 89012345, username: "martasaavedra", password: "con123", rol: "conductor" },
    { nombre: "Jorge Alonso", correo: "jorge.alonso@example.com", ci: 90123456, username: "jorgealonso", password: "con123", rol: "conductor" },
    { nombre: "Sofia Castro", correo: "sofia.castro@example.com", ci: 81234567, username: "sofiacastro", password: "con123", rol: "conductor" },
    { nombre: "Luis Pérez", correo: "luis.perez@example.com", ci: 82345678, username: "luisperez", password: "con123", rol: "conductor" },
    { nombre: "Eva Morales", correo: "eva.morales@example.com", ci: 83456789, username: "evamorales", password: "con123", rol: "conductor" },
    { nombre: "Ana Ribera", correo: "ana.ribera@example.com", ci: 84567890, username: "anaribera", password: "con123", rol: "conductor" },
];

async function crearUsuarios() {
    try {
        // Crear administradores y propietarios
        for (const user of usuarios) {
            await usuario.create(user);
        }

        // Obtener IDs de los propietarios para asociar conductores
        const propietarios = await usuario.findAll({
            where: { rol: 'propietario' },
            attributes: ['id']
        });

        // Crear conductores y asociar cada uno a un propietario
        for (let i = 0; i < conductores.length; i++) {
            conductores[i].propietarioId = propietarios[i % propietarios.length].id;
            await usuario.create(conductores[i]);
        }

        console.log('Usuarios creados exitosamente');
    } catch (error) {
        console.error('Error creando usuarios:', error);
    }
}

crearUsuarios();
