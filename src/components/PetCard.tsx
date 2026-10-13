import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { FeedListing } from '@/lib/schemas';
import { formatAge, speciesEmoji } from '@/lib/format';
import { colors, radius, space } from '@/theme';

const sizeLabel = { small: 'Pequeño', medium: 'Mediano', large: 'Grande' } as const;

export function PetCard({ pet }: { pet: FeedListing }) {
  const [failed, setFailed] = useState(false);
  const photo = pet.photos[0];
  const facts = [
    pet.vaccinated && '💉 Vacunado',
    pet.sterilized && '✂️ Esterilizado',
    pet.dewormed && '🪱 Desparasitado',
  ].filter(Boolean) as string[];

  return (
    <View style={styles.card}>
      {photo && !failed ? (
        <Image
          source={{ uri: photo }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`Foto de ${pet.name}`}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={{ fontSize: 96 }}>{speciesEmoji[pet.species]}</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.name}>
          {pet.name} <Text style={styles.age}>· {formatAge(pet.age_months)}</Text>
        </Text>
        <Text style={styles.meta}>
          {[pet.breed, pet.size && sizeLabel[pet.size], pet.sex === 'male' ? 'Macho' : pet.sex === 'female' ? 'Hembra' : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {pet.temperament ? <Text style={styles.meta}>{pet.temperament}</Text> : null}
        {facts.length ? <Text style={styles.facts}>{facts.join('   ')}</Text> : null}
        <Text style={styles.vet}>📍 {pet.vet_name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#EADBCB' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6E3CF' },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, backgroundColor: 'rgba(0,0,0,0.55)' },
  name: { color: '#fff', fontSize: 26, fontWeight: '800' },
  age: { fontSize: 18, fontWeight: '500' },
  meta: { color: '#F3E9DF', fontSize: 14, marginTop: 2 },
  facts: { color: '#fff', fontSize: 13, marginTop: 6 },
  vet: { color: colors.bg, fontSize: 13, marginTop: 6, fontWeight: '600' },
});
