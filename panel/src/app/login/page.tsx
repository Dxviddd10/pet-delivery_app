import { SubmitButton } from '@/components/SubmitButton';
import { ErrorBanner, Field, btnPrimary, inputClass } from '@/components/ui';
import { signIn } from './actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-5xl">🐾</div>
        <h1 className="mt-2 text-2xl font-extrabold">Pet Delivery</h1>
        <p className="text-sm text-muted">Panel para veterinarias aliadas</p>
      </div>
      <ErrorBanner message={error} />
      <form action={signIn} className="space-y-4 rounded-2xl border border-line bg-white p-6">
        <Field label="Correo">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Contraseña">
          <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        <SubmitButton className={`${btnPrimary} w-full`}>Ingresar</SubmitButton>
      </form>
      <p className="mt-4 text-center text-xs text-muted">
        ¿Quieres ser aliado? Escríbenos y activamos tu veterinaria.
      </p>
    </main>
  );
}
