import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, EmptyState, ErrorState, Loading, Row, Screen, styles } from '@/components/ui';
import { useProducts } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { useCart } from '@/providers/CartProvider';
import { UuidParam, type Product } from '@/lib/schemas';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, radius, space } from '@/theme';

const kindTile = {
  food: { emoji: '🍖', bg: colors.sky },
  accessory: { emoji: '🧸', bg: colors.sunSoft },
  otc_medicine: { emoji: '💊', bg: colors.tint },
  rx_medicine: { emoji: '💊', bg: colors.tint },
} as const;

export default function ShopScreen() {
  const params = useLocalSearchParams<{ vetId?: string }>();
  const parsedVet = UuidParam.safeParse(params.vetId);
  const vetId = parsedVet.success ? parsedVet.data : null;

  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const products = useProducts({ search: debounced, vetId });
  const cart = useCart();

  const addToCart = (p: Product) => {
    const result = cart.add(p);
    if (result === 'other_vet') {
      Alert.alert(
        'Carrito de otra veterinaria',
        'Cada pedido se hace a una sola veterinaria. ¿Quieres vaciar tu carrito y empezar con este producto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reemplazar', style: 'destructive', onPress: () => cart.replaceWith(p) },
        ],
      );
    } else if (result === 'no_stock') {
      Alert.alert('Agotado', 'Este producto no tiene unidades disponibles.');
    }
  };

  return (
    <Screen>
      <Text style={styles.h1}>Tienda</Text>
      <TextInput
        accessibilityLabel="Buscar productos"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar alimento, accesorios, antipulgas..."
        placeholderTextColor={colors.muted}
        style={[styles.input, { marginVertical: space.md }]}
        returnKeyType="search"
      />
      {vetId ? (
        <Pressable onPress={() => router.setParams({ vetId: undefined })} style={{ marginBottom: space.md }}>
          <Badge label="Filtrando por una veterinaria · toca para quitar ✕" color={colors.info} />
        </Pressable>
      ) : null}

      {products.isLoading ? (
        <Loading />
      ) : products.isError ? (
        <ErrorState message={errMsg(products.error)} onRetry={() => products.refetch()} />
      ) : !products.data?.length ? (
        <EmptyState emoji="🛍️" title="Sin resultados" subtitle="Prueba con otra palabra. Los medicamentos con fórmula se gestionan directamente con la veterinaria." />
      ) : (
        <FlatList
          data={products.data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: cart.count ? 90 : space.xl }}
          refreshing={products.isRefetching}
          onRefresh={() => products.refetch()}
          renderItem={({ item }) => (
            <Row>
              <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: kindTile[item.kind].bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 30 }}>{kindTile[item.kind].emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.h3} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.muted} numberOfLines={1}>{item.vets?.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 }}>
                  <View style={{ backgroundColor: colors.sun, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.sm }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>{formatCOP(item.price)}</Text>
                  </View>
                  {item.stock < 1 ? <Badge label="Agotado" color={colors.pass} /> : item.stock <= 3 ? <Badge label={`Quedan ${item.stock}`} color={colors.warn} /> : null}
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Agregar ${item.name} al carrito`}
                disabled={item.stock < 1}
                onPress={() => addToCart(item)}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center', opacity: item.stock < 1 ? 0.35 : pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: -2 }}>+</Text>
              </Pressable>
            </Row>
          )}
        />
      )}

      {cart.count > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/cart')}
          style={{
            position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, backgroundColor: colors.primary,
            borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: space.xl, flexDirection: 'row', justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>🛒 Ver carrito ({cart.count})</Text>
          <Text style={{ color: colors.sun, fontWeight: '900' }}>{formatCOP(cart.subtotal)}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}