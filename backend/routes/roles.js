const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
    const { nombre, permisos } = req.body;

    try {
        const newRole = await pool.query(
            "INSERT INTO roles (nombre) VALUES ($1) RETURNING id",
            [nombre]
        );
        const rolId = newRole.rows[0].id;

        const permisosArray = permisos.map(permisoId => `(${rolId}, ${permisoId})`).join(",");
        if (permisos.length > 0) {
            await pool.query(
                `INSERT INTO roles_permisos (rol_id, permiso_id) VALUES ${permisosArray}`
            );
        }

        res.status(201).json({ message: "Rol creado con éxito", rolId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el rol" });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.nombre AS rol, COALESCE(json_agg(p.nombre) FILTER (WHERE p.nombre IS NOT NULL), '[]') AS permisos
            FROM roles r
            LEFT JOIN roles_permisos rp ON r.id = rp.rol_id
            LEFT JOIN permisos p ON rp.permiso_id = p.id
            GROUP BY r.id, r.nombre;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.patch('/:id', async (req, res) => {
    const { id } = req.params; 
    const { nombre, permisos } = req.body; 

    try {
        const rolExistente = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
        if (rolExistente.rows.length === 0) {
            return res.status(404).json({ error: 'El rol no existe' });
        }

        if (nombre) {
            await pool.query('UPDATE roles SET nombre = $1 WHERE id = $2', [nombre, id]);
        }

        if (permisos && permisos.length > 0) {
            await pool.query('DELETE FROM roles_permisos WHERE rol_id = $1', [id]);

            const valoresPermisos = permisos.map(permisoId => `(${id}, ${permisoId})`).join(',');
            await pool.query(`INSERT INTO roles_permisos (rol_id, permiso_id) VALUES ${valoresPermisos}`);
        }

        res.json({ message: 'Rol actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el rol:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si el rol existe
        const rolExistente = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
        if (rolExistente.rows.length === 0) {
            return res.status(404).json({ error: 'El rol no existe' });
        }

        // Eliminar los permisos asociados a ese rol
        await pool.query('DELETE FROM roles_permisos WHERE rol_id = $1', [id]);

        // Eliminar el rol
        await pool.query('DELETE FROM roles WHERE id = $1', [id]);

        res.json({ message: 'Rol eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el rol:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
