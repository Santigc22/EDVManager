const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generarReporteInventario(bodegasData) {
  const workbook = new ExcelJS.Workbook();

  for (const bodega of bodegasData) {
    const sheet = workbook.addWorksheet(bodega.nombre);

    sheet.addRow([
      'Material', 'Código', 'Abreviatura', 'Cantidad', 
      'Precio Unitario', 'Valor Total', 'Unidad de Medida'
    ]).font = { bold: true };

    let totalBodega = 0;

    for (const mat of bodega.materiales) {
      const valorTotal = mat.cantidad * parseFloat(mat.precio);
      totalBodega += valorTotal;

      sheet.addRow([
        mat.nombre,
        mat.codigo,
        mat.abreviatura,
        mat.cantidad,
        parseFloat(mat.precio),
        valorTotal,
        mat.unidad
      ]);
    }

    sheet.addRow([]);
    sheet.addRow(['', '', '', '', 'Total Bodega', totalBodega]);
  }

  const timestamp = new Date().getTime();
  const filePath = path.join(__dirname, `reporte_inventario_${timestamp}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

module.exports = { generarReporteInventario };
