import { Linking, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Avatar, Badge, Button, ErrorState, Loading, Row, Screen, SectionTitle, styles } from '@/components/ui';
import { PricePill } from '@/components/extras';
import { useServices, useVet } from '@/hooks/queries';
import { UuidParam } from '@/lib/schemas';
import { errMsg } from '@/lib/format';
import { colors, radius, space } from '@/theme';

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
      <View style={{ backgroundColor: colors.sky, borderRadius: radius.lg, padding: space.xl }}>
        <Avatar label={v.name} size={72} />
        <Text style={[styles.h1, { marginTop: space.md }]}>{v.name}</Text>
        {v.address ? <Text style={[styles.muted, { marginTop: 4, color: colors.text }]}>📍 {v.address}</Text> : null}
        {v.description ? <Text style={[styles.body, { marginTop: space.sm }]}>{v.description}</Text> : null}
        {v.offers_home_visits ? (
          <View style={{ marginTop: space.md }}>
            <Badge label="Va hasta tu casa" color={colors.primary} />
          </View>
        ) : null}
      </View>

      {v.whatsapp || v.phone ? (
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
          {v.whatsapp ? (
            <Button title="💬  WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${v.whatsapp}`)} style={{ flex: 1 }} />
          ) : null}
          {v.phone ? (
            <Button title="📞  Llamar" variant="secondary" onPress={() => Linking.openURL(`tel:${v.phone}`)} style={{ flex: 1 }} />
          ) : null}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/shop', params: { vetId: v.id } })} style={{ marginTop: space.sm }}>
        <Row>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.sunSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>🛍️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>Ver su tienda</Text>
            <Text style={styles.muted}>Alimento, accesorios y más</Text>
          </View>
          <Text style={{ fontSize: 22, color: colors.muted }}>›</Text>
        </Row>
      </Pressable>

      <SectionTitle>Servicios</SectionTitle>
      {services.isLoading ? (
        <Loading />
      ) : services.isError ? (
        <ErrorState message={errMsg(services.error)} onRetry={() => services.refetch()} />
      ) : !services.data?.length ? (
        <Text style={styles.muted}>Esta veterinaria aún no ha publicado servicios.</Text>
      ) : (
        services.data.map((s) => (
          <Row key={s.id} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h3}>{s.name}</Text>
              <Text style={[styles.muted, { marginVertical: 4 }]}>⏱ {s.duration_min} minutos</Text>
              {v.offers_home_visits && s.home_available ? <Badge label="También a domicilio" color={colors.like} /> : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: space.sm }}>
              <PricePill value={s.price} />
              <Button
                title="Agendar"
                onPress={() => router.push({ pathname: `/book/${v.id}`, params: { serviceId: s.id } })}
                style={{ minHeight: 40, paddingVertical: 8, paddingHorizontal: 20 }}
              />
            </View>
          </Row>
        ))
      )}
    </Screen>
  );
}