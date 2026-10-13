import { Field, btnPrimary, inputClass } from '@/components/ui';
import { SubmitButton } from '@/components/SubmitButton';
import type { ListingRow } from '@/lib/schemas';

type Props = { action: (formData: FormData) => Promise<void>; listing?: ListingRow };

export function ListingForm({ action, listing }: Props) {
  const l = listing;
  return (
    <form action={action} encType="multipart/form-data" className="space-y-5 rounded-2xl border border-line bg-white p-6">
      {l ? <input type="hidden" name="id" value={l.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input name="name" required maxLength={40} defaultValue={l?.name} className={inputClass} />
        </Field>
        <Field label="Especie">
          <select name="species" defaultValue={l?.species ?? 'dog'} className={inputClass}>
            <option value="dog">Perro</option><option value="cat">Gato</option><option value="other">Otro</option>
          </select>
        </Field>
        <Field label="Raza (opcional)">
          <input name="breed" maxLength={60} defaultValue={l?.breed ?? ''} className={inputClass} />
        </Field>
        <Field label="Sexo">
          <select name="sex" defaultValue={l?.sex ?? ''} className={inputClass}>
            <option value="">Sin especificar</option><option value="male">Macho</option><option value="female">Hembra</option>
          </select>
        </Field>
        <Field label="Edad (en meses)" hint="Ej. 18 para año y medio">
          <input name="age_months" type="number" min={0} max={300} defaultValue={l?.age_months ?? ''} className={inputClass} />
        </Field>
        <Field label="Tamaño">
          <select name="size" defaultValue={l?.size ?? ''} className={inputClass}>
            <option value="">Sin especificar</option><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option>
          </select>
        </Field>
      </div>

      <Field label="Descripción">
        <textarea name="description" rows={3} maxLength={600} defaultValue={l?.description ?? ''} className={inputClass} />
      </Field>
      <Field label="Temperamento (opcional)">
        <input name="temperament" maxLength={120} defaultValue={l?.temperament ?? ''} className={inputClass} />
      </Field>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="vaccinated" defaultChecked={l?.vaccinated} /> Vacunado</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="sterilized" defaultChecked={l?.sterilized} /> Esterilizado</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="dewormed" defaultChecked={l?.dewormed} /> Desparasitado</label>
      </div>

      <Field label="Fotos" hint="JPG, PNG o WebP, máximo 5 MB cada una y hasta 5 en total. Las nuevas se agregan a las existentes.">
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className={inputClass} />
      </Field>
      {l?.photos.length ? (
        <div className="flex flex-wrap gap-3">
          {l.photos.map((url) => (
            <label key={url} className="text-center text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto de ${l.name}`} className="h-24 w-24 rounded-xl object-cover" />
              <span className="mt-1 flex items-center justify-center gap-1">
                <input type="checkbox" name="remove_photo" value={url} /> Quitar
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <Field label="Estado">
        <select name="status" defaultValue={l?.status ?? 'draft'} className={inputClass}>
          <option value="draft">Borrador (no visible en la app)</option>
          <option value="published">Publicada (visible en la app)</option>
          <option value="reserved">Reservada</option>
          <option value="adopted">Adoptada</option>
          <option value="archived">Archivada</option>
        </select>
      </Field>

      <SubmitButton className={btnPrimary}>{l ? 'Guardar cambios' : 'Crear mascota'}</SubmitButton>
    </form>
  );
}
