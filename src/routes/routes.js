import { Router } from "express";
import { 
  createUsuario, 
  deleteUsuario, 
  getUsuario, 
  getUsuarios, 
  updateUsuario, 
  verificarTarjeta,
  bloquearUsuario,
  desbloquearUsuario,
  verificarBloqueo,
  getUsuariosPorRol
} from "../controllers/controllerUsuario.js";
import { login, refreshToken } from "../controllers/authController.js";
import { 
  getCargasAgua, 
  getCargaAguaById, 
  createCargaAgua, 
  updateCargaAgua, 
  deleteCargaAgua, 
  getCargasPorParametros, 
  getCargasPorParametros2,
  registrarCargaPorRFID
} from '../controllers/cargaAguaController.js';
import {
  reporteCargasPorPeriodo,
  reportePagosPorPeriodo,
  reporteUsuariosPorActividad,
  reporteDeudas,
  reporteIngresos,
  reporteUsuariosBloqueados,
  reporteRendimientoPorTipoCamion,
  reporteHistorialPrecios,
} from "../controllers/reportesController.js"; // Asegúrate de que la ruta sea correcta

import {
  getPrecios,
  getPrecioById,
  createPrecio,
  updatePrecio,
  deletePrecio,
} from "../controllers/precioCargaAguaController.js"; // Asegúrate de que la ruta sea correcta
// Rutas para precios de carga de agua
import { 
  createTipoDeCamion, 
  deleteTipoDeCamion, 
  getTipoDeCamion, 
  getTiposDeCamion, 
  updateTipoDeCamion 
} from "../controllers/controllerTipoDeCamion.js";
import { getPerfil, updatePerfil } from '../controllers/controllerPerfil.js';
import { getCargasDeUsuario } from '../controllers/controllerCargaCliente.js';
import { 
  getCargasDePropietario, 
  getUsuariosDePropietario, 
  getPropietarios 
} from '../controllers/controlerCargaPropietario.js';
import verifyToken from '../middleware/verifyToken.js';
import { getPagosDePropietario } from '../controllers/controllerPagosPropietario.js';

const router = Router();



// LOGIN
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Middleware de autenticación (comentado por ahora)
//router.use(verifyToken);

// USUARIOS
router.get("/usuarios", getUsuarios);
router.get("/usuarios/:id", getUsuario);
router.post("/usuarios", createUsuario);
router.put("/usuarios/:id", updateUsuario);
router.delete("/usuarios/:id", deleteUsuario);


router.get("/usuariosrol", getUsuariosPorRol);
// BLOQUEO DE USUARIOS (nuevos endpoints)
router.post("/usuarios/:id/bloquear", bloquearUsuario);
router.post("/usuarios/:id/desbloquear", desbloquearUsuario);
router.get("/usuarios/:id/verificar-bloqueo", verificarBloqueo);

// TIPOS DE CAMION
router.get("/tiposDeCamion", getTiposDeCamion);
router.get("/tiposDeCamion/:id", getTipoDeCamion);
router.post("/tiposDeCamion", createTipoDeCamion);
router.put("/tiposDeCamion/:id", updateTipoDeCamion);
router.delete("/tiposDeCamion/:id", deleteTipoDeCamion);

// CARGAS DE AGUA
router.get('/cargagua', getCargasAgua);
router.get('/cargagua/:id', getCargaAguaById);
router.post('/cargagua', createCargaAgua);
router.put('/cargagua/:id', updateCargaAgua);
router.delete('/cargagua/:id', deleteCargaAgua);
router.post('/registroRFID', registrarCargaPorRFID);

// PERFIL
router.get('/perfil/:id', getPerfil);
router.put('/perfil/:id', updatePerfil);

// CARGAS CLIENTE Y PROPIETARIO
router.get('/cargascliente/:id', getCargasDeUsuario);
router.get('/cargasPropietario/:id', getCargasDePropietario);
router.get('/conductores/:id', getUsuariosDePropietario);
router.get('/propietarios', getPropietarios);

// PAGOS
router.get("/pagosPropietario/:id", getPagosDePropietario);

// VERIFICACIONES
router.post('/verificartarjeta', verificarTarjeta);

// CONSULTAS
router.post('/consultacargas', getCargasPorParametros);
router.post('/consultacargas2', getCargasPorParametros2);

router.get("/precios", getPrecios); // Obtener todos los precios
router.get("/precios/:id", getPrecioById); // Obtener un precio por ID
router.post("/precios", createPrecio); // Crear un nuevo precio
router.put("/precios/:id", updatePrecio); // Actualizar un precio existente
router.delete("/precios/:id", deletePrecio); // Eliminar un precio (soft delete)
// Rutas para reportes
router.post("/reportes/cargas/periodo", reporteCargasPorPeriodo); // Reporte de cargas de agua por período
router.post("/reportes/pagos/periodo", reportePagosPorPeriodo); // Reporte de pagos por período
router.post("/reportes/usuarios/actividad", reporteUsuariosPorActividad); // Reporte de usuarios por actividad
router.get("/reportes/deudas", reporteDeudas); // Reporte de deudas por usuario
router.post("/reportes/ingresos", reporteIngresos); // Reporte de ingresos por período
router.get("/reportes/usuarios/bloqueados", reporteUsuariosBloqueados); // Reporte de usuarios bloqueados
router.post("/reportes/rendimiento/tipoCamion", reporteRendimientoPorTipoCamion); // Reporte de rendimiento por tipo de camión
router.get("/reportes/historial/precios", reporteHistorialPrecios); // Reporte de historial de precios
export default router;