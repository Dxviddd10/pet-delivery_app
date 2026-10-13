import { SubmitButton } from '@/components/SubmitButton';
import { btnSecondary } from '@/components/ui';
import { signOut } from '@/app/login/actions';

export default function NoAccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="mt-3 text-xl font-extrabold">Tu cuenta aún no está asociada a una veterinaria</h1>
      <p className="mt-2 text-sm text-muted">
        Pide al administrador de Pet Delivery que te agregue como personal de tu veterinaria y vuelve a ingresar.
      </p>
      <form action={signOut} className="mt-6">
        <SubmitButton className={btnSecondary}>Cerrar sesión</SubmitButton>
      </form>
    </main>
  );
}
