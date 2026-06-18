// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

// Ahora son strings dinámicos: los valores vienen de las tablas
// `categorias` y `unidades_medida` en SQLite (CRUD completo).
export type CategoriaProducto = string;
export type UnidadMedida = string;

export type TipoMovimiento = 'Entrada' | 'Venta' | 'Ajuste' | 'Merma';

// ─────────────────────────────────────────────
// Categorías (tabla dinámica)
// ─────────────────────────────────────────────
export interface Categoria {
  id: number;
  nombre: string;
  icono: string | null;
  orden: number;
}
export type CategoriaInput = Omit<Categoria, 'id'>;

// ─────────────────────────────────────────────
// Unidades de Medida (tabla dinámica)
// ─────────────────────────────────────────────
export interface UnidadMedidaItem {
  id: number;
  nombre: string;
  icono: string | null;
  abreviatura: string | null;
}
export type UnidadMedidaInput = Omit<UnidadMedidaItem, 'id'>;

// ─────────────────────────────────────────────
// Productos
// ─────────────────────────────────────────────

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaProducto;
  descripcion: string | null;
  unidad_medida: UnidadMedida;
  precio_compra: number;
  margen_ganancia: number;
  precio_venta: number;
  precio_venta_manual: number; // 1 = precio editado manualmente, 0 = calculado por fórmula
  stock: number;
  stock_minimo: number;
  imagen_path: string | null;
  fecha_creacion: string;
}

export type ProductoInput = Omit<Producto, 'id' | 'fecha_creacion'>;

export type ProductoUpdate = Partial<ProductoInput>;

// ─────────────────────────────────────────────
// Compras
// ─────────────────────────────────────────────

export interface Compra {
  id: number;
  numero_factura: string | null;
  proveedor: string | null;
  fecha: string;
}

export type CompraInput = Omit<Compra, 'id'>;

export interface DetalleCompra {
  id: number;
  compra_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export type DetalleCompraInput = Omit<DetalleCompra, 'id'>;

export interface CompraConDetalles extends Compra {
  detalles: (DetalleCompra & { producto_nombre?: string })[];
}

// ─────────────────────────────────────────────
// Ventas
// ─────────────────────────────────────────────

export interface Venta {
  id: number;
  fecha: string;
  total: number;
}

export type VentaInput = Omit<Venta, 'id'>;

export interface DetalleVenta {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export type DetalleVentaInput = Omit<DetalleVenta, 'id'>;

export interface VentaConDetalles extends Venta {
  detalles: (DetalleVenta & { producto_nombre?: string })[];
}

// ─────────────────────────────────────────────
// Movimientos de Stock
// ─────────────────────────────────────────────

export interface MovimientoStock {
  id: number;
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: string;
  nota: string | null;
}

export type MovimientoStockInput = Omit<MovimientoStock, 'id'>;

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

export interface ConfiguracionItem {
  clave: string;
  valor: string;
}

// ─────────────────────────────────────────────
// Respuesta genérica de repositorio
// ─────────────────────────────────────────────

export interface RepositoryResult<T> {
  data: T | null;
  error: string | null;
}

export interface RepositoryListResult<T> {
  data: T[];
  error: string | null;
}
