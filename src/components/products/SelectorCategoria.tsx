import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCategoriasStore, type CategoriaProducto } from '../..';
import { GestorCatalogo } from './GestorCatalogo';

// ─── SelectorCategoria ─────────────────────────────────────────────────────
// Las categorías vienen del store dinámico (Equipo 1).
// Incluye botón "Gestionar" para abrir el CRUD de categorías.

interface Props {
  value: CategoriaProducto | '';
  onChange: (v: CategoriaProducto) => void;
  error?: string;
}

export function SelectorCategoria({ value, onChange, error }: Props) {
  const categorias = useCategoriasStore((s) => s.categorias);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [gestorVisible, setGestorVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const nombres = categorias.map((c) => c.nombre);
  const lista = busqueda
    ? nombres.filter((c) => c.toLowerCase().includes(busqueda.toLowerCase()))
    : nombres;

  const mostrarCrear =
    busqueda.trim().length > 0 &&
    !nombres.some((c) => c.toLowerCase() === busqueda.toLowerCase());

  const iconoActual = categorias.find((c) => c.nombre === value)?.icono ?? '';

  function seleccionar(cat: string) {
    onChange(cat as CategoriaProducto);
    setSelectorVisible(false);
    setBusqueda('');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Categoría</Text>
        <TouchableOpacity
          onPress={() => setGestorVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.gestionarTxt}>⚙ Gestionar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={() => setSelectorVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? styles.valorTxt : styles.placeholderTxt}>
          {value ? `${iconoActual} ${value}` : 'Seleccionar categoría'}
        </Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorTxt}>{error}</Text> : null}

      {/* Modal selector */}
      <Modal
        visible={selectorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Categoría</Text>
            <View style={styles.modalHeaderRight}>
              <TouchableOpacity
                onPress={() => {
                  setSelectorVisible(false);
                  setTimeout(() => setGestorVisible(true), 300);
                }}
                style={styles.modalGestorBtn}
              >
                <Text style={styles.modalGestorTxt}>⚙ Gestionar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSelectorVisible(false); setBusqueda(''); }}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.busqWrap}>
            <TextInput
              style={styles.busq}
              placeholder="Buscar categoría..."
              placeholderTextColor="#9CA3AF"
              value={busqueda}
              onChangeText={setBusqueda}
              autoFocus
              returnKeyType="done"
            />
          </View>

          {mostrarCrear && (
            <TouchableOpacity
              style={styles.crearBtn}
              onPress={() => seleccionar(busqueda.trim())}
            >
              <Text style={styles.crearTxt}>+ Usar "{busqueda.trim()}"</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={lista}
            keyExtractor={(i) => i}
            renderItem={({ item }) => {
              const cat = categorias.find((c) => c.nombre === item);
              return (
                <TouchableOpacity
                  style={[styles.opcion, value === item && styles.opcionActiva]}
                  onPress={() => seleccionar(item)}
                >
                  <Text style={styles.opcionIco}>{cat?.icono ?? '📦'}</Text>
                  <Text style={[styles.opcionTxt, value === item && styles.opcionTxtActivo]}>
                    {item}
                  </Text>
                  {value === item && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text style={styles.vacioTxt}>
                {busqueda ? 'Sin resultados' : 'No hay categorías. Usá "Gestionar" para agregar.'}
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal CRUD */}
      <GestorCatalogo
        visible={gestorVisible}
        onClose={() => setGestorVisible(false)}
        tabInicial="categorias"
      />
    </View>
  );
}

const VERDE = '#1A6B3C';
const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#111827' },
  gestionarTxt: { fontSize: 12, color: VERDE, fontWeight: '500' },

  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 12, paddingHorizontal: 16, minHeight: 48,
  },
  triggerError: { borderColor: '#DC2626' },
  valorTxt: { fontSize: 15, color: '#111827' },
  placeholderTxt: { fontSize: 15, color: '#9CA3AF' },
  arrow: { fontSize: 20, color: '#6B7280', transform: [{ rotate: '90deg' }] },
  errorTxt: { fontSize: 11, color: '#DC2626', marginTop: 4 },

  modal: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  modalGestorBtn: {},
  modalGestorTxt: { fontSize: 13, color: VERDE, fontWeight: '500' },
  cancelar: { fontSize: 15, color: VERDE, fontWeight: '500' },

  busqWrap: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  busq: {
    backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111827',
  },
  crearBtn: { padding: 16, backgroundColor: '#D4EDDA', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  crearTxt: { fontSize: 15, color: VERDE, fontWeight: '600' },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#fff',
  },
  opcionActiva: { backgroundColor: '#D4EDDA' },
  opcionIco: { fontSize: 18, width: 26 },
  opcionTxt: { flex: 1, fontSize: 15, color: '#111827' },
  opcionTxtActivo: { color: VERDE, fontWeight: '600' },
  check: { fontSize: 16, color: VERDE, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#F3F4F6' },
  vacioTxt: { padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
});