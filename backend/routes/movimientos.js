const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.post('/entrada-c', verificarToken, verificarPermiso('registrar_movimientos'), async (req, res) => {
      const usuarioId = req.usuario.id;
      const { proveedor_id, bodega_destino_id, observaciones, materiales } = req.body;
  
      if (!proveedor_id || !bodega_destino_id || !Array.isArray(materiales) || materiales.length === 0) {
        return res.status(400).json({
          message: 'Debe proporcionar proveedor_id, bodega_destino_id y al menos un material con material_id y cantidad.'
        });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const insertMovText = `
          INSERT INTO movimientos (
            tipo, usuario_id, proveedor_id, bodega_destino_id, observaciones
          ) VALUES (
            'ENTRADA_C', $1, $2, $3, $4
          ) RETURNING id
        `;
        const { rows: movRows } = await client.query(insertMovText, [
          usuarioId,
          proveedor_id,
          bodega_destino_id,
          observaciones || null
        ]);
        const movimientoId = movRows[0].id;
  
        for (const item of materiales) {
          const { material_id, cantidad } = item;
          if (!material_id || cantidad == null || isNaN(cantidad) || cantidad <= 0) {
            throw new Error('Cada material debe incluir material_id y cantidad > 0.');
          }
  
          await client.query(
            `INSERT INTO movimiento_materiales (movimiento_id, material_id, cantidad)
             VALUES ($1, $2, $3)`,
            [movimientoId, material_id, cantidad]
          );
  
          const upsertMbText = `
            INSERT INTO materiales_bodegas (material_id, bodega_id, cantidad)
            VALUES ($1, $2, $3)
            ON CONFLICT (material_id, bodega_id)
            DO UPDATE SET cantidad = materiales_bodegas.cantidad + EXCLUDED.cantidad
          `;
          await client.query(upsertMbText, [
            material_id,
            bodega_destino_id,
            cantidad
          ]);
  
          await client.query(
            `UPDATE materiales
             SET cantidad = cantidad + $1
             WHERE id = $2`,
            [cantidad, material_id]
          );
        }
  
        await client.query('COMMIT');
        res.status(201).json({
          message: 'Movimiento ENTRADA_C registrado exitosamente',
          movimiento_id: movimientoId
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registrando movimiento ENTRADA_C:', error);
        res.status(500).json({ message: 'Error al registrar el movimiento' });
      } finally {
        client.release();
      }
    }
  );

  router.post('/traslado', verificarToken, verificarPermiso('registrar_movimientos'), async (req, res) => {
      const usuarioId = req.usuario.id;
      const {
        bodega_origen_id,
        bodega_destino_id,
        observaciones,
        materiales
      } = req.body;
  
      if (
        !bodega_origen_id ||
        !bodega_destino_id ||
        bodega_origen_id === bodega_destino_id ||
        !Array.isArray(materiales) ||
        materiales.length === 0
      ) {
        return res.status(400).json({
          message:
            'Debe proporcionar bodega_origen_id y bodega_destino_id diferentes, y al menos un material con material_id y cantidad.'
        });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const insertMov = `
          INSERT INTO movimientos (
            tipo,
            usuario_id,
            bodega_origen_id,
            bodega_destino_id,
            observaciones
          ) VALUES (
            'TRASLADO', $1, $2, $3, $4
          ) RETURNING id
        `;
        const { rows: movRows } = await client.query(insertMov, [
          usuarioId,
          bodega_origen_id,
          bodega_destino_id,
          observaciones || null
        ]);
        const movimientoId = movRows[0].id;
  
        for (const item of materiales) {
          const { material_id, cantidad } = item;
          if (!material_id || cantidad == null || isNaN(cantidad) || cantidad <= 0) {
            throw new Error('Cada material debe incluir material_id y cantidad > 0.');
          }
  
          const { rows: origenRows } = await client.query(
            `SELECT cantidad FROM materiales_bodegas
             WHERE material_id = $1 AND bodega_id = $2`,
            [material_id, bodega_origen_id]
          );
          const stockOrigen = origenRows.length ? parseFloat(origenRows[0].cantidad) : 0;
          if (stockOrigen < cantidad) {
            throw new Error(
              `Stock insuficiente en bodega origen para material ${material_id}: tenemos ${stockOrigen}, se requieren ${cantidad}.`
            );
          }
  
          await client.query(
            `INSERT INTO movimiento_materiales (movimiento_id, material_id, cantidad)
             VALUES ($1, $2, $3)`,
            [movimientoId, material_id, cantidad]
          );
  
          await client.query(
            `UPDATE materiales_bodegas
             SET cantidad = cantidad - $1
             WHERE material_id = $2 AND bodega_id = $3`,
            [cantidad, material_id, bodega_origen_id]
          );
  
          await client.query(
            `INSERT INTO materiales_bodegas (material_id, bodega_id, cantidad)
             VALUES ($1, $2, $3)
             ON CONFLICT (material_id, bodega_id)
             DO UPDATE SET cantidad = materiales_bodegas.cantidad + EXCLUDED.cantidad`,
            [material_id, bodega_destino_id, cantidad]
          );
        }
  
        await client.query('COMMIT');
        res.status(201).json({
          message: 'Movimiento TRASLADO registrado exitosamente',
          movimiento_id: movimientoId
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registrando movimiento TRASLADO:', error);
        res.status(500).json({
          message: 'Error al registrar movimiento TRASLADO',
          detail: error.message
        });
      } finally {
        client.release();
      }
    }
  );

  router.post('/venta', verificarToken, verificarPermiso('registrar_movimientos'), async (req, res) => {
      const usuarioId = req.usuario.id;
      const { orden_compra_id, bodega_origen_id, observaciones } = req.body;
  
      if (!orden_compra_id || !bodega_origen_id) {
        return res.status(400).json({
          message: 'Debe proporcionar orden_compra_id y bodega_origen_id.'
        });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const { rows: ordenRows } = await client.query(
          `SELECT cliente_id, estado 
           FROM ordenes_compra 
           WHERE id = $1 
           FOR UPDATE`,
          [orden_compra_id]
        );
        if (ordenRows.length === 0) {
          return res.status(404).json({ message: 'Orden de compra no encontrada' });
        }
        const { cliente_id, estado } = ordenRows[0];
        if (estado !== 'MATERIAL COMPLETO') {
          return res.status(400).json({
            message: `Solo se puede vender una orden en estado "MATERIAL COMPLETO", estado actual: "${estado}".`
          });
        }
  
        const insertMov = `
          INSERT INTO movimientos (
            tipo, usuario_id, bodega_origen_id, cliente_id, observaciones, orden_compra_id
          ) VALUES (
            'VENTA', $1, $2, $3, $4, $5
          ) RETURNING id
        `;
        const { rows: movRows } = await client.query(insertMov, [
          usuarioId,
          bodega_origen_id,
          cliente_id,
          observaciones || null,
          orden_compra_id
        ]);
        const movimientoId = movRows[0].id;

        const { rows: items } = await client.query(
          `SELECT material_id, cantidad 
           FROM orden_materiales 
           WHERE orden_id = $1`,
          [orden_compra_id]
        );
        if (items.length === 0) {
          throw new Error('La orden de compra no tiene materiales asociados.');
        }
  
        for (const item of items) {
          const { material_id, cantidad } = item;
  
          const { rows: origenRows } = await client.query(
            `SELECT cantidad 
             FROM materiales_bodegas 
             WHERE material_id = $1 AND bodega_id = $2`,
            [material_id, bodega_origen_id]
          );
          const stockOrigen = origenRows.length ? parseFloat(origenRows[0].cantidad) : 0;
          if (stockOrigen < cantidad) {
            throw new Error(
              `Stock insuficiente en bodega origen para material ${material_id}: tenemos ${stockOrigen}, se requieren ${cantidad}.`
            );
          }
  
          await client.query(
            `INSERT INTO movimiento_materiales (movimiento_id, material_id, cantidad)
             VALUES ($1, $2, $3)`,
            [movimientoId, material_id, cantidad]
          );
  
          await client.query(
            `UPDATE materiales_bodegas
             SET cantidad = cantidad - $1
             WHERE material_id = $2 AND bodega_id = $3`,
            [cantidad, material_id, bodega_origen_id]
          );
  
          await client.query(
            `UPDATE materiales
             SET cantidad = cantidad - $1
             WHERE id = $2`,
            [cantidad, material_id]
          );
        }
  
        await client.query(
          `UPDATE ordenes_compra
           SET estado = 'FINALIZADA',
               usuario_modificacion_id = $1,
               fecha_modificacion = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [usuarioId, orden_compra_id]
        );
  
        await client.query('COMMIT');
        res.status(201).json({
          message: 'Movimiento VENTA registrado y orden finalizada',
          movimiento_id: movimientoId
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registrando movimiento VENTA:', error);
        res.status(500).json({
          message: 'Error al registrar movimiento VENTA',
          detail: error.message
        });
      } finally {
        client.release();
      }
    }
  );

  router.post('/salida', verificarToken, verificarPermiso('registrar_movimientos'), async (req, res) => {
      const usuarioId = req.usuario.id;
      const { bodega_origen_id, observaciones, materiales } = req.body;
  
      if (!bodega_origen_id || !Array.isArray(materiales) || materiales.length === 0) {
        return res.status(400).json({
          message:
            'Debe proporcionar bodega_origen_id y al menos un material con material_id y cantidad.'
        });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const insertMov = `
          INSERT INTO movimientos (
            tipo,
            usuario_id,
            bodega_origen_id,
            observaciones
          ) VALUES (
            'SALIDA', $1, $2, $3
          ) RETURNING id
        `;
        const { rows: movRows } = await client.query(insertMov, [
          usuarioId,
          bodega_origen_id,
          observaciones || null
        ]);
        const movimientoId = movRows[0].id;
  
        for (const item of materiales) {
          const { material_id, cantidad } = item;
          if (!material_id || cantidad == null || isNaN(cantidad) || cantidad <= 0) {
            throw new Error('Cada material debe incluir material_id y cantidad > 0.');
          }
  
          const { rows: origenRows } = await client.query(
            `SELECT cantidad FROM materiales_bodegas
             WHERE material_id = $1 AND bodega_id = $2`,
            [material_id, bodega_origen_id]
          );
          const stockOrigen = origenRows.length ? parseFloat(origenRows[0].cantidad) : 0;
          if (stockOrigen < cantidad) {
            throw new Error(
              `Stock insuficiente en bodega origen para material ${material_id}: tenemos ${stockOrigen}, se requieren ${cantidad}.`
            );
          }
  
          await client.query(
            `INSERT INTO movimiento_materiales (movimiento_id, material_id, cantidad)
             VALUES ($1, $2, $3)`,
            [movimientoId, material_id, cantidad]
          );
  
          await client.query(
            `UPDATE materiales_bodegas
             SET cantidad = cantidad - $1
             WHERE material_id = $2 AND bodega_id = $3`,
            [cantidad, material_id, bodega_origen_id]
          );
  
          await client.query(
            `UPDATE materiales
             SET cantidad = cantidad - $1
             WHERE id = $2`,
            [cantidad, material_id]
          );
        }
  
        await client.query('COMMIT');
        res.status(201).json({
          message: 'Movimiento SALIDA registrado exitosamente',
          movimiento_id: movimientoId
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registrando movimiento SALIDA:', error);
        res.status(500).json({
          message: 'Error al registrar movimiento SALIDA',
          detail: error.message
        });
      } finally {
        client.release();
      }
    }
  );

  router.get('/', verificarToken, verificarPermiso('ver_movimientos'), async (req, res) => {
      try {
        const pagina = parseInt(req.query.pagina) || 1;
        const resultadosPorPagina = parseInt(req.query.resultados_por_pagina) || 10;
        const offset = (pagina - 1) * resultadosPorPagina;
  
        const { tipo, fecha, usuario } = req.query;
        const filtros = [];
        const valores = [];
  
        if (tipo) {
          filtros.push(`m.tipo ILIKE $${valores.length + 1}`);
          valores.push(`%${tipo}%`);
        }
        if (fecha) {
          filtros.push(`CAST(m.fecha_hora AS DATE) = $${valores.length + 1}`);
          valores.push(fecha);
        }
        if (usuario) {
          filtros.push(`LOWER(u.nombre) LIKE LOWER($${valores.length + 1})`);
          valores.push(`%${usuario}%`);
        }
  
        const whereClause = filtros.length
          ? `WHERE ${filtros.join(' AND ')}`
          : '';
  
        const totalQuery = `
          SELECT COUNT(*) AS total
          FROM movimientos m
          JOIN usuarios u ON m.usuario_id = u.id
          ${whereClause}
        `;
        const { rows: totalRows } = await pool.query(totalQuery, valores);
        const totalMov = parseInt(totalRows[0].total);
        const totalPaginas = Math.ceil(totalMov / resultadosPorPagina);
  
        const query = `
          SELECT
            m.id,
            m.tipo,
            m.fecha_hora,
            m.usuario_id,
            u.nombre AS usuario_nombre
          FROM movimientos m
          JOIN usuarios u ON m.usuario_id = u.id
          ${whereClause}
          ORDER BY m.fecha_hora DESC
          LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}
        `;
        valores.push(resultadosPorPagina, offset);
  
        const { rows: movimientos } = await pool.query(query, valores);
  
        res.json({
          pagina,
          resultados_por_pagina: resultadosPorPagina,
          total_resultados: totalMov,
          total_paginas: totalPaginas,
          movimientos
        });
      } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({ message: 'Error al obtener movimientos' });
      }
    }
  );

  // MISING GET DETAIL AND POST UNDO AND POST FOR ENTRADA-P
  
  module.exports = router;
