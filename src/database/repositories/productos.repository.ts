import { BaseRepository } from './base.repository';
import { getDatabase } from '../db';
import type {
  Producto,
  ProductoInput,
  ProductoUpdate,
  CategoriaProducto,
  RepositoryListResult,
  RepositoryResult,
} from '../../types';

/**
 * Calcula el precio de venta según la fórmula del negocio:
 * precio_venta = precio_compra + (precio_compra × margen / 100)
 */
export function calcularPrecioVenta(
  precioCompra: number,
  margen: number
): number {
  return Math.round((precioCompra + (precioCompra * margen) / 100) * 100) / 100;
}

export class ProductosRepository extends BaseRepository<Producto, ProductoInput> {
  protected tableName = 'productos';

  // ─────────────────────────────────────────────
  // Búsquedas específicas
  // ─────────────────────────────────────────────

  async findByCategoria(
    categoria: CategoriaProducto
  ): Promise<RepositoryListResult<Producto>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<Producto>(
        `SELECT * FROM productos WHERE categoria = ? ORDER BY nombre ASC`,
        [categoria]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async findByCodigo(
    codigo: string
  ): Promise<RepositoryResult<Producto>> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<Producto>(
        `SELECT * FROM productos WHERE codigo = ?`,
        [codigo]
      );
      return { data: row ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  async search(query: string): Promise<RepositoryListResult<Producto>> {
    try {
      const db = getDatabase();
      const term = `%${query}%`;
      const rows = await db.getAllAsync<Producto>(
        `SELECT * FROM productos
         WHERE nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?
         ORDER BY nombre ASC`,
        [term, term, term]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async findStockBajo(): Promise<RepositoryListResult<Producto>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<Producto>(
        `SELECT * FROM productos
         WHERE stock <= stock_minimo
         ORDER BY (stock - stock_minimo) ASC`
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  // ─────────────────────────────────────────────
  // Operaciones de negocio
  // ─────────────────────────────────────────────

  /**
   * Actualiza precio de compra y recalcula precio de venta automáticamente.
   */
  async actualizarPrecioCompra(
    id: number,
    nuevoPrecioCompra: number
  ): Promise<RepositoryResult<Producto>> {
    try {
      const { data: producto, error } = await this.findById(id);
      if (error || !producto) return { data: null, error: error ?? 'Producto no encontrado' };

      const nuevoPrecioVenta = calcularPrecioVenta(
        nuevoPrecioCompra,
        producto.margen_ganancia
      );

      return this.update(id, {
        precio_compra: nuevoPrecioCompra,
        precio_venta: nuevoPrecioVenta,
      });
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  /**
   * Ajusta el stock de un producto sumando/restando la cantidad indicada.
   * cantidad positiva = entrada, cantidad negativa = salida.
   */
  async ajustarStock(
    id: number,
    delta: number
  ): Promise<RepositoryResult<Producto>> {
    try {
      const db = getDatabase();
      await db.runAsync(
        `UPDATE productos SET stock = stock + ? WHERE id = ?`,
        [delta, id]
      );
      return this.findById(id);
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  override async insert(
    input: ProductoInput
  ): Promise<RepositoryResult<Producto>> {
    // Garantizar que precio_venta esté calculado
    const precioVenta = calcularPrecioVenta(
      input.precio_compra,
      input.margen_ganancia
    );
    return super.insert({ ...input, precio_venta: precioVenta });
  }

  override async update(
    id: number,
    changes: Partial<ProductoInput>
  ): Promise<RepositoryResult<Producto>> {
    // Si se modifica precio de compra o margen, recalcular precio de venta
    if (
      changes.precio_compra !== undefined ||
      changes.margen_ganancia !== undefined
    ) {
      const { data: actual } = await this.findById(id);
      if (actual) {
        const precioCompra = changes.precio_compra ?? actual.precio_compra;
        const margen = changes.margen_ganancia ?? actual.margen_ganancia;
        changes = { ...changes, precio_venta: calcularPrecioVenta(precioCompra, margen) };
      }
    }
    return super.update(id, changes);
  }
}

export const productosRepository = new ProductosRepository();
