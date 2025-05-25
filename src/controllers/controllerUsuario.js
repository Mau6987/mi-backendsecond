import { usuario as Usuario } from "../models/usuarios.js";
import { cargaAgua } from "../models/cargaAgua.js";
import { pagoCargaAgua } from "../models/pagodeCargaAgua.js";
import bcrypt from "bcryptjs";

// Obtener todos los usuarios (solo activos por defecto)
export const getUsuarios = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === "true" ? {} : { activo: true };

    const usuarios = await Usuario.findAll({ where });
    res.status(200).json(
      usuarios.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        correo: usuario.correo,
        ci: usuario.ci,
        rol: usuario.rol,
        numeroTarjetaRFID: usuario.numeroTarjetaRFID,
        propietarioId: usuario.propietarioId,
        activo: usuario.activo,
        bloqueado: usuario.bloqueado,
        motivoBloqueo: usuario.motivoBloqueo,
        fechaBloqueo: usuario.fechaBloqueo,
      }))
    );
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
};

// Obtener un usuario por ID
export const getUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const unUsuario = await Usuario.findByPk(id);

    if (!unUsuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      id: unUsuario.id,
      nombre: unUsuario.nombre,
      username: unUsuario.username,
      correo: unUsuario.correo,
      ci: unUsuario.ci,
      rol: unUsuario.rol,
      numeroTarjetaRFID: unUsuario.numeroTarjetaRFID,
      propietarioId: unUsuario.propietarioId,
      activo: unUsuario.activo,
      bloqueado: unUsuario.bloqueado,
      motivoBloqueo: unUsuario.motivoBloqueo,
      fechaBloqueo: unUsuario.fechaBloqueo,
    });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ message: "Error al obtener el usuario" });
  }
};

// Crear un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, ci, username, password, rol, numeroTarjetaRFID, propietarioId, bloqueado, motivoBloqueo } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      correo,
      ci,
      username,
      password: hashedPassword,
      rol,
      numeroTarjetaRFID,
      propietarioId: rol === "conductor" ? propietarioId : null,
      activo: true,
      bloqueado: bloqueado || false,
      motivoBloqueo,
      fechaBloqueo: bloqueado ? new Date() : null,
    });

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res.status(500).json({ message: "Error al crear el usuario" });
  }
};

// Actualizar un usuario existente
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, ci, username, password, rol, numeroTarjetaRFID, propietarioId, bloqueado, motivoBloqueo } = req.body;

    const usuarioExistente = await Usuario.findByPk(id);

    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    usuarioExistente.nombre = nombre;
    usuarioExistente.username = username;
    usuarioExistente.correo = correo;
    usuarioExistente.ci = ci;
    usuarioExistente.numeroTarjetaRFID = numeroTarjetaRFID;

    if (password) {
      usuarioExistente.password = await bcrypt.hash(password, 10);
    }

    usuarioExistente.rol = rol;
    usuarioExistente.propietarioId = rol === "conductor" ? propietarioId : null;

    // Actualizar estado de bloqueo solo si no es administrador
    if (bloqueado !== undefined && usuarioExistente.bloqueado !== bloqueado) {
      if (usuarioExistente.rol === "admin" && bloqueado) {
        return res.status(403).json({ message: "No se puede bloquear a un administrador" });
      }

      usuarioExistente.bloqueado = bloqueado;
      if (bloqueado) {
        usuarioExistente.motivoBloqueo = motivoBloqueo || "No especificado";
        usuarioExistente.fechaBloqueo = new Date();
      } else {
        usuarioExistente.motivoBloqueo = null;
        usuarioExistente.fechaBloqueo = null;
      }
    }

    await usuarioExistente.save();
    res.status(200).json(usuarioExistente);
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({ message: "Error al actualizar el usuario" });
  }
};

// Eliminar un usuario (soft delete)
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioExistente = await Usuario.findByPk(id);

    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Soft delete - marcar como inactivo
    usuarioExistente.activo = false;
    await usuarioExistente.save();

    // Desactivar cargas y pagos relacionados
    await actualizarEstadoRelacionados(id, false);

    res.status(200).json({ message: "Usuario desactivado exitosamente" });
  } catch (error) {
    console.error("Error al desactivar el usuario:", error);
    res.status(500).json({ message: "Error al desactivar el usuario" });
  }
};

// Función para actualizar el estado de cargas y pagos relacionados
async function actualizarEstadoRelacionados(usuarioId, activo) {
  try {
    // Actualizar cargas de agua
    await cargaAgua.update({ activo }, { where: { usuarioId } });

    // Actualizar pagos
    await pagoCargaAgua.update({ activo }, { where: { usuarioId } });

    // Si el usuario es propietario, actualizar también a sus conductores
    const conductores = await Usuario.findAll({
      where: { propietarioId: usuarioId },
    });

    for (const conductor of conductores) {
      await Usuario.update({ activo }, { where: { id: conductor.id } });

      // Actualizar cargas y pagos de los conductores
      await cargaAgua.update({ activo }, { where: { usuarioId: conductor.id } });
      await pagoCargaAgua.update({ activo }, { where: { usuarioId: conductor.id } });
    }
  } catch (error) {
    console.error("Error al actualizar entidades relacionadas:", error);
    throw error;
  }
}

// Verificar la existencia de una tarjeta RFID
export const verificarTarjeta = async (req, res) => {
  try {
    const { numeroTarjetaRFID } = req.body;

    const usuarioExistente = await Usuario.findOne({
      where: { numeroTarjetaRFID },
    });

    if (usuarioExistente) {
      return res.status(200).json({ valida: false, message: "Número de tarjeta RFID ya existe" });
    }

    res.status(200).json({ valida: true, message: "Número de tarjeta RFID es válido" });
  } catch (error) {
    console.error("Error al verificar el número de tarjeta RFID:", error);
    res.status(500).json({ message: "Error al verificar el número de tarjeta RFID" });
  }
};

// Obtener usuarios bloqueados
export const getUsuariosBloqueados = async (req, res) => {
  try {
    const usuariosBloqueados = await Usuario.findAll({
      where: {
        bloqueado: true,
        activo: true,
      },
    });

    res.status(200).json(usuariosBloqueados);
  } catch (error) {
    console.error("Error al obtener usuarios bloqueados:", error);
    res.status(500).json({ message: "Error al obtener usuarios bloqueados" });
  }
};

// Obtener usuarios inactivos
export const getUsuariosInactivos = async (req, res) => {
  try {
    const usuariosInactivos = await Usuario.findAll({
      where: { activo: false },
    });

    res.status(200).json(usuariosInactivos);
  } catch (error) {
    console.error("Error al obtener usuarios inactivos:", error);
    res.status(500).json({ message: "Error al obtener usuarios inactivos" });
  }
};

// Bloquear un usuario
export const bloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoBloqueo } = req.body;

    if (!motivoBloqueo) {
      return res.status(400).json({ message: "El motivo de bloqueo es requerido" });
    }

    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar que el usuario no sea administrador
    if (usuarioExistente.rol === "admin") {
      return res.status(403).json({ message: "No se puede bloquear a un administrador" });
    }

    if (usuarioExistente.bloqueado) {
      return res.status(400).json({ message: "El usuario ya está bloqueado" });
    }

    usuarioExistente.bloqueado = true;
    usuarioExistente.motivoBloqueo = motivoBloqueo;
    usuarioExistente.fechaBloqueo = new Date();

    await usuarioExistente.save();

    res.status(200).json({
      message: "Usuario bloqueado exitosamente",
      usuario: {
        id: usuarioExistente.id,
        nombre: usuarioExistente.nombre,
        bloqueado: usuarioExistente.bloqueado,
        motivoBloqueo: usuarioExistente.motivoBloqueo,
        fechaBloqueo: usuarioExistente.fechaBloqueo,
      },
    });
  } catch (error) {
    console.error("Error al bloquear el usuario:", error);
    res.status(500).json({ message: "Error al bloquear el usuario" });
  }
};

// Desbloquear un usuario
export const desbloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!usuarioExistente.bloqueado) {
      return res.status(400).json({ message: "El usuario no está bloqueado" });
    }

    usuarioExistente.bloqueado = false;
    usuarioExistente.motivoBloqueo = null;
    usuarioExistente.fechaBloqueo = null;

    await usuarioExistente.save();

    res.status(200).json({
      message: "Usuario desbloqueado exitosamente",
      usuario: {
        id: usuarioExistente.id,
        nombre: usuarioExistente.nombre,
        bloqueado: usuarioExistente.bloqueado,
      },
    });
  } catch (error) {
    console.error("Error al desbloquear el usuario:", error);
    res.status(500).json({ message: "Error al desbloquear el usuario" });
  }
};

// Verificar si un usuario está bloqueado
export const verificarBloqueo = async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      bloqueado: usuarioExistente.bloqueado,
      motivoBloqueo: usuarioExistente.motivoBloqueo,
      fechaBloqueo: usuarioExistente.fechaBloqueo,
    });
  } catch (error) {
    console.error("Error al verificar el bloqueo del usuario:", error);
    res.status(500).json({ message: "Error al verificar el bloqueo del usuario" });
  }
};
