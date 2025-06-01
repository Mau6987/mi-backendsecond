import { cargaAgua } from "../models/cargaAgua.js"
import { pagoCargaAgua } from "../models/pagodeCargaAgua.js"
import { usuario } from "../models/usuarios.js"
import { precioCargaAgua } from "../models/precioCargaAgua.js"
import { Op, Sequelize } from "sequelize"

// Función auxiliar para formatear fechas
const formatearFecha = (fecha) => {
  const date = new Date(fecha)
  return date.toISOString().split("T")[0]
}

/**
 * Genera un reporte de cargas de agua por período
 */
export const reporteCargasPorPeriodo = async (req, res) => {
  const { fechaInicio, fechaFin, agruparPor = "dia" } = req.body

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: "Fechas de inicio y fin son requeridas" })
  }

  try {
    let groupByClause
    let dateFormat

    // Configurar agrupación según el parámetro - CORREGIDO: usar el alias correcto
    switch (agruparPor) {
      case "dia":
        dateFormat = 'DATE("cargas_agua"."fechaHora")'
        groupByClause = Sequelize.literal('DATE("cargas_agua"."fechaHora")')
        break
      case "semana":
        dateFormat =
          'EXTRACT(YEAR FROM "cargas_agua"."fechaHora") || \'-\' || EXTRACT(WEEK FROM "cargas_agua"."fechaHora")'
        groupByClause = Sequelize.literal(
          'EXTRACT(YEAR FROM "cargas_agua"."fechaHora"), EXTRACT(WEEK FROM "cargas_agua"."fechaHora")',
        )
        break
      case "mes":
        dateFormat =
          'EXTRACT(YEAR FROM "cargas_agua"."fechaHora") || \'-\' || EXTRACT(MONTH FROM "cargas_agua"."fechaHora")'
        groupByClause = Sequelize.literal(
          'EXTRACT(YEAR FROM "cargas_agua"."fechaHora"), EXTRACT(MONTH FROM "cargas_agua"."fechaHora")',
        )
        break
      default:
        dateFormat = 'DATE("cargas_agua"."fechaHora")'
        groupByClause = Sequelize.literal('DATE("cargas_agua"."fechaHora")')
    }

    const reporte = await cargaAgua.findAll({
      attributes: [
        [Sequelize.literal(dateFormat), "periodo"],
        [Sequelize.fn("COUNT", Sequelize.col("cargas_agua.id")), "totalCargas"],
        [Sequelize.fn("SUM", Sequelize.col("cargas_agua.costo")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_agua.estado = 'pagado' THEN 1 END")),
          "cargasPagadas",
        ],
        [Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_agua.estado = 'deuda' THEN 1 END")), "cargasEnDeuda"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_agua.estado = 'pagado' THEN cargas_agua.costo ELSE 0 END"),
          ),
          "montoPagado",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_agua.estado = 'deuda' THEN cargas_agua.costo ELSE 0 END"),
          ),
          "montoEnDeuda",
        ],
      ],
      where: {
        fechaHora: {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
        },
        activo: true,
      },
      group: [groupByClause],
      order: [Sequelize.literal("periodo ASC")],
    })

    // Calcular totales generales
    const totales = {
      totalCargas: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.totalCargas), 0),
      montoTotal: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoTotal), 0),
      cargasPagadas: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.cargasPagadas), 0),
      cargasEnDeuda: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.cargasEnDeuda), 0),
      montoPagado: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoPagado), 0),
      montoEnDeuda: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoEnDeuda), 0),
    }

    res.status(200).json({
      reporte,
      totales,
      parametros: {
        fechaInicio,
        fechaFin,
        agruparPor,
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de cargas por período:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

/**
 * Genera un reporte de cargas de agua por usuario
 */
export const reporteCargasPorUsuario = async (req, res) => {
  const { fechaInicio, fechaFin, rol, estado } = req.body

  try {
    const whereClause = {
      activo: true,
    }

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    }

    if (estado) {
      whereClause.estado = estado
    }

    const usuarioWhereClause = {
      activo: true,
    }

    // CORREGIDO: Solo agregar el filtro de rol si es un valor válido del enum
    if (rol && rol !== "todos") {
      usuarioWhereClause.rol = rol
    }

    const reporte = await usuario.findAll({
      attributes: [
        "id",
        "nombre",
        "username",
        "ci",
        "rol",
        [Sequelize.fn("COUNT", Sequelize.col("cargas_aguas.id")), "totalCargas"],
        [Sequelize.fn("SUM", Sequelize.col("cargas_aguas.costo")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_aguas.estado = 'pagado' THEN 1 END")),
          "cargasPagadas",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_aguas.estado = 'deuda' THEN 1 END")),
          "cargasEnDeuda",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_aguas.estado = 'pagado' THEN cargas_aguas.costo ELSE 0 END"),
          ),
          "montoPagado",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_aguas.estado = 'deuda' THEN cargas_aguas.costo ELSE 0 END"),
          ),
          "montoEnDeuda",
        ],
      ],
      include: [
        {
          model: cargaAgua,
          as: "cargas_aguas",
          attributes: [],
          where: whereClause,
          required: false,
        },
      ],
      where: usuarioWhereClause,
      group: ["usuarios.id"],
      order: [["nombre", "ASC"]],
    })

    // Calcular totales generales
    const totales = {
      totalCargas: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.totalCargas), 0),
      montoTotal: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoTotal || 0), 0),
      cargasPagadas: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.cargasPagadas), 0),
      cargasEnDeuda: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.cargasEnDeuda), 0),
      montoPagado: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoPagado || 0), 0),
      montoEnDeuda: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoEnDeuda || 0), 0),
    }

    res.status(200).json({
      reporte,
      totales,
      parametros: {
        fechaInicio: fechaInicio || "todos",
        fechaFin: fechaFin || "todos",
        rol: rol || "todos",
        estado: estado || "todos",
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de cargas por usuario:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

/**
 * Genera un reporte de pagos por período
 */
export const reportePagosPorPeriodo = async (req, res) => {
  const { fechaInicio, fechaFin, agruparPor = "dia" } = req.body

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: "Fechas de inicio y fin son requeridas" })
  }

  try {
    let groupByClause
    let dateFormat

    // Configurar agrupación según el parámetro - CORREGIDO: usar el alias correcto
    switch (agruparPor) {
      case "dia":
        dateFormat = 'DATE("pagos_carga_agua"."fechaHora")'
        groupByClause = Sequelize.literal('DATE("pagos_carga_agua"."fechaHora")')
        break
      case "semana":
        dateFormat =
          'EXTRACT(YEAR FROM "pagos_carga_agua"."fechaHora") || \'-\' || EXTRACT(WEEK FROM "pagos_carga_agua"."fechaHora")'
        groupByClause = Sequelize.literal(
          'EXTRACT(YEAR FROM "pagos_carga_agua"."fechaHora"), EXTRACT(WEEK FROM "pagos_carga_agua"."fechaHora")',
        )
        break
      case "mes":
        dateFormat =
          'EXTRACT(YEAR FROM "pagos_carga_agua"."fechaHora") || \'-\' || EXTRACT(MONTH FROM "pagos_carga_agua"."fechaHora")'
        groupByClause = Sequelize.literal(
          'EXTRACT(YEAR FROM "pagos_carga_agua"."fechaHora"), EXTRACT(MONTH FROM "pagos_carga_agua"."fechaHora")',
        )
        break
      default:
        dateFormat = 'DATE("pagos_carga_agua"."fechaHora")'
        groupByClause = Sequelize.literal('DATE("pagos_carga_agua"."fechaHora")')
    }

    const reporte = await pagoCargaAgua.findAll({
      attributes: [
        [Sequelize.literal(dateFormat), "periodo"],
        [Sequelize.fn("COUNT", Sequelize.col("pagos_carga_agua.id")), "totalPagos"],
        [Sequelize.fn("SUM", Sequelize.col("pagos_carga_agua.monto")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN pagos_carga_agua.activo = true THEN 1 END")),
          "pagosActivos",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN pagos_carga_agua.activo = false THEN 1 END")),
          "pagosAnulados",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN pagos_carga_agua.activo = true THEN pagos_carga_agua.monto ELSE 0 END"),
          ),
          "montoActivo",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN pagos_carga_agua.activo = false THEN pagos_carga_agua.monto ELSE 0 END"),
          ),
          "montoAnulado",
        ],
      ],
      where: {
        fechaHora: {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
        },
      },
      group: [groupByClause],
      order: [Sequelize.literal("periodo ASC")],
    })

    // Calcular totales generales
    const totales = {
      totalPagos: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.totalPagos), 0),
      montoTotal: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoTotal), 0),
      pagosActivos: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.pagosActivos), 0),
      pagosAnulados: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.pagosAnulados), 0),
      montoActivo: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoActivo), 0),
      montoAnulado: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoAnulado), 0),
    }

    res.status(200).json({
      reporte,
      totales,
      parametros: {
        fechaInicio,
        fechaFin,
        agruparPor,
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de pagos por período:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

/**
 * Genera un reporte de deudas por usuario
 */
export const reporteDeudasPorUsuario = async (req, res) => {
  try {
    const reporte = await usuario.findAll({
      attributes: [
        "id",
        "nombre",
        "username",
        "ci",
        "rol",
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_aguas.estado = 'deuda' THEN 1 END")),
          "cargasEnDeuda",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_aguas.estado = 'deuda' THEN cargas_aguas.costo ELSE 0 END"),
          ),
          "montoDeuda",
        ],
      ],
      include: [
        {
          model: cargaAgua,
          as: "cargas_aguas",
          attributes: [],
          where: {
            estado: "deuda",
            activo: true,
          },
          required: false,
        },
      ],
      where: {
        activo: true,
        bloqueado: false,
      },
      having: Sequelize.literal("COUNT(CASE WHEN cargas_aguas.estado = 'deuda' THEN 1 END) > 0"),
      group: ["usuarios.id"],
      order: [["nombre", "ASC"]],
    })

    // Calcular totales generales
    const totales = {
      totalUsuariosConDeuda: reporte.length,
      totalCargasEnDeuda: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.cargasEnDeuda), 0),
      montoTotalDeuda: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoDeuda || 0), 0),
    }

    res.status(200).json({
      reporte,
      totales,
    })
  } catch (error) {
    console.error("Error al generar reporte de deudas por usuario:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

/**
 * Genera un reporte de dashboard con estadísticas generales
 */
export const reporteDashboard = async (req, res) => {
  try {
    // Obtener fechas del body de la request, o usar valores por defecto
    const { fechaInicio, fechaFin } = req.body

    let fechaInicioFiltro, fechaFinFiltro

    if (fechaInicio && fechaFin) {
      fechaInicioFiltro = new Date(fechaInicio)
      fechaFinFiltro = new Date(fechaFin)
      // Ajustar la fecha fin para incluir todo el día
      fechaFinFiltro.setHours(23, 59, 59, 999)
    } else {
      // Si no se proporcionan fechas, usar el mes actual
      const fechaActual = new Date()
      fechaInicioFiltro = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
      fechaFinFiltro = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0)
      fechaFinFiltro.setHours(23, 59, 59, 999)
    }

    // Estadísticas de cargas con filtro de fechas
    const estadisticasCargas = await cargaAgua.findAll({
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("cargas_agua.id")), "totalCargas"],
        [Sequelize.fn("SUM", Sequelize.col("cargas_agua.costo")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_agua.estado = 'pagado' THEN 1 END")),
          "cargasPagadas",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_agua.estado = 'deuda' THEN 1 END")),
          "cargasEnDeuda",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_agua.estado = 'pagado' THEN cargas_agua.costo ELSE 0 END"),
          ),
          "montoPagado",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_agua.estado = 'deuda' THEN cargas_agua.costo ELSE 0 END"),
          ),
          "montoEnDeuda",
        ],
      ],
      where: {
        activo: true,
        fechaHora: {
          [Op.between]: [fechaInicioFiltro, fechaFinFiltro],
        },
      },
    })

    // Cargas por día en el período seleccionado
    const cargasPorDia = await cargaAgua.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("cargas_agua.fechaHora")), "fecha"],
        [Sequelize.fn("COUNT", Sequelize.col("cargas_agua.id")), "totalCargas"],
        [Sequelize.fn("SUM", Sequelize.col("cargas_agua.costo")), "montoTotal"],
      ],
      where: {
        activo: true,
        fechaHora: {
          [Op.between]: [fechaInicioFiltro, fechaFinFiltro],
        },
      },
      group: [Sequelize.fn("DATE", Sequelize.col("cargas_agua.fechaHora"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("cargas_agua.fechaHora")), "ASC"]],
    })

    // Estadísticas de pagos con filtro de fechas
    const estadisticasPagos = await pagoCargaAgua.findAll({
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("pagos_carga_agua.id")), "totalPagos"],
        [Sequelize.fn("SUM", Sequelize.col("pagos_carga_agua.monto")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN pagos_carga_agua.activo = true THEN 1 END")),
          "pagosActivos",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN pagos_carga_agua.activo = false THEN 1 END")),
          "pagosAnulados",
        ],
      ],
      where: {
        fechaHora: {
          [Op.between]: [fechaInicioFiltro, fechaFinFiltro],
        },
      },
    })

    // Precio actual (sin filtro de fecha)
    const precioActual = await precioCargaAgua.findOne({
      where: {
        activo: true,
      },
      order: [["fechaCreacion", "DESC"]],
    })

    res.status(200).json({
      estadisticasGenerales: {
        cargas: estadisticasCargas[0],
        pagos: estadisticasPagos[0],
        precioActual: precioActual ? precioActual.valor : 0,
      },
      cargasPorDia: cargasPorDia.map((item) => ({
        fecha: formatearFecha(item.dataValues.fecha),
        totalCargas: Number.parseInt(item.dataValues.totalCargas),
        montoTotal: Number.parseFloat(item.dataValues.montoTotal),
      })),
      parametros: {
        fechaInicio: formatearFecha(fechaInicioFiltro),
        fechaFin: formatearFecha(fechaFinFiltro),
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de dashboard:", error)
    res.status(500).json({ message: "Error al generar el reporte de dashboard" })
  }
}

// Nuevos reportes adicionales

/**
 * Genera un reporte de pagos por usuario
 */
export const reportePagosPorUsuario = async (req, res) => {
  const { fechaInicio, fechaFin, rol } = req.body

  try {
    const whereClause = {}

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    }

    const usuarioWhereClause = {
      activo: true,
    }

    if (rol && rol !== "todos") {
      usuarioWhereClause.rol = rol
    }

    const reporte = await usuario.findAll({
      attributes: [
        "id",
        "nombre",
        "username",
        "ci",
        "rol",
        [Sequelize.fn("COUNT", Sequelize.col("pagos_carga_aguas.id")), "totalPagos"],
        [Sequelize.fn("SUM", Sequelize.col("pagos_carga_aguas.monto")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN pagos_carga_aguas.activo = true THEN 1 END")),
          "pagosActivos",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN pagos_carga_aguas.activo = false THEN 1 END")),
          "pagosAnulados",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN pagos_carga_aguas.activo = true THEN pagos_carga_aguas.monto ELSE 0 END"),
          ),
          "montoActivo",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN pagos_carga_aguas.activo = false THEN pagos_carga_aguas.monto ELSE 0 END"),
          ),
          "montoAnulado",
        ],
      ],
      include: [
        {
          model: pagoCargaAgua,
          as: "pagos_carga_aguas",
          attributes: [],
          where: whereClause,
          required: false,
        },
      ],
      where: usuarioWhereClause,
      group: ["usuarios.id"],
      order: [["nombre", "ASC"]],
    })

    // Calcular totales generales
    const totales = {
      totalPagos: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.totalPagos || 0), 0),
      montoTotal: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoTotal || 0), 0),
      pagosActivos: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.pagosActivos || 0), 0),
      pagosAnulados: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.pagosAnulados || 0), 0),
      montoActivo: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoActivo || 0), 0),
      montoAnulado: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoAnulado || 0), 0),
    }

    res.status(200).json({
      reporte,
      totales,
      parametros: {
        fechaInicio: fechaInicio || "todos",
        fechaFin: fechaFin || "todos",
        rol: rol || "todos",
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de pagos por usuario:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

/**
 * Genera un reporte de eficiencia de cobros
 */
export const reporteEficienciaCobros = async (req, res) => {
  const { fechaInicio, fechaFin } = req.body

  try {
    const whereClause = {
      activo: true,
    }

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    }

    const reporte = await usuario.findAll({
      attributes: [
        "id",
        "nombre",
        "username",
        "rol",
        [Sequelize.fn("COUNT", Sequelize.col("cargas_aguas.id")), "totalCargas"],
        [Sequelize.fn("SUM", Sequelize.col("cargas_aguas.costo")), "montoTotal"],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_aguas.estado = 'pagado' THEN 1 END")),
          "cargasPagadas",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.literal("CASE WHEN cargas_aguas.estado = 'deuda' THEN 1 END")),
          "cargasEnDeuda",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_aguas.estado = 'pagado' THEN cargas_aguas.costo ELSE 0 END"),
          ),
          "montoPagado",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN cargas_aguas.estado = 'deuda' THEN cargas_aguas.costo ELSE 0 END"),
          ),
          "montoEnDeuda",
        ],
      ],
      include: [
        {
          model: cargaAgua,
          as: "cargas_aguas",
          attributes: [],
          where: whereClause,
          required: false,
        },
      ],
      where: {
        activo: true,
        rol: {
          [Op.in]: ["propietario", "conductor"],
        },
      },
      group: ["usuarios.id"],
      order: [["nombre", "ASC"]],
    })

    // Calcular eficiencia para cada usuario
    const reporteConEficiencia = reporte.map((item) => {
      const totalCargas = Number.parseInt(item.dataValues.totalCargas || 0)
      const cargasPagadas = Number.parseInt(item.dataValues.cargasPagadas || 0)
      const montoTotal = Number.parseFloat(item.dataValues.montoTotal || 0)
      const montoPagado = Number.parseFloat(item.dataValues.montoPagado || 0)

      const eficienciaCargas = totalCargas > 0 ? (cargasPagadas / totalCargas) * 100 : 0
      const eficienciaMonto = montoTotal > 0 ? (montoPagado / montoTotal) * 100 : 0

      return {
        ...item.dataValues,
        eficienciaCargas: Number.parseFloat(eficienciaCargas.toFixed(2)),
        eficienciaMonto: Number.parseFloat(eficienciaMonto.toFixed(2)),
      }
    })

    // Calcular totales generales
    const totales = {
      totalCargas: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.totalCargas || 0), 0),
      montoTotal: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoTotal || 0), 0),
      cargasPagadas: reporte.reduce((sum, item) => sum + Number.parseInt(item.dataValues.cargasPagadas || 0), 0),
      montoPagado: reporte.reduce((sum, item) => sum + Number.parseFloat(item.dataValues.montoPagado || 0), 0),
    }

    totales.eficienciaGeneralCargas = totales.totalCargas > 0 ? (totales.cargasPagadas / totales.totalCargas) * 100 : 0
    totales.eficienciaGeneralMonto = totales.montoTotal > 0 ? (totales.montoPagado / totales.montoTotal) * 100 : 0

    res.status(200).json({
      reporte: reporteConEficiencia,
      totales,
      parametros: {
        fechaInicio: fechaInicio || "todos",
        fechaFin: fechaFin || "todos",
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de eficiencia de cobros:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

/**
 * Genera un reporte de actividad reciente
 */
export const reporteActividadReciente = async (req, res) => {
  const { dias = 7 } = req.body

  try {
    const fechaActual = new Date()
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - dias)

    // Cargas recientes
    const cargasRecientes = await cargaAgua.findAll({
      attributes: ["id", "fechaHora", "costo", "estado", "observaciones"],
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["nombre", "username", "rol"],
        },
      ],
      where: {
        activo: true,
        fechaHora: {
          [Op.between]: [fechaInicio, fechaActual],
        },
      },
      order: [["fechaHora", "DESC"]],
      limit: 20,
    })

    // Pagos recientes
    const pagosRecientes = await pagoCargaAgua.findAll({
      attributes: ["id", "fechaHora", "monto", "activo", "observaciones"],
      include: [
        {
          model: usuario,
          as: "usuario",
          attributes: ["nombre", "username", "rol"],
        },
      ],
      where: {
        fechaHora: {
          [Op.between]: [fechaInicio, fechaActual],
        },
      },
      order: [["fechaHora", "DESC"]],
      limit: 20,
    })

    res.status(200).json({
      cargasRecientes,
      pagosRecientes,
      parametros: {
        dias,
        fechaInicio: formatearFecha(fechaInicio),
        fechaFin: formatearFecha(fechaActual),
      },
    })
  } catch (error) {
    console.error("Error al generar reporte de actividad reciente:", error)
    res.status(500).json({ message: "Error al generar el reporte" })
  }
}

// Exportar todas las funciones
export default {
  reporteCargasPorPeriodo,
  reporteCargasPorUsuario,
  reportePagosPorPeriodo,
  reporteDeudasPorUsuario,
  reporteDashboard,
  reportePagosPorUsuario,
  reporteEficienciaCobros,
  reporteActividadReciente,
}
