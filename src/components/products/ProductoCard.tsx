import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { formatearMoneda, type Producto } from '../..';

interface Props {
  producto: Producto;
  onPress: () => void;
  onToggleFavorito: () => void;
}

export function ProductoCard({ producto, onPress, onToggleFavorito }: Props) {
  const stockBajo = producto.stock <= producto.stock_minimo;
  const esFavorito = (producto as any).favorito === 1;
  const precioManual = !!producto.precio_venta_manual;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      android_ripple={{ color: '#E5E7EB' }}
    >
      {/* Imagen */}
      <View style={styles.imgWrap}>
        {producto.imagen_path ? (
          <Image source={{ uri: producto.imagen_path }} style={styles.img} />
        ) : (
          <View style={styles.imgDefault}>
            <Text style={styles.imgEmoji}>📦</Text>
          </View>
        )}
        {stockBajo && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertTxt}>!</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>{producto.nombre}</Text>

        {producto.categoria ? (
          <View style={styles.catPill}>
            <Text style={styles.catTxt} numberOfLines={1}>{producto.categoria}</Text>
          </View>
        ) : null}

        <View style={styles.precioRow}>
          <Text style={styles.precio}>{formatearMoneda(producto.precio_venta)}</Text>
          {precioManual && (
            <View style={styles.manualTag}>
              <Text style={styles.manualTagTxt}>✎ manual</Text>
            </View>
          )}
        </View>

        <View style={[styles.stockRow, stockBajo && styles.stockRowBajo]}>
          <Text style={[styles.stockTxt, stockBajo && styles.stockTxtBajo]}>
            Stock: {producto.stock} {producto.unidad_medida}
          </Text>
        </View>
      </View>

      {/* Favorito */}
      <TouchableOpacity
        style={styles.favBtn}
        onPress={onToggleFavorito}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.favStar, esFavorito && styles.favStarActivo]}>
          {esFavorito ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </Pressable>
  );
}

const VERDE = '#1A6B3C';
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 5,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardPressed: { opacity: 0.9 },
  imgWrap: { position: 'relative', marginRight: 14 },
  img: { width: 68, height: 68, borderRadius: 10, backgroundColor: '#F3F4F6' },
  imgDefault: {
    width: 68, height: 68, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  imgEmoji: { fontSize: 30 },
  alertBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  alertTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { flex: 1, gap: 3 },
  nombre: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 20 },
  catPill: {
    alignSelf: 'flex-start', backgroundColor: '#F3F4F6',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  catTxt: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  precioRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  precio: { fontSize: 18, fontWeight: '700', color: VERDE },
  manualTag: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  manualTagTxt: { fontSize: 10, color: '#92400E', fontWeight: '600' },
  stockRow: {
    alignSelf: 'flex-start', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: '#D4EDDA',
  },
  stockRowBajo: { backgroundColor: '#FEE2E2' },
  stockTxt: { fontSize: 11, color: VERDE, fontWeight: '500' },
  stockTxtBajo: { color: '#DC2626' },
  favBtn: { padding: 6, marginLeft: 8 },
  favStar: { fontSize: 22, color: '#D1D5DB' },
  favStarActivo: { color: '#F5A623' },
});
