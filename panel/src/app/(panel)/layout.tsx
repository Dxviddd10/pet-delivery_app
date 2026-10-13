import { NavLink } from '@/components/NavLink';
import { SubmitButton } from '@/components/SubmitButton';
import { Badge, btnSecondary } from '@/components/ui';
import { isAdminUser, requireVet } from '@/lib/auth';
import { signOut } from '@/app/login/actions';

const links = [
  { href: '/', label: '🏠 Inicio' },
  { href: '/citas', label: '📅 Citas' },
  { href: '/pedidos', label: '📦 Pedidos' },
  { href: '/adopciones', label: '🐶 Adopciones' },
  { href: '/productos', label: '🛍️ Productos' },
  { href: '/servicios', label: '🩺 Servicios' },
  { href: '/ajustes', label: '⚙️ Ajustes' },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { vet, user, supabase } = await requireVet();
  const isAdmin = await isAdminUser(supabase);
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-4">
          <div className="text-lg font-extrabold">🐾 {vet.name}</div>
          {vet.status !== 'active' ? (
            <div className="mt-1"><Badge tone="amber">Pendiente de aprobación</Badge></div>
          ) : null}
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
          ))}
          {isAdmin ? <NavLink href="/admin">🛡️ Administración</NavLink> : null}
        </nav>
        <div className="mt-6 hidden text-xs text-muted md:block">
          <div className="truncate">{user.email}</div>
          <form action={signOut} className="mt-2">
            <SubmitButton className={btnSecondary}>Cerrar sesión</SubmitButton>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        {vet.status !== 'active' ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tu veterinaria aún no está activa: los clientes no la ven en la app hasta que Pet Delivery la apruebe.
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
