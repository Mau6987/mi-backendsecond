import { cargaAgua } from '../models/cargaAgua.js';
import { usuario } from '../models/usuarios.js';
import {tipoDeCamion } from '../models/tipoDeCamion.js'

   export const getCargasDeUsuario = async (req, res) => {
       try {
           const { id } = req.params;
           const cargas = await cargaAgua.findAll({
               where: { usuarioId: id, activo: true }, // Filtrar por cargas activas
               include: [usuario, tipoDeCamion]
           });
           
           res.json(cargas);
       } catch (error) {
           console.error('Error al obtener las cargas de agua:', error);
           res.status(500).json({ message: 'Error interno del servidor' });
       }
   };
   