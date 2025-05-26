import { cargaAgua } from "../models/cargaAgua.js";
import { pagoCargaAgua } from "../models/pagodeCargaAgua.js";
import { usuario } from "../models/usuarios.js";
import { tipoDeCamion } from "../models/tipoDeCamion.js";
import { Op, Sequelize } from "sequelize";

// Reporte de cargas de agua por período
export const reporteCargasPorPeriodo = async (req, res) => {
  const { fechaInicio, fechaFin, usuarioId, tipoCamionId, estado } = req.body;

  try {
    const whereClause = {
      activo: true,
    };

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      };
    }

    if (usuarioId) {
      whereClause.usuarioId = usuarioId;
    }

    if (tipoCamionId) {
      whereClause.tipoCamionId = tipoCamionId;
    }

    if (estado) {
      whereClause.estado = estado;
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
          as: "tiposDeCamion",
        },
      ],
      order: [["fechaHora", "DESC"]],
    });

    // Calcular estadísticas
    const totalCargas = cargas.length;
    const totalCosto = cargas.reduce((sum, carga) => sum + carga.costo, 0);
    const cargasPagadas = cargas.filter((carga) => carga.estado === "pagado").length;
    const cargasDeuda = cargas.filter((carga) => carga.estado === "deuda").length;
    const costoPagado = cargas
      .filter((carga) => carga.estado === "pagado")
      .reduce((sum, carga) => sum + carga.costo, 0);
    const costoDeuda = cargas
      .filter((carga) => carga.estado === "deuda")
      .reduce((sum, carga) => sum + carga.costo, 0);

    res.status(200).json({
      cargas,
      estadisticas: {
        totalCargas,
        totalCosto,
        cargasPagadas,
        cargasDeuda,
        costoPagado,
        costoDeuda,
        porcentajePagado: totalCargas > 0 ? (cargasPagadas / totalCargas) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error al generar reporte de cargas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Reporte de pagos por período
export const reportePagosPorPeriodo = async (req, res) => {
  const { fechaInicio, fechaFin, usuarioId } = req.body;

  try {
    const whereClause = {
      activo: true,
    };

    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      };
    }

    if (usuarioId) {
      whereClause.usuarioId = usuarioId;
    }

    const pagos = await pagoCargaAgua.findAll({
      where: whereClause,
      include: [
        { 
          model: usuario,
          as: "usuario",
          attributes: ["id", "nombre", "username", "correo", "activo", "bloqueado"],
        },
        {
          model: cargaAgua,
          as: "cargas",
          include: [tipoDeCamion],
        },
      ],
      order: [["fechaHora", "DESC"]],
    });

    // Calcular estadísticas
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const cargasPagadas = pagos.reduce((sum, pago) => sum + pago.cargas.length, 0);

    res.status(200).json({
      pagos,
      estadisticas: {
        totalPagos,
        montoTotal,
        cargasPagadas,
        promedioMontoPorPago: totalPagos > 0 ? montoTotal / totalPagos : 0,
        promedioCargasPorPago: totalPagos > 0 ? cargasPagadas / totalPagos : 0,
      },
    });
  } catch (error) {
    console.error("Error al generar reporte de pagos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Reporte de usuarios por actividad
export const reporteUsuariosPorActividad = async (req, res) => {
  const { fechaInicio, fechaFin, rol } = req.body;

  try {
    const whereUsuario = {
      activo: true,
    };

    if (rol) {
      whereUsuario.rol = rol;
    }

    const usuarios = await usuario.findAll({
      where: whereUsuario,
      attributes: ["id", "nombre", "username", "correo", "ci", "rol", "bloqueado"],
    });

    const rangoFechas = {};
    if (fechaInicio && fechaFin) {
      rangoFechas.fechaHora = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      };
    }

    const usuariosConActividad = await Promise.all(
      usuarios.map(async (user) => {
        const cargas = await cargaAgua.findAll({
          where: {
            usuarioId: user.id,
            activo: true,
            ...rangoFechas,
          },
        });

        const pagos = await pagoCargaAgua.findAll({
          where: {
            usuarioId: user.id,
            activo: true,
            ...rangoFechas,
          },
        });

        const totalCargas = cargas.length;
        const cargasPagadas = cargas.filter((carga) => carga.estado === "pagado").length;
        const cargasDeuda = cargas.filter((carga) => carga.estado === "deuda").length;
        const totalCosto = cargas.reduce((sum, carga) => sum + carga.costo, 0);
        const totalPagos = pagos.length;
        const montoPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);

        return {
          ...user.toJSON(),
          actividad: {
            totalCargas,
            cargasPagadas,
            cargasDeuda,
            totalCosto,
            totalPagos,
            montoPagado,
            saldoPendiente: totalCosto - montoPagado,
          },
        };
      }),
    );

    res.status(200).json(usuariosConActividad);
  } catch (error) {
    console.error("Error al generar reporte de usuarios por actividad:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Reporte de deudas por usuario
export const reporteDeudas = async (req, res) => {
  try {
    const usuarios = await usuario.findAll({
      where: {
        activo: true,
        bloqueado: false,
      },
      attributes: ["id", "nombre", "username", "correo", "ci", "rol"],
    });

    const usuariosConDeuda = await Promise.all(
      usuarios.map(async (user) => {
        const cargasDeuda = await cargaAgua.findAll({
          where: {
            usuarioId: user.id,
            estado: "deuda",
            activo: true,
          },
          include: [tipoDeCamion],
        });

        const montoDeuda = cargasDeuda.reduce((sum, carga) => sum + carga.costo, 0);

        return {
          ...user.toJSON(),
          deuda: {
            cantidadCargasDeuda: cargasDeuda.length,
            montoDeuda,
            cargas: cargasDeuda,
          },
        };
      }),
    );

    const deudores = usuariosConDeuda.filter((user) => user.deuda.cantidadCargasDeuda > 0);

    const totalDeudores = deudores.length;
    const montoTotalDeuda = deudores.reduce((sum, user) => sum + user.deuda.montoDeuda, 0);
    const totalCargasDeuda = deudores.reduce((sum, user) => sum + user.deuda.cantidadCargasDeuda, 0);

    res.status(200).json({
      deudores,
      estadisticas: {
        totalDeudores,
        montoTotalDeuda,
        totalCargasDeuda,
        promedioDeudaPorUsuario: totalDeudores > 0 ? montoTotalDeuda / totalDeudores : 0,
      },
    });
  } catch (error) {
    console.error("Error al generar reporte de deudas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// FUNCIÓN CORREGIDA: Reporte de ingresos por período
export const reporteIngresos = async (req, res) => {
  const { fechaInicio, fechaFin, agruparPor } = req.body;

  try {
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Se requieren fechas de inicio y fin" });
    }

    // CORRECCIÓN: Mapear valores en español a inglés para PostgreSQL
    const mapeoUnidades = {
      'dia': 'day',
      'semana': 'week', 
      'mes': 'month',
      'año': 'year',
      'day': 'day',
      'week': 'week',
      'month': 'month',
      'year': 'year'
    };

    // Obtener la unidad correcta en inglés
    const unidadPostgreSQL = mapeoUnidades[agruparPor] || 'day';

    console.log(`Agrupando por: ${agruparPor} -> ${unidadPostgreSQL}`);

    // Consulta para obtener ingresos agrupados
    const ingresos = await pagoCargaAgua.findAll({
      attributes: [
        [Sequelize.fn("date_trunc", unidadPostgreSQL, Sequelize.col("fechaHora")), "periodo"],
        [Sequelize.fn("SUM", Sequelize.col("monto")), "total"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "cantidad"],
      ],
      where: {
        fechaHora: {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
        },
        activo: true,
      },
      group: ["periodo"],
      order: [[Sequelize.literal("periodo"), "ASC"]],
      raw: true, // Agregar esto para obtener datos planos
    });

    // Consulta para obtener totales
    const totales = await pagoCargaAgua.findAll({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("monto")), "totalIngresos"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalPagos"],
        [Sequelize.fn("AVG", Sequelize.col("monto")), "promedioMontoPorPago"],
      ],
      where: {
        fechaHora: {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
        },
        activo: true,
      },
      raw: true,
    });

    // Formatear los resultados
    const ingresosFormateados = ingresos.map(ingreso => ({
      periodo: ingreso.periodo,
      total: parseFloat(ingreso.total) || 0,
      cantidad: parseInt(ingreso.cantidad) || 0
    }));

    const totalesFormateados = {
      totalIngresos: parseFloat(totales[0]?.totalIngresos) || 0,
      totalPagos: parseInt(totales[0]?.totalPagos) || 0,
      promedioMontoPorPago: parseFloat(totales[0]?.promedioMontoPorPago) || 0
    };

    res.status(200).json({
      ingresos: ingresosFormateados,
      totales: totalesFormateados,
      estadisticas: totalesFormateados, // Alias para compatibilidad con frontend
      parametros: {
        fechaInicio,
        fechaFin,
        agruparPor,
        unidadUsada: unidadPostgreSQL
      },
    });
  } catch (error) {
    console.error("Error al generar reporte de ingresos:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Reporte de usuarios bloqueados
export const reporteUsuariosBloqueados = async (req, res) => {
  try {
    const usuariosBloqueados = await usuario.findAll({
      where: {
        bloqueado: true,
        activo: true,
      },
      attributes: ["id", "nombre", "username", "correo", "ci", "rol", "fechaBloqueo", "motivoBloqueo"],
      order: [["fechaBloqueo", "DESC"]],
    });

    res.status(200).json({
      usuariosBloqueados,
      total: usuariosBloqueados.length,
    });
  } catch (error) {
    console.error("Error al generar reporte de usuarios bloqueados:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const reporteRendimientoPorTipoCamion = async (req, res) => {
  const { fechaInicio, fechaFin } = req.body;

  try {
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Se requieren fechas de inicio y fin" });
    }

    const tiposCamion = await tipoDeCamion.findAll();

    const rendimientoPorTipo = await Promise.all(
      tiposCamion.map(async (tipo) => {
        const cargas = await cargaAgua.findAll({
          where: {
            tipoCamionId: tipo.id,
            fechaHora: {
              [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
            },
            activo: true,
          },
        });

        const totalCargas = cargas.length;
        const cargasPagadas = cargas.filter(c => c.estado === "pagado").length;
        const cargasDeuda = cargas.filter(c => c.estado === "deuda").length;
        const totalCosto = cargas.reduce((sum, carga) => sum + carga.costo, 0);
        const totalLitros = totalCargas * tipo.cantidadDeAgua;

        return {
          tipoCamion: tipo,
          estadisticas: {
            totalCargas,
            cargasPagadas,
            cargasDeuda,
            totalCosto,
            totalLitros,
            porcentajePagado: totalCargas > 0 ? (cargasPagadas / totalCargas) * 100 : 0,
            ingresoPromedioPorCarga: totalCargas > 0 ? totalCosto / totalCargas : 0,
          },
        };
      })
    );

    const totalCargas = rendimientoPorTipo.reduce((sum, item) => sum + item.estadisticas.totalCargas, 0);
    const totalCosto = rendimientoPorTipo.reduce((sum, item) => sum + item.estadisticas.totalCosto, 0);
    const totalLitros = rendimientoPorTipo.reduce((sum, item) => sum + item.estadisticas.totalLitros, 0);

    return res.status(200).json({
      rendimientoPorTipo,
      totales: {
        totalCargas,
        totalCosto,
        totalLitros,
        ingresoPromedioPorCarga: totalCargas > 0 ? totalCosto / totalCargas : 0,
      },
      parametros: { fechaInicio, fechaFin },
    });
  } catch (error) {
    console.error("Error al generar reporte de rendimiento por tipo de camión:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
// Reporte de historial de precios
export const reporteHistorialPrecios = async (req, res) => {
  try {
    const historialPrecios = await precioCargaAgua.findAll({
      include: [
        {
          model: tipoDeCamion,
          as: "tipoCamion",
        },
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
      order: [
        ["tipoCamionId", "ASC"],
        ["fechaCreacion", "DESC"],
      ],
    });

    // Agrupar por tipo de camión
    const preciosPorTipoCamion = {};
    historialPrecios.forEach((precio) => {
      const tipoCamionId = precio.tipoCamionId;
      if (!preciosPorTipoCamion[tipoCamionId]) {
        preciosPorTipoCamion[tipoCamionId] = {
          tipoCamion: precio.tipoCamion,
          precios: [],
        };
      }
      preciosPorTipoCamion[tipoCamionId].precios.push(precio);
    });

    res.status(200).json({
      preciosPorTipoCamion: Object.values(preciosPorTipoCamion),
    });
  } catch (error) {
    console.error("Error al generar reporte de historial de precios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
