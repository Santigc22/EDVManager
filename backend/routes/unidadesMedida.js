const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.post('/', verificarToken, verificarPermiso("registrar_unidades_medida"), async (req, res) => {
    const { nombre, abreviatura } = req.body;

    if (!nombre || !abreviatura) {
        return res.status(400).json({ message: "Nombre y abreviatura son obligatorios" });
    }

    try {
        const { rows: abreviaturaExistente } = await pool.query(
            'SELECT id FROM unidades_medida WHERE abreviatura = $1',
            [abreviatura]
        );

        if (abreviaturaExistente.length > 0) {
            return res.status(409).json({ message: "La abreviatura ya está registrada" });
        }

        const { rows } = await pool.query(
            'INSERT INTO unidades_medida (nombre, abreviatura) VALUES ($1, $2) RETURNING id, nombre, abreviatura',
            [nombre, abreviatura]
        );

        res.status(201).json({
            message: "Unidad de medida registrada exitosamente",
            unidad_medida: rows[0]
        });

    } catch (error) {
        console.error('Error al registrar unidad de medida:', error);
        res.status(500).json({ message: 'Error al registrar unidad de medida' });
    }
});

router.get('/', verificarToken, verificarPermiso("ver_unidades_medida"), async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, nombre, abreviatura FROM unidades_medida ORDER BY id'
        );

        res.json({
            unidades_medida: rows
        });
    } catch (error) {
        console.error('Error al obtener unidades de medida:', error);
        res.status(500).json({ message: 'Error al obtener unidades de medida' });
    }
});

router.patch('/:id', verificarToken, verificarPermiso("modificar_unidades_medida"), async (req, res) => {
    const { id } = req.params;
    const { nombre, abreviatura } = req.body;

    try {
        if (!nombre && !abreviatura) {
            return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar' });
        }

        if (abreviatura) {
            const { rows: abreviaturaExistente } = await pool.query(
                'SELECT id FROM unidades_medida WHERE abreviatura = $1 AND id != $2',
                [abreviatura, id]
            );

            if (abreviaturaExistente.length > 0) {
                return res.status(400).json({ message: 'Ya existe una unidad de medida con esa abreviatura' });
            }
        }

        const campos = [];
        const valores = [];
        let indice = 1;

        if (nombre) {
            campos.push(`nombre = $${indice++}`);
            valores.push(nombre);
        }

        if (abreviatura) {
            campos.push(`abreviatura = $${indice++}`);
            valores.push(abreviatura);
        }

        valores.push(id);

        const query = `UPDATE unidades_medida SET ${campos.join(', ')} WHERE id = $${indice}`;
        await pool.query(query, valores);

        res.json({ message: 'Unidad de medida actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar unidad de medida:', error);
        res.status(500).json({ message: 'Error al actualizar unidad de medida' });
    }
});

module.exports = router;
