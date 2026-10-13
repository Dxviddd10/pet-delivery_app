const TZ = 'America/Bogota'; // UTC-5 todo el año

export function formatCOP(value: number): string {
  return '$' + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
}

/** Valor para <input type="datetime-local"> en hora de Colombia. */
export function toBogotaInput(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 5 * 3600_000);
  return d.toISOString().slice(0, 16);
}

/** Convierte el valor de datetime-local (hora Colombia) a ISO UTC. */
export function fromBogotaInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function bogotaDayRange(now = new Date()): { start: string; end: string } {
  const b = new Date(now.getTime() - 5 * 3600_000);
  const start = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), 5);
  return { start: new Date(start).toISOString(), end: new Date(start + 86_400_000).toISOString() };
}

export function bogotaMonthStart(now = new Date()): string {
  const b = new Date(now.getTime() - 5 * 3600_000);
  return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 1, 5)).toISOString();
}

export const speciesLabel = { dog: 'Perro', cat: 'Gato', other: 'Otro' } as const;

export function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message);
  return 'Error inesperado';
}
