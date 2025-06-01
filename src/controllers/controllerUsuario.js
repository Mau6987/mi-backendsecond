import { usuario as Usuario } from "../models/usuarios.js"
import { cargaAgua } from "../models/cargaAgua.js"
import { pagoCargaAgua } from "../models/pagodeCargaAgua.js"
import bcrypt from "bcryptjs"
import { Op } from "sequelize"

// Función para manejar errores de validación de Sequelize
const handleSequelizeError = (error) => {
  const errors = {}

  if (error.name === "SequelizeValidationError") {
    error.errors.forEach((err) => {
      if (!errors[err.path]) {
        errors[err.path] = []
      }
      errors[err.path].push(err.message)
    })
  } else if (error.name === "SequelizeUniqueConstraintError") {
    error.errors.forEach((err) => {
      if (!errors[err.path]) {
        errors[err.path] = []
      }

      switch (err.path) {
        case "correo":
          errors[err.path].push("Este correo electrónico ya está registrado")
          break
        case "ci":
          errors[err.path].push("Esta cédula de identidad ya está registrada")
          break
        case "username":
          errors[err.path].push("Este nombre de usuario ya está en uso")
          break
        case "numeroTarjetaRFID":
          errors[err.path].push("Este número de tarjeta RFID ya está asignado")
          break
        default:
          errors[err.path].push("Este valor ya existe en el sistema")
      }
    })
  }

  return errors
}

// Función para validar datos del usuario
const validateUserData = (data, isUpdate = false) => {
  const errors = {}

  // Validar nombre
  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.nombre = ["El nombre debe tener al menos 2 caracteres"]
  } else if (data.nombre.length > 100) {
    errors.nombre = ["El nombre no puede exceder 100 caracteres"]
  }

  // Validar correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.correo || !emailRegex.test(data.correo)) {
    errors.correo = ["Ingrese un correo electrónico válido"]
  }

  // Validar CI
  if (!data.ci || data.ci.toString().length < 6) {
    errors.ci = ["La cédula debe tener al menos 6 dígitos"]
  } else if (!/^\d+$/.test(data.ci.toString())) {
    errors.ci = ["La cédula solo debe contener números"]
  }

  // Validar username
  if (!data.username || data.username.length < 3) {
    errors.username = ["El username debe tener al menos 3 caracteres"]
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = ["El username solo puede contener letras, números y guiones bajos"]
  }

  // Validar password (solo en creación o si se proporciona en actualización)
  if (!isUpdate || data.password) {
    if (!data.password || data.password.length < 8) {
      errors.password = ["La contraseña debe tener al menos 8 caracteres"]
    } else {
      const passwordErrors = []
      if (!/[a-zA-Z]/.test(data.password)) {
        passwordErrors.push("Debe contener al menos una letra")
      }
      if (!/[0-9]/.test(data.password)) {
        passwordErrors.push("Debe contener al menos un número")
      }
      if (!/[^a-zA-Z0-9]/.test(data.password)) {
        passwordErrors.push("Debe contener al menos un carácter especial")
      }
      if (passwordErrors.length > 0) {
        errors.password = passwordErrors
      }
    }
  }

  // Validar rol
  if (!data.rol || !["admin", "conductor", "propietario"].includes(data.rol)) {
    errors.rol = ["Seleccione un rol válido"]
  }

  // Validar propietarioId para conductores
  if (data.rol === "conductor" && !data.propietarioId) {
    errors.propietarioId = ["Debe seleccionar un propietario para el conductor"]
  }

  // Validar tarjeta RFID si se proporciona
  if (data.numeroTarjetaRFID && data.numeroTarjetaRFID.length < 8) {
    errors.numeroTarjetaRFID = ["El número de tarjeta RFID debe tener al menos 8 caracteres"]
  }

  return errors
}

// Obtener todos los usuarios (solo activos por defecto)
export const getUsuarios = async (req, res) => {
  try {
    const { includeInactive } = req.query
    const where = includeInactive === "true" ? {} : { activo: true }

    const usuarios = await Usuario.findAll({ where })
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
      })),
    )
  } catch (error) {
    console.error("Error al obtener los usuarios:", error)
    res.status(500).json({
      message: "Error al obtener los usuarios",
      errors: { general: ["Error interno del servidor"] },
    })
  }
}

// Obtener un usuario por ID
export const getUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const unUsuario = await Usuario.findByPk(id)

    if (!unUsuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        errors: { general: ["El usuario solicitado no existe"] },
      })
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
    })
  } catch (error) {
    console.error("Error al obtener el usuario:", error)
    res.status(500).json({
      message: "Error al obtener el usuario",
      errors: { general: ["Error interno del servidor"] },
    })
  }
}

// Crear un nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, ci, username, password, rol, numeroTarjetaRFID, propietarioId, bloqueado, motivoBloqueo } =
      req.body

    // Validar datos de entrada
    const validationErrors = validateUserData(req.body)
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Errores de validación",
        errors: validationErrors,
        success: false,
      })
    }

    // Verificar si el propietario existe (si es conductor)
    if (rol === "conductor" && propietarioId) {
      const propietarioExiste = await Usuario.findOne({
        where: { id: propietarioId, rol: "propietario", activo: true },
      })
      if (!propietarioExiste) {
        return res.status(400).json({
          message: "Propietario no válido",
          errors: { propietarioId: ["El propietario seleccionado no existe o no está activo"] },
          success: false,
        })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      ci: Number.parseInt(ci),
      username: username.trim(),
      password: hashedPassword,
      rol,
      numeroTarjetaRFID: numeroTarjetaRFID || null,
      propietarioId: rol === "conductor" ? propietarioId : null,
      activo: true,
      bloqueado: bloqueado || false,
      motivoBloqueo,
      fechaBloqueo: bloqueado ? new Date() : null,
    })

    // Remover la contraseña de la respuesta
    const { password: _, ...usuarioResponse } = nuevoUsuario.toJSON()

    res.status(201).json({
      message: "Usuario creado exitosamente",
      usuario: usuarioResponse,
      success: true,
    })
  } catch (error) {
    console.error("Error al crear el usuario:", error)

    const sequelizeErrors = handleSequelizeError(error)
    if (Object.keys(sequelizeErrors).length > 0) {
      return res.status(400).json({
        message: "Error de validación",
        errors: sequelizeErrors,
        success: false,
      })
    }

    res.status(500).json({
      message: "Error al crear el usuario",
      errors: { general: ["Error interno del servidor"] },
      success: false,
    })
  }
}

// Actualizar un usuario existente
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, correo, ci, username, password, rol, numeroTarjetaRFID, propietarioId, bloqueado, motivoBloqueo } =
      req.body

    const usuarioExistente = await Usuario.findByPk(id)

    if (!usuarioExistente) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        errors: { general: ["El usuario que intenta actualizar no existe"] },
        success: false,
      })
    }

    // Validar datos de entrada
    const validationErrors = validateUserData(req.body, true)
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Errores de validación",
        errors: validationErrors,
        success: false,
      })
    }

    // Verificar si el propietario existe (si es conductor)
    if (rol === "conductor" && propietarioId) {
      const propietarioExiste = await Usuario.findOne({
        where: { id: propietarioId, rol: "propietario", activo: true },
      })
      if (!propietarioExiste) {
        return res.status(400).json({
          message: "Propietario no válido",
          errors: { propietarioId: ["El propietario seleccionado no existe o no está activo"] },
          success: false,
        })
      }
    }

    // Verificar unicidad antes de actualizar
    const whereConditions = {
      id: { [Op.ne]: id }, // Excluir el usuario actual
    }

    // Verificar correo único
    if (correo && correo !== usuarioExistente.correo) {
      const correoExiste = await Usuario.findOne({
        where: { ...whereConditions, correo: correo.trim().toLowerCase() },
      })
      if (correoExiste) {
        return res.status(400).json({
          message: "Correo ya registrado",
          errors: { correo: ["Este correo electrónico ya está registrado"] },
          success: false,
        })
      }
    }

    // Verificar CI único
    if (ci && Number.parseInt(ci) !== usuarioExistente.ci) {
      const ciExiste = await Usuario.findOne({
        where: { ...whereConditions, ci: Number.parseInt(ci) },
      })
      if (ciExiste) {
        return res.status(400).json({
          message: "Cédula ya registrada",
          errors: { ci: ["Esta cédula de identidad ya está registrada"] },
          success: false,
        })
      }
    }

    // Verificar username único
    if (username && username !== usuarioExistente.username) {
      const usernameExiste = await Usuario.findOne({
        where: { ...whereConditions, username: username.trim() },
      })
      if (usernameExiste) {
        return res.status(400).json({
          message: "Username ya en uso",
          errors: { username: ["Este nombre de usuario ya está en uso"] },
          success: false,
        })
      }
    }

    // Verificar tarjeta RFID única
    if (numeroTarjetaRFID && numeroTarjetaRFID !== usuarioExistente.numeroTarjetaRFID) {
      const tarjetaExiste = await Usuario.findOne({
        where: { ...whereConditions, numeroTarjetaRFID },
      })
      if (tarjetaExiste) {
        return res.status(400).json({
          message: "Tarjeta RFID ya asignada",
          errors: { numeroTarjetaRFID: ["Este número de tarjeta RFID ya está asignado"] },
          success: false,
        })
      }
    }

    // Actualizar campos
    usuarioExistente.nombre = nombre?.trim() || usuarioExistente.nombre
    usuarioExistente.username = username?.trim() || usuarioExistente.username
    usuarioExistente.correo = correo?.trim().toLowerCase() || usuarioExistente.correo
    usuarioExistente.ci = ci ? Number.parseInt(ci) : usuarioExistente.ci
    usuarioExistente.numeroTarjetaRFID = numeroTarjetaRFID || usuarioExistente.numeroTarjetaRFID

    if (password) {
      usuarioExistente.password = await bcrypt.hash(password, 10)
    }

    usuarioExistente.rol = rol || usuarioExistente.rol
    usuarioExistente.propietarioId = rol === "conductor" ? propietarioId : null

    // Actualizar estado de bloqueo solo si no es administrador
    if (bloqueado !== undefined && usuarioExistente.bloqueado !== bloqueado) {
      if (usuarioExistente.rol === "admin" && bloqueado) {
        return res.status(403).json({
          message: "No se puede bloquear a un administrador",
          errors: { general: ["Los administradores no pueden ser bloqueados"] },
          success: false,
        })
      }

      usuarioExistente.bloqueado = bloqueado
      if (bloqueado) {
        usuarioExistente.motivoBloqueo = motivoBloqueo || "No especificado"
        usuarioExistente.fechaBloqueo = new Date()
      } else {
        usuarioExistente.motivoBloqueo = null
        usuarioExistente.fechaBloqueo = null
      }
    }

    await usuarioExistente.save()

    // Remover la contraseña de la respuesta
    const { password: _, ...usuarioResponse } = usuarioExistente.toJSON()

    res.status(200).json({
      message: "Usuario actualizado exitosamente",
      usuario: usuarioResponse,
      success: true,
    })
  } catch (error) {
    console.error("Error al actualizar el usuario:", error)

    const sequelizeErrors = handleSequelizeError(error)
    if (Object.keys(sequelizeErrors).length > 0) {
      return res.status(400).json({
        message: "Error de validación",
        errors: sequelizeErrors,
        success: false,
      })
    }

    res.status(500).json({
      message: "Error al actualizar el usuario",
      errors: { general: ["Error interno del servidor"] },
      success: false,
    })
  }
}

// Verificar la existencia de una tarjeta RFID
export const verificarTarjeta = async (req, res) => {
  try {
    const { numeroTarjetaRFID } = req.body

    if (!numeroTarjetaRFID) {
      return res.status(400).json({
        valida: false,
        message: "Número de tarjeta RFID requerido",
        errors: { numeroTarjetaRFID: ["El número de tarjeta RFID es requerido"] },
      })
    }

    if (numeroTarjetaRFID.length < 8) {
      return res.status(400).json({
        valida: false,
        message: "Número de tarjeta RFID muy corto",
        errors: { numeroTarjetaRFID: ["El número de tarjeta RFID debe tener al menos 8 caracteres"] },
      })
    }

    const usuarioExistente = await Usuario.findOne({
      where: { numeroTarjetaRFID },
    })

    if (usuarioExistente) {
      return res.status(200).json({
        valida: false,
        message: "Número de tarjeta RFID ya existe",
        errors: { numeroTarjetaRFID: ["Este número de tarjeta RFID ya está asignado"] },
      })
    }

    res.status(200).json({
      valida: true,
      message: "Número de tarjeta RFID es válido",
      success: true,
    })
  } catch (error) {
    console.error("Error al verificar el número de tarjeta RFID:", error)
    res.status(500).json({
      valida: false,
      message: "Error al verificar el número de tarjeta RFID",
      errors: { general: ["Error interno del servidor"] },
    })
  }
}

// Resto de funciones sin cambios...
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params

    const usuarioExistente = await Usuario.findByPk(id)

    if (!usuarioExistente) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        errors: { general: ["El usuario que intenta eliminar no existe"] },
        success: false,
      })
    }

    // Soft delete - marcar como inactivo
    usuarioExistente.activo = false
    await usuarioExistente.save()

    // Desactivar cargas y pagos relacionados
    await actualizarEstadoRelacionados(id, false)

    res.status(200).json({
      message: "Usuario desactivado exitosamente",
      success: true,
    })
  } catch (error) {
    console.error("Error al desactivar el usuario:", error)
    res.status(500).json({
      message: "Error al desactivar el usuario",
      errors: { general: ["Error interno del servidor"] },
      success: false,
    })
  }
}

// Función para actualizar el estado de cargas y pagos relacionados
async function actualizarEstadoRelacionados(usuarioId, activo) {
  try {
    // Actualizar cargas de agua
    await cargaAgua.update({ activo }, { where: { usuarioId } })

    // Actualizar pagos
    await pagoCargaAgua.update({ activo }, { where: { usuarioId } })

    // Si el usuario es propietario, actualizar también a sus conductores
    const conductores = await Usuario.findAll({
      where: { propietarioId: usuarioId },
    })

    for (const conductor of conductores) {
      await Usuario.update({ activo }, { where: { id: conductor.id } })

      // Actualizar cargas y pagos de los conductores
      await cargaAgua.update({ activo }, { where: { usuarioId: conductor.id } })
      await pagoCargaAgua.update({ activo }, { where: { usuarioId: conductor.id } })
    }
  } catch (error) {
    console.error("Error al actualizar entidades relacionadas:", error)
    throw error
  }
}

// Resto de las funciones existentes...
export const getUsuariosBloqueados = async (req, res) => {
  try {
    const usuariosBloqueados = await Usuario.findAll({
      where: {
        bloqueado: true,
        activo: true,
      },
    })

    res.status(200).json(usuariosBloqueados)
  } catch (error) {
    console.error("Error al obtener usuarios bloqueados:", error)
    res.status(500).json({
      message: "Error al obtener usuarios bloqueados",
      errors: { general: ["Error interno del servidor"] },
    })
  }
}

export const getUsuariosInactivos = async (req, res) => {
  try {
    const usuariosInactivos = await Usuario.findAll({
      where: { activo: false },
    })

    res.status(200).json(usuariosInactivos)
  } catch (error) {
    console.error("Error al obtener usuarios inactivos:", error)
    res.status(500).json({
      message: "Error al obtener usuarios inactivos",
      errors: { general: ["Error interno del servidor"] },
    })
  }
}

export const bloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const { motivoBloqueo } = req.body

    if (!motivoBloqueo) {
      return res.status(400).json({
        message: "El motivo de bloqueo es requerido",
        errors: { motivoBloqueo: ["El motivo de bloqueo es requerido"] },
        success: false,
      })
    }

    const usuarioExistente = await Usuario.findByPk(id)
    if (!usuarioExistente) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        errors: { general: ["El usuario no existe"] },
        success: false,
      })
    }

    // Verificar que el usuario no sea administrador
    if (usuarioExistente.rol === "admin") {
      return res.status(403).json({
        message: "No se puede bloquear a un administrador",
        errors: { general: ["Los administradores no pueden ser bloqueados"] },
        success: false,
      })
    }

    if (usuarioExistente.bloqueado) {
      return res.status(400).json({
        message: "El usuario ya está bloqueado",
        errors: { general: ["Este usuario ya se encuentra bloqueado"] },
        success: false,
      })
    }

    usuarioExistente.bloqueado = true
    usuarioExistente.motivoBloqueo = motivoBloqueo
    usuarioExistente.fechaBloqueo = new Date()

    await usuarioExistente.save()

    res.status(200).json({
      message: "Usuario bloqueado exitosamente",
      usuario: {
        id: usuarioExistente.id,
        nombre: usuarioExistente.nombre,
        bloqueado: usuarioExistente.bloqueado,
        motivoBloqueo: usuarioExistente.motivoBloqueo,
        fechaBloqueo: usuarioExistente.fechaBloqueo,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error al bloquear el usuario:", error)
    res.status(500).json({
      message: "Error al bloquear el usuario",
      errors: { general: ["Error interno del servidor"] },
      success: false,
    })
  }
}

export const desbloquearUsuario = async (req, res) => {
  try {
    const { id } = req.params

    const usuarioExistente = await Usuario.findByPk(id)
    if (!usuarioExistente) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        errors: { general: ["El usuario no existe"] },
        success: false,
      })
    }

    if (!usuarioExistente.bloqueado) {
      return res.status(400).json({
        message: "El usuario no está bloqueado",
        errors: { general: ["Este usuario no se encuentra bloqueado"] },
        success: false,
      })
    }

    usuarioExistente.bloqueado = false
    usuarioExistente.motivoBloqueo = null
    usuarioExistente.fechaBloqueo = null

    await usuarioExistente.save()

    res.status(200).json({
      message: "Usuario desbloqueado exitosamente",
      usuario: {
        id: usuarioExistente.id,
        nombre: usuarioExistente.nombre,
        bloqueado: usuarioExistente.bloqueado,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error al desbloquear el usuario:", error)
    res.status(500).json({
      message: "Error al desbloquear el usuario",
      errors: { general: ["Error interno del servidor"] },
      success: false,
    })
  }
}

export const verificarBloqueo = async (req, res) => {
  try {
    const { id } = req.params

    const usuarioExistente = await Usuario.findByPk(id)
    if (!usuarioExistente) {
      return res.status(404).json({
        message: "Usuario no encontrado",
        errors: { general: ["El usuario no existe"] },
        success: false,
      })
    }

    res.status(200).json({
      bloqueado: usuarioExistente.bloqueado,
      motivoBloqueo: usuarioExistente.motivoBloqueo,
      fechaBloqueo: usuarioExistente.fechaBloqueo,
      success: true,
    })
  } catch (error) {
    console.error("Error al verificar el bloqueo del usuario:", error)
    res.status(500).json({
      message: "Error al verificar el bloqueo del usuario",
      errors: { general: ["Error interno del servidor"] },
      success: false,
    })
  }
}

export const getUsuariosPorRol = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: {
        rol: {
          [Op.or]: ["propietario", "conductor"], // Filtrar por roles
        },
        activo: true, // Solo usuarios activos
      },
      attributes: ["id", "nombre", "username", "correo", "rol"], // Ajusta los atributos según sea necesario
    })
    res.status(200).json(usuarios)
  } catch (error) {
    console.error("Error al obtener usuarios por rol:", error)
    res.status(500).json({
      message: "Error interno del servidor",
      errors: { general: ["Error interno del servidor"] },
    })
  }
}
