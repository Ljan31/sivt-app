import { ProductoCard } from '@/src/components/products/ProductoCard';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  CATEGORIAS,
  useProductosStore,
  useStockBajo,
  type CategoriaProducto,
  type Producto,
} from '../..';

// ─── ProductosScreen ───────────────────────────────────────────────────────
// Lista principal con búsqueda, filtros por categoría,
// favoritos, recientes y alertas de stock bajo.

export default function ProductosScreen() {
  const router = useRouter();
  const {
    productos, loading,
    cargarProductos, buscarProductos, cargarPorCategoria,
    actualizarProducto, seleccionarProducto,
  } = useProductosStore();

  const { cantidad: cantStockBajo } = useStockBajo();

  const [busqueda, setBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState<CategoriaProducto | 'todos' | 'favoritos' | 'recientes'>('todos');
  const [refrescando, setRefrescando] = useState(false);

  // Animación del FAB al scrollear
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabScale = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.85], extrapolate: 'clamp' });

  useEffect(() => { cargarProductos(); }, []);

  // ── Búsqueda con debounce ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (busqueda.trim()) buscarProductos(busqueda);
      else cargarProductos();
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  // ── Filtro por categoría ──────────────────────────────────────────────────
  useEffect(() => {
    if (busqueda) return; // búsqueda tiene prioridad
    if (catActiva === 'todos') cargarProductos();
    else if (catActiva === 'favoritos') cargarProductos(); // filtrado local
    else if (catActiva === 'recientes') cargarProductos(); // filtrado local
    else cargarPorCategoria(catActiva);
  }, [catActiva]);

  const handleRefrescar = useCallback(async () => {
    setRefrescando(true);
    await cargarProductos();
    setRefrescando(false);
  }, [cargarProductos]);

  // ── Lista derivada (favoritos / recientes son filtros locales) ────────────
  const listaFinal: Producto[] = (() => {
    if (catActiva === 'favoritos')
      return productos.filter(p => (p as any).favorito === 1);
    if (catActiva === 'recientes')
      return [...productos]
        .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion))
        .slice(0, 20);
    return productos;
  })();

  // ── Toggle favorito ───────────────────────────────────────────────────────
  async function toggleFavorito(producto: Producto) {
    const nuevoValor = (producto as any).favorito === 1 ? 0 : 1;
    await actualizarProducto(producto.id, { favorito: nuevoValor } as any);
  }

  // ── Abrir formulario ──────────────────────────────────────────────────────
  function abrirEditar(producto: Producto) {
    seleccionarProducto(producto);
    router.push(`/(tabs)/producto-form?id=${producto.id}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Productos</Text>
          <Text style={styles.subtitulo}>
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            {cantStockBajo > 0 && (
              <Text style={styles.alertaStock}>  ⚠ {cantStockBajo} con stock bajo</Text>
            )}
          </Text>
        </View>
      </View>

      {/* ── Buscador ── */}
      <View style={styles.busqWrap}>
        <Text style={styles.busqIcon}>🔍</Text>
        <TextInput
          style={styles.busqInput}
          placeholder="Buscar por nombre, código o categoría..."
          placeholderTextColor="#9CA3AF"
          value={busqueda}
          onChangeText={v => { setBusqueda(v); setCatActiva('todos'); }}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {busqueda ? (
          <TouchableOpacity onPress={() => setBusqueda('')} style={styles.busqClear}>
            <Text style={styles.busqClearTxt}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Filtros horizontales ── */}
      {!busqueda && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="Todos" activo={catActiva === 'todos'} onPress={() => setCatActiva('todos')} />
          <Chip label="⭐ Fav." activo={catActiva === 'favoritos'} onPress={() => setCatActiva('favoritos')} />
          <Chip label="🕐 Recientes" activo={catActiva === 'recientes'} onPress={() => setCatActiva('recientes')} />
          {CATEGORIAS.map(cat => (
            <Chip
              key={cat} label={cat}
              activo={catActiva === cat}
              onPress={() => setCatActiva(catActiva === cat ? 'todos' : cat)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Contador resultados (búsqueda activa) ── */}
      {busqueda ? (
        <View style={styles.resultadosRow}>
          <Text style={styles.resultadosTxt}>
            {listaFinal.length} {listaFinal.length === 1 ? 'resultado' : 'resultados'}
          </Text>
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Text style={styles.limpiarTxt}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Lista ── */}
      <Animated.FlatList
        data={listaFinal}
        keyExtractor={p => p.id.toString()}
        renderItem={({ item }) => (
          <ProductoCard
            producto={item}
            onPress={() => abrirEditar(item)}
            onToggleFavorito={() => toggleFavorito(item)}
          />
        )}
        ListEmptyComponent={<ListaVacia cargando={loading} busqueda={busqueda} />}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefrescar}
            colors={['#1A6B3C']}
            tintColor="#1A6B3C"
          />
        }
        contentContainerStyle={listaFinal.length === 0 ? styles.listaVacia : styles.lista}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      />

      {/* ── FAB agregar ── */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => router.push('/(tabs)/producto-form')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabTxt}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Componentes locales ──────────────────────────────────────────────────────

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[chipStyles.chip, activo && chipStyles.chipActivo]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[chipStyles.txt, activo && chipStyles.txtActivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ListaVacia({ cargando, busqueda }: { cargando: boolean; busqueda: string }) {
  if (cargando) return null;
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.emoji}>{busqueda ? '🔍' : '📦'}</Text>
      <Text style={emptyStyles.titulo}>
        {busqueda ? 'Sin resultados' : 'Sin productos'}
      </Text>
      <Text style={emptyStyles.sub}>
        {busqueda
          ? 'Ningún producto coincide con tu búsqueda.'
          : 'Tocá el botón + para agregar tu primer producto.'}
      </Text>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const VERDE = '#1A6B3C';
const S = StyleSheet.create;

const styles = S({
  root: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  titulo: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitulo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  alertaStock: { color: '#DC2626', fontWeight: '600' },

  busqWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 14, marginBottom: 8,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  busqIcon: { fontSize: 16, marginRight: 8 },
  busqInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 12 },
  busqClear: { padding: 6 },
  busqClearTxt: { fontSize: 16, color: '#9CA3AF' },

  chips: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },

  resultadosRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 8,
  },
  resultadosTxt: { fontSize: 13, color: '#6B7280' },
  limpiarTxt: { fontSize: 13, color: VERDE, fontWeight: '600' },

  lista: { paddingTop: 4, paddingBottom: 100 },
  listaVacia: { flex: 1 },

  fab: {
    position: 'absolute', bottom: 28, right: 22,
    shadowColor: VERDE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  fabBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: VERDE,
    alignItems: 'center', justifyContent: 'center',
  },
  fabTxt: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
});

const chipStyles = S({
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActivo: { backgroundColor: VERDE, borderColor: VERDE },
  txt: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  txtActivo: { color: '#fff', fontWeight: '600' },
});

const emptyStyles = S({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 },
  emoji: { fontSize: 52 },
  titulo: { fontSize: 20, fontWeight: '700', color: '#374151' },
  sub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
