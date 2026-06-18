import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="productos"
        options={{ title: 'Productos' }}
      />
      <Tabs.Screen
        name="producto-form"
        options={{ title: 'Nuevo Producto' }}
      />
    </Tabs>
  );
}