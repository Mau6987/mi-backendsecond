import { Router } from "express";
import { createUsuario, deleteUsuario, getUsuario, getUsuarios, updateUsuario,verificarTarjeta } from "../controllers/controllerUsuario.js";
import { login, refreshToken } from "../controllers/authController.js";
import {
    getCargasAgua,
    getCargaAguaById,
    createCargaAgua,
    updateCargaAgua,
    deleteCargaAgua
} from '../controllers/cargaAguaController.js';
import { createTipoDeCamion, deleteTipoDeCamion, getTipoDeCamion, getTiposDeCamion, updateTipoDeCamion } from "../controllers/controllerTipoDeCamion.js";
import {
    deletePagoCargaAgua, updatePagoCargaAgua, createPagoCargaAgua, getPagosCargaAgua, getUsuariosPropietariosConductores,
    getCargasDePropietarioDeuda,
    getCargasDeConductorDeuda, getPagoCargaAguaById, getPagosDeUsuario 
} from '../controllers/pagodeCargaAguaController.js';
import { getPerfil, updatePerfil } from '../controllers/controllerPerfil.js';
import {getCargasDeUsuario} from '../controllers/controllerCargaCliente.js';
import {getCargasDePropietario, getUsuariosDePropietario, getPropietarios} from '../controllers/controlerCargaPropietario.js';
import verifyToken from '../middleware/verifyToken.js';
import {getPagosDePropietario} from '../controllers/controllerPagosPropietario.js';

const router = Router();

// LOGIN
router.post('/login', login);
//router.post('/refresh-token', refreshToken);
//router.use(verifyToken);

// USUARIOS
router.get("/usuarios", getUsuarios);
router.get("/usuarios/:id", getUsuario);
router.post("/usuarios", createUsuario);
router.put("/usuarios/:id", updateUsuario);
router.delete("/usuarios/:id", deleteUsuario);

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

// PAGOS DE CARGA DE AGUA
router.get("/pagoscargagua", getPagosCargaAgua);
router.get("/pagoscargagua/:id", getPagoCargaAguaById);
router.post("/pagoscargagua", createPagoCargaAgua);
router.put("/pagoscargagua/:id", updatePagoCargaAgua);
router.delete("/pagoscargagua/:id", deletePagoCargaAgua);

//
router.get('/perfil/:id', getPerfil); // Ruta para obtener el perfil del usuario autenticado
router.put('/perfil/:id',  updatePerfil); // Ruta para actualizar el perfil del usuario autenticado
router.get('/cargascliente/:id', getCargasDeUsuario); 
router.get('/cargasPropietario/:id',getCargasDePropietario);
router.get('/conductores/:id', getUsuariosDePropietario);

router.get('/propietarios', getPropietarios);
router.get("/usuariosrol", getUsuariosPropietariosConductores);

router.get("/cargasPropietarioDeuda/:id", getCargasDePropietarioDeuda);
router.get("/cargasclienteDeuda/:id", getCargasDeConductorDeuda);

router.get("/pagoscliente/:id", getPagosDeUsuario);
router.get("/pagosPropietario/:id", getPagosDePropietario);


router.post('/verificartarjeta', verificarTarjeta);


export default router;
