import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button, ErrorState, Loading, Row, Screen, SectionTitle, styles } from '@/components/ui';
import { useMyPets } from '@/hooks/queries';
import { useAuth } from '@/providers/AuthProvider';
import { errMsg, speciesEmoji } from '@/lib/format';
import { colors, radius, space } from '@/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const pets = useMyPets();
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? '';

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', backgroundColor: colors.sky, borderRadius: radius.lg, padding: space.xl }}>
        <Avatar label={name || session?.user.email || '?'} size={76} />
        <Text style={[styles.h1, { marginTop: space.md, textAlign: 'center' }]}>{name || 'Mi perfil'}</Text>
        <Text style={[styles.muted, { color: colors.text }]}>{session?.user.email}</Text>
      </View>

      <SectionTitle>Mis mascotas</SectionTitle>
      {pets.isLoading ? (
        <Loading />
      ) : pets.isError ? (
        <ErrorState message={errMsg(pets.error)} onRetry={() => pets.refetch()} />
      ) : pets.data?.length ? (
        pets.data.map((p) => {
          const details = [p.breed, p.sex === 'male' ? 'Macho' : p.sex === 'female' ? 'Hembra' : null, p.weight_kg ? `${p.weight_kg} kg` : null].filter(Boolean);
          return (
            <Row key={p.id}>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.sunSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 }}>{speciesEmoji[p.species]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>{p.name}</Text>
                <Text style={styles.muted}>{details.length ? details.join(', ') : 'Sin más datos'}</Text>
              </View>
            </Row>
          );
        })
      ) : (
        <Text style={[styles.muted, { marginBottom: space.md }]}>Registra a tu mascota y agenda citas más rápido.</Text>
      )}
      <Button title="Agregar mascota" variant="secondary" onPress={() => router.push('/pet/new')} style={{ marginTop: space.md }} />

      <View style={{ marginTop: space.xl }}>
        <Button
          title="Cerrar sesión"
          variant="ghost"
          onPress={() => signOut().catch((e) => Alert.alert('No se pudo cerrar sesión', errMsg(e)))}
        />
      </View>
    </Screen>
  );
}