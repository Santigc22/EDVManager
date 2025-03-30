const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
    const { username, contrasenia } = req.body;

    try {
        const { rows: usuarios } = await pool.query(
            "SELECT id, username, contrasenia, nombre, email FROM usuarios WHERE username = $1",
            [username]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }

        const usuario = usuarios[0];

        const passwordCorrecta = await bcrypt.compare(contrasenia, usuario.contrasenia);
        if (!passwordCorrecta) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }

        const { rows: roles } = await pool.query(
            `SELECT r.nombre AS rol 
             FROM roles r 
             INNER JOIN usuarios_roles ur ON r.id = ur.rol_id 
             WHERE ur.usuario_id = $1`,
            [usuario.id]
        );

        const rolesUsuario = roles.map(rol => rol.rol);

        const { rows: permisos } = await pool.query(
            `SELECT DISTINCT p.nombre AS permiso
             FROM permisos p
             INNER JOIN roles_permisos rp ON p.id = rp.permiso_id
             INNER JOIN usuarios_roles ur ON rp.rol_id = ur.rol_id
             WHERE ur.usuario_id = $1`,
            [usuario.id]
        );

        const permisosUsuario = permisos.map(permiso => permiso.permiso);

        const token = jwt.sign(
            { 
                id: usuario.id, 
                username: usuario.username, 
                email: usuario.email, 
                roles: rolesUsuario,
                permisos: permisosUsuario
            }, 
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            message: "Login exitoso",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                username: usuario.username,
                email: usuario.email,
                roles: rolesUsuario,
                permisos: permisosUsuario
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
});

module.exports = router;
