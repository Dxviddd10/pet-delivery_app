import Link from 'next/link';
import { SubmitButton } from '@/components/SubmitButton';
import { Card, ErrorBanner, PageHeader, btnPrimary, btnSecondary, inputClass } from '@/components/ui';
import { importProducts } from '../actions';

export default async function ImportarPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Importar productos desde CSV" subtitle="Sube tu inventario completo de una sola vez" />
      <ErrorBanner message={error} />
      <Card className="max-w-2xl">
        <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm">
          <li>Descarga la plantilla y llénala en Excel o Google Sheets (guárdala como CSV).</li>
          <li>Columnas obligatorias: <strong>nombre, precio, stock</strong>. Opcionales: marca, sku, tipo, descripcion.</li>
          <li>Tipos válidos: alimento, accesorio, venta libre, formula. Si lo dejas vacío se toma “alimento”.</li>
          <li>Máximo 500 productos por archivo. Si una fila tiene error, no se importa nada y te decimos cuál es.</li>
        </ol>
        <a href="/productos/plantilla" className={`${btnSecondary} mb-5`}>⬇️ Descargar plantilla</a>
        <form action={importProducts} encType="multipart/form-data" className="space-y-4">
          <input name="file" type="file" accept=".csv,text/csv" required className={inputClass} />
          <div className="flex gap-2">
            <SubmitButton className={btnPrimary}>Importar</SubmitButton>
            <Link href="/productos" className={btnSecondary}>Volver</Link>
          </div>
        </form>
      </Card>
    </>
  );
}
