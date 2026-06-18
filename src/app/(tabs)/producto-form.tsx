import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  formatearMoneda,
  guardarImagenProducto,
  resolverImagenProducto,
  useProductosStore,
} from '../..';
// import { SelectorCategoria } from '../../../components/products/SelectorCategoria';
import { SelectorCategoria } from '@/src/components/products/SelectorCategoria';
import { SelectorImagen } from '@/src/components/products/SelectorImagen';
import { SelectorUnidad } from '@/src/components/products/SelectorUnidad';
import { useProductoForm } from '@/src/components/products/useProductoForm';

export default function ProductoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? parseInt(params.id) : undefined;
  const esEdicion = !!id;

  const { productos, crearProducto, actualizarProducto, eliminarProducto } = useProductosStore();
  const productoExistente = id ? productos.find((p) => p.id === id) : undefined;

  const {
    campos, errores, imagenUri, precioManual,
    precioCalculado, precioVentaFinal,
    setCampo, setImagenUri, validar, toInput,
    activarPrecioManual, restaurarPrecioAutomatico,
  } = useProductoForm(productoExistente);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (productoExistente?.imagen_path && !imagenUri) {
      resolverImagenProducto(productoExistente.imagen_path).then((uri) => {
        if (uri) setImagenUri(uri);
      });
    }
  }, []);

  // ── Guardar ─────────────────────────────────────────────────────────────

  async function handleGuardar() {
    if (!validar()) return;
    setGuardando(true);
    try {
      const input = toInput();
      if (esEdicion && id) {
        let nuevaRuta: string | undefined;
        if (imagenUri && imagenUri !== productoExistente?.imagen_path) {
          nuevaRuta = await guardarImagenProducto(imagenUri, id);
        }
        await actualizarProducto(id, {
          ...input,
          ...(nuevaRuta ? { imagen_path: nuevaRuta } : {}),
        });
      } else {
        const nuevo = await crearProducto(input);
        if (nuevo && imagenUri) {
          const ruta = await guardarImagenProducto(imagenUri, nuevo.id);
          await actualizarProducto(nuevo.id, { imagen_path: ruta });
        }
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el producto. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────

  function confirmarEliminar() {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${productoExistente?.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => { if (id) await eliminarProducto(id); router.back(); },
        },
      ]
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</Text>
        {esEdicion ? (
          <TouchableOpacity onPress={confirmarEliminar} hitSlop={HIT}>
            <Text style={styles.eliminar}>Eliminar</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Imagen ── */}
        <View style={styles.imagenRow}>
          <SelectorImagen
            uri={imagenUri}
            onChange={setImagenUri}
            onQuitar={() => setImagenUri(null)}
          />
          <View style={styles.imagenInfo}>
            <Text style={styles.imagenHint}>
              La imagen se guarda en el{'\n'}dispositivo, no en la BD.
            </Text>
            {imagenUri ? (
              <View style={styles.imagenOk}>
                <Text style={styles.imagenOkTxt}>✓ Imagen lista</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Datos básicos ── */}
        <SectionTitle>Datos básicos</SectionTitle>

        <Field label="Nombre" requerido error={errores.nombre}>
          <TextInput
            style={[styles.input, errores.nombre && styles.inputError]}
            value={campos.nombre}
            onChangeText={(v) => setCampo('nombre', v)}
            placeholder="Ej: Coca Cola 2L"
            placeholderTextColor="#9CA3AF"
            returnKeyType="next"
          />
        </Field>

        <Field label="Código (opcional)">
          <TextInput
            style={styles.input}
            value={campos.codigo}
            onChangeText={(v) => setCampo('codigo', v)}
            placeholder="Código de barras o interno"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </Field>

        <SelectorCategoria
          value={campos.categoria}
          onChange={(v) => setCampo('categoria', v)}
          error={errores.categoria}
        />

        <SelectorUnidad
          value={campos.unidad_medida}
          onChange={(v) => setCampo('unidad_medida', v)}
        />

        <Field label="Descripción (opcional)">
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={campos.descripcion}
            onChangeText={(v) => setCampo('descripcion', v)}
            placeholder="Breve descripción del producto"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Field>

        {/* ── Precios ── */}
        <SectionTitle>Precios</SectionTitle>

        <Field label="Precio de compra" requerido error={errores.precio_compra}>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>Bs</Text>
            <TextInput
              style={[styles.inputFlex, errores.precio_compra && styles.inputError]}
              value={campos.precio_compra}
              onChangeText={(v) => setCampo('precio_compra', v)}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
        </Field>

        <Field
          label="Margen de ganancia"
          error={errores.margen_ganancia}
          helper={precioManual ? undefined : 'El precio de venta se calcula automáticamente'}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputFlex, errores.margen_ganancia && styles.inputError]}
              value={campos.margen_ganancia}
              onChangeText={(v) => setCampo('margen_ganancia', v)}
              placeholder="25"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            <Text style={styles.suffix}>%</Text>
          </View>
        </Field>

        {/* ── Precio de venta editable ── */}
        <View style={styles.precioVentaWrap}>
          <View style={styles.precioVentaHeader}>
            <Text style={styles.precioVentaLabel}>
              Precio de venta
              {precioManual && (
                <Text style={styles.precioManualBadge}> ✎ manual</Text>
              )}
            </Text>
            {precioManual ? (
              <TouchableOpacity onPress={restaurarPrecioAutomatico} hitSlop={HIT}>
                <Text style={styles.precioRestaurarTxt}>
                  ↺ Usar fórmula ({formatearMoneda(precioCalculado)})
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={[
            styles.inputRow,
            styles.precioVentaInput,
            precioManual && styles.precioVentaInputManual,
            errores.precio_venta && styles.inputError,
          ]}>
            <Text style={styles.prefix}>Bs</Text>
            <TextInput
              style={styles.inputFlex}
              value={campos.precio_venta}
              onFocus={activarPrecioManual}
              onChangeText={(v) => setCampo('precio_venta', v)}
              placeholder={precioCalculado.toFixed(2)}
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            {!precioManual && (
              <View style={styles.autoTag}>
                <Text style={styles.autoTagTxt}>auto</Text>
              </View>
            )}
          </View>
          {errores.precio_venta ? (
            <Text style={styles.fieldError}>{errores.precio_venta}</Text>
          ) : null}
          {!precioManual ? (
            <Text style={styles.precioHint}>
              Tocá el campo para editar manualmente
            </Text>
          ) : null}
        </View>

        {/* ── Inventario ── */}
        <SectionTitle>Inventario</SectionTitle>

        <Field label="Stock inicial" error={errores.stock}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputFlex, errores.stock && styles.inputError]}
              value={campos.stock}
              onChangeText={(v) => setCampo('stock', v)}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            <Text style={styles.suffix}>{campos.unidad_medida}</Text>
          </View>
        </Field>

        <Field label="Stock mínimo" helper="Recibirás alertas cuando el stock llegue a este nivel">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              value={campos.stock_minimo}
              onChangeText={(v) => setCampo('stock_minimo', v)}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            <Text style={styles.suffix}>{campos.unidad_medida}</Text>
          </View>
        </Field>

        {/* ── Botón guardar ── */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnGuardarDisabled]}
          onPress={handleGuardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          <Text style={styles.btnGuardarTxt}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Subcomponentes locales ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return <Text style={stylesSection.titulo}>{children}</Text>;
}

function Field({
  label, requerido, error, helper, children,
}: {
  label: string; requerido?: boolean; error?: string; helper?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={stylesField.wrap}>
      <Text style={stylesField.label}>
        {label}{requerido ? <Text style={stylesField.req}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={stylesField.error}>{error}</Text> : null}
      {!error && helper ? <Text style={stylesField.helper}>{helper}</Text> : null}
    </View>
  );
}

const HIT = { top: 8, bottom: 8, left: 8, right: 8 };
const VERDE = '#1A6B3C';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  back: { fontSize: 17, color: VERDE },
  titulo: { fontSize: 17, fontWeight: '700', color: '#111827' },
  eliminar: { fontSize: 15, color: '#DC2626', width: 60, textAlign: 'right' },
  scroll: { flex: 1 },
  content: { padding: 16 },

  imagenRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  imagenInfo: { flex: 1 },
  imagenHint: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  imagenOk: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#D4EDDA', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  imagenOkTxt: { fontSize: 12, color: VERDE, fontWeight: '600' },

  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#111827', minHeight: 48,
  },
  inputMulti: { minHeight: 88, paddingTop: 12 },
  inputError: { borderColor: '#DC2626' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 12, paddingHorizontal: 16, minHeight: 48,
  },
  inputFlex: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 12 },
  prefix: { fontSize: 15, color: '#6B7280', marginRight: 8 },
  suffix: { fontSize: 14, color: '#6B7280', marginLeft: 8 },

  // Precio de venta editable
  precioVentaWrap: { marginBottom: 16 },
  precioVentaHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  precioVentaLabel: { fontSize: 13, fontWeight: '600', color: '#111827' },
  precioManualBadge: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  precioRestaurarTxt: { fontSize: 11, color: VERDE, fontWeight: '500' },
  precioVentaInput: { borderColor: '#D1D5DB' },
  precioVentaInputManual: { borderColor: '#F59E0B', borderWidth: 2 },
  autoTag: {
    backgroundColor: '#D4EDDA', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8,
  },
  autoTagTxt: { fontSize: 11, color: VERDE, fontWeight: '700' },
  precioHint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  fieldError: { fontSize: 11, color: '#DC2626', marginTop: 4 },

  btnGuardar: {
    backgroundColor: VERDE, borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', marginTop: 24,
  },
  btnGuardarDisabled: { opacity: 0.55 },
  btnGuardarTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

const stylesSection = StyleSheet.create({
  titulo: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 20, marginBottom: 10,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
});

const stylesField = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 6 },
  req: { color: '#DC2626' },
  error: { fontSize: 11, color: '#DC2626', marginTop: 4 },
  helper: { fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 16 },
});
