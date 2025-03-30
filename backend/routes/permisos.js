const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verificarToken = require("../security/authMiddleware");
const verificarPermiso = require("../security/permisosMiddleware");

router.get("/", verificarToken, verificarPermiso("ver_permisos"), async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM permisos ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo permisos:", error);
        res.status(500).json({ error: "Error al obtener los permisos" });
    }
});

module.exports = router;
