import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCOP } from '@/lib/format';
import { colors, radius, space } from '@/theme';

// ---------- Opción seleccionable (tipo "radio" con aspecto de tarjeta) ----------
type TileProps = {
  title: string;
  subtitle?: string;
  emoji?: string;
  right?: string;
  selected?: boolean;
  stacked?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function OptionTile({ title, subtitle, emoji, right, selected, stacked, onPress, style }: TileProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[tile.base, stacked && tile.stacked, selected && tile.selected, style]}
    >
      {emoji ? <Text style={{ fontSize: 26 }}>{emoji}</Text> : null}
      <View style={stacked ? undefined : { flex: 1 }}>
        <Text style={tile.title}>{title}</Text>
        {subtitle ? <Text style={tile.sub}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={tile.right}>{right}</Text> : null}
    </Pressable>
  );
}

const tile = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.tint,
    borderWidth: 2, borderColor: 'transparent', borderRadius: 18, padding: 14, marginBottom: 8,
  },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 6 },
  selected: { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  right: { fontSize: 15, fontWeight: '900', color: colors.text },
});

// ---------- Precio en píldora amarilla ----------
export function PricePill({ value }: { value: number }) {
  return (
    <View style={{ backgroundColor: colors.sun, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{formatCOP(value)}</Text>
    </View>
  );
}

// ---------- Barra inferior fija con total y botón de acción ----------
export function Footer({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.card, paddingHorizontal: space.lg, paddingTop: space.md,
        paddingBottom: Math.max(insets.bottom, space.lg),
        borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        elevation: 12, shadowColor: '#10261F', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -3 },
      }}
    >
      {children}
    </View>
  );
}

// ---------- Icono por tipo de producto ----------
export function productTile(kind: 'food' | 'accessory' | 'otc_medicine' | 'rx_medicine') {
  switch (kind) {
    case 'food': return { emoji: '🍖', bg: colors.sky };
    case 'accessory': return { emoji: '🧸', bg: colors.sunSoft };
    default: return { emoji: '💊', bg: colors.tint };
  }
}