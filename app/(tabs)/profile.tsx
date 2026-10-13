import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ErrorState, Loading, Screen, SectionTitle, styles } from '@/components/ui';
import { useMyPets } from '@/hooks/queries';
import { useAuth } from '@/providers/AuthProvider';
import { errMsg, speciesEmoji } from '@/lib/format';
import { space } from '@/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const pets = useMyPets();
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? 'Mi perfil';

  return (
    <Screen scroll>
      <Text style={styles.h1}>{name}</Text>
      <Text style={[styles.muted, { marginTop: 4 }]}>{session?.user.email}</Text>

      <SectionTitle>Mis mascotas</SectionTitle>
      {pets.isLoading ? (
        <Loading />
      ) : pets.isError ? (
        <ErrorState message={errMsg(pets.error)} onRetry={() => pets.refetch()} />
      ) : pets.data?.length ? (
        pets.data.map((p) => (
          <Card key={p.id}>
            <Text style={styles.h3}>{speciesEmoji[p.species]} {p.name}</Text>
            <Text style={[styles.muted, { marginTop: 2 }]}>
              {[p.breed, p.sex === 'male' ? 'Macho' : p.sex === 'female' ? 'Hembra' : null, p.weight_kg ? `${p.weight_kg} kg` : null].filter(Boolean).join(' · ') || 'Sin más datos'}
            </Text>
          </Card>
        ))
      ) : (
        <Text style={[styles.muted, { marginBottom: space.md }]}>Registra a tu mascota para agendar citas más rápido.</Text>
      )}
      <Button title="➕ Agregar mascota" variant="secondary" onPress={() => router.push('/pet/new')} />

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
