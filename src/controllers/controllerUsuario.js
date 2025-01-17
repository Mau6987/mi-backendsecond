import { usuario as Usuario } from "../models/usuarios.js";
import bcrypt from 'bcrypt';

// Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    const formatoUsuarios = usuarios.map((usuario) => {
      return {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        correo: usuario.correo,
        ci: usuario.ci,
        rol: usuario.rol,
        numeroTarjetaRFID: usuario.numeroTarjetaRFID,
        propietarioId: usuario.propietarioId
      };
    });
    res.status(200).json(formatoUsuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// Obtener un usuario por ID
export const getUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const unUsuario = await Usuario.findOne({ where: { id } });

    if (!unUsuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const formatoUsuario = {
      id: unUsuario.id,
      nombre: unUsuario.nombre,
      username: unUsuario.username,
      correo: unUsuario.correo,
      ci: unUsuario.ci,
      rol: unUsuario.rol,
      numeroTarjetaRFID: unUsuario.numeroTarjetaRFID,
      propietarioId: unUsuario.propietarioId
    };

    res.status(200).json(formatoUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};

// Crear un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, ci, username, password, rol, numeroTarjetaRFID, propietarioId } = req.body; 
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      correo,
      ci,
      username,
      password: hashedPassword,
      rol,
      numeroTarjetaRFID,
      propietarioId: rol === 'conductor' ? propietarioId : null
    });

    res.status(201).json(nuevoUsuario); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

// Actualizar un usuario existente
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params; 
    const { nombre, correo, ci, username, password, rol, numeroTarjetaRFID, propietarioId } = req.body; 

    const usuarioExistente = await Usuario.findByPk(id); 

    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuarioExistente.nombre = nombre;
    usuarioExistente.username = username;
    usuarioExistente.correo = correo;
    usuarioExistente.ci = ci;
    usuarioExistente.numeroTarjetaRFID = numeroTarjetaRFID;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      usuarioExistente.password = hashedPassword;
    }
    usuarioExistente.rol = rol;
    usuarioExistente.propietarioId = rol === 'conductor' ? propietarioId : null;

    await usuarioExistente.save(); 

    res.status(200).json(usuarioExistente); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

// Eliminar un usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    await usuarioExistente.destroy();
    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el usuario" });
  }
};
// Verificar la existencia de una tarjeta RFID
export const verificarTarjeta = async (req, res) => {
  try {
    const { numeroTarjetaRFID } = req.body;

    const usuarioExistente = await Usuario.findOne({ where: { numeroTarjetaRFID } });

    if (usuarioExistente) {
      return res.status(200).json({ valida: false, message: 'Número de tarjeta RFID ya existe' });
    }

    res.status(200).json({ valida: true, message: 'Número de tarjeta RFID es válido' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar el número de tarjeta RFID' });
  }
};