import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <View style={{ width: 54, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.sun : 'transparent' }}>
    <Text style={{ fontSize: 19 }}>{emoji}</Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 12,
          shadowColor: '#10261F',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
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