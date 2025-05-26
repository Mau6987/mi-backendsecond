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
} from "../controllers/reportesController.js"; 

import {
  getPrecios,
  getPrecioById,
  createPrecio,
  updatePrecio,
  deletePrecio,
} from "../controllers/precioCargaAguaController.js"; 

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
import { getPagosDePropietario } from '../controllers/controllerPagosPropietario.js';

import {
  getPagosCargaAgua,
  getPagoCargaAguaById,
  createPagoCargaAgua,
  createPagoCargaAgua2,
  updatePagoCargaAgua,
  deletePagoCargaAgua,
  getPagosDeUsuario,
  getUsuariosPropietariosConductores,
  getCargasDePropietarioDeuda,
  getCargasDeConductorDeuda,
  getPagosPorParametros,
  getPagosPorParametros2,
  toggleActivoPago,
} from '../controllers/pagoCargaAguaController.js'; 

const router = Router();

// LOGIN
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// USUARIOS
router.get("/usuarios", getUsuarios);
router.get("/usuarios/:id", getUsuario);
router.post("/usuarios", createUsuario);
router.put("/usuarios/:id", updateUsuario);
router.delete("/usuarios/:id", deleteUsuario);
router.get("/usuariosrol", getUsuariosPorRol);
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
router.get("/pagoscargagua", getPagosCargaAgua);
router.get("/pagoscargagua/:id", getPagoCargaAguaById);
router.post("/pagoscargagua", createPagoCargaAgua);
router.put("/pagoscargagua/:id", updatePagoCargaAgua);
router.delete("/pagoscargagua/:id", deletePagoCargaAgua);
router.get("/pagosPropietario/:id", getPagosDePropietario);
router.get("/pagoscliente/:id", getPagosDeUsuario);

// VERIFICACIONES
router.post('/verificartarjeta', verificarTarjeta);

// CONSULTAS
router.post('/consultacargas', getCargasPorParametros);
router.post('/consultacargas2', getCargasPorParametros2);
router.post('/consultapagos', getPagosPorParametros);
router.post('/consultapagos2', getPagosPorParametros2);

// PRECIOS
router.get("/precios", getPrecios);
router.get("/precios/:id", getPrecioById);
router.post("/precios", createPrecio);
router.put("/precios/:id", updatePrecio);
router.delete("/precios/:id", deletePrecio);

// Rutas para reportes
router.post("/reportes/cargas/periodo", reporteCargasPorPeriodo);
router.post("/reportes/pagos/periodo", reportePagosPorPeriodo);
router.post("/reportes/usuarios/actividad", reporteUsuariosPorActividad);
router.get("/reportes/deudas", reporteDeudas);
router.post("/reportes/ingresos", reporteIngresos);
router.get("/reportes/usuarios/bloqueados", reporteUsuariosBloqueados);
router.post("/reportes/rendimiento/tipoCamion", reporteRendimientoPorTipoCamion);
router.get("/reportes/historial/precios", reporteHistorialPrecios);

export default router;
