import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Screen, TextField, styles } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { errMsg } from '@/lib/format';
import { colors, space } from '@/theme';

const Schema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type Values = z.infer<typeof Schema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      Alert.alert('No pudimos iniciar sesión', errMsg(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginVertical: space.xl }}>
        <Text style={{ fontSize: 64 }}>🐾</Text>
        <Text style={styles.h1}>Pet Delivery</Text>
        <Text style={[styles.muted, { marginTop: 4 }]}>Adopta, agenda y cuida a tu mascota</Text>
      </View>
      <Controller control={control} name="email" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Correo" value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none"
          keyboardType="email-address" autoComplete="email" error={errors.email?.message} />
      )} />
      <Controller control={control} name="password" render={({ field: { value, onChange, onBlur } }) => (
        <TextField label="Contraseña" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry
          autoComplete="password" error={errors.password?.message} />
      )} />
      <Button title="Ingresar" onPress={onSubmit} loading={busy} />
      <Text style={[styles.muted, { textAlign: 'center', marginTop: space.lg }]}>
        ¿No tienes cuenta?{' '}
        <Link href="/register" style={{ color: colors.primary, fontWeight: '700' }}>Regístrate</Link>
      </Text>
    </Screen>
  );
}
