const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM permisos ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo permisos:", error);
        res.status(500).json({ error: "Error al obtener los permisos" });
    }
});

module.exports = router;
