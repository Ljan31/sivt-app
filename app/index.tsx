import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStockBajo } from '../src/hooks/useStockBajo';
import { useConfiguracionStore } from '../src/store/configuracion.store';

export default function HomeScreen() {
  const nombreTienda = useConfiguracionStore((s) => s.get('nombre_tienda'));
  const moneda = useConfiguracionStore((s) => s.get('moneda'));
  const { cantidad: stockBajoCount } = useStockBajo();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🏪</Text>
        <Text style={styles.title}>Sistema de Inventario</Text>
        <Text style={styles.subtitle}>{nombreTienda || 'Mi Tienda'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>✅ Infraestructura lista</Text>
        <Item label="Base de datos SQLite" ok />
        <Item label="Migraciones automáticas" ok />
        <Item label="Repositorios CRUD" ok />
        <Item label="Stores Zustand" ok />
        <Item label="Servicios base" ok />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Configuración</Text>
        <Row label="Tienda" value={nombreTienda || 'Mi Tienda'} />
        <Row label="Moneda" value={moneda || 'Bs'} />
        <Row label="Productos stock bajo" value={String(stockBajoCount)} />
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Esta pantalla es temporal.{'\n'}
          Los equipos de UI reemplazarán este archivo.
        </Text>
      </View>
    </ScrollView>
  );
}

function Item({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemIcon}>{ok ? '✓' : '○'}</Text>
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F1F5F9',
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  subtitle: { fontSize: 15, color: '#64748B' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemIcon: { fontSize: 16, color: '#16A34A', width: 20 },
  itemLabel: { fontSize: 15, color: '#334155' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: '#64748B' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  note: {
    backgroundColor: '#FEF9C3',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308',
  },
  noteText: { fontSize: 13, color: '#854D0E', lineHeight: 20 },
});