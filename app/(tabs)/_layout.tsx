import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Adoptar', tabBarIcon: icon('🐶') }} />
      <Tabs.Screen name="vets" options={{ title: 'Veterinarias', tabBarIcon: icon('🏥') }} />
      <Tabs.Screen name="shop" options={{ title: 'Tienda', tabBarIcon: icon('🛍️') }} />
      <Tabs.Screen name="activity" options={{ title: 'Mi actividad', tabBarIcon: icon('📋') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
