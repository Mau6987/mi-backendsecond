import { pagoCargaAgua } from "../models/pagodeCargaAgua.js";
import { cargaAgua } from "../models/cargaAgua.js";
import { usuario } from "../models/usuarios.js";
import { tipoDeCamion } from '../models/tipoDeCamion.js';

// Obtener todos los pagos de carga de agua
export const getPagosCargaAgua = async (req, res) => {
  try {
    const pagos = await pagoCargaAgua.findAll({
      include: [
        { model: usuario, as: 'usuario', attributes: ['id', 'username', 'nombre', 'correo'] },
        { model: cargaAgua, as: 'cargas' }
      ]
    });
    res.status(200).json(pagos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pagos de carga de agua' });
  }
};

// Función para obtener un pago de carga de agua por su ID
export const getPagoCargaAguaById = async (req, res) => {
  const { id } = req.params;
  try {
    const pago = await pagoCargaAgua.findByPk(id, {
      include: [
        { model: usuario, as: 'usuario', attributes: ['id', 'username', 'nombre', 'correo'] },
        { model: cargaAgua, as: 'cargas' }
      ]
    });
    if (!pago) {
      res.status(404).json({ message: 'Pago de carga de agua no encontrado' });
    } else {
      res.status(200).json(pago);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el pago de carga de agua' });
  }
};

export const createPagoCargaAgua = async (req, res) => {
  try {
    const { usuarioId, monto, cargaAguaIds } = req.body;

    // Verificar que todas las cargas de agua estén en estado "deuda"
    const cargas = await cargaAgua.findAll({
      where: {
        id: cargaAguaIds,
        estado: 'deuda'
      }
    });

    if (cargas.length !== cargaAguaIds.length) {
      return res.status(400).json({ message: 'Algunas cargas de agua no están en estado de deuda' });
    }

    // Crear el nuevo pago de carga de agua
    const nuevoPagoCargaAgua = await pagoCargaAgua.create({
      usuarioId,
      monto,
      fechaHora: new Date(),
      cargaAguaIds
    });

    // Actualizar el estado de las cargas de agua a "pagado"
    await cargaAgua.update({ estado: 'pagado' }, {
      where: { id: cargaAguaIds }
    });

    res.status(201).json(nuevoPagoCargaAgua);
  } catch (error) {
    console.error('Error al crear el pago de carga de agua', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar un pago de carga de agua existente
export const updatePagoCargaAgua = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId, monto, cargaAguaIds } = req.body;
    const pagoCargaAguaExistente = await pagoCargaAgua.findByPk(id);
    if (!pagoCargaAguaExistente) {
      return res.status(404).json({ message: 'Pago de carga de agua no encontrado' });
    }

    // Actualizar los datos del pago
    pagoCargaAguaExistente.usuarioId = usuarioId;
    pagoCargaAguaExistente.monto = monto;
    pagoCargaAguaExistente.cargaAguaIds = cargaAguaIds;
    await pagoCargaAguaExistente.save();

    res.status(200).json(pagoCargaAguaExistente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el pago de carga de agua' });
  }
};

// Eliminar un pago de carga de agua
export const deletePagoCargaAgua = async (req, res) => {
  try {
    const { id } = req.params;
    const pagoCargaAguaExistente = await pagoCargaAgua.findByPk(id);
    if (!pagoCargaAguaExistente) {
      return res.status(404).json({ message: 'Pago de carga de agua no encontrado' });
    }
    await pagoCargaAguaExistente.destroy();
    res.status(200).json({ message: 'Pago de carga de agua eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el pago de carga de agua' });
  }
};

// Controlador para obtener usuarios por rol
export const getUsuariosPorRol = async (req, res) => {
  try {
    const { rol } = req.params;
    const usuarios = await usuario.findAll({
      where: { rol: rol },
      attributes: ['id', 'username', 'rol']
    });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios por rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getUsuariosPropietariosConductores = async (req, res) => {
  try {
    const usuarios = await usuario.findAll({
      where: {
        rol: ['propietario', 'conductor']
      }
    });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// Obtener todas las cargas de agua con deuda para un propietario y sus conductores
export const getCargasDePropietarioDeuda = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener todos los conductores asociados al propietario
    const conductores = await usuario.findAll({
      where: { propietarioId: id },
      attributes: ['id']
    });

    // Extraer los IDs de los conductores
    const conductorIds = conductores.map(conductor => conductor.id);

    // Incluir también el ID del propietario para obtener sus cargas si aplica
    conductorIds.push(parseInt(id));

    // Obtener las cargas de los conductores asociados al propietario y del propietario
    const cargas = await cargaAgua.findAll({
      where: {
        usuarioId: conductorIds,
        estado: 'deuda'
      },
      include: [usuario, tipoDeCamion]
    });

    res.json(cargas);
  } catch (error) {
    console.error('Error al obtener las cargas de agua:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener todas las cargas de agua con deuda para un conductor
export const getCargasDeConductorDeuda = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener las cargas de agua en estado de deuda para el conductor
    const cargas = await cargaAgua.findAll({
      where: {
        usuarioId: id,
        estado: 'deuda'
      },
      include: [usuario, tipoDeCamion]
    });

    res.json(cargas);
  } catch (error) {
    console.error('Error al obtener las cargas de agua del conductor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getPagosDeUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const pagos = await pagoCargaAgua.findAll({
      where: { usuarioId: id },
      include: [
        { model: cargaAgua, as: 'cargas' },
        { model: usuario, as: 'usuario', attributes: ['id', 'username', 'nombre', 'correo'] }
      ]
    });
    res.status(200).json(pagos);
  } catch (error) {
    console.error('Error al obtener los pagos del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};