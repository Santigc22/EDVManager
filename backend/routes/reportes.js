const express = require('express');
const router = express.Router();
const fs = require('fs');
const pool = require('../config/db');
const { generarReporteInventario } = require('../utils/reporteInventario');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.post('/inventario', verificarToken, verificarPermiso('generar_reportes'), async (req, res) => {
  try {
    const { bodegas } = req.body;

    if (!bodegas || !Array.isArray(bodegas) || bodegas.length === 0) {
      return res.status(400).json({ message: 'Debes enviar al menos una bodega' });
    }

    const query = `
      SELECT 
        b.id AS bodega_id,
        b.nombre AS bodega_nombre,
        m.id AS material_id,
        m.nombre AS material_nombre,
        m.codigo,
        m.abreviatura,
        m.precio,
        um.nombre AS unidad,
        mb.cantidad
      FROM materiales_bodegas mb
      JOIN bodegas b ON mb.bodega_id = b.id
      JOIN materiales m ON mb.material_id = m.id
      JOIN unidades_medida um ON m.unidad_medida_id = um.id
      WHERE b.id = ANY($1)
      ORDER BY b.nombre, m.nombre
    `;

    const { rows } = await pool.query(query, [bodegas]);

    const bodegasData = [];
    const bodegasMap = new Map();

    for (const row of rows) {
      if (!bodegasMap.has(row.bodega_id)) {
        bodegasMap.set(row.bodega_id, {
          nombre: row.bodega_nombre,
          materiales: []
        });
      }

      bodegasMap.get(row.bodega_id).materiales.push({
        nombre: row.material_nombre,
        codigo: row.codigo,
        abreviatura: row.abreviatura,
        cantidad: row.cantidad,
        precio: row.precio,
        unidad: row.unidad
      });
    }

    for (const bodega of bodegasMap.values()) {
      bodegasData.push(bodega);
    }

    const filePath = await generarReporteInventario(bodegasData);

    res.download(filePath, 'reporte_inventario.xlsx', (err) => {
      if (err) {
        console.error('Error al descargar:', err);
        res.status(500).json({ message: 'Error al enviar el archivo' });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('Error generando reporte de inventario:', error);
    res.status(500).json({ message: 'Error generando reporte de inventario' });
  }
});

module.exports = router;
