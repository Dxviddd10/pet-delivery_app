import { Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Chip, ChipRow, Screen, TextField, styles } from '@/components/ui';
import { useCreatePet } from '@/hooks/queries';
import { errMsg } from '@/lib/format';
import { Species } from '@/lib/schemas';

const Schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(40),
  species: Species,
  breed: z.string().trim().max(60),
  sex: z.enum(['male', 'female']).nullable(),
  weight: z.string().trim().regex(/^(\d{1,3}([.,]\d{1,2})?)?$/, 'Usa un número, ej. 12.5'),
});
type Values = z.infer<typeof Schema>;

export default function NewPetScreen() {
  const create = useCreatePet();
  const { control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '', species: 'dog', breed: '', sex: null, weight: '' },
  });

  const onSubmit = handleSubmit((v) => {
    create.mutate(
      { name: v.name, species: v.species, breed: v.breed, sex: v.sex, weightKg: v.weight ? Number(v.weight.replace(',', '.')) : null },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('No se pudo guardar', errMsg(e)),
      },
    );
  });

  return (
    <Screen scroll>
      <Controller control={control} name="name" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Nombre" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
      )} />
      <Text style={styles.label}>Especie</Text>
      <Controller control={control} name="species" render={({ field: { value, onChange } }) => (
        <ChipRow>
          <Chip label="🐶 Perro" selected={value === 'dog'} onPress={() => onChange('dog')} />
          <Chip label="🐱 Gato" selected={value === 'cat'} onPress={() => onChange('cat')} />
          <Chip label="🐾 Otro" selected={value === 'other'} onPress={() => onChange('other')} />
        </ChipRow>
      )} />
      <Controller control={control} name="breed" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Raza (opcional)" value={value} onChangeText={onChange} onBlur={onBlur} />
      )} />
      <Text style={styles.label}>Sexo</Text>
      <Controller control={control} name="sex" render={({ field: { value, onChange } }) => (
        <ChipRow>
          <Chip label="Macho" selected={value === 'male'} onPress={() => onChange('male')} />
          <Chip label="Hembra" selected={value === 'female'} onPress={() => onChange('female')} />
        </ChipRow>
      )} />
      <Controller control={control} name="weight" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Peso en kg (opcional)" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" error={errors.weight?.message} />
      )} />
      <Button title="Guardar mascota" onPress={onSubmit} loading={create.isPending} />
    </Screen>
  );
}
