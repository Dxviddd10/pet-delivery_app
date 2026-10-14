import { SubmitButton } from '@/components/SubmitButton';
import { btnSecondary } from '@/components/ui';
import { signOut } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/server';

export default async function NoAccessPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="mt-3 text-xl font-extrabold">Tu cuenta aún no está asociada a una veterinaria</h1>
      
      {email ? (
        <div className="mt-3 rounded-lg border border-line bg-gray-50 px-3 py-2 text-xs text-gray-700">
          <span className="text-muted">Sesión actual:</span> <strong>{email}</strong>
        </div>
      ) : null}

      <p className="mt-3 text-sm text-muted">
        Para acceder al panel administrativo, un administrador de la plataforma debe asociar este correo ({email ?? 'tu cuenta'}) a una veterinaria aliada desde la sección de <strong>Administración</strong>.
      </p>

      <form action={signOut} className="mt-6">
        <SubmitButton className={btnSecondary}>Cerrar sesión / Ingresar con otra cuenta</SubmitButton>
      </form>
    </main>
  );
}
