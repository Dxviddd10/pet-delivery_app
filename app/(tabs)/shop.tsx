import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, Screen, styles } from '@/components/ui';
import { useProducts } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { useCart } from '@/providers/CartProvider';
import { UuidParam, type Product } from '@/lib/schemas';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, radius, space } from '@/theme';

const kindLabel = { food: 'Alimento', accessory: 'Accesorio', otc_medicine: 'Venta libre', rx_medicine: 'Con fórmula' } as const;

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
            <Card>
              <View style={styles.between}>
                <View style={{ flex: 1, paddingRight: space.md }}>
                  <Text style={styles.h3}>{item.name}</Text>
                  <Text style={[styles.muted, { marginTop: 2 }]}>{item.vets?.name}</Text>
                  <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                    <Badge label={kindLabel[item.kind]} color={colors.info} />
                    {item.stock < 1 ? <Badge label="Agotado" color={colors.pass} /> : item.stock <= 3 ? <Badge label={`Quedan ${item.stock}`} color={colors.warn} /> : null}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: space.sm }}>
                  <Text style={[styles.h3, { color: colors.primaryDark }]}>{formatCOP(item.price)}</Text>
                  <Button title="Agregar" onPress={() => addToCart(item)} disabled={item.stock < 1} style={{ minHeight: 40, paddingVertical: 8 }} />
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {cart.count > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/cart')}
          style={{
            position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, backgroundColor: colors.primary,
            borderRadius: radius.md, padding: space.lg, flexDirection: 'row', justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>🛒 Ver carrito ({cart.count})</Text>
          <Text style={{ color: '#fff', fontWeight: '800' }}>{formatCOP(cart.subtotal)}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
