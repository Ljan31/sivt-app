import type {
  Compra,
  CompraConDetalles,
  CompraInput,
  DetalleCompra,
  DetalleCompraInput,
  RepositoryListResult,
  RepositoryResult,
} from '../../types';
import { getDatabase } from '../db';
import { BaseRepository } from './base.repository';
import { productosRepository } from './productos.repository';

class DetalleComprasRepository extends BaseRepository<
  DetalleCompra,
  DetalleCompraInput
> {
  protected tableName = 'detalle_compras';

  async findByCompra(compraId: number): Promise<RepositoryListResult<DetalleCompra & { producto_nombre: string }>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<DetalleCompra & { producto_nombre: string }>(
        `SELECT dc.*, p.nombre AS producto_nombre
         FROM detalle_compras dc
         JOIN productos p ON p.id = dc.producto_id
         WHERE dc.compra_id = ?`,
        [compraId]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }
}

const detalleComprasRepository = new DetalleComprasRepository();

class ComprasRepository extends BaseRepository<Compra, CompraInput> {
  protected tableName = 'compras';

  async findConDetalles(id: number): Promise<RepositoryResult<CompraConDetalles>> {
    try {
      const { data: compra, error } = await this.findById(id);
      if (error || !compra) return { data: null, error: error ?? 'Compra no encontrada' };

      const { data: detalles } = await detalleComprasRepository.findByCompra(id);
      return { data: { ...compra, detalles }, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  async findAllConDetalles(): Promise<RepositoryListResult<CompraConDetalles>> {
    try {
      const { data: compras, error } = await this.findAll();
      if (error) return { data: [], error };

      const comprasConDetalles: CompraConDetalles[] = [];
      for (const compra of compras) {
        const { data: detalles } = await detalleComprasRepository.findByCompra(compra.id);
        comprasConDetalles.push({ ...compra, detalles });
      }
      return { data: comprasConDetalles, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  /**
   * Registra una compra completa con sus detalles.
   * - Inserta la cabecera de la compra.
   * - Inserta cada ítem del detalle.
   * - Actualiza el stock de cada producto.
   * - Actualiza el precio de compra de cada producto.
   * - Registra movimiento de stock tipo "Entrada".
   * Todo dentro de una transacción atómica.
   */
  async registrarCompra(
    compra: CompraInput,
    detalles: Omit<DetalleCompraInput, 'compra_id'>[]
  ): Promise<RepositoryResult<CompraConDetalles>> {
    return this.withTransaction(async () => {
      const db = getDatabase();

      // 1. Insertar cabecera
      const compraResult = await db.runAsync(
        `INSERT INTO compras (numero_factura, proveedor, fecha)
         VALUES (?, ?, ?)`,
        [compra.numero_factura ?? null, compra.proveedor ?? null, compra.fecha]
      );
      const compraId = compraResult.lastInsertRowId;

      // 2. Insertar detalles y actualizar stock/precios
      for (const detalle of detalles) {
        // Insertar detalle
        await db.runAsync(
          `INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?)`,
          [compraId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario]
        );

        // Actualizar stock
        await productosRepository.ajustarStock(detalle.producto_id, detalle.cantidad);

        // Actualizar precio de compra (y recalcular precio de venta)
        await productosRepository.actualizarPrecioCompra(
          detalle.producto_id,
          detalle.precio_unitario
        );

        // Registrar movimiento de stock
        await db.runAsync(
          `INSERT INTO movimientos_stock (producto_id, tipo, cantidad, fecha, nota)
           VALUES (?, 'Entrada', ?, ?, ?)`,
          [
            detalle.producto_id,
            detalle.cantidad,
            compra.fecha,
            `Compra factura: ${compra.numero_factura ?? 'S/N'}`,
          ]
        );
      }

      // 3. Retornar compra completa
      const detallesInsertados = await detalleComprasRepository.findByCompra(compraId);
      const compraInsertada = await db.getFirstAsync<Compra>(
        `SELECT * FROM compras WHERE id = ?`,
        [compraId]
      );

      return {
        ...compraInsertada!,
        detalles: detallesInsertados.data,
      } as CompraConDetalles;
    });
  }
}

export const comprasRepository = new ComprasRepository();
export { detalleComprasRepository };

