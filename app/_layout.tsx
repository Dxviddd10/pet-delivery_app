import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';
import { Loading } from '@/components/ui';
import { colors } from '@/theme';

function Gate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!session) queryClient.clear(); // no dejar datos del usuario anterior en caché
    const inAuthGroup = (segments as string[])[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/login');
    else if (session && inAuthGroup) router.replace('/');
  }, [session, loading, segments, router, queryClient]);

  if (loading) return <Loading />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="vet/[id]" options={{ title: 'Veterinaria' }} />
      <Stack.Screen name="book/[vetId]" options={{ title: 'Agendar cita' }} />
      <Stack.Screen name="adoption/[id]" options={{ title: 'Solicitar adopción' }} />
      <Stack.Screen name="cart" options={{ title: 'Tu carrito' }} />
      <Stack.Screen name="pet/new" options={{ title: 'Nueva mascota' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }));
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <Gate />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
