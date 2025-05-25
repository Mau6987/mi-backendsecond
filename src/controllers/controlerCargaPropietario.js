import { usuario as Usuario } from "../models/usuarios.js";
import { cargaAgua } from "../models/cargaAgua.js";
import { tipoDeCamion } from "../models/tipoDeCamion.js"; // Asegúrate de importar el modelo correspondiente

export const getCargasDePropietario = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener todos los conductores asociados al propietario
    const conductores = await Usuario.findAll({
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
        usuarioId: conductorIds
      },
      include: [Usuario, tipoDeCamion]
    });

    res.status(200).json(cargas);
  } catch (error) {
    console.error('Error al obtener las cargas de agua:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getUsuariosDePropietario = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener todos los conductores asociados al propietario
    const conductores = await Usuario.findAll({
      where: { propietarioId: id },
      attributes: ['id', 'nombre', 'correo', 'ci', 'username', 'rol']
    });

    res.status(200).json(conductores);
  } catch (error) {
    console.error('Error al obtener los usuarios del propietario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getPropietarios = async (req, res) => {
  try {
    // Obtener todos los usuarios con el rol de 'propietario'
    const propietarios = await Usuario.findAll({
      where: { rol: 'propietario' },
      attributes: ['id', 'nombre', 'correo', 'ci', 'username', 'rol']
    });

    res.status(200).json(propietarios);
  } catch (error) {
    console.error('Error al obtener los propietarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
