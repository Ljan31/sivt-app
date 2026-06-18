import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { useUnidadesStore, type UnidadMedida } from '../..';
import { GestorCatalogo } from './GestorCatalogo';

// ─── SelectorUnidad ────────────────────────────────────────────────────────
// Las unidades vienen del store dinámico (Equipo 1).
// Incluye botón "Gestionar" para abrir el CRUD de unidades.

interface Props {
  value: UnidadMedida;
  onChange: (v: UnidadMedida) => void;
}

export function SelectorUnidad({ value, onChange }: Props) {
  const unidades = useUnidadesStore((s) => s.unidades);

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [gestorVisible, setGestorVisible] = useState(false);

  const unidadActual = unidades.find((u) => u.nombre === value);
  const icono = unidadActual?.icono ?? '▫️';
  const abrev = unidadActual?.abreviatura;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Unidad de medida</Text>
        <TouchableOpacity
          onPress={() => setGestorVisible(true)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.gestionarTxt}>⚙ Gestionar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setSelectorVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.valorTxt}>
          {icono} {value}{abrev ? ` (${abrev})` : ''}
        </Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* Modal selector */}
      <Modal
        visible={selectorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Unidad de medida</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => {
                  setSelectorVisible(false);
                  setTimeout(() => setGestorVisible(true), 300);
                }}
              >
                <Text style={styles.gestionarModal}>⚙ Gestionar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Text style={styles.listo}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={unidades}
            keyExtractor={(u) => u.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.opcion, value === item.nombre && styles.opcionActiva]}
                onPress={() => { onChange(item.nombre); setSelectorVisible(false); }}
              >
                <Text style={styles.opcionIco}>{item.icono ?? '▫️'}</Text>
                <View style={styles.opcionInfo}>
                  <Text style={[styles.opcionTxt, value === item.nombre && styles.opcionTxtActivo]}>
                    {item.nombre}
                  </Text>
                  {item.abreviatura
                    ? <Text style={styles.abrev}>{item.abreviatura}</Text>
                    : null}
                </View>
                {value === item.nombre && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text style={styles.vacioTxt}>
                No hay unidades. Usá "Gestionar" para agregar.
              </Text>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal CRUD */}
      <GestorCatalogo
        visible={gestorVisible}
        onClose={() => setGestorVisible(false)}
        tabInicial="unidades"
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
  valorTxt: { fontSize: 15, color: '#111827' },
  arrow: { fontSize: 20, color: '#6B7280', transform: [{ rotate: '90deg' }] },

  modal: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  titulo: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  gestionarModal: { fontSize: 13, color: VERDE, fontWeight: '500' },
  listo: { fontSize: 15, color: VERDE, fontWeight: '600' },

  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#fff',
  },
  opcionActiva: { backgroundColor: '#D4EDDA' },
  opcionIco: { fontSize: 18, width: 26 },
  opcionInfo: { flex: 1 },
  opcionTxt: { fontSize: 15, color: '#111827' },
  opcionTxtActivo: { color: VERDE, fontWeight: '600' },
  abrev: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  check: { fontSize: 16, color: VERDE, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#F3F4F6' },
  vacioTxt: { padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
});