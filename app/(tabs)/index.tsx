import { useCallback, useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, ChipRow, EmptyState, ErrorState, Loading, Screen, styles } from '@/components/ui';
import { PetCard } from '@/components/PetCard';
import { SwipeDeck, type SwipeDirection } from '@/components/SwipeDeck';
import { useAdoptionFeed, useSwipe } from '@/hooks/queries';
import type { FeedListing, Species } from '@/lib/schemas';
import { errMsg } from '@/lib/format';
import { colors, radius, space } from '@/theme';

export default function AdoptFeedScreen() {
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
      if (dir === 'like') setMatch(item);
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
      <Text style={styles.h1}>Encuentra a tu compañero 🐾</Text>
      <View style={{ marginTop: space.md }}>
        <ChipRow>
          <Chip label="Todos" selected={species === null} onPress={() => changeSpecies(null)} />
          <Chip label="🐶 Perros" selected={species === 'dog'} onPress={() => changeSpecies('dog')} />
          <Chip label="🐱 Gatos" selected={species === 'cat'} onPress={() => changeSpecies('cat')} />
        </ChipRow>
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
              title="¡Ya viste todas las mascotas!"
              subtitle="Vuelve pronto: las veterinarias aliadas publican nuevos peluditos cada semana."
              action={<Button title="Actualizar" variant="secondary" onPress={reload} />}
            />
          }
        />
      )}

      <Modal visible={!!match} transparent animationType="fade" onRequestClose={() => setMatch(null)}>
        <View style={modal.backdrop}>
          <View style={modal.sheet}>
            <Text style={{ fontSize: 56 }}>💚</Text>
            <Text style={[styles.h1, { textAlign: 'center' }]}>¡Es un match!</Text>
            <Text style={[styles.muted, { textAlign: 'center', marginVertical: space.md }]}>
              {match ? `${match.name} te está esperando en ${match.vet_name}. Envía tu solicitud para que la veterinaria te contacte.` : ''}
            </Text>
            <Button
              title="Solicitar adopción"
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' as const, padding: space.xl },
  sheet: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xl, alignItems: 'center' as const },
};
