import { tipoDeCamion } from "../models/tipoDeCamion.js";

export const getTiposDeCamion = async (req, res) => {
    try {
        const tiposDeCamion = await tipoDeCamion.findAll();
        const formatoTiposDeCamion = tiposDeCamion.map((tipo) => {
            return {
                id: tipo.id,
                descripcion: tipo.descripcion,
                cantidadDeAgua: tipo.cantidadDeAgua
            };
        });
        res.status(200).json(formatoTiposDeCamion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al obtener los tipos de camión" });
    }
};

export const getTipoDeCamion = async (req, res) => {
    try {
        const { id } = req.params;
        const unTipoDeCamion = await tipoDeCamion.findOne({ where: { id } });

        if (!unTipoDeCamion) {
            return res.status(404).json({ message: 'Tipo de Camión no encontrado' });
        }

        const formatoTipoDeCamion = {
            descripcion: unTipoDeCamion.descripcion,
            cantidadDeAgua: unTipoDeCamion.cantidadDeAgua
        };

        res.status(200).json(formatoTipoDeCamion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al obtener el tipo de camión' });
    }
};

export const createTipoDeCamion = async (req, res) => {
    try {
        const { descripcion, cantidadDeAgua } = req.body;
        const nuevoTipoDeCamion = await tipoDeCamion.create({
            descripcion,
            cantidadDeAgua
        });

        res.status(201).json(nuevoTipoDeCamion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al crear el tipo de camión' });
    }
};

export const updateTipoDeCamion = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, cantidadDeAgua } = req.body;

        const tipoDeCamionExistente = await tipoDeCamion.findByPk(id);

        if (!tipoDeCamionExistente) {
            return res.status(404).json({ message: 'Tipo de Camión no encontrado' });
        }

        tipoDeCamionExistente.descripcion = descripcion;
        tipoDeCamionExistente.cantidadDeAgua = cantidadDeAgua;

        await tipoDeCamionExistente.save();

        res.status(200).json(tipoDeCamionExistente);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al actualizar el tipo de camión' });
    }
};

export const deleteTipoDeCamion = async (req, res) => {
    try {
        const { id } = req.params;

        const tipoDeCamionExistente = await tipoDeCamion.findByPk(id);

        if (!tipoDeCamionExistente) {
            return res.status(404).json({ message: 'Tipo de Camión no encontrado' });
        }

        await tipoDeCamionExistente.destroy();

        res.status(200).json({ message: 'Tipo de Camión eliminado exitosamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error al eliminar el tipo de camión' });
    }
};
