import jwt from 'jsonwebtoken';
import { usuario as Usuario } from '../models/usuarios.js';

const SECRET_KEY = 'tu_clave_secreta';

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authorization.split(' ')[1];

  try {
    const user = await Usuario.findOne({ where: { token } });
    if (!user || user.tokenExpiresAt < new Date()) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

export default verifyToken;
