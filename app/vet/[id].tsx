import { Linking, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, ErrorState, Loading, Screen, SectionTitle, styles } from '@/components/ui';
import { useServices, useVet } from '@/hooks/queries';
import { UuidParam } from '@/lib/schemas';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, space } from '@/theme';

export default function VetDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const parsed = UuidParam.safeParse(params.id);
  if (!parsed.success) return <ErrorState message="Veterinaria no válida" />;
  return <VetDetail id={parsed.data} />;
}

function VetDetail({ id }: { id: string }) {
  const vet = useVet(id);
  const services = useServices(id);

  if (vet.isLoading) return <Loading />;
  if (vet.isError || !vet.data) return <ErrorState message={errMsg(vet.error)} onRetry={() => vet.refetch()} />;
  const v = vet.data;

  return (
    <Screen scroll>
      <Text style={styles.h1}>{v.name}</Text>
      {v.address ? <Text style={[styles.muted, { marginTop: 4 }]}>📍 {v.address}</Text> : null}
      {v.description ? <Text style={[styles.body, { marginTop: space.md }]}>{v.description}</Text> : null}

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        {v.whatsapp ? (
          <Button title="WhatsApp" variant="secondary" onPress={() => Linking.openURL(`https://wa.me/${v.whatsapp}`)} style={{ flex: 1 }} />
        ) : null}
        {v.phone ? (
          <Button title="Llamar" variant="secondary" onPress={() => Linking.openURL(`tel:${v.phone}`)} style={{ flex: 1 }} />
        ) : null}
      </View>
      <Button title="Ver su tienda" variant="secondary" onPress={() => router.push({ pathname: '/shop', params: { vetId: v.id } })} style={{ marginTop: space.sm }} />

      <SectionTitle>Servicios</SectionTitle>
      {services.isLoading ? (
        <Loading />
      ) : services.isError ? (
        <ErrorState message={errMsg(services.error)} onRetry={() => services.refetch()} />
      ) : !services.data?.length ? (
        <Text style={styles.muted}>Esta veterinaria aún no ha publicado servicios.</Text>
      ) : (
        services.data.map((s) => (
          <Card key={s.id}>
            <View style={styles.between}>
              <Text style={[styles.h3, { flex: 1 }]}>{s.name}</Text>
              <Text style={[styles.h3, { color: colors.primaryDark }]}>{formatCOP(s.price)}</Text>
            </View>
            <Text style={[styles.muted, { marginVertical: space.sm }]}>⏱ {s.duration_min} min</Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
              <Badge label="En la veterinaria" color={colors.info} />
              {v.offers_home_visits && s.home_available ? <Badge label={`A domicilio +${formatCOP(v.home_fee)}`} color={colors.like} /> : null}
            </View>
            <Button title="Agendar" onPress={() => router.push({ pathname: `/book/${v.id}`, params: { serviceId: s.id } })} />
          </Card>
        ))
      )}
    </Screen>
  );
}
