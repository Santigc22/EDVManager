const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.post('/', verificarToken, verificarPermiso('registrar_materiales'), async (req, res) => {
    const { nombre, codigo, abreviatura, precio, unidad_medida_id } = req.body;

    if (!nombre || !codigo || !abreviatura || !precio || !unidad_medida_id) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
        const { rows: codigoExistente } = await pool.query(
            'SELECT id FROM materiales WHERE codigo = $1',
            [codigo]
        );
        if (codigoExistente.length > 0) {
            return res.status(400).json({ message: 'Ya existe un material con ese código' });
        }

        const { rows: abreviaturaExistente } = await pool.query(
            'SELECT id FROM materiales WHERE abreviatura = $1',
            [abreviatura]
        );
        if (abreviaturaExistente.length > 0) {
            return res.status(400).json({ message: 'Ya existe un material con esa abreviatura' });
        }

        const { rows: unidadExistente } = await pool.query(
            'SELECT id FROM unidades_medida WHERE id = $1',
            [unidad_medida_id]
        );
        if (unidadExistente.length === 0) {
            return res.status(400).json({ message: 'La unidad de medida no existe' });
        }

        await pool.query(
            `INSERT INTO materiales (nombre, codigo, abreviatura, cantidad, precio, unidad_medida_id)
             VALUES ($1, $2, $3, 0, $4, $5)`,
            [nombre, codigo, abreviatura, precio, unidad_medida_id]
        );

        res.status(201).json({ message: 'Material registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar material:', error);
        res.status(500).json({ message: 'Error al registrar material' });
    }
});

router.get('/', verificarToken, verificarPermiso('ver_materiales'), async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const resultadosPorPagina = parseInt(req.query.resultados_por_pagina) || 10;
        const offset = (pagina - 1) * resultadosPorPagina;

        const { nombre, codigo, abreviatura } = req.query;

        const filtros = [];
        const valores = [];

        if (nombre) {
            filtros.push(`LOWER(m.nombre) LIKE LOWER($${valores.length + 1})`);
            valores.push(`%${nombre}%`);
        }
        if (codigo) {
            filtros.push(`CAST(m.codigo AS TEXT) LIKE $${valores.length + 1}`);
            valores.push(`%${codigo}%`);
        }
        if (abreviatura) {
            filtros.push(`LOWER(m.abreviatura) LIKE LOWER($${valores.length + 1})`);
            valores.push(`%${abreviatura}%`);
        }

        const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

        const totalQuery = `SELECT COUNT(*) FROM materiales m ${whereClause}`;
        const { rows: totalRows } = await pool.query(totalQuery, valores);
        const totalMateriales = parseInt(totalRows[0].count);
        const totalPaginas = Math.ceil(totalMateriales / resultadosPorPagina);

        const query = `
            SELECT 
                m.id, m.nombre, m.codigo, m.abreviatura, m.cantidad, m.precio, 
                m.unidad_medida_id, 
                u.nombre AS unidad_medida_nombre, 
                u.abreviatura AS unidad_medida_abreviatura
            FROM materiales m
            JOIN unidades_medida u ON m.unidad_medida_id = u.id
            ${whereClause}
            ORDER BY m.id
            LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}
        `;
        valores.push(resultadosPorPagina, offset);

        const { rows: materiales } = await pool.query(query, valores);

        res.json({
            pagina,
            resultados_por_pagina: resultadosPorPagina,
            total_resultados: totalMateriales,
            total_paginas: totalPaginas,
            materiales
        });
    } catch (error) {
        console.error('Error al obtener materiales:', error);
        res.status(500).json({ message: 'Error al obtener materiales' });
    }
});

router.patch('/:id', verificarToken, verificarPermiso('modificar_materiales'), async (req, res) => {
    const { id } = req.params;
    const { nombre, codigo, abreviatura, precio, unidad_medida_id, cantidad } = req.body;

    if (cantidad !== undefined) {
        return res.status(400).json({ message: 'No se permite actualizar la cantidad desde esta API' });
    }

    try {
        const campos = [];
        const valores = [];
        let index = 1;

        if (nombre !== undefined) {
            campos.push(`nombre = $${index++}`);
            valores.push(nombre);
        }

        if (codigo !== undefined) {
            const { rows: codigoExistente } = await pool.query(
                'SELECT id FROM materiales WHERE codigo = $1 AND id != $2',
                [codigo, id]
            );
            if (codigoExistente.length > 0) {
                return res.status(400).json({ message: 'El código ya está registrado en otro material' });
            }
            campos.push(`codigo = $${index++}`);
            valores.push(codigo);
        }

        if (abreviatura !== undefined) {
            const { rows: abreviaturaExistente } = await pool.query(
                'SELECT id FROM materiales WHERE abreviatura = $1 AND id != $2',
                [abreviatura, id]
            );
            if (abreviaturaExistente.length > 0) {
                return res.status(400).json({ message: 'La abreviatura ya está registrada en otro material' });
            }
            campos.push(`abreviatura = $${index++}`);
            valores.push(abreviatura);
        }

        if (precio !== undefined) {
            campos.push(`precio = $${index++}`);
            valores.push(precio);
        }

        if (unidad_medida_id !== undefined) {
            campos.push(`unidad_medida_id = $${index++}`);
            valores.push(unidad_medida_id);
        }

        if (campos.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar' });
        }

        valores.push(id);
        const query = `UPDATE materiales SET ${campos.join(', ')} WHERE id = $${valores.length}`;
        await pool.query(query, valores);

        res.json({ message: 'Material actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar material:', error);
        res.status(500).json({ message: 'Error al actualizar material' });
    }
});

router.get('/:id', verificarToken, verificarPermiso('ver_materiales'), async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT m.id, m.nombre, m.codigo, m.abreviatura, m.cantidad, m.precio,
                   m.unidad_medida_id,
                   u.nombre AS unidad_medida_nombre,
                   u.abreviatura AS unidad_medida_abreviatura
            FROM materiales m
            JOIN unidades_medida u ON m.unidad_medida_id = u.id
            WHERE m.id = $1
        `;
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Material no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener el material:', error);
        res.status(500).json({ message: 'Error al obtener el material' });
    }
});

// MISING GET DETAIL

module.exports = router;
