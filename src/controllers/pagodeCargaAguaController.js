import { pagoCargaAgua } from "../models/pagodeCargaAgua.js"
import { cargaAgua } from "../models/cargaAgua.js"
import { usuario } from "../models/usuarios.js"
import { tipoDeCamion } from "../models/tipoDeCamion.js"
import { Op } from "sequelize"
// Ejemplo para getPagosCargaAgua



export const getPagosCargaAgua = async (req, res) => {
  try {
    // Traer todos los pagos con usuario
    const pagos = await pagoCargaAgua.findAll({
      include: {
        model: usuario,
        as: 'usuario',
        attributes: ['id', 'username', 'nombre', 'correo', 'ci', 'activo', 'bloqueado']
      }
    });

    // Para cada pago, buscar cargas según cargaAguaIds
    const pagosConCargas = await Promise.all(
      pagos.map(async pago => {
        const cargas = await cargaAgua.findAll({
          where: {
            id: pago.cargaAguaIds  // Array de IDs para filtrar
          },
          attributes: ['id', 'fechaHora', 'estado', 'usuarioId', 'tipoCamionId', 'costo', 'activo']
        });

        // Devolver objeto con cargas en el campo cargas
        return {
          ...pago.toJSON(),
          cargas
        };
      })
    );

    res.json(pagosConCargas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo pagos con cargas' });
  }
};
export const getPagoCargaAguaById = async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await pagoCargaAgua.findByPk(id, {
      include: {
        model: usuario,
        as: 'usuario',
        attributes: ['id', 'username', 'nombre', 'correo', 'ci', 'activo', 'bloqueado']
      }
    });

    if (!pago) return res.status(404).json({ message: 'Pago no encontrado' });

    const cargas = await cargaAgua.findAll({
      where: {
        id: pago.cargaAguaIds
      },
      attributes: ['id', 'fechaHora', 'estado', 'usuarioId', 'tipoCamionId', 'costo', 'activo']
    });

    res.json({
      ...pago.toJSON(),
      cargas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo pago con cargas' });
  }
};



export const createPagoCargaAgua2 = async (req, res) => {
  const { usuarioId, monto, numeroCargas } = req.body

  try {
    // Verificar si el usuario está activo y no bloqueado
    const user = await usuario.findByPk(usuarioId)
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    if (!user.activo) {
      return res.status(400).json({ message: "No se puede crear pago para un usuario inactivo" })
    }

    if (user.bloqueado) {
      return res.status(400).json({ message: "Usuario bloqueado. No puede realizar pagos" })
    }

    // Obtener las cargas de agua más antiguas en estado "deuda" del usuario
    const cargas = await cargaAgua.findAll({
      where: {
        usuarioId,
        estado: "deuda",
        activo: true,
      },
      order: [["fechaHora", "ASC"]], // Ordenar por fecha ascendente para pagar las más antiguas primero
      limit: numeroCargas, // Limitar al número de cargas que se desean pagar
    })

    // Verificar si hay suficientes cargas para pagar
    if (cargas.length < numeroCargas) {
      return res.status(400).json({
        message: `No hay suficientes cargas de agua en deuda. Se encontraron solo ${cargas.length}.`,
      })
    }

    // Calcular el monto total sumando los costos de las cargas seleccionadas
    const montoCalculado = cargas.reduce((total, carga) => total + carga.costo, 0)

    // Verificar que el monto proporcionado coincida con la suma de los costos de las cargas seleccionadas
    if (monto !== montoCalculado) {
      return res.status(400).json({
        message: `El monto enviado (${monto}) no coincide con el monto total de las cargas seleccionadas (${montoCalculado}).`,
      })
    }

    // Crear el nuevo pago de carga de agua
    const nuevoPagoCargaAgua = await pagoCargaAgua.create({
      usuarioId,
      monto,
      fechaHora: new Date(),
      cargaAguaIds: cargas.map((carga) => carga.id),
      activo: true,
    })

    // Asociar las cargas pagadas al pago y actualizar su estado a "pagado"
    await Promise.all(
      cargas.map(async (carga) => {
        await carga.update({ estado: "pagado" })
        await nuevoPagoCargaAgua.addCarga(carga)
      }),
    )

    res.status(201).json({
      message: "Pago registrado correctamente",
      pago: nuevoPagoCargaAgua,
      cargasPagadas: cargas,
    })
  } catch (error) {
    console.error("Error al crear el pago de carga de agua", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

export const createPagoCargaAgua = async (req, res) => {
  const { usuarioId, monto, cargaAguaIds } = req.body

  try {
    // Verificar si el usuario está activo y no bloqueado
    const user = await usuario.findByPk(usuarioId)
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    if (!user.activo) {
      return res.status(400).json({ message: "No se puede crear pago para un usuario inactivo" })
    }

    if (user.bloqueado) {
      return res.status(400).json({ message: "Usuario bloqueado. No puede realizar pagos" })
    }

    // Verificar que todas las cargas de agua estén en estado "deuda" y activas
    const cargas = await cargaAgua.findAll({
      where: {
        id: cargaAguaIds,
        estado: "deuda",
        activo: true,
      },
    })

    if (cargas.length !== cargaAguaIds.length) {
      return res
        .status(400)
        .json({ message: "Algunas cargas de agua no están en estado de deuda, no están activas o no existen" })
    }

    // Crear el nuevo pago de carga de agua con el monto proporcionado por el usuario
    const nuevoPagoCargaAgua = await pagoCargaAgua.create({
      usuarioId,
      monto, // Se usa el monto enviado en el request sin calcularlo
      fechaHora: new Date(),
      cargaAguaIds,
      activo: true,
    })

    // Actualizar el estado de las cargas de agua a "pagado"
    await cargaAgua.update(
      { estado: "pagado" },
      {
        where: { id: cargaAguaIds },
      },
    )

    res.status(201).json(nuevoPagoCargaAgua)
  } catch (error) {
    console.error("Error al crear el pago de carga de agua", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Actualizar un pago de carga de agua existente
export const updatePagoCargaAgua = async (req, res) => {
  try {
    const { id } = req.params
    const { usuarioId, monto, cargaAguaIds, activo } = req.body
    const pagoCargaAguaExistente = await pagoCargaAgua.findByPk(id, {
      include: [{ model: cargaAgua, as: "cargas" }],
    })

    if (!pagoCargaAguaExistente) {
      return res.status(404).json({ message: "Pago de carga de agua no encontrado" })
    }

    // Si se está cambiando el usuario, verificar que esté activo y no bloqueado
    if (usuarioId && usuarioId !== pagoCargaAguaExistente.usuarioId) {
      const user = await usuario.findByPk(usuarioId)
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" })
      }

      if (!user.activo) {
        return res.status(400).json({ message: "No se puede asignar pago a un usuario inactivo" })
      }

      if (user.bloqueado) {
        return res.status(400).json({ message: "Usuario bloqueado. No puede tener pagos" })
      }
    }

    // Obtener las IDs de las cargas de agua actualmente asociadas al pago
    const cargasActualesIds = pagoCargaAguaExistente.cargas.map((carga) => carga.id)

    // Si se están cambiando las cargas
    if (cargaAguaIds) {
      // Determinar las cargas que han sido eliminadas del pago
      const cargasEliminadasIds = cargasActualesIds.filter((id) => !cargaAguaIds.includes(id))

      // Determinar las nuevas cargas que han sido añadidas al pago
      const nuevasCargasIds = cargaAguaIds.filter((id) => !cargasActualesIds.includes(id))

      // Actualizar el estado de las cargas eliminadas a "deuda"
      if (cargasEliminadasIds.length > 0) {
        await cargaAgua.update(
          { estado: "deuda" },
          {
            where: { id: cargasEliminadasIds },
          },
        )
      }

      // Actualizar el estado de las nuevas cargas añadidas a "pagado"
      if (nuevasCargasIds.length > 0) {
        await cargaAgua.update(
          { estado: "pagado" },
          {
            where: { id: nuevasCargasIds },
          },
        )
      }

      pagoCargaAguaExistente.cargaAguaIds = cargaAguaIds
    }

    // Actualizar los datos del pago
    if (usuarioId !== undefined) pagoCargaAguaExistente.usuarioId = usuarioId
    if (monto !== undefined) pagoCargaAguaExistente.monto = monto
    if (activo !== undefined) pagoCargaAguaExistente.activo = activo

    await pagoCargaAguaExistente.save()

    res.status(200).json(pagoCargaAguaExistente)
  } catch (error) {
    console.error("Error al actualizar el pago de carga de agua", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}
export const deletePagoCargaAgua = async (req, res) => {
  try {
    const { id } = req.params;
    const pagoCargaAguaExistente = await pagoCargaAgua.findByPk(id);

    if (!pagoCargaAguaExistente) {
      return res.status(404).json({ message: "Pago de carga de agua no encontrado" });
    }

    // Usar directamente cargaAguaIds del modelo
    const cargaIds = pagoCargaAguaExistente.cargaAguaIds;
    console.log("Cargas a actualizar:", cargaIds);

    // Actualizar el estado de las cargas de agua a "deuda"
    const [updatedCount] = await cargaAgua.update(
      { estado: "deuda" },
      {
        where: { 
          id: cargaIds,
          activo: true // Asegurar que solo actualices cargas activas
        },
      }
    );

    console.log("Cargas actualizadas:", updatedCount);

    // Soft delete - marcar como inactivo
    pagoCargaAguaExistente.activo = false;
    await pagoCargaAguaExistente.save();

    res.status(200).json({
      message: "Pago de carga de agua desactivado exitosamente y cargas actualizadas a deuda",
      cargasActualizadas: updatedCount
    });
  } catch (error) {
    console.error("Error al desactivar el pago de carga de agua", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}


// Controlador para obtener usuarios por rol
export const getUsuariosPorRol = async (req, res) => {
  try {
    const { rol } = req.params
    const usuarios = await usuario.findAll({
      where: {
        rol: rol,
        activo: true,
      },
      attributes: ["id", "username", "rol"],
    })
    res.status(200).json(usuarios)
  } catch (error) {
    console.error("Error al obtener usuarios por rol:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

export const getUsuariosPropietariosConductores = async (req, res) => {
  try {
    const usuarios = await usuario.findAll({
      where: {
        rol: ["propietario", "conductor"],
        activo: true,
      },
    })
    res.status(200).json(usuarios)
  } catch (error) {
    console.error("Error al obtener los usuarios:", error)
    res.status(500).json({ message: "Error al obtener los usuarios" })
  }
}

// Obtener todas las cargas de agua con deuda para un propietario y sus conductores
export const getCargasDePropietarioDeuda = async (req, res) => {
  try {
    const { id } = req.params

    // Obtener todos los conductores asociados al propietario
    const conductores = await usuario.findAll({
      where: {
        propietarioId: id,
        activo: true,
        bloqueado: false,
      },
      attributes: ["id"],
    })

    // Extraer los IDs de los conductores
    const conductorIds = conductores.map((conductor) => conductor.id)

    // Incluir también el ID del propietario para obtener sus cargas si aplica
    conductorIds.push(Number.parseInt(id))

    // Obtener las cargas de los conductores asociados al propietario y del propietario
    const cargas = await cargaAgua.findAll({
      where: {
        usuarioId: conductorIds,
        estado: "deuda",
        activo: true,
      },
      include: [
        {
          model: usuario,
          as: "usuario",
          where: {
            activo: true,
            bloqueado: false,
          },
        },
        tiposDeCamion,
      ],
    })

    res.json(cargas)
  } catch (error) {
    console.error("Error al obtener las cargas de agua:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Obtener todas las cargas de agua con deuda para un conductor
export const getCargasDeConductorDeuda = async (req, res) => {
  try {
    const { id } = req.params

    // Obtener las cargas de agua en estado de deuda para el conductor
    const cargas = await cargaAgua.findAll({
      where: {
        usuarioId: id,
        estado: "deuda",
        activo: true,
      },
      include: [
        {
          model: usuario,
          as: "usuario",
          where: {
            activo: true,
            bloqueado: false,
          },
        },
        tipoDeCamion,
      ],
    })

    res.json(cargas)
  } catch (error) {
    console.error("Error al obtener las cargas de agua del conductor:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

export const getPagosDeUsuario = async (req, res) => {
  const { id } = req.params
  try {
    const pagos = await pagoCargaAgua.findAll({
      where: {
        usuarioId: id,
        activo: true,
      },
      include: [
        {
          model: cargaAgua,
          as: "cargas",
          where: { activo: true },
        },
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "username", "nombre", "correo", "activo", "bloqueado"],
        },
      ],
    })
    res.status(200).json(pagos)
  } catch (error) {
    console.error("Error al obtener los pagos del usuario:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

export const registrarCargaPorRFID = async (req, res) => {
  const { numeroTarjetaRFID } = req.body

  if (!numeroTarjetaRFID) {
    return res.status(400).json({ message: "Número de tarjeta RFID es requerido" })
  }

  try {
    const user = await usuario.findOne({
      where: {
        numeroTarjetaRFID,
        activo: true,
        bloqueado: false,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado, inactivo o bloqueado con el número de tarjeta RFID proporcionado",
      })
    }

    const nuevaCarga = await cargaAgua.create({
      fechaHora: new Date(),
      estado: "deuda",
      usuarioId: user.id,
      tipoCamionId: 1,
      costo: 30,
      activo: true,
    })

    res.status(201).json(nuevaCarga)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al registrar la carga de agua" })
  }
}

// Ruta: GET /api/pagos
export const getPagosPorParametros = async (req, res) => {
  const { fechaInicio, fechaFin, activo } = req.body

  try {
    const whereClause = {}

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    }

    if (activo !== undefined) {
      whereClause.activo = activo
    } else {
      whereClause.activo = true // Por defecto solo pagos activos
    }

    const pagos = await pagoCargaAgua.findAll({
      where: whereClause,
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "username", "nombre", "correo", "activo", "bloqueado"],
        },
        {
          model: cargaAgua,
          as: "cargas",
          include: [tiposDeCamion],
        },
      ],
    })

    res.status(200).json(pagos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener los pagos" })
  }
}

export const getPagosPorParametros2 = async (req, res) => {
  const { usuarioId, fechaInicio, fechaFin, conductoresIds, activo } = req.body
  const ids = conductoresIds || []
  if (usuarioId) {
    ids.push(usuarioId) // Asegura que el usuarioId siempre está incluido
  }

  try {
    const whereClause = {}

    if (ids.length > 0) {
      whereClause.usuarioId = { [Op.in]: ids }
    }

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    }

    if (activo !== undefined) {
      whereClause.activo = activo
    } else {
      whereClause.activo = true // Por defecto solo pagos activos
    }

    const pagos = await pagoCargaAgua.findAll({
      where: whereClause,
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["id", "username", "nombre", "correo", "activo", "bloqueado"],
        },
        {
          model: cargaAgua,
          as: "cargas",
          include: [tipoDeCamion],
        },
      ],
    })

    res.status(200).json(pagos)
  } catch (error) {
    console.error("Error al obtener los pagos", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Activar/Desactivar pago
export const toggleActivoPago = async (req, res) => {
  try {
    const { id } = req.params
    const { activo } = req.body

    const pagoExistente = await pagoCargaAgua.findByPk(id, {
      include: [{ model: cargaAgua, as: "cargas" }],
    })

    if (!pagoExistente) {
      return res.status(404).json({ message: "Pago no encontrado" })
    }

    pagoExistente.activo = activo
    await pagoExistente.save()

    // Si se está desactivando el pago, actualizar las cargas a estado "deuda"
    if (!activo) {
      const cargaIds = pagoExistente.cargas.map((carga) => carga.id)
      await cargaAgua.update(
        { estado: "deuda" },
        {
          where: { id: cargaIds },
        },
      )
    }

    res.status(200).json({
      message: activo ? "Pago activado exitosamente" : "Pago desactivado exitosamente",
      pago: pagoExistente,
    })
  } catch (error) {
    console.error("Error al cambiar estado activo del pago:", error)
    res.status(500).json({ message: "Error al cambiar estado activo del pago" })
  }
}
