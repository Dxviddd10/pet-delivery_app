import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, styles } from '@/components/ui';
import { useVets } from '@/hooks/queries';
import { errMsg } from '@/lib/format';
import { colors, space } from '@/theme';

export default function VetsScreen() {
  const vets = useVets();
  return (
    <Screen>
      <Text style={[styles.h1, { marginBottom: space.md }]}>Veterinarias aliadas</Text>
      {vets.isLoading ? (
        <Loading />
      ) : vets.isError ? (
        <ErrorState message={errMsg(vets.error)} onRetry={() => vets.refetch()} />
      ) : !vets.data?.length ? (
        <EmptyState emoji="🏥" title="Aún no hay veterinarias" subtitle="Muy pronto sumaremos aliados en tu ciudad." />
      ) : (
        <FlatList
          data={vets.data}
          keyExtractor={(v) => v.id}
          refreshing={vets.isRefetching}
          onRefresh={() => vets.refetch()}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/vet/${item.id}`)}>
              <Card>
                <Text style={styles.h2}>{item.name}</Text>
                {item.address ? <Text style={[styles.muted, { marginTop: 4 }]}>📍 {item.address}</Text> : null}
                {item.description ? <Text style={[styles.body, { marginTop: space.sm }]} numberOfLines={2}>{item.description}</Text> : null}
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                  {item.offers_home_visits ? <Badge label="Visitas a domicilio" color={colors.like} /> : null}
                  <Badge label="Ver servicios" color={colors.primary} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
