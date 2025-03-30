const express = require('express');
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require('../config/db');

router.post("/", async (req, res) => {
    try {
        const { nombre, username, contrasenia, email, identificacion, roles } = req.body;

        if (!nombre || !username || !contrasenia || !email || !identificacion) {
            return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasenia, saltRounds);

        const usuarioQuery = `
            INSERT INTO usuarios (nombre, username, contrasenia, email, identificacion)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `;
        const { rows } = await pool.query(usuarioQuery, [nombre, username, hashedPassword, email, identificacion]);
        const usuarioId = rows[0].id;

        if (roles && roles.length > 0) {
            const valoresRoles = roles.map(rolId => `(${usuarioId}, ${rolId})`).join(",");
            const rolesQuery = `INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ${valoresRoles}`;
            await pool.query(rolesQuery);
        }

        res.status(201).json({ mensaje: "Usuario registrado con éxito." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al registrar usuario." });
    }
});

router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, username, email, identificacion, estado, roles } = req.body;

    try {
        const { rows } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const usuarioActual = rows[0];

        const nuevoNombre = nombre !== undefined ? nombre : usuarioActual.nombre;
        const nuevoUsername = username !== undefined ? username : usuarioActual.username;
        const nuevoEmail = email !== undefined ? email : usuarioActual.email;
        const nuevaIdentificacion = identificacion !== undefined ? identificacion : usuarioActual.identificacion;
        const nuevoEstado = estado !== undefined ? estado : usuarioActual.estado;

        await pool.query(
            `UPDATE usuarios 
             SET nombre = $1, username = $2, email = $3, identificacion = $4, estado = $5, fecha_modificacion = NOW() 
             WHERE id = $6`,
            [nuevoNombre, nuevoUsername, nuevoEmail, nuevaIdentificacion, nuevoEstado, id]
        );

        if (roles !== undefined) {
            const { rows: rolesActuales } = await pool.query(
                "SELECT rol_id FROM usuarios_roles WHERE usuario_id = $1",
                [id]
            );

            const rolesActualesIds = rolesActuales.map((r) => r.rol_id);
            const rolesNuevosIds = roles || [];

            const rolesAEliminar = rolesActualesIds.filter((rol) => !rolesNuevosIds.includes(rol));

            const rolesAAgregar = rolesNuevosIds.filter((rol) => !rolesActualesIds.includes(rol));

            if (rolesAEliminar.length > 0) {
                await pool.query(
                    "DELETE FROM usuarios_roles WHERE usuario_id = $1 AND rol_id = ANY($2)",
                    [id, rolesAEliminar]
                );
            }

            if (rolesAAgregar.length > 0) {
                const insertQueries = rolesAAgregar.map((rol) =>
                    pool.query("INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)", [id, rol])
                );
                await Promise.all(insertQueries);
            }
        }

        res.json({ message: "Usuario actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error actualizando el usuario" });
    }
});

router.get("/", async (req, res) => {
    try {
        const resultadosPorPagina = parseInt(req.query.resultados_por_pagina) || 10;
        const pagina = parseInt(req.query.pagina) || 1;
        const offset = (pagina - 1) * resultadosPorPagina;

        const { nombre, username, email, identificacion, ordenar_por, orden } = req.query;
        let filtros = [];
        let valores = [];

        if (nombre) {
            valores.push(`%${nombre}%`);
            filtros.push(`u.nombre ILIKE $${valores.length}`);
        }
        if (username) {
            valores.push(`%${username}%`);
            filtros.push(`u.username ILIKE $${valores.length}`);
        }
        if (email) {
            valores.push(`%${email}%`);
            filtros.push(`u.email ILIKE $${valores.length}`);
        }
        if (identificacion) {
            valores.push(`%${identificacion}%`);
            filtros.push(`CAST(u.identificacion AS TEXT) ILIKE $${valores.length}`);
        }

        const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

        const camposOrdenables = ["nombre", "fecha_creacion", "fecha_modificacion"];
        const campoOrden = camposOrdenables.includes(ordenar_por) ? `u.${ordenar_por}` : "u.id";

        const tipoOrden = orden && orden.toUpperCase() === "DESC" ? "DESC" : "ASC";

        const countQuery = `
            SELECT COUNT(DISTINCT u.id) AS total
            FROM usuarios u
            LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id
            LEFT JOIN roles r ON ur.rol_id = r.id
            ${whereClause};
        `;
        const countResult = await pool.query(countQuery, valores);
        const totalResultados = parseInt(countResult.rows[0].total) || 0;

        valores.push(resultadosPorPagina, offset);
        const query = `
            SELECT 
                u.id, u.nombre, u.username, u.email, u.identificacion, u.estado, u.fecha_creacion, u.fecha_modificacion,
                COALESCE(json_agg(json_build_object('id', r.id, 'nombre', r.nombre)) FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
            FROM usuarios u
            LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id
            LEFT JOIN roles r ON ur.rol_id = r.id
            ${whereClause}
            GROUP BY u.id
            ORDER BY ${campoOrden} ${tipoOrden}
            LIMIT $${valores.length - 1} OFFSET $${valores.length};
        `;
        
        const { rows } = await pool.query(query, valores);

        res.json({
            pagina_actual: pagina,
            resultados_por_pagina: resultadosPorPagina,
            total_resultados: totalResultados,
            total_paginas: Math.ceil(totalResultados / resultadosPorPagina),
            usuarios: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error obteniendo los usuarios" });
    }
});

module.exports = router;
