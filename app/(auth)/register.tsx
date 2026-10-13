import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, TextField, styles } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { errMsg } from '@/lib/format';
import { colors, space } from '@/theme';

const Schema = z.object({
  fullName: z.string().trim().min(2, 'Escribe tu nombre'),
  phone: z.string().trim().regex(/^3\d{9}$/, 'Celular colombiano de 10 dígitos (ej. 3101234567)'),
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type Values = z.infer<typeof Schema>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { fullName: '', phone: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(values);
      if (needsConfirmation) {
        Alert.alert('Revisa tu correo', 'Te enviamos un enlace para confirmar tu cuenta. Luego inicia sesión.');
        router.replace('/login');
      }
    } catch (e) {
      Alert.alert('No pudimos crear la cuenta', errMsg(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen scroll>
      <Text style={[styles.h1, { marginVertical: space.lg }]}>Crea tu cuenta</Text>
      <Controller control={control} name="fullName" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Nombre completo" value={value} onChangeText={onChange} onBlur={onBlur} autoComplete="name" error={errors.fullName?.message} />
      )} />
      <Controller control={control} name="phone" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Celular" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" error={errors.phone?.message} />
      )} />
      <Controller control={control} name="email" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Correo" value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" keyboardType="email-address" error={errors.email?.message} />
      )} />
      <Controller control={control} name="password" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Contraseña" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={errors.password?.message} />
      )} />
      <Text style={[styles.muted, { marginBottom: space.md, fontSize: 12 }]}>
        Al registrarte aceptas el tratamiento de tus datos personales (Ley 1581 de 2012) para gestionar adopciones, citas y pedidos.
      </Text>
      <Button title="Registrarme" onPress={onSubmit} loading={busy} />
      <Text style={[styles.muted, { textAlign: 'center', marginTop: space.lg }]}>
        ¿Ya tienes cuenta? <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>Ingresa</Link>
      </Text>
    </Screen>
  );
}
