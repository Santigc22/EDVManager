const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.get('/movimientos-ultimos-dias', verificarToken, verificarPermiso('ver_indicadores'), async (req, res) => {
  try {
    const query = `
      WITH fechas AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE, INTERVAL '1 day')::date AS fecha
      ),
      movimientos_por_dia AS (
        SELECT 
          DATE(fecha_hora) AS fecha,
          COUNT(*) AS cantidad
        FROM movimientos
        WHERE fecha_hora >= CURRENT_DATE - INTERVAL '9 days'
        GROUP BY DATE(fecha_hora)
      )
      SELECT 
        f.fecha,
        COALESCE(m.cantidad, 0) AS cantidad
      FROM fechas f
      LEFT JOIN movimientos_por_dia m ON f.fecha = m.fecha
      ORDER BY f.fecha DESC
    `;

    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener indicadores de movimientos:', error);
    res.status(500).json({ message: 'Error al obtener indicadores de movimientos' });
  }
});

router.get('/materiales-sin-stock', verificarToken, verificarPermiso('ver_indicadores'), async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.nombre,
        m.codigo,
        m.abreviatura,
        m.cantidad,
        m.precio,
        u.nombre AS unidad_medida
      FROM materiales m
      JOIN unidades_medida u ON m.unidad_medida_id = u.id
      WHERE m.cantidad = 0
      ORDER BY m.nombre
    `;

    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener materiales sin stock:', error);
    res.status(500).json({ message: 'Error al obtener materiales sin stock' });
  }
});

module.exports = router;
