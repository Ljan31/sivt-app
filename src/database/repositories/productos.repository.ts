import type {
  CategoriaProducto,
  Producto,
  ProductoInput,
  RepositoryListResult,
  RepositoryResult,
} from '../../types';
import { getDatabase } from '../db';
import { BaseRepository } from './base.repository';

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
   * Actualiza precio de compra.
   * Si el precio de venta NO fue editado manualmente, lo recalcula automáticamente.
   * Si fue editado manualmente, lo respeta.
   */
  async actualizarPrecioCompra(
    id: number,
    nuevoPrecioCompra: number
  ): Promise<RepositoryResult<Producto>> {
    try {
      const { data: producto, error } = await this.findById(id);
      if (error || !producto) return { data: null, error: error ?? 'Producto no encontrado' };

      const changes: Partial<ProductoInput> = { precio_compra: nuevoPrecioCompra };

      // Solo recalcula si el precio NO fue modificado manualmente
      if (!producto.precio_venta_manual) {
        changes.precio_venta = calcularPrecioVenta(nuevoPrecioCompra, producto.margen_ganancia);
      }

      return this.update(id, changes);
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  /**
   * Permite al usuario editar el precio de venta directamente.
   * Marca precio_venta_manual = 1 para que futuras actualizaciones
   * de precio de compra no lo sobreescriban.
   */
  async setPrecioVentaManual(
    id: number,
    precioVenta: number
  ): Promise<RepositoryResult<Producto>> {
    return this.update(id, {
      precio_venta: precioVenta,
      precio_venta_manual: 1,
    } as Partial<ProductoInput>);
  }

  /**
   * Restaura el precio de venta calculado por fórmula y
   * desactiva el modo manual.
   */
  async restaurarPrecioVentaAutomatico(
    id: number
  ): Promise<RepositoryResult<Producto>> {
    const { data: producto, error } = await this.findById(id);
    if (error || !producto) return { data: null, error: error ?? 'Producto no encontrado' };

    const precioCalculado = calcularPrecioVenta(
      producto.precio_compra,
      producto.margen_ganancia
    );
    return this.update(id, {
      precio_venta: precioCalculado,
      precio_venta_manual: 0,
    } as Partial<ProductoInput>);
  }

  /**
   * Ajusta el stock de un producto sumando/restando la cantidad indicada.
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
    // Si se provee precio_venta_manual=1, respetar el precio dado.
    // Si no, calcular automáticamente.
    const usaManual = (input as any).precio_venta_manual === 1;
    const precioVenta = usaManual
      ? input.precio_venta
      : calcularPrecioVenta(input.precio_compra, input.margen_ganancia);
    return super.insert({ ...input, precio_venta: precioVenta, precio_venta_manual: usaManual ? 1 : 0 } as ProductoInput);
  }

  override async update(
    id: number,
    changes: Partial<ProductoInput>
  ): Promise<RepositoryResult<Producto>> {
    const hayPrecioManual = (changes as any).precio_venta_manual === 1;
    const cambiaPrecioOMargen =
      changes.precio_compra !== undefined || changes.margen_ganancia !== undefined;

    // Recalcular precio de venta solo si:
    // - cambia precio de compra o margen
    // - Y el cambio actual NO es una edición manual de precio
    // - Y el producto no tenía precio manual previo
    if (cambiaPrecioOMargen && !hayPrecioManual) {
      const { data: actual } = await this.findById(id);
      if (actual && !actual.precio_venta_manual) {
        const precioCompra = changes.precio_compra ?? actual.precio_compra;
        const margen = changes.margen_ganancia ?? actual.margen_ganancia;
        changes = { ...changes, precio_venta: calcularPrecioVenta(precioCompra, margen) };
      }
    }
    return super.update(id, changes);
  }
}

export const productosRepository = new ProductosRepository();

