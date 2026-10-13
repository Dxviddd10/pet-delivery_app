export function formatCOP(value: number): string {
  return '$' + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatAge(months: number | null): string {
  if (months == null) return 'Edad desconocida';
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} ${years === 1 ? 'año' : 'años'}`;
  return rest ? `${y} y ${rest} m` : y;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} · ${h12}:${mm} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
}

export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message);
  return 'Ocurrió un error inesperado';
}

export const speciesLabel = { dog: 'Perro', cat: 'Gato', other: 'Otro' } as const;
export const speciesEmoji = { dog: '🐶', cat: '🐱', other: '🐾' } as const;
