import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { FeedListing } from '@/lib/schemas';
import { formatAge, speciesEmoji } from '@/lib/format';
import { colors, radius, space } from '@/theme';

const sizeLabel = { small: 'Pequeño', medium: 'Mediano', large: 'Grande' } as const;

export function PetCard({ pet }: { pet: FeedListing }) {
  const [failed, setFailed] = useState(false);
  const photo = pet.photos[0];
  const stickers = [pet.vaccinated && 'Vacunado', pet.sterilized && 'Esterilizado', pet.dewormed && 'Desparasitado'].filter(Boolean) as string[];
  const traits = [
    pet.breed,
    pet.size && sizeLabel[pet.size],
    pet.sex === 'male' ? 'Macho' : pet.sex === 'female' ? 'Hembra' : null,
  ].filter(Boolean) as string[];

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${pet.name}, ${formatAge(pet.age_months)}, en ${pet.vet_name}`}
    >
      {photo && !failed ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => setFailed(true)} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={{ fontSize: 120 }}>{speciesEmoji[pet.species]}</Text>
        </View>
      )}

      {/* Degradado funcional: asegura que el texto se lea sobre cualquier foto */}
      <LinearGradient colors={['rgba(16,38,31,0)', 'rgba(16,38,31,0.94)']} locations={[0, 0.9]} style={styles.scrim} pointerEvents="none" />

      <View style={styles.vetChip}>
        <Text style={styles.vetChipText} numberOfLines={1}>🏥 {pet.vet_name}</Text>
      </View>

      <View style={styles.info}>
        {stickers.length ? (
          <View style={styles.stickers}>
            {stickers.map((s, i) => (
              <View key={s} style={[styles.sticker, { transform: [{ rotate: i % 2 === 0 ? '-3deg' : '2deg' }] }]}>
                <Text style={styles.stickerText}>✓ {s}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{pet.name}</Text>
        <Text style={styles.age}>{formatAge(pet.age_months)}</Text>

        {traits.length ? (
          <View style={styles.traits}>
            {traits.map((t) => (
              <View key={t} style={styles.trait}><Text style={styles.traitText}>{t}</Text></View>
            ))}
          </View>
        ) : null}
        {pet.temperament ? <Text style={styles.temper} numberOfLines={2}>{pet.temperament}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.sky },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sky },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  vetChip: {
    position: 'absolute', top: space.lg, left: space.lg, maxWidth: '75%',
    backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
  },
  vetChipText: { fontSize: 12, fontWeight: '800', color: colors.text },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.xl },
  stickers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  sticker: { backgroundColor: colors.sun, paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.sm },
  stickerText: { fontSize: 12, fontWeight: '900', color: colors.text },
  name: { color: '#FFFFFF', fontSize: 46, fontWeight: '900', letterSpacing: -1.5 },
  age: { color: '#FFFFFF', fontSize: 19, fontWeight: '700', marginTop: -2 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  trait: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 11, paddingVertical: 4, borderRadius: radius.pill },
  traitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  temper: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 10, lineHeight: 19 },
});