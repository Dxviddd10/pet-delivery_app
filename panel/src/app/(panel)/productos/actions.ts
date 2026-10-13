'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { failTo, requireVet } from '@/lib/auth';
import { Uuid } from '@/lib/schemas';

const Kind = z.enum(['food', 'accessory', 'otc_medicine', 'rx_medicine']);
const optional = (max: number) => z.string().trim().max(max).transform((v) => (v === '' ? null : v));

const ProductInput = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(120),
  brand: optional(60),
  sku: optional(40),
  description: optional(500),
  price: z.coerce.number().int('El precio debe ser entero').min(0).max(50_000_000),
  stock: z.coerce.number().int('El stock debe ser entero').min(0).max(1_000_000),
  kind: Kind,
});

function readProduct(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? '');
  return ProductInput.safeParse({
    name: g('name'), brand: g('brand'), sku: g('sku'), description: g('description'),
    price: g('price'), stock: g('stock'), kind: g('kind'),
  });
}

export async function createProduct(formData: FormData) {
  const parsed = readProduct(formData);
  if (!parsed.success) failTo('/productos/nuevo', parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase, vet } = await requireVet();
  const d = parsed.data;
  const { error } = await supabase.from('products').insert({
    vet_id: vet.id, ...d, requires_prescription: d.kind === 'rx_medicine', is_active: formData.get('is_active') === 'on',
  });
  if (error) failTo('/productos/nuevo', error.message);
  revalidatePath('/productos');
  redirect('/productos?ok=' + encodeURIComponent('Producto creado'));
}

export async function updateProduct(formData: FormData) {
  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) failTo('/productos', 'Producto inválido');
  const back = `/productos/${id.data}`;
  const parsed = readProduct(formData);
  if (!parsed.success) failTo(back, parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase, vet } = await requireVet();
  const d = parsed.data;
  const { error } = await supabase.from('products').update({
    ...d, requires_prescription: d.kind === 'rx_medicine', is_active: formData.get('is_active') === 'on',
  }).eq('id', id.data).eq('vet_id', vet.id);
  if (error) failTo(back, error.message);
  revalidatePath('/productos');
  redirect('/productos?ok=' + encodeURIComponent('Cambios guardados'));
}

const QuickInput = z.object({
  id: Uuid,
  price: z.coerce.number().int().min(0).max(50_000_000),
  stock: z.coerce.number().int().min(0).max(1_000_000),
});

export async function quickUpdateProduct(formData: FormData) {
  const parsed = QuickInput.safeParse({ id: formData.get('id'), price: formData.get('price'), stock: formData.get('stock') });
  if (!parsed.success) failTo('/productos', 'Precio o stock inválido');
  const { supabase, vet } = await requireVet();
  const { error } = await supabase.from('products')
    .update({ price: parsed.data.price, stock: parsed.data.stock }).eq('id', parsed.data.id).eq('vet_id', vet.id);
  if (error) failTo('/productos', error.message);
  revalidatePath('/productos');
}

export async function toggleProduct(formData: FormData) {
  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) failTo('/productos', 'Producto inválido');
  const active = formData.get('active') === 'true';
  const { supabase, vet } = await requireVet();
  const { error } = await supabase.from('products').update({ is_active: active }).eq('id', id.data).eq('vet_id', vet.id);
  if (error) failTo('/productos', error.message);
  revalidatePath('/productos');
}

// ---------- Importación masiva por CSV ----------
const MAX_ROWS = 500;
const MAX_CSV_BYTES = 1_000_000;

/** Parser CSV mínimo: comillas, comas/punto y coma dentro de comillas, "" escapado, CRLF. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

const KIND_ALIASES: Record<string, z.infer<typeof Kind>> = {
  food: 'food', alimento: 'food', comida: 'food',
  accessory: 'accessory', accesorio: 'accessory', accesorios: 'accessory',
  otc_medicine: 'otc_medicine', 'venta libre': 'otc_medicine', medicamento: 'otc_medicine',
  rx_medicine: 'rx_medicine', formula: 'rx_medicine', fórmula: 'rx_medicine',
};

const CsvRow = z.object({
  name: z.string().trim().min(1, 'falta el nombre').max(120),
  brand: optional(60),
  sku: optional(40),
  price: z.coerce.number().int('precio no válido').min(0).max(50_000_000),
  stock: z.coerce.number().int('stock no válido').min(0).max(1_000_000),
  kind: Kind,
  description: optional(500),
});

export async function importProducts(formData: FormData) {
  const back = '/productos/importar';
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) failTo(back, 'Selecciona un archivo CSV');
  if (file.size > MAX_CSV_BYTES) failTo(back, 'El archivo es muy grande (máximo 1 MB)');
  const { supabase, vet } = await requireVet();

  const text = (await file.text()).replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  const table = parseCsv(text, delimiter);
  if (table.length < 2) failTo(back, 'El archivo no tiene filas de datos');
  if (table.length - 1 > MAX_ROWS) failTo(back, `Máximo ${MAX_ROWS} productos por archivo`);

  const header = table[0].map((h) => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    name: col('nombre', 'name'), brand: col('marca', 'brand'), sku: col('sku', 'codigo'),
    price: col('precio', 'price'), stock: col('stock', 'cantidad'), kind: col('tipo', 'kind'),
    description: col('descripcion', 'description'),
  };
  if (idx.name < 0 || idx.price < 0 || idx.stock < 0) {
    failTo(back, 'Faltan columnas obligatorias: nombre, precio y stock (usa la plantilla)');
  }

  const records: (z.infer<typeof CsvRow> & { vet_id: string; requires_prescription: boolean; is_active: boolean })[] = [];
  const errors: string[] = [];
  table.slice(1).forEach((cells, i) => {
    const get = (j: number) => (j >= 0 ? (cells[j] ?? '').trim() : '');
    const rawKind = get(idx.kind).toLowerCase();
    const kind = rawKind === '' ? 'food' : KIND_ALIASES[rawKind];
    const parsed = CsvRow.safeParse({
      name: get(idx.name), brand: get(idx.brand), sku: get(idx.sku),
      price: get(idx.price).replace(/[$.\s]/g, ''), // "12.500" o "$12.500" → 12500
      stock: get(idx.stock), kind, description: get(idx.description),
    });
    if (!parsed.success) errors.push(`Fila ${i + 2}: ${kind ? parsed.error.issues[0]?.message : 'tipo desconocido'}`);
    else records.push({ ...parsed.data, vet_id: vet.id, requires_prescription: parsed.data.kind === 'rx_medicine', is_active: true });
  });

  if (errors.length) {
    const shown = errors.slice(0, 5).join(' · ');
    failTo(back, `No se importó nada. ${errors.length} fila(s) con error → ${shown}${errors.length > 5 ? ' …' : ''}`);
  }

  const { error } = await supabase.from('products').insert(records);
  if (error) failTo(back, error.message);
  revalidatePath('/productos');
  redirect(`/productos?ok=${encodeURIComponent(`Se importaron ${records.length} productos`)}`);
}
