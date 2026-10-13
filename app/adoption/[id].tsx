import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Chip, ChipRow, ErrorState, Loading, Screen, SectionTitle, TextField, styles } from '@/components/ui';
import { useListing, useRequestAdoption } from '@/hooks/queries';
import { UuidParam } from '@/lib/schemas';
import { errMsg, speciesEmoji } from '@/lib/format';
import { space } from '@/theme';

const HOUSING = ['Casa', 'Apartamento', 'Finca / lote'] as const;

export default function AdoptionRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = UuidParam.safeParse(params.id);
  if (!id.success) return <ErrorState message="Mascota no válida" />;
  return <AdoptionForm id={id.data} />;
}

function AdoptionForm({ id }: { id: string }) {
  const listing = useListing(id);
  const request = useRequestAdoption();
  const [housing, setHousing] = useState<string>(HOUSING[0]);
  const [otherPets, setOtherPets] = useState(false);
  const [children, setChildren] = useState(false);
  const [message, setMessage] = useState('');

  if (listing.isLoading) return <Loading />;
  if (listing.isError || !listing.data) return <ErrorState message={errMsg(listing.error)} onRetry={() => listing.refetch()} />;
  const l = listing.data;

  const submit = () => {
    if (message.trim().length < 10) {
      return Alert.alert('Cuéntanos más', 'Escribe unas líneas sobre por qué quieres adoptar (mínimo 10 caracteres).');
    }
    request.mutate(
      { listingId: id, housingType: housing, hasOtherPets: otherPets, hasChildren: children, message },
      {
        onSuccess: () => {
          Alert.alert('¡Solicitud enviada!', `${l.vets?.name ?? 'La veterinaria'} revisará tu solicitud y te contactará para coordinar una visita.`);
          router.replace('/activity');
        },
        onError: (e) => Alert.alert('No se pudo enviar', errMsg(e)),
      },
    );
  };

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginBottom: space.lg }}>
        <Text style={{ fontSize: 56 }}>{speciesEmoji[l.species]}</Text>
        <Text style={styles.h1}>{l.name}</Text>
        <Text style={styles.muted}>{l.vets?.name}</Text>
      </View>
      {l.description ? <Text style={[styles.body, { marginBottom: space.md }]}>{l.description}</Text> : null}

      <SectionTitle>Sobre tu hogar</SectionTitle>
      <ChipRow>
        {HOUSING.map((h) => (
          <Chip key={h} label={h} selected={housing === h} onPress={() => setHousing(h)} />
        ))}
      </ChipRow>
      <View style={[styles.between, { marginBottom: space.md }]}>
        <Text style={styles.body}>¿Tienes otras mascotas?</Text>
        <Switch value={otherPets} onValueChange={setOtherPets} />
      </View>
      <View style={[styles.between, { marginBottom: space.lg }]}>
        <Text style={styles.body}>¿Hay niños en casa?</Text>
        <Switch value={children} onValueChange={setChildren} />
      </View>

      <TextField
        label="¿Por qué quieres adoptar a esta mascota?"
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder="Cuéntanos sobre tu experiencia y tu rutina"
      />
      <Text style={[styles.muted, { fontSize: 12, marginBottom: space.md }]}>
        Adoptar es un compromiso de por vida. La veterinaria revisará tu solicitud y podrá pedirte una visita o entrevista.
      </Text>
      <Button title="Enviar solicitud" onPress={submit} loading={request.isPending} />
    </Screen>
  );
}
