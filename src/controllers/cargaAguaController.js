import { cargaAgua } from "../models/cargaAgua.js";
import { usuario } from "../models/usuarios.js";
import { tipoDeCamion } from "../models/tipoDeCamion.js";
import { precioCargaAgua } from "../models/precioCargaAgua.js";
import { Op } from "sequelize";

export const getCargasAgua = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === "true" ? {} : { activo: true };

    const cargas = await cargaAgua.findAll({
      where,
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "nombre", "username", "correo", "activo", "bloqueado"],
        },
        {
          model: tipoDeCamion,
          as: "tiposDeCamion",
        },
      ],
    });
    res.status(200).json(cargas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las cargas de agua" });
  }
};

export const getCargaAguaById = async (req, res) => {
  const { id } = req.params;
  try {
    const carga = await cargaAgua.findByPk(id, {
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "nombre", "username", "correo", "activo", "bloqueado"],
        },
        {
          model: tipoDeCamion,
          as: "tiposDeCamion",
        },
      ],
    });
    if (!carga) {
      res.status(404).json({ message: "Carga de agua no encontrada" });
    } else {
      res.status(200).json(carga);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la carga de agua" });
  }
};

export const createCargaAgua = async (req, res) => {
  const { fechaHora, estado, usuarioId, tipoCamionId } = req.body;
  try {
    // Verificar si el usuario está activo y no bloqueado
    const user = await usuario.findByPk(usuarioId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.activo) {
      return res.status(400).json({ message: "No se puede crear carga para un usuario inactivo" });
    }

    if (user.bloqueado) {
      return res.status(400).json({ message: "Usuario bloqueado. No puede realizar cargas de agua" });
    }

    // Obtener el último precio activo
    const precioActual = await precioCargaAgua.findOne({
      where: { activo: true },
      order: [["fechaCreacion", "DESC"]],
    });

    if (!precioActual) {
      return res.status(400).json({
        message: "No hay un precio activo disponible",
      });
    }

    const nuevaCarga = await cargaAgua.create({
      fechaHora,
      estado,
      usuarioId,
      tipoCamionId,
      costo: precioActual.valor, // Asignar el costo del precio activo
      activo: true,
    });
    res.status(201).json(nuevaCarga);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la carga de agua" });
  }
};

export const updateCargaAgua = async (req, res) => {
  const { id } = req.params;
  const { fechaHora, estado, usuarioId, tipoCamionId } = req.body;
  try {
    const carga = await cargaAgua.findByPk(id);
    if (!carga) {
      return res.status(404).json({ message: "Carga de agua no encontrada" });
    }

    // Obtener el último precio activo
    const precioActual = await precioCargaAgua.findOne({
      where: { activo: true },
      order: [["fechaCreacion", "DESC"]],
    });

    if (precioActual) {
      carga.costo = precioActual.valor; // Actualizar el costo con el nuevo precio
    }

    if (fechaHora !== undefined) carga.fechaHora = fechaHora;
    if (estado !== undefined) carga.estado = estado;
    if (usuarioId !== undefined) carga.usuarioId = usuarioId;
    if (tipoCamionId !== undefined) carga.tipoCamionId = tipoCamionId;

    await carga.save();
    res.status(200).json(carga);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la carga de agua" });
  }
};

export const deleteCargaAgua = async (req, res) => {
  const { id } = req.params;
  try {
    const carga = await cargaAgua.findByPk(id);
    if (!carga) {
      res.status(404).json({ message: "Carga de agua no encontrada" });
    } else {
      // Soft delete - marcar como inactivo
      carga.activo = false;
      await carga.save();
      res.status(200).json({ message: "Carga de agua desactivada correctamente" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desactivar la carga de agua" });
  }
};

// Resto de funciones (registrarCargaPorRFID, getCargasPorParametros, etc.) se mantienen igual

export const registrarCargaPorRFID = async (req, res) => {
  const { numeroTarjetaRFID, tipoCamionId = 1 } = req.body;

  if (!numeroTarjetaRFID) {
    return res.status(400).json({ message: "Número de tarjeta RFID es requerido" });
  }

  try {
    const user = await usuario.findOne({
      where: {
        numeroTarjetaRFID,
        activo: true,
        bloqueado: false,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado, inactivo o bloqueado con el número de tarjeta RFID proporcionado",
      });
    }

    const precioActual = await precioCargaAgua.findOne({
      where: { activo: true },
      order: [["fechaCreacion", "DESC"]],
    });

    if (!precioActual) {
      return res.status(404).json({ message: "No hay un precio activo disponible" });
    }

    const nuevaCarga = await cargaAgua.create({
      fechaHora: new Date(),
      estado: "deuda",
      usuarioId: user.id,
      tipoCamionId,
      costo: precioActual.valor,
      activo: true,
    });

    res.status(201).json(nuevaCarga);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar la carga de agua" });
  }
};


export const getCargasPorParametros = async (req, res) => {
  const { fechaInicio, fechaFin, estado, usuarioId, activo } = req.body;

  try {
    const whereClause = {};

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      };
    }

    if (estado) {
      whereClause.estado = estado;
    }

    if (usuarioId) {
      whereClause.usuarioId = usuarioId;
    }

    if (activo !== undefined) {
      whereClause.activo = activo;
    } else {
      whereClause.activo = true; // Por defecto solo cargas activas
    }

    const cargas = await cargaAgua.findAll({
      where: whereClause,
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "nombre", "username", "correo", "activo", "bloqueado"],
        },
        {
          model: tipoDeCamion,
          as: "tipoDeCamion",
        },
      ],
    });

    res.status(200).json(cargas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las cargas" });
  }
};

export const getCargasPorParametros2 = async (req, res) => {
  const { usuarioId, fechaInicio, fechaFin, estado, conductoresIds, activo } = req.body;
  const ids = conductoresIds || [];
  if (usuarioId) {
    ids.push(usuarioId); // Asegura que el usuarioId siempre está incluido
  }

  try {
    const whereClause = {};

    if (ids.length > 0) {
      whereClause.usuarioId = { [Op.in]: ids };
    }

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      };
    }

    if (estado) {
      whereClause.estado = estado;
    }

    if (activo !== undefined) {
      whereClause.activo = activo;
    } else {
      whereClause.activo = true; // Por defecto solo cargas activas
    }

    const cargas = await cargaAgua.findAll({
      where: whereClause,
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "username", "nombre", "correo", "activo", "bloqueado"],
        },
      ],
    });

    res.status(200).json(cargas);
  } catch (error) {
    console.error("Error al obtener las cargas de agua:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Activar/Desactivar carga de agua
export const toggleActivoCargaAgua = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const cargaExistente = await cargaAgua.findByPk(id);

    if (!cargaExistente) {
      return res.status(404).json({ message: "Carga de agua no encontrada" });
    }

    cargaExistente.activo = activo;
    await cargaExistente.save();

    res.status(200).json({
      message: activo ? "Carga de agua activada exitosamente" : "Carga de agua desactivada exitosamente",
      carga: cargaExistente,
    });
  } catch (error) {
    console.error("Error al cambiar estado activo de la carga de agua:", error);
    res.status(500).json({ message: "Error al cambiar estado activo de la carga de agua" });
  }
};
