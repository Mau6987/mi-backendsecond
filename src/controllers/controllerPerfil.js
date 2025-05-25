import { usuario as Usuario } from "../models/usuarios.js";

   export const getPerfil = async (req, res) => {
     try {
       const { id } = req.params;
       const unUsuario = await Usuario.findOne({ where: { id, activo: true } }); // Filtrar por usuario activo

       if (!unUsuario) {
         return res.status(404).json({ message: 'Usuario no encontrado o inactivo' });
       }
       const perfil = {
         nombre: unUsuario.nombre,
         username: unUsuario.username,
         correo: unUsuario.correo,
         ci: unUsuario.ci
       };

       res.status(200).json(perfil);
     } catch (error) {
       console.log(error);
       res.status(500).json({ message: 'Error al obtener el usuario' });
     }
   };
   
   export const updatePerfil = async (req, res) => {
     try {
       const { id } = req.params; 
       const { nombre, username, correo } = req.body; 

       const usuarioExistente = await Usuario.findByPk(id); 

       if (!usuarioExistente || !usuarioExistente.activo) { // Verificar si el usuario existe y está activo
         return res.status(404).json({ message: 'Usuario no encontrado o inactivo' });
       }

       usuarioExistente.nombre = nombre;
       usuarioExistente.username = username;
       usuarioExistente.correo = correo;
       await usuarioExistente.save(); 

       res.status(200).json(usuarioExistente); 
     } catch (error) {
       console.log(error);
       res.status(500).json({ message: 'Error al actualizar el perfil' });
     }
   };

   export const updatePerfil2 = async (req, res) => {
     try {
       const { id } = req.params; 
       const { nombre, username, correo, ci } = req.body; 

       const usuarioExistente = await Usuario.findByPk(id); 

       if (!usuarioExistente || !usuarioExistente.activo) { // Verificar si el usuario existe y está activo
         return res.status(404).json({ message: 'Usuario no encontrado o inactivo' });
       }

       usuarioExistente.nombre = nombre;
       usuarioExistente.username = username;
       usuarioExistente.correo = correo;
       usuarioExistente.ci = ci;
       await usuarioExistente.save(); 

       res.status(200).json(usuarioExistente); 
     } catch (error) {
       console.log(error);
       res.status(500).json({ message: 'Error al actualizar el perfil' });
     }
   };
   