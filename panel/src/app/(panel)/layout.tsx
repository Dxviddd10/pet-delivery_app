import { NavLink } from '@/components/NavLink';
import { SubmitButton } from '@/components/SubmitButton';
import { Badge, btnSecondary, inputClass } from '@/components/ui';
import { isAdminUser, requireVet } from '@/lib/auth';
import { signOut } from '@/app/login/actions';
import { switchActiveVet } from './layout-actions';

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
  const { vet, user, supabase, memberships } = await requireVet();
  const isAdmin = await isAdminUser(supabase);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-4">
          <div className="text-lg font-extrabold">🐾 {vet.name}</div>
          {vet.status !== 'active' ? (
            <div className="mt-1"><Badge tone="amber">Pendiente de aprobación</Badge></div>
          ) : null}

          {/* Selector de sede cuando el usuario pertenece a más de una veterinaria */}
          {memberships && memberships.length > 1 ? (
            <form action={switchActiveVet} className="mt-3 rounded-xl border border-line bg-gray-50 p-2">
              <label className="text-[11px] font-bold text-muted block mb-1">
                Sede activa ({memberships.length}):
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  name="vet_id"
                  defaultValue={vet.id}
                  className={`${inputClass} text-xs py-1 px-1.5 font-medium`}
                >
                  {memberships.map((m) => (
                    <option key={m.vet.id} value={m.vet.id}>
                      {m.vet.name} ({m.role === 'owner' ? 'Dueño' : 'Staff'})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-orange-600 transition"
                  title="Cambiar a la sede seleccionada"
                >
                  Ir
                </button>
              </div>
            </form>
          ) : null}
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
          ))}
          {isAdmin ? <NavLink href="/admin">🛡️ Administración</NavLink> : null}
        </nav>
        <div className="mt-6 hidden text-xs text-muted md:block">
          <div className="truncate font-medium">{user.email}</div>
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
