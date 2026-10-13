'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

export function SubmitButton({ children, className, confirm }: { children: ReactNode; className: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? 'Guardando…' : children}
    </button>
  );
}
