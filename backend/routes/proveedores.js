const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.get('/', verificarToken, verificarPermiso("ver_proveedores"), async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const resultadosPorPagina = parseInt(req.query.resultados_por_pagina) || 10;

        const offset = (pagina - 1) * resultadosPorPagina;

        const { rows: totalRows } = await pool.query('SELECT COUNT(*) FROM proveedores');
        const totalProveedores = parseInt(totalRows[0].count);
        const totalPaginas = Math.ceil(totalProveedores / resultadosPorPagina);

        const query = `
            SELECT id, nombre, estado
            FROM proveedores
            ORDER BY id
            LIMIT $1 OFFSET $2
        `;
        const values = [resultadosPorPagina, offset];
        const { rows } = await pool.query(query, values);

        res.json({
            pagina: pagina,
            resultados_por_pagina: resultadosPorPagina,
            total_resultados: totalProveedores,
            total_paginas: totalPaginas,
            proveedores: rows
        });
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ message: 'Error al obtener proveedores' });
    }
});

router.post('/', verificarToken, verificarPermiso("registrar_proveedores"), async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
        }

        const query = 'INSERT INTO proveedores (nombre, estado) VALUES ($1, $2) RETURNING *';
        const values = [nombre, true];

        const { rows } = await pool.query(query, values);

        res.status(201).json({
            message: 'Proveedor registrado exitosamente',
            proveedor: rows[0]
        });
    } catch (error) {
        console.error('Error al registrar proveedor:', error);
        res.status(500).json({ message: 'Error al registrar proveedor' });
    }
});

router.patch('/:id', verificarToken, verificarPermiso("modificar_proveedores"), async (req, res) => {
    const { id } = req.params;
    const { nombre, estado } = req.body;

    if (nombre === undefined && estado === undefined) {
        return res.status(400).json({ message: "Debe proporcionar al menos un campo para actualizar (nombre o estado)." });
    }

    try {
        const campos = [];
        const valores = [];
        let contador = 1;

        if (nombre !== undefined) {
            campos.push(`nombre = $${contador++}`);
            valores.push(nombre);
        }

        if (estado !== undefined) {
            campos.push(`estado = $${contador++}`);
            valores.push(estado);
        }

        valores.push(id);
        const query = `UPDATE proveedores SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`;

        const { rowCount, rows } = await pool.query(query, valores);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Proveedor no encontrado" });
        }

        res.json({
            message: "Proveedor actualizado exitosamente",
            proveedor: rows[0]
        });
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        res.status(500).json({ message: "Error al actualizar proveedor" });
    }
});

module.exports = router;