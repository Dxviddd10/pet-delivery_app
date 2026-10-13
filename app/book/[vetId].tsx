import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Chip, ChipRow, ErrorState, Loading, Screen, TextField, styles } from '@/components/ui';
import { Footer, OptionTile } from '@/components/extras';
import { useMyPets, useRequestAppointment, useServices, useVet } from '@/hooks/queries';
import { UuidParam } from '@/lib/schemas';
import { errMsg, formatCOP, speciesEmoji } from '@/lib/format';
import { colors, radius, space } from '@/theme';

const HOURS = [8, 9, 10, 11, 14, 15, 16, 17];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function BookRoute() {
  const params = useLocalSearchParams<{ vetId: string; serviceId?: string }>();
  const vetId = UuidParam.safeParse(params.vetId);
  if (!vetId.success) return <ErrorState message="Veterinaria no válida" />;
  const serviceId = UuidParam.safeParse(params.serviceId);
  return <Book vetId={vetId.data} initialServiceId={serviceId.success ? serviceId.data : null} />;
}

// Paso numerado: aquí sí es una secuencia real
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space.md }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: colors.text }}>{n}</Text>
        </View>
        <Text style={styles.h2}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Book({ vetId, initialServiceId }: { vetId: string; initialServiceId: string | null }) {
  const vet = useVet(vetId);
  const services = useServices(vetId);
  const pets = useMyPets();
  const request = useRequestAppointment();

  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [petId, setPetId] = useState<string | null>(null);
  const [mode, setMode] = useState<'in_clinic' | 'home'>('in_clinic');
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    }),
    [],
  );

  if (vet.isLoading || services.isLoading || pets.isLoading) return <Loading />;
  if (vet.isError || !vet.data) return <ErrorState message={errMsg(vet.error)} onRetry={() => vet.refetch()} />;
  if (services.isError) return <ErrorState message={errMsg(services.error)} onRetry={() => services.refetch()} />;

  const service = services.data?.find((s) => s.id === serviceId) ?? null;
  const canHome = !!service && vet.data.offers_home_visits && service.home_available;
  const effectiveMode = mode === 'home' && canHome ? 'home' : 'in_clinic';
  const homeFee = effectiveMode === 'home' ? vet.data.home_fee : 0;
  const total = (service?.price ?? 0) + homeFee;

  const slotDate = (() => {
    if (hour == null) return null;
    const d = new Date(days[dayOffset]);
    d.setHours(hour, 0, 0, 0);
    return d;
  })();
  const slotInPast = !!slotDate && slotDate.getTime() < Date.now() + 60 * 60 * 1000;

  const submit = () => {
    if (!service) return Alert.alert('Falta el servicio', 'Elige el servicio que necesitas.');
    if (!petId) return Alert.alert('Falta la mascota', 'Elige o registra tu mascota.');
    if (!slotDate || slotInPast) return Alert.alert('Horario inválido', 'Elige un horario con al menos 1 hora de anticipación.');
    if (effectiveMode === 'home' && address.trim().length < 6) return Alert.alert('Falta la dirección', 'Escribe la dirección completa de la visita.');

    request.mutate(
      { vetId, serviceId: service.id, petId, mode: effectiveMode, scheduledAt: slotDate, address, notes },
      {
        onSuccess: () => {
          Alert.alert('¡Solicitud enviada!', 'La veterinaria confirmará tu cita pronto. Te avisaremos en "Mi actividad".');
          router.replace('/activity');
        },
        onError: (e) => Alert.alert('No se pudo agendar', errMsg(e)),
      },
    );
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>{vet.data.name}</Text>

        <Step n={1} title="¿Qué necesita tu mascota?">
          {services.data?.map((s) => (
            <OptionTile
              key={s.id}
              title={s.name}
              subtitle={`${s.duration_min} minutos`}
              right={formatCOP(s.price)}
              selected={s.id === serviceId}
              onPress={() => setServiceId(s.id)}
            />
          ))}
        </Step>

        <Step n={2} title="¿Para quién es?">
          {pets.data?.length ? (
            <ChipRow>
              {pets.data.map((p) => (
                <Chip key={p.id} label={`${speciesEmoji[p.species]} ${p.name}`} selected={p.id === petId} onPress={() => setPetId(p.id)} />
              ))}
            </ChipRow>
          ) : (
            <View>
              <Text style={[styles.muted, { marginBottom: space.md }]}>Aún no tienes mascotas registradas.</Text>
              <Button title="Registrar mascota" variant="secondary" onPress={() => router.push('/pet/new')} />
            </View>
          )}
        </Step>

        <Step n={3} title="¿Dónde?">
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <OptionTile stacked emoji="🏥" title="En la veterinaria" subtitle="Sin costo extra" selected={effectiveMode === 'in_clinic'} onPress={() => setMode('in_clinic')} style={{ flex: 1 }} />
            {canHome ? (
              <OptionTile stacked emoji="🏠" title="En tu casa" subtitle={`+${formatCOP(vet.data.home_fee)}`} selected={effectiveMode === 'home'} onPress={() => setMode('home')} style={{ flex: 1 }} />
            ) : null}
          </View>
          {effectiveMode === 'home' ? (
            <TextField label="Dirección de la visita" value={address} onChangeText={setAddress} placeholder="Calle, número, barrio y referencias" />
          ) : null}
        </Step>

        <Step n={4} title="¿Cuándo?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingBottom: space.md }}>
            {days.map((d, i) => {
              const active = i === dayOffset;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setDayOffset(i)}
                  style={{ width: 62, paddingVertical: 10, borderRadius: 18, alignItems: 'center', backgroundColor: active ? colors.primary : colors.tint }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#FFFFFF' : colors.muted }}>{i === 0 ? 'Hoy' : DAY_NAMES[d.getDay()]}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: active ? '#FFFFFF' : colors.text }}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ChipRow>
            {HOURS.map((h) => {
              const d = new Date(days[dayOffset]);
              d.setHours(h, 0, 0, 0);
              const past = d.getTime() < Date.now() + 60 * 60 * 1000;
              return (
                <View key={h} style={past ? { opacity: 0.35 } : undefined} pointerEvents={past ? 'none' : 'auto'}>
                  <Chip label={`${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'a. m.' : 'p. m.'}`} selected={h === hour} onPress={() => setHour(h)} />
                </View>
              );
            })}
          </ChipRow>
        </Step>

        <View style={{ marginTop: space.md }}>
          <TextField label="Notas para la veterinaria (opcional)" value={notes} onChangeText={setNotes} multiline placeholder="Síntomas, alergias, comportamiento..." />
        </View>

        {homeFee > 0 ? (
          <View style={{ backgroundColor: colors.sunSoft, borderRadius: radius.md, padding: space.lg }}>
            <View style={styles.between}><Text style={styles.body}>Servicio</Text><Text style={styles.body}>{formatCOP(service?.price ?? 0)}</Text></View>
            <View style={styles.between}><Text style={styles.body}>Visita a domicilio</Text><Text style={styles.body}>{formatCOP(homeFee)}</Text></View>
          </View>
        ) : null}
      </ScrollView>

      <Footer>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <View>
            <Text style={styles.muted}>Total</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>{formatCOP(total)}</Text>
          </View>
          <Button title="Solicitar cita" onPress={submit} loading={request.isPending} style={{ flex: 1 }} />
        </View>
        <Text style={[styles.muted, { fontSize: 12, marginTop: space.sm }]}>
          Pagas directamente a la veterinaria. La cita queda sujeta a su confirmación.
        </Text>
      </Footer>
    </Screen>
  );
}