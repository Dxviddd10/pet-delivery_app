import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// ---------- Button ----------
type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        variant === 'danger' && { backgroundColor: colors.pass },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.primary : '#fff'} />
      ) : (
        <Text
          style={[
            styles.btnText,
            (variant === 'secondary' || variant === 'ghost') && { color: colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

// ---------- TextField ----------
type FieldProps = TextInputProps & { label: string; error?: string };

export const TextField = forwardRef<TextInput, FieldProps>(function TextField({ label, error, style, ...rest }, ref) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, !!error && { borderColor: colors.pass }, rest.multiline && { minHeight: 90, textAlignVertical: 'top' }, style]}
        {...rest}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
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
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
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
      <Text style={{ fontSize: 48, marginBottom: space.md }}>{emoji}</Text>
      <Text style={styles.h2}>{title}</Text>
      {subtitle ? <Text style={[styles.muted, { textAlign: 'center', marginTop: space.sm }]}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 40 }}>😿</Text>
      <Text accessibilityRole="alert" style={[styles.muted, { textAlign: 'center', marginVertical: space.md }]}>
        {message}
      </Text>
      {onRetry ? <Button title="Reintentar" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

// ---------- Card y Badge ----------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, color = colors.muted }: { label: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={[styles.h3, { marginTop: space.lg, marginBottom: space.sm }]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { padding: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  h3: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  error: { color: colors.pass, fontSize: 12, marginTop: 4 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: 12, fontSize: 15, color: colors.text,
  },
  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, marginBottom: space.md,
    borderWidth: 1, borderColor: colors.border,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
