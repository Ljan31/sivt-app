import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useCategoriasStore,
  useUnidadesStore,
  type Categoria,
  type UnidadMedidaItem,
} from '../..';

// ─── GestorCatalogo ────────────────────────────────────────────────────────
// Modal con dos pestañas: Categorías y Unidades de medida.
// CRUD completo con feedback visual para cada acción.
// Se usa desde SelectorCategoria y SelectorUnidad vía botón "Gestionar".

interface Props {
  visible: boolean;
  onClose: () => void;
  tabInicial?: 'categorias' | 'unidades';
}

type Tab = 'categorias' | 'unidades';

// ── Subcomponente: fila editable ──────────────────────────────────────────

interface FilaEditableProps {
  icono: string;
  nombre: string;
  secundario?: string;    // abreviatura para unidades
  enUso?: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}

function FilaEditable({ icono, nombre, secundario, enUso, onEditar, onEliminar }: FilaEditableProps) {
  return (
    <View style={fila.wrap}>
      <Text style={fila.icono}>{icono || '📦'}</Text>
      <View style={fila.info}>
        <Text style={fila.nombre}>{nombre}</Text>
        {secundario ? <Text style={fila.secundario}>{secundario}</Text> : null}
      </View>
      <TouchableOpacity style={fila.btnEditar} onPress={onEditar} hitSlop={HIT}>
        <Text style={fila.btnEditarTxt}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[fila.btnEliminar, enUso && fila.btnDeshabilitado]}
        onPress={onEliminar}
        hitSlop={HIT}
        disabled={enUso}
      >
        <Text style={fila.btnEliminarTxt}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Subcomponente: formulario inline ─────────────────────────────────────

interface FormItemProps {
  titulo: string;
  campoNombre: string;
  setCampoNombre: (v: string) => void;
  campoIcono: string;
  setCampoIcono: (v: string) => void;
  campoExtra?: string;
  setCampoExtra?: (v: string) => void;
  labelExtra?: string;
  errorNombre?: string;
  guardando: boolean;
  onGuardar: () => void;
  onCancelar: () => void;
}

function FormItem({
  titulo, campoNombre, setCampoNombre,
  campoIcono, setCampoIcono,
  campoExtra, setCampoExtra, labelExtra,
  errorNombre, guardando, onGuardar, onCancelar,
}: FormItemProps) {
  return (
    <View style={form.wrap}>
      <Text style={form.titulo}>{titulo}</Text>

      <View style={form.fila}>
        {/* Ícono */}
        <View style={form.iconoWrap}>
          <Text style={form.iconoLabel}>Ícono</Text>
          <TextInput
            style={form.iconoInput}
            value={campoIcono}
            onChangeText={setCampoIcono}
            placeholder="📦"
            placeholderTextColor="#9CA3AF"
            maxLength={2}
          />
        </View>

        {/* Nombre */}
        <View style={form.nombreWrap}>
          <Text style={form.nombreLabel}>Nombre *</Text>
          <TextInput
            style={[form.nombreInput, errorNombre && form.inputError]}
            value={campoNombre}
            onChangeText={setCampoNombre}
            placeholder="Nombre..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onGuardar}
          />
          {errorNombre ? <Text style={form.error}>{errorNombre}</Text> : null}
        </View>
      </View>

      {/* Campo extra (abreviatura para unidades) */}
      {labelExtra && setCampoExtra !== undefined ? (
        <View style={form.extraWrap}>
          <Text style={form.nombreLabel}>{labelExtra}</Text>
          <TextInput
            style={form.nombreInput}
            value={campoExtra}
            onChangeText={setCampoExtra}
            placeholder="Ej: kg, L, u..."
            placeholderTextColor="#9CA3AF"
            maxLength={10}
          />
        </View>
      ) : null}

      <View style={form.botones}>
        <TouchableOpacity style={form.btnCancelar} onPress={onCancelar}>
          <Text style={form.btnCancelarTxt}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.btnGuardar, guardando && form.btnDeshabilitado]}
          onPress={onGuardar}
          disabled={guardando}
        >
          {guardando
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={form.btnGuardarTxt}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────

export function GestorCatalogo({ visible, onClose, tabInicial = 'categorias' }: Props) {
  const [tab, setTab] = useState<Tab>(tabInicial);

  // Sincronizar tab cuando cambia tabInicial desde afuera
  useEffect(() => { setTab(tabInicial); }, [tabInicial, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modal.root}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={modal.header}>
            <Text style={modal.titulo}>Gestionar catálogo</Text>
            <TouchableOpacity onPress={onClose} hitSlop={HIT}>
              <Text style={modal.cerrar}>Listo</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={modal.tabs}>
            <TouchableOpacity
              style={[modal.tab, tab === 'categorias' && modal.tabActivo]}
              onPress={() => setTab('categorias')}
            >
              <Text style={[modal.tabTxt, tab === 'categorias' && modal.tabTxtActivo]}>
                Categorías
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.tab, tab === 'unidades' && modal.tabActivo]}
              onPress={() => setTab('unidades')}
            >
              <Text style={[modal.tabTxt, tab === 'unidades' && modal.tabTxtActivo]}>
                Unidades
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          {tab === 'categorias'
            ? <TabCategorias />
            : <TabUnidades />}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Tab: Categorías ────────────────────────────────────────────────────────

function TabCategorias() {
  const {
    categorias, loading, error,
    cargar, crear, actualizar, eliminar, limpiarError,
  } = useCategoriasStore();

  const [modo, setModo] = useState<'lista' | 'crear' | 'editar'>('lista');
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [campoNombre, setCampoNombre] = useState('');
  const [campoIcono, setCampoIcono] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);
  useEffect(() => { if (error) { Alert.alert('Error', error); limpiarError(); } }, [error]);

  function abrirCrear() {
    setCampoNombre('');
    setCampoIcono('');
    setErrorNombre('');
    setEditando(null);
    setModo('crear');
  }

  function abrirEditar(cat: Categoria) {
    setCampoNombre(cat.nombre);
    setCampoIcono(cat.icono ?? '');
    setErrorNombre('');
    setEditando(cat);
    setModo('editar');
  }

  function cancelar() {
    setModo('lista');
    setEditando(null);
    setErrorNombre('');
  }

  async function guardar() {
    const nombre = campoNombre.trim();
    if (!nombre) { setErrorNombre('El nombre es obligatorio'); return; }
    if (categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase() && c.id !== editando?.id)) {
      setErrorNombre('Ya existe una categoría con ese nombre');
      return;
    }

    setGuardando(true);
    try {
      const input = { nombre, icono: campoIcono.trim() || null, orden: categorias.length + 1 };
      if (modo === 'crear') {
        await crear(input);
      } else if (editando) {
        await actualizar(editando.id, input);
      }
      cancelar();
    } finally {
      setGuardando(false);
    }
  }

  function confirmarEliminar(cat: Categoria) {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${cat.nombre}"?\nLos productos asignados pasarán a "Otros".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(cat.id) },
      ]
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {(modo === 'crear' || modo === 'editar') && (
        <FormItem
          titulo={modo === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
          campoNombre={campoNombre}
          setCampoNombre={(v) => { setCampoNombre(v); setErrorNombre(''); }}
          campoIcono={campoIcono}
          setCampoIcono={setCampoIcono}
          errorNombre={errorNombre}
          guardando={guardando}
          onGuardar={guardar}
          onCancelar={cancelar}
        />
      )}

      <FlatList
        data={categorias}
        keyExtractor={(c) => c.id.toString()}
        ListHeaderComponent={
          <TouchableOpacity style={lista.btnAgregar} onPress={abrirCrear}>
            <Text style={lista.btnAgregarTxt}>+ Agregar categoría</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <FilaEditable
            icono={item.icono ?? '📦'}
            nombre={item.nombre}
            onEditar={() => abrirEditar(item)}
            onEliminar={() => confirmarEliminar(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={lista.sep} />}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator style={{ margin: 24 }} color={VERDE} />
            : <Text style={lista.vacio}>No hay categorías. Agregá la primera.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

// ── Tab: Unidades ──────────────────────────────────────────────────────────

function TabUnidades() {
  const {
    unidades, loading, error,
    cargar, crear, actualizar, eliminar, limpiarError,
  } = useUnidadesStore();

  const [modo, setModo] = useState<'lista' | 'crear' | 'editar'>('lista');
  const [editando, setEditando] = useState<UnidadMedidaItem | null>(null);
  const [campoNombre, setCampoNombre] = useState('');
  const [campoIcono, setCampoIcono] = useState('');
  const [campoAbrev, setCampoAbrev] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);
  useEffect(() => { if (error) { Alert.alert('Error', error); limpiarError(); } }, [error]);

  function abrirCrear() {
    setCampoNombre('');
    setCampoIcono('');
    setCampoAbrev('');
    setErrorNombre('');
    setEditando(null);
    setModo('crear');
  }

  function abrirEditar(u: UnidadMedidaItem) {
    setCampoNombre(u.nombre);
    setCampoIcono(u.icono ?? '');
    setCampoAbrev(u.abreviatura ?? '');
    setErrorNombre('');
    setEditando(u);
    setModo('editar');
  }

  function cancelar() {
    setModo('lista');
    setEditando(null);
    setErrorNombre('');
  }

  async function guardar() {
    const nombre = campoNombre.trim();
    if (!nombre) { setErrorNombre('El nombre es obligatorio'); return; }
    if (unidades.some(u => u.nombre.toLowerCase() === nombre.toLowerCase() && u.id !== editando?.id)) {
      setErrorNombre('Ya existe una unidad con ese nombre');
      return;
    }

    setGuardando(true);
    try {
      const input = {
        nombre,
        icono: campoIcono.trim() || null,
        abreviatura: campoAbrev.trim() || null,
      };
      if (modo === 'crear') {
        await crear(input);
      } else if (editando) {
        await actualizar(editando.id, input);
      }
      cancelar();
    } finally {
      setGuardando(false);
    }
  }

  function confirmarEliminar(u: UnidadMedidaItem) {
    Alert.alert(
      'Eliminar unidad',
      `¿Eliminar "${u.nombre}"?\nSolo se puede eliminar si no hay productos usándola.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const ok = await eliminar(u.id);
            if (!ok) {
              Alert.alert(
                'No se puede eliminar',
                'Hay productos que usan esta unidad. Cambiá su unidad primero.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {(modo === 'crear' || modo === 'editar') && (
        <FormItem
          titulo={modo === 'crear' ? 'Nueva unidad' : 'Editar unidad'}
          campoNombre={campoNombre}
          setCampoNombre={(v) => { setCampoNombre(v); setErrorNombre(''); }}
          campoIcono={campoIcono}
          setCampoIcono={setCampoIcono}
          campoExtra={campoAbrev}
          setCampoExtra={setCampoAbrev}
          labelExtra="Abreviatura"
          errorNombre={errorNombre}
          guardando={guardando}
          onGuardar={guardar}
          onCancelar={cancelar}
        />
      )}

      <FlatList
        data={unidades}
        keyExtractor={(u) => u.id.toString()}
        ListHeaderComponent={
          <TouchableOpacity style={lista.btnAgregar} onPress={abrirCrear}>
            <Text style={lista.btnAgregarTxt}>+ Agregar unidad</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <FilaEditable
            icono={item.icono ?? '▫️'}
            nombre={item.nombre}
            secundario={item.abreviatura ?? undefined}
            onEditar={() => abrirEditar(item)}
            onEliminar={() => confirmarEliminar(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={lista.sep} />}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator style={{ margin: 24 }} color={VERDE} />
            : <Text style={lista.vacio}>No hay unidades. Agregá la primera.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const HIT = { top: 8, bottom: 8, left: 8, right: 8 };
const VERDE = '#1A6B3C';

const modal = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  titulo: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cerrar: { fontSize: 15, color: VERDE, fontWeight: '600' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActivo: { borderBottomColor: VERDE },
  tabTxt: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTxtActivo: { color: VERDE, fontWeight: '700' },
});

const fila = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  icono: { fontSize: 22, width: 34 },
  info: { flex: 1 },
  nombre: { fontSize: 15, color: '#111827', fontWeight: '500' },
  secundario: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  btnEditar: { padding: 8 },
  btnEditarTxt: { fontSize: 16 },
  btnEliminar: { padding: 8, marginLeft: 4 },
  btnEliminarTxt: { fontSize: 16 },
  btnDeshabilitado: { opacity: 0.3 },
});

const form = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFF9EC',
    borderBottomWidth: 1, borderBottomColor: '#F59E0B',
    padding: 16,
  },
  titulo: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  fila: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  iconoWrap: { width: 70 },
  iconoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  iconoInput: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 20, textAlign: 'center', minHeight: 48,
  },

  nombreWrap: { flex: 1 },
  nombreLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  nombreInput: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#111827', minHeight: 48,
  },
  inputError: { borderColor: '#DC2626' },
  error: { fontSize: 11, color: '#DC2626', marginTop: 3 },

  extraWrap: { marginBottom: 10 },

  botones: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancelar: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  btnCancelarTxt: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  btnGuardar: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 10, backgroundColor: VERDE,
  },
  btnGuardarTxt: { fontSize: 14, color: '#fff', fontWeight: '700' },
  btnDeshabilitado: { opacity: 0.5 },
});

const lista = StyleSheet.create({
  btnAgregar: {
    margin: 14, paddingVertical: 13, alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, borderColor: VERDE,
    borderStyle: 'dashed', backgroundColor: '#F0FDF4',
  },
  btnAgregarTxt: { fontSize: 15, color: VERDE, fontWeight: '600' },
  sep: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 62 },
  vacio: { padding: 28, textAlign: 'center', color: '#9CA3AF', fontSize: 14 },
});