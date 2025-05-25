import { precioCargaAgua } from "../models/precioCargaAgua.js";
import { usuario } from "../models/usuarios.js";
import { Op } from "sequelize";

// Obtener todos los precios
export const getPrecios = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === "true" ? {} : { activo: true };

    const precios = await precioCargaAgua.findAll({
      where,
      include: [
        {
          model: usuario,
          as: "usuarioCreacion",
          attributes: ["id", "nombre", "username"],
        },
        {
          model: usuario,
          as: "usuarioModificacion",
          attributes: ["id", "nombre", "username"],
        },
      ],
      order: [["fechaCreacion", "DESC"]],
    });

    res.status(200).json(precios);
  } catch (error) {
    console.error("Error al obtener los precios:", error);
    res.status(500).json({ message: "Error al obtener los precios" });
  }
};

// Obtener un precio por ID
export const getPrecioById = async (req, res) => {
  try {
    const { id } = req.params;
    const precio = await precioCargaAgua.findByPk(id, {
      include: [
        {
          model: usuario,
          as: "usuarioCreacion",
          attributes: ["id", "nombre", "username"],
        },
        {
          model: usuario,
          as: "usuarioModificacion",
          attributes: ["id", "nombre", "username"],
        },
      ],
    });

    if (!precio) {
      return res.status(404).json({ message: "Precio no encontrado" });
    }

    res.status(200).json(precio);
  } catch (error) {
    console.error("Error al obtener el precio:", error);
    res.status(500).json({ message: "Error al obtener el precio" });
  }
};

// Crear un nuevo precio
export const createPrecio = async (req, res) => {
  try {
    const { valor, descripcion, usuarioCreacionId } = req.body;

    // Validar que el usuario exista
    const usuarioExistente = await usuario.findByPk(usuarioCreacionId);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Desactivar otros precios activos
    await precioCargaAgua.update(
      { activo: false },
      {
        where: {
          activo: true,
        },
      }
    );

    // Crear el nuevo precio
    const nuevoPrecio = await precioCargaAgua.create({
      valor,
      descripcion,
      activo: true,
      fechaCreacion: new Date(),
      usuarioCreacionId,
    });

    res.status(201).json(nuevoPrecio);
  } catch (error) {
    console.error("Error al crear el precio:", error);
    res.status(500).json({ message: "Error al crear el precio" });
  }
};

// Actualizar un precio existente
export const updatePrecio = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, descripcion, activo, usuarioModificacionId } = req.body;

    const precioExistente = await precioCargaAgua.findByPk(id);
    if (!precioExistente) {
      return res.status(404).json({ message: "Precio no encontrado" });
    }

    // Validar que el usuario exista
    const usuarioExistente = await usuario.findByPk(usuarioModificacionId);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si se está activando este precio, desactivar otros precios activos diferentes
    if (activo && !precioExistente.activo) {
      await precioCargaAgua.update(
        { activo: false },
        {
          where: {
            activo: true,
            id: { [Op.ne]: id },
          },
        }
      );
    }

    // Actualizar el precio
    precioExistente.valor = valor !== undefined ? valor : precioExistente.valor;
    precioExistente.descripcion = descripcion !== undefined ? descripcion : precioExistente.descripcion;
    precioExistente.activo = activo !== undefined ? activo : precioExistente.activo;
    precioExistente.fechaModificacion = new Date();
    precioExistente.usuarioModificacionId = usuarioModificacionId;

    await precioExistente.save();

    res.status(200).json(precioExistente);
  } catch (error) {
    console.error("Error al actualizar el precio:", error);
    res.status(500).json({ message: "Error al actualizar el precio" });
  }
};

// Eliminar un precio (soft delete)
export const deletePrecio = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioModificacionId } = req.body;

    const precioExistente = await precioCargaAgua.findByPk(id);
    if (!precioExistente) {
      return res.status(404).json({ message: "Precio no encontrado" });
    }

    // Validar que el usuario exista
    const usuarioExistente = await usuario.findByPk(usuarioModificacionId);
    if (!usuarioExistente) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Soft delete - marcar como inactivo
    precioExistente.activo = false;
    precioExistente.fechaModificacion = new Date();
    precioExistente.usuarioModificacionId = usuarioModificacionId;
    await precioExistente.save();

    res.status(200).json({ message: "Precio desactivado exitosamente" });
  } catch (error) {
    console.error("Error al desactivar el precio:", error);
    res.status(500).json({ message: "Error al desactivar el precio" });
  }
};
