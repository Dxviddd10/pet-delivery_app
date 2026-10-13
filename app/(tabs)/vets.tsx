import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Badge, EmptyState, ErrorState, Loading, Row, Screen, styles } from '@/components/ui';
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
              <Row>
                <Avatar label={item.name} size={54} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3}>{item.name}</Text>
                  {item.address ? <Text style={styles.muted} numberOfLines={1}>{item.address}</Text> : null}
                  {item.offers_home_visits ? (
                    <View style={{ marginTop: 6 }}>
                      <Badge label="Va hasta tu casa" color={colors.like} />
                    </View>
                  ) : null}
                </View>
                <Text style={{ fontSize: 22, color: colors.muted }}>›</Text>
              </Row>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}