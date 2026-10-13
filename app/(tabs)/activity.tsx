import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { Badge, Button, Card, Chip, ChipRow, EmptyState, ErrorState, Loading, Screen, styles } from '@/components/ui';
import {
  useCancelAppointment, useCancelOrder, useMyAdoptionRequests, useMyAppointments, useMyOrders,
} from '@/hooks/queries';
import { errMsg, formatCOP, formatDateTime } from '@/lib/format';
import { colors, space } from '@/theme';

type Tab = 'appointments' | 'orders' | 'adoptions';

const apptStatus = {
  requested: ['Pendiente de confirmar', colors.warn], confirmed: ['Confirmada', colors.like],
  rescheduled: ['Reprogramada', colors.info], completed: ['Realizada', colors.muted],
  cancelled: ['Cancelada', colors.pass], no_show: ['No asistió', colors.pass],
} as const;
const orderStatus = {
  placed: ['Enviado', colors.warn], confirmed: ['Confirmado', colors.info], preparing: ['Preparando', colors.info],
  out_for_delivery: ['En camino', colors.primary], delivered: ['Entregado', colors.like], cancelled: ['Cancelado', colors.pass],
} as const;
const requestStatus = {
  pending: ['En revisión', colors.warn], contacted: ['Te contactaron', colors.info], approved: ['Aprobada 🎉', colors.like],
  rejected: ['No aprobada', colors.pass], withdrawn: ['Retirada', colors.muted],
} as const;

export default function ActivityScreen() {
  const [tab, setTab] = useState<Tab>('appointments');
  return (
    <Screen>
      <Text style={styles.h1}>Mi actividad</Text>
      <View style={{ marginVertical: space.md }}>
        <ChipRow>
          <Chip label="Citas" selected={tab === 'appointments'} onPress={() => setTab('appointments')} />
          <Chip label="Pedidos" selected={tab === 'orders'} onPress={() => setTab('orders')} />
          <Chip label="Adopciones" selected={tab === 'adoptions'} onPress={() => setTab('adoptions')} />
        </ChipRow>
      </View>
      {tab === 'appointments' ? <Appointments /> : tab === 'orders' ? <Orders /> : <Adoptions />}
    </Screen>
  );
}

function Appointments() {
  const q = useMyAppointments();
  const cancel = useCancelAppointment();
  const confirmCancel = (id: string) =>
    Alert.alert('Cancelar cita', '¿Seguro que quieres cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancel.mutate(id, { onError: (e) => Alert.alert('No se pudo cancelar', errMsg(e)) }) },
    ]);

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState emoji="📅" title="Sin citas todavía" subtitle="Agenda una consulta desde la pestaña Veterinarias." />;
  return (
    <FlatList
      data={q.data}
      keyExtractor={(a) => a.id}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      renderItem={({ item }) => {
        const [label, color] = apptStatus[item.status];
        const cancellable = item.status === 'requested' || item.status === 'confirmed' || item.status === 'rescheduled';
        return (
          <Card>
            <View style={styles.between}>
              <Text style={[styles.h3, { flex: 1 }]}>{item.services?.name} · {item.pets?.name}</Text>
              <Badge label={label} color={color} />
            </View>
            <Text style={[styles.muted, { marginTop: 4 }]}>{item.vets?.name}</Text>
            <Text style={[styles.body, { marginTop: space.sm }]}>🗓 {formatDateTime(item.scheduled_at)} · {item.mode === 'home' ? '🏠 A domicilio' : '🏥 En la veterinaria'}</Text>
            <Text style={[styles.body, { marginTop: 4 }]}>Total: {formatCOP(item.total)}</Text>
            {cancellable ? <Button title="Cancelar cita" variant="secondary" onPress={() => confirmCancel(item.id)} style={{ marginTop: space.md }} /> : null}
          </Card>
        );
      }}
    />
  );
}

function Orders() {
  const q = useMyOrders();
  const cancel = useCancelOrder();
  const confirmCancel = (id: string) =>
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancel.mutate(id, { onError: (e) => Alert.alert('No se pudo cancelar', errMsg(e)) }) },
    ]);

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState emoji="📦" title="Sin pedidos todavía" subtitle="Cuando compres en la tienda, verás aquí el estado de tus pedidos." />;
  return (
    <FlatList
      data={q.data}
      keyExtractor={(o) => o.id}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      renderItem={({ item }) => {
        const [label, color] = orderStatus[item.status];
        return (
          <Card>
            <View style={styles.between}>
              <Text style={[styles.h3, { flex: 1 }]}>{item.vets?.name}</Text>
              <Badge label={label} color={color} />
            </View>
            <Text style={[styles.body, { marginTop: space.sm }]}>{item.order_items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>{item.delivery_mode === 'delivery' ? '🛵 Domicilio' : '🏪 Recoger en tienda'} · {formatCOP(item.total)}</Text>
            {item.status === 'placed' || item.status === 'confirmed' ? (
              <Button title="Cancelar pedido" variant="secondary" onPress={() => confirmCancel(item.id)} style={{ marginTop: space.md }} />
            ) : null}
          </Card>
        );
      }}
    />
  );
}

function Adoptions() {
  const q = useMyAdoptionRequests();
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState emoji="🐶" title="Aún no has solicitado adopciones" subtitle="Desliza a la derecha en una mascota que te encante." />;
  return (
    <FlatList
      data={q.data}
      keyExtractor={(r) => r.id}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      renderItem={({ item }) => {
        const [label, color] = requestStatus[item.status];
        return (
          <Card>
            <View style={styles.between}>
              <Text style={[styles.h3, { flex: 1 }]}>{item.adoption_listings?.name}</Text>
              <Badge label={label} color={color} />
            </View>
            <Text style={[styles.muted, { marginTop: 4 }]}>{item.adoption_listings?.vets?.name}</Text>
          </Card>
        );
      }}
    />
  );
}
