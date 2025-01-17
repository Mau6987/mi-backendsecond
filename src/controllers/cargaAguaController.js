// controllers/cargaAguaController.js
import { cargaAgua } from '../models/cargaAgua.js';
import { usuario } from '../models/usuarios.js';
import {tipoDeCamion } from '../models/tipoDeCamion.js'

export const getCargasAgua = async (req, res) => {
    try {
        const cargas = await cargaAgua.findAll({
            include: [usuario, tipoDeCamion]
        });
        res.status(200).json(cargas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las cargas de agua' });
    }
};

export const getCargaAguaById = async (req, res) => {
    const { id } = req.params;
    try {
        const carga = await cargaAgua.findByPk(id, {
            include: [usuario, tipoDeCamion]
        });
        if (!carga) {
            res.status(404).json({ message: 'Carga de agua no encontrada' });
        } else {
            res.status(200).json(carga);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la carga de agua' });
    }
};

export const createCargaAgua = async (req, res) => {
    const { fechaHora, estado, usuarioId, tipoCamionId } = req.body;
    try {
        const nuevaCarga = await cargaAgua.create({
            fechaHora,
            estado,
            usuarioId,
            tipoCamionId
        });
        res.status(201).json(nuevaCarga);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la carga de agua' });
    }
};

export const updateCargaAgua = async (req, res) => {
    const { id } = req.params;
    const { fechaHora, estado, usuarioId, tipoCamionId } = req.body;
    try {
        const carga = await cargaAgua.findByPk(id);
        if (!carga) {
            res.status(404).json({ message: 'Carga de agua no encontrada' });
        } else {
            carga.fechaHora = fechaHora;
            carga.estado = estado;
            carga.usuarioId = usuarioId;
            carga.tipoCamionId = tipoCamionId;
            await carga.save();
            res.status(200).json(carga);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la carga de agua' });
    }
};

export const deleteCargaAgua = async (req, res) => {
    const { id } = req.params;
    try {
        const carga = await cargaAgua.findByPk(id);
        if (!carga) {
            res.status(404).json({ message: 'Carga de agua no encontrada' });
        } else {
            await carga.destroy();
            res.status(200).json({ message: 'Carga de agua eliminada correctamente' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la carga de agua' });
    }
};
