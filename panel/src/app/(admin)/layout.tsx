import { NavLink } from '@/components/NavLink';
import { SubmitButton } from '@/components/SubmitButton';
import { btnSecondary } from '@/components/ui';
import { requireAdmin } from '@/lib/auth';
import { signOut } from '@/app/login/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-4 text-lg font-extrabold">🛡️ Administración</div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          <NavLink href="/admin" exact>🏥 Veterinarias</NavLink>
          <NavLink href="/admin/nueva" exact>➕ Nueva veterinaria</NavLink>
        </nav>
        <div className="mt-6 hidden text-xs text-muted md:block">
          <div className="truncate">{user.email}</div>
          <form action={signOut} className="mt-2">
            <SubmitButton className={btnSecondary}>Cerrar sesión</SubmitButton>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
