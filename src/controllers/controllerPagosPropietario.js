import { pagoCargaAgua } from "../models/pagodeCargaAgua.js";
import { cargaAgua } from "../models/cargaAgua.js";
import { usuario } from "../models/usuarios.js";
import { tipoDeCamion } from '../models/tipoDeCamion.js';
   export const getPagosDePropietario = async (req, res) => {
     try {
       const { id } = req.params;

       // Obtener todos los conductores asociados al propietario que estén activos
       const conductores = await usuario.findAll({
         where: { propietarioId: id, activo: true }, // Filtrar por usuarios activos
         attributes: ['id']
       });

       // Extraer los IDs de los conductores
       const conductorIds = conductores.map(conductor => conductor.id);

       // Incluir también el ID del propietario para obtener sus pagos si aplica
       conductorIds.push(parseInt(id));

       // Obtener los pagos de los conductores asociados al propietario y del propietario
       const pagos = await pagoCargaAgua.findAll({
         where: {
           usuarioId: conductorIds,
           activo: true // Asegúrate de que los pagos también estén activos
         },
         include: [
           { model: usuario, as: 'usuario', attributes: ['id', 'username', 'nombre', 'correo', 'ci'] },
           { model: cargaAgua, as: 'cargas', include: [tipoDeCamion] }
         ]
       });

       res.json(pagos);
     } catch (error) {
       console.error('Error al obtener los pagos de carga de agua:', error);
       res.status(500).json({ message: 'Error interno del servidor' });
     }
   };
   export const getUsuariosDePropietario = async (req, res) => {
     try {
       const { id } = req.params;

       // Obtener todos los conductores asociados al propietario que estén activos
       const conductores = await usuario.findAll({
         where: { propietarioId: id, activo: true }, // Filtrar por usuarios activos
         attributes: ['id', 'nombre', 'correo', 'ci', 'username', 'rol']
       });

       res.json(conductores);
     } catch (error) {
       console.error('Error al obtener los usuarios del propietario:', error);
       res.status(500).json({ message: 'Error interno del servidor' });
     }
   };
   
   export const getPropietarios = async (req, res) => {
     try {
       // Obtener todos los usuarios con el rol de 'propietario' que estén activos
       const propietarios = await usuario.findAll({
         where: { rol: 'propietario', activo: true }, // Filtrar por usuarios activos
         attributes: ['id', 'nombre', 'correo', 'ci', 'username', 'rol']
       });

       res.json(propietarios);
     } catch (error) {
       console.error('Error al obtener los propietarios:', error);
       res.status(500).json({ message: 'Error interno del servidor' });
     }
   };
   