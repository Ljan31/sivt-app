import { useCallback, useState } from 'react';
import {
  calcularPrecioVenta,
  type CategoriaProducto,
  type Producto,
  type ProductoInput,
  type UnidadMedida,
  validarPrecio,
} from '../..';

// Campos internos como strings (para inputs de texto)
interface CamposForm {
  codigo: string;
  nombre: string;
  categoria: CategoriaProducto | '';
  descripcion: string;
  unidad_medida: UnidadMedida;
  precio_compra: string;
  margen_ganancia: string;
  precio_venta: string;  // editable directamente
  stock: string;
  stock_minimo: string;
}

export interface ErroresForm {
  nombre?: string;
  precio_compra?: string;
  margen_ganancia?: string;
  precio_venta?: string;
  stock?: string;
  categoria?: string;
}

function parsear(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function camposDesdeProducto(p: Producto): CamposForm {
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    descripcion: p.descripcion ?? '',
    unidad_medida: p.unidad_medida,
    precio_compra: p.precio_compra > 0 ? p.precio_compra.toString() : '',
    margen_ganancia: p.margen_ganancia.toString(),
    precio_venta: p.precio_venta.toString(),
    stock: p.stock.toString(),
    stock_minimo: p.stock_minimo.toString(),
  };
}

const CAMPOS_VACIOS: CamposForm = {
  codigo: '',
  nombre: '',
  categoria: '',
  descripcion: '',
  unidad_medida: 'Unidad',
  precio_compra: '',
  margen_ganancia: '25',
  precio_venta: '',
  stock: '0',
  stock_minimo: '0',
};

export function useProductoForm(productoInicial?: Producto) {
  const [campos, setCampos] = useState<CamposForm>(
    productoInicial ? camposDesdeProducto(productoInicial) : CAMPOS_VACIOS
  );
  const [errores, setErrores] = useState<ErroresForm>({});
  const [imagenUri, setImagenUri] = useState<string | null>(
    productoInicial?.imagen_path ?? null
  );
  // Rastrea si el usuario editó manualmente el precio de venta
  const [precioManual, setPrecioManual] = useState<boolean>(
    !!productoInicial?.precio_venta_manual
  );

  // ── Precio calculado en tiempo real ──────────────────────────────────────
  const precioCompra = parsear(campos.precio_compra);
  const margen = parsear(campos.margen_ganancia);
  const precioCalculado = calcularPrecioVenta(precioCompra, margen);

  // El precio mostrado: si es manual usa el campo, si no usa la fórmula
  const precioVentaFinal = precioManual ? parsear(campos.precio_venta) : precioCalculado;

  // ── Actualizar campo individual ───────────────────────────────────────────
  const setCampo = useCallback(<K extends keyof CamposForm>(k: K, v: CamposForm[K]) => {
    setCampos((prev) => {
      const next = { ...prev, [k]: v };
      // Si el usuario cambia precio_compra o margen y NO editó precio manual,
      // sincronizar el campo precio_venta con el calculado
      if ((k === 'precio_compra' || k === 'margen_ganancia') && !precioManual) {
        const pc = k === 'precio_compra' ? parsear(v as string) : parsear(prev.precio_compra);
        const mg = k === 'margen_ganancia' ? parsear(v as string) : parsear(prev.margen_ganancia);
        next.precio_venta = calcularPrecioVenta(pc, mg).toString();
      }
      return next;
    });
    setErrores((prev) => ({ ...prev, [k]: undefined }));
  }, [precioManual]);

  /** Llamar cuando el usuario toca el campo precio_venta y empieza a editarlo */
  const activarPrecioManual = useCallback(() => {
    setPrecioManual(true);
  }, []);

  /** Restaura el precio de venta a la fórmula automática */
  const restaurarPrecioAutomatico = useCallback(() => {
    setPrecioManual(false);
    setCampos((prev) => ({
      ...prev,
      precio_venta: calcularPrecioVenta(
        parsear(prev.precio_compra),
        parsear(prev.margen_ganancia)
      ).toString(),
    }));
  }, []);

  // ── Validar ───────────────────────────────────────────────────────────────
  const validar = useCallback((): boolean => {
    const e: ErroresForm = {};

    if (!campos.nombre.trim())
      e.nombre = 'El nombre es obligatorio';

    if (!validarPrecio(parsear(campos.precio_compra)) || parsear(campos.precio_compra) <= 0)
      e.precio_compra = 'Ingresá un precio mayor a 0';

    if (parsear(campos.margen_ganancia) < 0)
      e.margen_ganancia = 'El margen no puede ser negativo';

    if (precioVentaFinal <= 0)
      e.precio_venta = 'El precio de venta debe ser mayor a 0';

    if (parsear(campos.stock) < 0)
      e.stock = 'El stock no puede ser negativo';

    setErrores(e);
    return Object.keys(e).length === 0;
  }, [campos, precioVentaFinal]);

  // ── Armar ProductoInput para el store ─────────────────────────────────────
  const toInput = useCallback((): ProductoInput & { precio_venta_manual: number } => ({
    codigo: campos.codigo.trim(),
    nombre: campos.nombre.trim(),
    categoria: (campos.categoria || 'Otros') as CategoriaProducto,
    descripcion: campos.descripcion.trim() || null,
    unidad_medida: campos.unidad_medida,
    precio_compra: parsear(campos.precio_compra),
    margen_ganancia: parsear(campos.margen_ganancia),
    precio_venta: precioVentaFinal,
    precio_venta_manual: precioManual ? 1 : 0,
    stock: parsear(campos.stock),
    stock_minimo: parsear(campos.stock_minimo),
    imagen_path: imagenUri,
  }), [campos, imagenUri, precioVentaFinal, precioManual]);

  const resetear = useCallback(() => {
    setCampos(CAMPOS_VACIOS);
    setErrores({});
    setImagenUri(null);
    setPrecioManual(false);
  }, []);

  return {
    campos, errores, imagenUri, precioManual,
    precioCalculado,      // precio por fórmula (siempre disponible para mostrarlo)
    precioVentaFinal,     // precio que se guardará
    setCampo, setImagenUri,
    activarPrecioManual,
    restaurarPrecioAutomatico,
    validar, toInput, resetear,
  };
}
