import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Avatar, Button, EmptyState, ErrorState, Loading, Screen, styles } from '@/components/ui';
import { PetCard } from '@/components/PetCard';
import { SwipeDeck, type SwipeDirection } from '@/components/SwipeDeck';
import { useAdoptionFeed, useSwipe } from '@/hooks/queries';
import { useAuth } from '@/providers/AuthProvider';
import type { FeedListing, Species } from '@/lib/schemas';
import { errMsg } from '@/lib/format';
import { colors, radius, space } from '@/theme';

const FILTERS: { key: Species | null; label: string }[] = [
  { key: null, label: 'Todos' },
  { key: 'dog', label: 'Perros' },
  { key: 'cat', label: 'Gatos' },
];

export default function AdoptFeedScreen() {
  const { session } = useAuth();
  const fullName = (session?.user.user_metadata?.full_name as string | undefined) ?? '';
  const firstName = fullName.trim().split(' ')[0] ?? '';

  const [species, setSpecies] = useState<Species | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  const [match, setMatch] = useState<FeedListing | null>(null);
  const feed = useAdoptionFeed(species);
  const swipe = useSwipe();

  const handleSwipe = useCallback(
    (item: FeedListing, dir: SwipeDirection) => {
      swipe.mutate(
        { listingId: item.id, action: dir },
        { onError: (e) => Alert.alert('No se guardó tu selección', errMsg(e)) },
      );
      if (dir === 'like') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMatch(item);
      }
    },
    [swipe],
  );

  const reload = useCallback(async () => {
    await feed.refetch();
    setDeckKey((k) => k + 1);
  }, [feed]);

  const changeSpecies = (s: Species | null) => {
    setSpecies(s);
    setDeckKey((k) => k + 1);
  };

  return (
    <Screen>
      <View style={[styles.between, { marginBottom: space.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>{firstName ? `Hola, ${firstName}` : 'Hola'}</Text>
          <Text style={styles.h1}>Encuentra a tu compañero</Text>
        </View>
        <Avatar label={firstName || '🐾'} />
      </View>

      <View style={{ flexDirection: 'row', gap: space.xl, marginBottom: space.md }}>
        {FILTERS.map((f) => {
          const active = species === f.key;
          return (
            <Pressable
              key={f.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => changeSpecies(f.key)}
              style={{ paddingVertical: 6, borderBottomWidth: 3, borderBottomColor: active ? colors.sun : 'transparent' }}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', color: active ? colors.text : colors.muted }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {feed.isLoading ? (
        <Loading />
      ) : feed.isError ? (
        <ErrorState message={errMsg(feed.error)} onRetry={reload} />
      ) : (
        <SwipeDeck
          key={`${deckKey}-${species ?? 'all'}`}
          items={feed.data ?? []}
          keyOf={(p) => p.id}
          renderCard={(p) => <PetCard pet={p} />}
          onSwipe={handleSwipe}
          empty={
            <EmptyState
              emoji="🎉"
              title="Ya los viste a todos"
              subtitle="Las veterinarias aliadas suben nuevos peluditos cada semana. Vuelve pronto."
              action={<Button title="Actualizar" variant="secondary" onPress={reload} />}
            />
          }
        />
      )}

      <Modal visible={!!match} transparent animationType="fade" onRequestClose={() => setMatch(null)}>
        <View style={modal.backdrop}>
          <View style={modal.sheet}>
            <View style={modal.heart}>
              <Text style={{ fontSize: 44 }}>💛</Text>
            </View>
            <Text style={[styles.h1, { textAlign: 'center' }]}>¡Es un match!</Text>
            <Text style={[styles.muted, { textAlign: 'center', marginVertical: space.md }]}>
              {match ? `${match.name} está en ${match.vet_name}. Envía tu solicitud y la veterinaria te contactará para que se conozcan.` : ''}
            </Text>
            <Button
              title="Solicitar adopción"
              variant="sun"
              onPress={() => {
                const id = match?.id;
                setMatch(null);
                if (id) router.push(`/adoption/${id}`);
              }}
              style={{ alignSelf: 'stretch' }}
            />
            <Button title="Seguir viendo" variant="ghost" onPress={() => setMatch(null)} style={{ alignSelf: 'stretch', marginTop: space.sm }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const modal = {
  backdrop: { flex: 1, backgroundColor: 'rgba(16,38,31,0.6)', justifyContent: 'center' as const, padding: space.xl },
  sheet: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: space.xl, alignItems: 'center' as const },
  heart: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.sun, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: space.lg },
};