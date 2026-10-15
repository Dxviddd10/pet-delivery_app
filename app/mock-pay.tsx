import { Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Screen, styles } from '@/components/ui';
import { useMockPay } from '@/hooks/queries';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, radius, space } from '@/theme';

// ============================================================
// MODO PRUEBA · Simulador de pago
// Reemplaza a la pasarela (Wompi) mientras no hay RUT.
// La app NO escribe el pago: llama a la RPC mock_pay_order, que
// en el servidor marca el pedido como pagado (igual que un webhook).
// ============================================================
export default function MockPayScreen() {
  const params = useLocalSearchParams<{ orderId?: string; total?: string }>();
  const orderId = params.orderId ?? '';
  const total = Number(params.total ?? 0);
  const mockPay = useMockPay();

  const decide = (approve: boolean) => {
    if (!orderId) return Alert.alert('Error', 'No se recibió el pedido a pagar.');
    mockPay.mutate(
      { orderId, approve },
      {
        onSuccess: () => {
          Alert.alert(
            approve ? '✅ Pago aprobado' : 'Pago rechazado',
            approve
              ? 'El pedido quedó marcado como pagado. Lo verás en "Mi actividad".'
              : 'El pedido sigue pendiente de pago.',
          );
          router.replace('/activity');
        },
        onError: (e) => Alert.alert('No se pudo completar el pago', errMsg(e)),
      },
    );
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={cardStyle}>
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>MODO PRUEBA · Pago simulado</Text>
          </View>

          <Text style={styles.h2}>Simulador de pago</Text>
          <Text style={[styles.muted, { marginTop: space.sm }]}>
            Esta pantalla reemplaza a la pasarela (Wompi) mientras no tienes RUT. No se cobra dinero real.
          </Text>

          <View style={{ marginTop: space.xl }}>
            <View style={styles.between}>
              <Text style={styles.body}>Pedido</Text>
              <Text style={styles.muted}>{orderId ? orderId.slice(0, 8) : '—'}</Text>
            </View>
            <View style={[styles.between, { marginTop: space.sm }]}>
              <Text style={styles.body}>Método</Text>
              <Text style={styles.muted}>Tarjeta (simulada)</Text>
            </View>
            <View style={[styles.between, { marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={styles.h3}>Total</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text }}>{formatCOP(total)}</Text>
            </View>
          </View>

          <View style={{ marginTop: space.xl, gap: space.md }}>
            <Button title="Aprobar pago" onPress={() => decide(true)} loading={mockPay.isPending} />
            <Button title="Rechazar" variant="secondary" onPress={() => decide(false)} disabled={mockPay.isPending} />
          </View>
        </View>

        <Text style={[styles.muted, { textAlign: 'center', fontSize: 12, marginTop: space.lg }]}>
          Solo ambiente de pruebas. Ningún cobro es real.
        </Text>
      </View>
    </Screen>
  );
}

const cardStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  padding: space.xl,
  borderWidth: 1,
  borderColor: colors.border,
};

const badgeStyle = {
  alignSelf: 'flex-start' as const,
  backgroundColor: colors.sunSoft,
  borderRadius: radius.pill,
  paddingHorizontal: 12,
  paddingVertical: 5,
  marginBottom: space.md,
};

const badgeTextStyle = {
  fontSize: 12,
  fontWeight: '800' as const,
  color: colors.warn,
};
