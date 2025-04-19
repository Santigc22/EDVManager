const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.get('/', verificarToken, verificarPermiso("ver_bodegas"), async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const resultadosPorPagina = parseInt(req.query.resultados_por_pagina) || 10;
        const offset = (pagina - 1) * resultadosPorPagina;

        const filtros = [];
        const valores = [];
        let contador = 1;

        if (req.query.nombre) {
            filtros.push(`LOWER(nombre) LIKE LOWER($${contador++})`);
            valores.push(`%${req.query.nombre}%`);
        }

        if (req.query.estado !== undefined) {
            filtros.push(`estado = $${contador++}`);
            valores.push(req.query.estado === 'true');
        }

        const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

        const totalQuery = `SELECT COUNT(*) FROM bodegas ${whereClause}`;
        const { rows: totalRows } = await pool.query(totalQuery, valores);
        const totalBodegas = parseInt(totalRows[0].count);
        const totalPaginas = Math.ceil(totalBodegas / resultadosPorPagina);

        const query = `
            SELECT id, nombre, direccion, estado
            FROM bodegas
            ${whereClause}
            ORDER BY id
            LIMIT $${contador++} OFFSET $${contador}
        `;
        valores.push(resultadosPorPagina, offset);

        const { rows } = await pool.query(query, valores);

        res.json({
            pagina,
            resultados_por_pagina: resultadosPorPagina,
            total_resultados: totalBodegas,
            total_paginas: totalPaginas,
            bodegas: rows
        });
    } catch (error) {
        console.error('Error al obtener bodegas:', error);
        res.status(500).json({ message: 'Error al obtener bodegas' });
    }
});

router.post('/', verificarToken, verificarPermiso("registrar_bodegas"), async (req, res) => {
    const { nombre, direccion } = req.body;

    if (!nombre || !direccion) {
        return res.status(400).json({ message: "El nombre y la dirección son obligatorios" });
    }

    try {
        const query = `
            INSERT INTO bodegas (nombre, direccion, estado)
            VALUES ($1, $2, true)
            RETURNING id, nombre, direccion, estado
        `;
        const values = [nombre, direccion];

        const { rows } = await pool.query(query, values);
        res.status(201).json({
            message: "Bodega registrada exitosamente",
            bodega: rows[0]
        });
    } catch (error) {
        console.error('Error al registrar bodega:', error);
        res.status(500).json({ message: 'Error al registrar bodega' });
    }
});

router.patch('/:id', verificarToken, verificarPermiso("modificar_bodegas"), async (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, estado } = req.body;

    if (nombre === undefined && direccion === undefined && estado === undefined) {
        return res.status(400).json({ message: "Debe enviar al menos un campo para actualizar" });
    }

    try {
        const campos = [];
        const valores = [];
        let contador = 1;

        if (nombre !== undefined) {
            campos.push(`nombre = $${contador++}`);
            valores.push(nombre);
        }

        if (direccion !== undefined) {
            campos.push(`direccion = $${contador++}`);
            valores.push(direccion);
        }

        if (estado !== undefined) {
            campos.push(`estado = $${contador++}`);
            valores.push(estado);
        }

        valores.push(id);

        const query = `
            UPDATE bodegas
            SET ${campos.join(', ')}
            WHERE id = $${contador}
            RETURNING id, nombre, direccion, estado
        `;

        const { rows } = await pool.query(query, valores);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Bodega no encontrada" });
        }

        res.json({
            message: "Bodega actualizada exitosamente",
            bodega: rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar bodega:', error);
        res.status(500).json({ message: 'Error al actualizar bodega' });
    }
});

router.get('/:id', verificarToken, verificarPermiso('ver_bodegas'), async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(
            'SELECT id, nombre, direccion, estado FROM bodegas WHERE id = $1',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Bodega no encontrada' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener la bodega:', error);
        res.status(500).json({ message: 'Error al obtener la bodega' });
    }
});

module.exports = router;
