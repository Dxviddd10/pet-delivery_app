'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function NavLink({ href, children, exact }: { href: string; children: ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact || href === '/' ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2 text-sm font-semibold ${active ? 'bg-brand text-white' : 'hover:bg-orange-100'}`}
    >
      {children}
    </Link>
  );
}
