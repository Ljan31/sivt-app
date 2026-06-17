import { Slot } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useDatabase } from '../src/hooks/useDatabase';

/**
 * Layout raíz de la aplicación.
 * Inicializa la base de datos antes de renderizar cualquier pantalla.
 */
export default function RootLayout() {
  const { ready, error } = useDatabase();

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Error al iniciar</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Iniciando inventario...</Text>
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
