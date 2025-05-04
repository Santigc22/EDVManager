const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../security/authMiddleware');
const verificarPermiso = require('../security/permisosMiddleware');

router.post('/', verificarToken, verificarPermiso('registrar_ordenes'), async (req, res) => {
    const { cliente_id, detalle, materiales } = req.body;

    if (!cliente_id || !Array.isArray(materiales) || materiales.length === 0) {
      return res.status(400).json({
        message: 'Debe proporcionar cliente_id y al menos un material con cantidad y precio_unitario.',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertOrdenText = `
        INSERT INTO ordenes_compra (cliente_id, estado, detalle, usuario_id)
        VALUES ($1, 'PENDIENTE', $2, $3)
        RETURNING id, cliente_id, fecha_hora, estado, detalle, usuario_id
      `;
      const { rows: ordenRows } = await client.query(insertOrdenText, [
        cliente_id,
        detalle || null,
        req.usuario.id,
      ]);
      const ordenId = ordenRows[0].id;

      const insertMatText = `
        INSERT INTO orden_materiales (orden_id, material_id, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4)
      `;
      for (const item of materiales) {
        const { material_id, cantidad, precio_unitario } = item;
        if (
          !material_id ||
          cantidad == null ||
          precio_unitario == null
        ) {
          throw new Error('Cada material debe incluir material_id, cantidad y precio_unitario.');
        }
        await client.query(insertMatText, [
          ordenId,
          material_id,
          cantidad,
          precio_unitario,
        ]);
      }

      await client.query('COMMIT');
      res.status(201).json({
        message: 'Orden de compra registrada exitosamente',
        orden: ordenRows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al registrar orden de compra:', error);
      res.status(500).json({ message: 'Error al registrar orden de compra' });
    } finally {
      client.release();
    }
  }
);

router.get('/', verificarToken, verificarPermiso('ver_ordenes'), async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const resultadosPorPagina = parseInt(req.query.resultados_por_pagina) || 10;
        const offset = (pagina - 1) * resultadosPorPagina;

        const { cliente, usuario, fecha, estado } = req.query;

        const filtros = [];
        const valores = [];

        if (cliente) {
            filtros.push(`LOWER(c.nombre) LIKE LOWER($${valores.length + 1})`);
            valores.push(`%${cliente}%`);
        }

        if (usuario) {
            filtros.push(`LOWER(u.nombre) LIKE LOWER($${valores.length + 1})`);
            valores.push(`%${usuario}%`);
        }

        if (fecha) {
            filtros.push(`CAST(o.fecha_hora AS DATE) = $${valores.length + 1}`);
            valores.push(fecha);
        }

        if (estado) {
            filtros.push(`o.estado ILIKE $${valores.length + 1}`);
            valores.push(`%${estado}%`);
          }

        const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

        const totalQuery = `
            SELECT COUNT(*)
            FROM ordenes_compra o
            JOIN clientes c ON o.cliente_id = c.id
            JOIN usuarios u ON o.usuario_id = u.id
            ${whereClause}
        `;
        const { rows: totalRows } = await pool.query(totalQuery, valores);
        const totalOrdenes = parseInt(totalRows[0].count);
        const totalPaginas = Math.ceil(totalOrdenes / resultadosPorPagina);

        const query = `
            SELECT o.id, o.cliente_id, c.nombre AS cliente_nombre, o.fecha_hora, o.estado, o.usuario_id, u.nombre AS usuario_nombre
            FROM ordenes_compra o
            JOIN clientes c ON o.cliente_id = c.id
            JOIN usuarios u ON o.usuario_id = u.id
            ${whereClause}
            ORDER BY o.fecha_hora DESC
            LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}
        `;
        valores.push(resultadosPorPagina, offset);

        const { rows: ordenes } = await pool.query(query, valores);

        res.json({
            pagina,
            resultados_por_pagina: resultadosPorPagina,
            total_resultados: totalOrdenes,
            total_paginas: totalPaginas,
            ordenes
        });

    } catch (error) {
        console.error('Error al obtener las órdenes de compra:', error);
        res.status(500).json({ message: 'Error al obtener las órdenes de compra' });
    }
});

router.get('/:id', verificarToken, verificarPermiso('ver_ordenes'), async (req, res) => {
      const { id } = req.params;
  
      try {
        const ordenQuery = `
          SELECT 
            o.id,
            o.cliente_id,
            c.nombre AS cliente_nombre,
            o.usuario_id,
            u.nombre AS usuario_nombre,
            o.fecha_hora,
            o.estado,
            o.detalle,
            o.fecha_modificacion,
            o.usuario_modificacion_id,
            umod.nombre AS usuario_modificacion_nombre
          FROM ordenes_compra o
          JOIN clientes c   ON o.cliente_id = c.id
          JOIN usuarios u   ON o.usuario_id = u.id
          LEFT JOIN usuarios umod ON o.usuario_modificacion_id = umod.id
          WHERE o.id = $1
        `;
        const { rows: ordenRows } = await pool.query(ordenQuery, [id]);
        if (ordenRows.length === 0) {
          return res.status(404).json({ message: 'Orden no encontrada' });
        }
        const orden = ordenRows[0];
  
        const itemsQuery = `
          SELECT 
            om.material_id,
            m.nombre         AS material_nombre,
            m.abreviatura AS material_abreviatura,
            om.cantidad,
            om.precio_unitario,
            (om.cantidad * om.precio_unitario) AS total_material
          FROM orden_materiales om
          JOIN materiales m   ON om.material_id = m.id
          WHERE om.orden_id = $1
          ORDER BY m.nombre
        `;
        const { rows: items } = await pool.query(itemsQuery, [id]);
  
        const totalOrden = items.reduce(
          (sum, item) => sum + parseFloat(item.total_material), 
          0
        );
  
        res.json({
          orden: {
            id: orden.id,
            cliente: {
              id: orden.cliente_id,
              nombre: orden.cliente_nombre
            },
            creado_por: {
                id: orden.usuario_id,
                nombre: orden.usuario_nombre
            },
            fecha_hora: orden.fecha_hora,
            estado: orden.estado,
            detalle: orden.detalle,
            fecha_modificación: orden.fecha_modificacion,
            modificado_por: {
                id: orden.usuario_modificacion_id,
                nombre: orden.usuario_modificacion_nombre
            }
          },
          materiales: items.map(it => ({
            id: it.material_id,
            nombre: it.material_nombre,
            abreviatura: it.material_abreviatura,
            cantidad: it.cantidad,
            precio_unitario: parseFloat(it.precio_unitario),
            total_material: parseFloat(it.total_material)
          })),
          total_orden: totalOrden
        });
      } catch (error) {
        console.error('Error al obtener detalle de la orden:', error);
        res.status(500).json({ message: 'Error al obtener detalle de la orden' });
      }
    }
  );

  router.put('/:id', verificarToken, verificarPermiso('modificar_ordenes'), async (req, res) => {
      const { id } = req.params;
      const { cliente_id, detalle, materiales } = req.body;
      const usuarioMod = req.usuario.id;
  
      if (!cliente_id || !Array.isArray(materiales) || materiales.length === 0) {
        return res.status(400).json({
          message:
            'Debe proporcionar cliente_id y al menos un material con cantidad y precio_unitario.',
        });
      }
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const { rows: ordenRows } = await client.query(
          'SELECT estado FROM ordenes_compra WHERE id = $1 FOR UPDATE',
          [id]
        );
        if (ordenRows.length === 0) {
          return res.status(404).json({ message: 'Orden no encontrada' });
        }
        const estadoActual = ordenRows[0].estado;
        const estadosPermitidos = ['PENDIENTE', 'MATERIAL FALTANTE', 'MATERIAL COMPLETO'];
        if (!estadosPermitidos.includes(estadoActual)) {
          return res.status(400).json({
            message: `No se puede modificar una orden en estado "${estadoActual}"`,
          });
        }
  
        const updateOrdenText = `
          UPDATE ordenes_compra
          SET
            cliente_id = $1,
            detalle = $2,
            estado = 'PENDIENTE',
            usuario_modificacion_id = $3,
            fecha_modificacion = CURRENT_TIMESTAMP
          WHERE id = $4
        `;
        await client.query(updateOrdenText, [cliente_id, detalle || null, usuarioMod, id]);
  
        await client.query('DELETE FROM orden_materiales WHERE orden_id = $1', [id]);
  
        const insertMatText = `
          INSERT INTO orden_materiales (orden_id, material_id, cantidad, precio_unitario)
          VALUES ($1, $2, $3, $4)
        `;
        for (const item of materiales) {
          const { material_id, cantidad, precio_unitario } = item;
          if (
            !material_id ||
            cantidad == null ||
            precio_unitario == null
          ) {
            throw new Error(
              'Cada material debe incluir material_id, cantidad y precio_unitario.'
            );
          }
          await client.query(insertMatText, [id, material_id, cantidad, precio_unitario]);
        }
  
        await client.query('COMMIT');
        res.json({ message: 'Orden de compra modificada exitosamente' });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al modificar orden de compra:', error);
        res.status(500).json({ message: 'Error al modificar orden de compra' });
      } finally {
        client.release();
      }
    }
  );

  router.patch('/:id/validarMateriales', verificarToken, verificarPermiso('modificar_materiales'), async (req, res) => {
      const { id } = req.params;
      const usuarioMod = req.usuario.id;
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const { rows: ordenRows } = await client.query(
          `SELECT estado 
           FROM ordenes_compra 
           WHERE id = $1 
           FOR UPDATE`,
          [id]
        );
        if (ordenRows.length === 0) {
          return res.status(404).json({ message: 'Orden no encontrada' });
        }
        const estadoActual = ordenRows[0].estado;
        const estadosPermitidos = ['PENDIENTE', 'MATERIAL FALTANTE', 'MATERIAL COMPLETO'];
        if (!estadosPermitidos.includes(estadoActual)) {
          return res.status(400).json({
            message: `No se pueden verificar materiales para órdenes en estado "${estadoActual}"`,
          });
        }
  
        const { rows: items } = await client.query(
          `SELECT om.material_id, om.cantidad AS solicitado, m.cantidad AS en_stock
           FROM orden_materiales om
           JOIN materiales m ON om.material_id = m.id
           WHERE om.orden_id = $1`,
          [id]
        );
  
        if (items.length === 0) {
          return res.status(400).json({ message: 'La orden no tiene materiales asociados' });
        }
  
        const todoDisponible = items.every(item => parseFloat(item.en_stock) >= parseFloat(item.solicitado));
        const nuevoEstado = todoDisponible ? 'MATERIAL COMPLETO' : 'MATERIAL FALTANTE';
  
        await client.query(
          `UPDATE ordenes_compra
           SET estado = $1,
               usuario_modificacion_id = $2,
               fecha_modificacion = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [nuevoEstado, usuarioMod, id]
        );
  
        await client.query('COMMIT');
        res.json({ message: `Estado actualizado a "${nuevoEstado}"` });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al chequear materiales de la orden:', error);
        res.status(500).json({ message: 'Error al chequear materiales de la orden' });
      } finally {
        client.release();
      }
    }
  );

  router.patch('/:id/anular', verificarToken, verificarPermiso('modificar_ordenes'), async (req, res) => {
      const { id } = req.params;
      const usuarioMod = req.usuario.id;
  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
  
        const { rows: ordenRows } = await client.query(
          `SELECT estado
           FROM ordenes_compra
           WHERE id = $1
           FOR UPDATE`,
          [id]
        );
        if (ordenRows.length === 0) {
          return res.status(404).json({ message: 'Orden no encontrada' });
        }
        const estadoActual = ordenRows[0].estado;
        if (estadoActual === 'FINALIZADA') {
          return res.status(400).json({ message: 'No se puede anular una orden finalizada' });
        }
  
        await client.query(
          `UPDATE ordenes_compra
           SET estado = 'ANULADA',
               usuario_modificacion_id = $1,
               fecha_modificacion = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [usuarioMod, id]
        );
  
        await client.query('COMMIT');
        res.json({ message: 'Orden anulada correctamente' });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al anular la orden:', error);
        res.status(500).json({ message: 'Error al anular la orden' });
      } finally {
        client.release();
      }
    }
  );

module.exports = router;