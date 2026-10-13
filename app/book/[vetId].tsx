import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, ChipRow, ErrorState, Loading, Screen, SectionTitle, TextField, styles } from '@/components/ui';
import { useMyPets, useRequestAppointment, useServices, useVet } from '@/hooks/queries';
import { UuidParam } from '@/lib/schemas';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, space } from '@/theme';

const HOURS = [8, 9, 10, 11, 14, 15, 16, 17];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function BookRoute() {
  const params = useLocalSearchParams<{ vetId: string; serviceId?: string }>();
  const vetId = UuidParam.safeParse(params.vetId);
  if (!vetId.success) return <ErrorState message="Veterinaria no válida" />;
  const serviceId = UuidParam.safeParse(params.serviceId);
  return <Book vetId={vetId.data} initialServiceId={serviceId.success ? serviceId.data : null} />;
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
    <Screen scroll>
      <Text style={styles.h2}>{vet.data.name}</Text>

      <SectionTitle>1. Servicio</SectionTitle>
      <ChipRow>
        {services.data?.map((s) => (
          <Chip key={s.id} label={`${s.name} · ${formatCOP(s.price)}`} selected={s.id === serviceId} onPress={() => setServiceId(s.id)} />
        ))}
      </ChipRow>

      <SectionTitle>2. Mascota</SectionTitle>
      {pets.data?.length ? (
        <ChipRow>
          {pets.data.map((p) => (
            <Chip key={p.id} label={p.name} selected={p.id === petId} onPress={() => setPetId(p.id)} />
          ))}
        </ChipRow>
      ) : (
        <Card>
          <Text style={[styles.muted, { marginBottom: space.md }]}>Aún no tienes mascotas registradas.</Text>
          <Button title="Registrar mascota" variant="secondary" onPress={() => router.push('/pet/new')} />
        </Card>
      )}

      <SectionTitle>3. ¿Dónde?</SectionTitle>
      <ChipRow>
        <Chip label="En la veterinaria" selected={effectiveMode === 'in_clinic'} onPress={() => setMode('in_clinic')} />
        {canHome ? <Chip label={`A domicilio (+${formatCOP(vet.data.home_fee)})`} selected={effectiveMode === 'home'} onPress={() => setMode('home')} /> : null}
      </ChipRow>
      {effectiveMode === 'home' ? (
        <TextField label="Dirección de la visita" value={address} onChangeText={setAddress} placeholder="Calle, número, barrio y referencias" />
      ) : null}

      <SectionTitle>4. Fecha y hora</SectionTitle>
      <ChipRow>
        {days.map((d, i) => (
          <Chip key={i} label={i === 0 ? 'Hoy' : `${DAY_NAMES[d.getDay()]} ${d.getDate()}`} selected={i === dayOffset} onPress={() => setDayOffset(i)} />
        ))}
      </ChipRow>
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

      <TextField label="Notas para la veterinaria (opcional)" value={notes} onChangeText={setNotes} multiline placeholder="Síntomas, alergias, comportamiento..." />

      <Card style={{ backgroundColor: '#FFF1E4' }}>
        <View style={styles.between}>
          <Text style={styles.body}>Servicio</Text>
          <Text style={styles.body}>{formatCOP(service?.price ?? 0)}</Text>
        </View>
        {homeFee > 0 ? (
          <View style={styles.between}>
            <Text style={styles.body}>Recargo a domicilio</Text>
            <Text style={styles.body}>{formatCOP(homeFee)}</Text>
          </View>
        ) : null}
        <View style={[styles.between, { marginTop: space.sm }]}>
          <Text style={styles.h3}>Total</Text>
          <Text style={[styles.h3, { color: colors.primaryDark }]}>{formatCOP(total)}</Text>
        </View>
        <Text style={[styles.muted, { fontSize: 12, marginTop: space.sm }]}>Pagas directamente a la veterinaria (efectivo o transferencia). La cita queda sujeta a su confirmación.</Text>
      </Card>

      <Button title="Solicitar cita" onPress={submit} loading={request.isPending} />
    </Screen>
  );
}
