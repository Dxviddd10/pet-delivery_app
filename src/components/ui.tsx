import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, radius, space } from '@/theme';

// ---------- Screen ----------
export function Screen({ children, scroll = false, padded = true }: { children: ReactNode; scroll?: boolean; padded?: boolean }) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.padded, { paddingBottom: space.xl * 2 }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

// ---------- Pantallas de acceso: cabecera verde + hoja blanca ----------
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xl + 8 }}>
        <View style={styles.logoCircle}>
          <Text style={{ fontSize: 34 }}>🐾</Text>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSub}>{subtitle}</Text>
      </SafeAreaView>
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={{ padding: space.xl, paddingBottom: space.xl * 2 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ---------- Button ----------
type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'sun' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const buttonColors = {
  primary: { bg: colors.primary, fg: '#FFFFFF' },
  sun: { bg: colors.sun, fg: colors.text },
  secondary: { bg: colors.tint, fg: colors.text },
  danger: { bg: colors.pass, fg: '#FFFFFF' },
  ghost: { bg: 'transparent', fg: colors.primary },
} as const;

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const c = buttonColors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: c.bg },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={c.fg} /> : <Text style={[styles.btnText, { color: c.fg }]}>{title}</Text>}
    </Pressable>
  );
}

// ---------- TextField ----------
type FieldProps = TextInputProps & { label: string; error?: string };

export const TextField = forwardRef<TextInput, FieldProps>(function TextField(
  { label, error, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[
          styles.input,
          focused && { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
          !!error && { borderColor: colors.pass },
          rest.multiline && { minHeight: 96, textAlignVertical: 'top' },
          style,
        ]}
        {...rest}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
});

// ---------- Chip ----------
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

// ---------- Estados ----------
export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({ emoji, title, subtitle, action }: { emoji: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyCircle}>
        <Text style={{ fontSize: 44 }}>{emoji}</Text>
      </View>
      <Text style={[styles.h2, { textAlign: 'center' }]}>{title}</Text>
      {subtitle ? <Text style={[styles.muted, { textAlign: 'center', marginTop: space.sm, maxWidth: 300 }]}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <View style={[styles.emptyCircle, { backgroundColor: '#FDE3DB' }]}>
        <Text style={{ fontSize: 44 }}>😿</Text>
      </View>
      <Text accessibilityRole="alert" style={[styles.muted, { textAlign: 'center', marginBottom: space.md, maxWidth: 300 }]}>
        {message}
      </Text>
      {onRetry ? <Button title="Reintentar" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

// ---------- Card, Row, Avatar, Badge ----------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Fila de lista con línea divisoria (para listas largas: veterinarias, productos). */
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.listRow, style]}>{children}</View>;
}

export function Avatar({ label, size = 48, bg = colors.sun }: { label: string; size?: number; bg?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '900', color: colors.text }}>{label.trim().charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

export function Badge({ label, color = colors.muted }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '1F' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={[styles.h3, { marginTop: space.xl, marginBottom: space.sm }]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { padding: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  h1: { fontSize: 30, fontWeight: '900', color: colors.text, letterSpacing: -0.6 },
  h2: { fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  error: { color: colors.pass, fontSize: 12, marginTop: 4, fontWeight: '600' },
  input: {
    backgroundColor: colors.tint, borderWidth: 2, borderColor: 'transparent', borderRadius: radius.md,
    paddingHorizontal: space.lg, paddingVertical: 13, fontSize: 15, color: colors.text,
  },
  btn: { borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  btnText: { fontSize: 15, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.tint },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.tint, borderRadius: 20, padding: space.lg, marginBottom: space.md },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  heroTitle: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8 },
  heroSub: { fontSize: 15, color: '#CFE6DB', marginTop: 4, lineHeight: 21 },
  sheet: { flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
});