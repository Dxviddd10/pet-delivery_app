import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Row, Screen, SectionTitle, TextField, styles } from '@/components/ui';
import { Footer, OptionTile, productTile } from '@/components/extras';
import { useCreateOrder, useVet } from '@/hooks/queries';
import { useCart } from '@/providers/CartProvider';
import { errMsg, formatCOP } from '@/lib/format';
import { colors, radius, space } from '@/theme';

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
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>Tu pedido en</Text>
        <Text style={styles.h1}>{cart.lines[0].product.vets?.name}</Text>

        <View style={{ marginTop: space.md }}>
          {cart.lines.map(({ product, quantity }) => {
            const t = productTile(product.kind);
            return (
              <Row key={product.id}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h3} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.muted}>{formatCOP(product.price * quantity)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.tint, borderRadius: radius.pill }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Quitar una unidad de ${product.name}`} onPress={() => cart.setQuantity(product.id, quantity - 1)} style={stepBtn}>
                    <Text style={stepText}>−</Text>
                  </Pressable>
                  <Text style={{ minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: '900', color: colors.text }}>{quantity}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Agregar una unidad de ${product.name}`} onPress={() => cart.setQuantity(product.id, quantity + 1)} style={stepBtn}>
                    <Text style={stepText}>+</Text>
                  </Pressable>
                </View>
              </Row>
            );
          })}
        </View>

        <SectionTitle>¿Cómo lo recibes?</SectionTitle>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <OptionTile stacked emoji="🏪" title="Recoger en tienda" subtitle="Sin costo" selected={deliveryMode === 'pickup'} onPress={() => setDeliveryMode('pickup')} style={{ flex: 1 }} />
          <OptionTile stacked emoji="🛵" title="A domicilio" subtitle={vet.data?.delivery_fee ? `+${formatCOP(vet.data.delivery_fee)}` : 'Sin costo'} selected={deliveryMode === 'delivery'} onPress={() => setDeliveryMode('delivery')} style={{ flex: 1 }} />
        </View>
        {deliveryMode === 'delivery' ? (
          <TextField label="Dirección de entrega" value={address} onChangeText={setAddress} placeholder="Calle, número, barrio y referencias" />
        ) : null}

        <SectionTitle>¿Cómo pagas?</SectionTitle>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <OptionTile stacked emoji="💵" title="Contra entrega" subtitle="Pagas al recibir" selected={paymentMethod === 'cash_on_delivery'} onPress={() => setPaymentMethod('cash_on_delivery')} style={{ flex: 1 }} />
          <OptionTile stacked emoji="🏦" title="Transferencia" subtitle="Te enviarán los datos" selected={paymentMethod === 'transfer'} onPress={() => setPaymentMethod('transfer')} style={{ flex: 1 }} />
        </View>

        <View style={{ marginTop: space.md }}>
          <TextField label="Notas (opcional)" value={notes} onChangeText={setNotes} multiline />
        </View>

        <View style={{ backgroundColor: colors.sunSoft, borderRadius: radius.md, padding: space.lg }}>
          <View style={styles.between}><Text style={styles.body}>Subtotal</Text><Text style={styles.body}>{formatCOP(cart.subtotal)}</Text></View>
          <View style={styles.between}><Text style={styles.body}>Domicilio</Text><Text style={styles.body}>{deliveryFee ? formatCOP(deliveryFee) : 'Gratis'}</Text></View>
        </View>

        <Button title="Vaciar carrito" variant="ghost" onPress={cart.clear} style={{ marginTop: space.md }} />
      </ScrollView>

      <Footer>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <View>
            <Text style={styles.muted}>Total</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>{formatCOP(total)}</Text>
          </View>
          <Button title="Confirmar pedido" onPress={submit} loading={createOrder.isPending} style={{ flex: 1 }} />
        </View>
      </Footer>
    </Screen>
  );
}

const stepBtn = { width: 38, height: 38, alignItems: 'center' as const, justifyContent: 'center' as const };
const stepText = { fontSize: 22, fontWeight: '800' as const, color: colors.primary };