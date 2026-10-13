import type { ReactNode } from 'react';

const tones = {
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-800',
} as const;
export type Tone = keyof typeof tones;

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</div>;
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">{children}</div>;
}

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
export const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50';
export const btnSecondary =
  'inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-orange-50 disabled:opacity-50';
export const btnDanger =
  'inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function OkBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      {message}
    </div>
  );
}
