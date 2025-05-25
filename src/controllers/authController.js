import { usuario as Usuario } from '../models/usuarios.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { Sequelize } from 'sequelize';
//coai
const SECRET_KEY = 'tu_clave_secreta'; // Debe ser una clave secreta segura y mantenida en el archivo de configuración

   export const login = async (req, res) => {
       const { correo, username, password } = req.body;
       try {
           const user = await Usuario.findOne({
               where: {
                   [Sequelize.Op.or]: { username: username },
                   activo: true // Asegúrate de que el usuario esté activo
               }
           });

           if (!user) {
               return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
           }

           const isMatch = await bcrypt.compare(password, user.password);
           if (!isMatch) {
               return res.status(401).json({ error: 'Credenciales inválidas' });
           }

           const token = jwt.sign({ userId: user.id, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });
           const tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

           user.token = token;
           user.tokenExpiresAt = tokenExpiresAt;
           await user.save();

           return res.status(200).json({
               message: 'Inicio de sesión exitoso',
               token,
               rol: user.rol, // Aquí incluimos el rol en la respuesta
                idUser: user.id
           });
       } catch (error) {
           console.log(error);
           return res.status(500).json({ error: 'Error en el servidor' });
       }
   };
   

export const refreshToken = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: 'No se proporcionó un token' });
  }

  const token = authorization.split(' ')[1];
  try {
    const user = await Usuario.findOne({ where: { token } });
    if (!user || user.tokenExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const newToken = jwt.sign({ userId: user.id, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });
    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000);

    user.token = newToken;
    user.tokenExpiresAt = tokenExpiresAt;
    await user.save();

    return res.status(200).json({ 
      message: 'Token actualizado exitosamente',
      token: newToken,
      tokenExpiration: tokenExpiresAt,
    });
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
