export function GET() {
  const csv =
    '\uFEFFnombre,marca,sku,precio,stock,tipo,descripcion\n' +
    'Concentrado perro adulto 8 kg,Marca X,CP-8,135000,20,alimento,Para perros adultos\n' +
    'Correa talla M,,CO-M,28000,30,accesorio,\n' +
    'Antipulgas externo,Marca Y,AP-1,38000,25,venta libre,Pipeta\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-productos.csv"',
    },
  });
}
