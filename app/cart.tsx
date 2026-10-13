import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, ChipRow, EmptyState, Screen, SectionTitle, TextField, styles } from '@/components/ui';
import { useCreateOrder, useVet } from '@/hooks/queries';
import { useCart } from '@/providers/CartProvider';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, space } from '@/theme';

export default function CartScreen() {
  const cart = useCart();
  const vet = useVet(cart.vetId);
  const createOrder = useCreateOrder();
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'transfer'>('cash_on_delivery');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  if (!cart.lines.length || !cart.vetId) {
    return (
      <Screen>
        <EmptyState
          emoji="🛒"
          title="Tu carrito está vacío"
          subtitle="Agrega alimento, accesorios o productos de venta libre desde la tienda."
          action={<Button title="Ir a la tienda" onPress={() => router.replace('/shop')} />}
        />
      </Screen>
    );
  }

  const vetId = cart.vetId;
  const deliveryFee = deliveryMode === 'delivery' ? vet.data?.delivery_fee ?? 0 : 0;
  const total = cart.subtotal + deliveryFee;

  const submit = () => {
    if (deliveryMode === 'delivery' && address.trim().length < 6) {
      return Alert.alert('Falta la dirección', 'Escribe la dirección completa de entrega.');
    }
    createOrder.mutate(
      {
        vetId,
        items: cart.lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
        deliveryMode,
        address,
        paymentMethod,
        notes,
      },
      {
        onSuccess: () => {
          cart.clear();
          Alert.alert('¡Pedido enviado!', 'La veterinaria lo confirmará en breve. Sigue el estado en "Mi actividad".');
          router.replace('/activity');
        },
        onError: (e) => Alert.alert('No se pudo crear el pedido', errMsg(e)),
      },
    );
  };

  return (
    <Screen scroll>
      <Text style={styles.h2}>{cart.lines[0].product.vets?.name}</Text>

      <View style={{ marginTop: space.md }}>
        {cart.lines.map(({ product, quantity }) => (
          <Card key={product.id}>
            <Text style={styles.h3}>{product.name}</Text>
            <View style={[styles.between, { marginTop: space.sm }]}>
              <View style={styles.row}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Quitar una unidad de ${product.name}`} onPress={() => cart.setQuantity(product.id, quantity - 1)} style={qty}>
                  <Text style={qtyText}>−</Text>
                </Pressable>
                <Text style={[styles.h3, { marginHorizontal: space.lg }]}>{quantity}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Agregar una unidad de ${product.name}`} onPress={() => cart.setQuantity(product.id, quantity + 1)} style={qty}>
                  <Text style={qtyText}>+</Text>
                </Pressable>
              </View>
              <Text style={styles.h3}>{formatCOP(product.price * quantity)}</Text>
            </View>
          </Card>
        ))}
      </View>

      <SectionTitle>Entrega</SectionTitle>
      <ChipRow>
        <Chip label="Recoger en tienda" selected={deliveryMode === 'pickup'} onPress={() => setDeliveryMode('pickup')} />
        <Chip label="Domicilio" selected={deliveryMode === 'delivery'} onPress={() => setDeliveryMode('delivery')} />
      </ChipRow>
      {deliveryMode === 'delivery' ? (
        <TextField label="Dirección de entrega" value={address} onChangeText={setAddress} placeholder="Calle, número, barrio y referencias" />
      ) : null}

      <SectionTitle>Pago</SectionTitle>
      <ChipRow>
        <Chip label="Contra entrega" selected={paymentMethod === 'cash_on_delivery'} onPress={() => setPaymentMethod('cash_on_delivery')} />
        <Chip label="Transferencia" selected={paymentMethod === 'transfer'} onPress={() => setPaymentMethod('transfer')} />
      </ChipRow>
      {paymentMethod === 'transfer' ? (
        <Text style={[styles.muted, { fontSize: 12, marginBottom: space.md }]}>
          La veterinaria te enviará los datos de la cuenta y confirmará el pago manualmente.
        </Text>
      ) : null}

      <TextField label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline />

      <Card style={{ backgroundColor: '#FFF1E4' }}>
        <View style={styles.between}><Text style={styles.body}>Subtotal</Text><Text style={styles.body}>{formatCOP(cart.subtotal)}</Text></View>
        <View style={styles.between}><Text style={styles.body}>Domicilio</Text><Text style={styles.body}>{deliveryFee ? formatCOP(deliveryFee) : 'Gratis'}</Text></View>
        <View style={[styles.between, { marginTop: space.sm }]}>
          <Text style={styles.h3}>Total</Text>
          <Text style={[styles.h3, { color: colors.primaryDark }]}>{formatCOP(total)}</Text>
        </View>
      </Card>

      <Button title="Confirmar pedido" onPress={submit} loading={createOrder.isPending} />
      <Button title="Vaciar carrito" variant="ghost" onPress={cart.clear} style={{ marginTop: space.sm }} />
    </Screen>
  );
}

const qty = { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const };
const qtyText = { fontSize: 20, fontWeight: '700' as const, color: colors.primary };
