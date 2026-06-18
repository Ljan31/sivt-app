import type {
  DetalleVenta,
  DetalleVentaInput,
  RepositoryListResult,
  RepositoryResult,
  Venta,
  VentaConDetalles,
  VentaInput,
} from '../../types';
import { getDatabase } from '../db';
import { BaseRepository } from './base.repository';
import { productosRepository } from './productos.repository';

class DetalleVentasRepository extends BaseRepository<DetalleVenta, DetalleVentaInput> {
  protected tableName = 'detalle_ventas';

  async findByVenta(
    ventaId: number
  ): Promise<RepositoryListResult<DetalleVenta & { producto_nombre: string }>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<DetalleVenta & { producto_nombre: string }>(
        `SELECT dv.*, p.nombre AS producto_nombre
         FROM detalle_ventas dv
         JOIN productos p ON p.id = dv.producto_id
         WHERE dv.venta_id = ?`,
        [ventaId]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }
}

const detalleVentasRepository = new DetalleVentasRepository();

export interface ItemVenta {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

class VentasRepository extends BaseRepository<Venta, VentaInput> {
  protected tableName = 'ventas';

  async findConDetalles(id: number): Promise<RepositoryResult<VentaConDetalles>> {
    try {
      const { data: venta, error } = await this.findById(id);
      if (error || !venta) return { data: null, error: error ?? 'Venta no encontrada' };

      const { data: detalles } = await detalleVentasRepository.findByVenta(id);
      return { data: { ...venta, detalles }, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  async findAllConDetalles(): Promise<RepositoryListResult<VentaConDetalles>> {
    try {
      const { data: ventas, error } = await this.findAll();
      if (error) return { data: [], error };

      const ventasConDetalles: VentaConDetalles[] = [];
      for (const venta of ventas) {
        const { data: detalles } = await detalleVentasRepository.findByVenta(venta.id);
        ventasConDetalles.push({ ...venta, detalles });
      }
      return { data: ventasConDetalles, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  /**
   * Registra una venta completa:
   * - Verifica stock suficiente para todos los productos.
   * - Inserta la cabecera de venta con el total calculado.
   * - Inserta cada ítem del detalle.
   * - Descuenta stock de cada producto.
   * - Registra movimiento tipo "Venta".
   * Todo dentro de una transacción atómica.
   */
  async registrarVenta(
    fecha: string,
    items: ItemVenta[]
  ): Promise<RepositoryResult<VentaConDetalles>> {
    return this.withTransaction(async () => {
      const db = getDatabase();

      // 1. Verificar stock para todos los productos
      for (const item of items) {
        const { data: producto } = await productosRepository.findById(item.producto_id);
        if (!producto) throw new Error(`Producto ${item.producto_id} no encontrado`);
        if (producto.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente para "${producto.nombre}". ` +
            `Disponible: ${producto.stock}, solicitado: ${item.cantidad}`
          );
        }
      }

      // 2. Calcular total
      const total = items.reduce(
        (sum, item) => sum + item.cantidad * item.precio_unitario,
        0
      );

      // 3. Insertar cabecera de venta
      const ventaResult = await db.runAsync(
        `INSERT INTO ventas (fecha, total) VALUES (?, ?)`,
        [fecha, Math.round(total * 100) / 100]
      );
      const ventaId = ventaResult.lastInsertRowId;

      // 4. Insertar detalles y actualizar stock
      for (const item of items) {
        await db.runAsync(
          `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?)`,
          [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
        );

        // Descontar stock (delta negativo)
        await productosRepository.ajustarStock(item.producto_id, -item.cantidad);

        // Registrar movimiento
        await db.runAsync(
          `INSERT INTO movimientos_stock (producto_id, tipo, cantidad, fecha)
           VALUES (?, 'Venta', ?, ?)`,
          [item.producto_id, item.cantidad, fecha]
        );
      }

      // 5. Retornar venta completa
      const venta = await db.getFirstAsync<Venta>(
        `SELECT * FROM ventas WHERE id = ?`,
        [ventaId]
      );
      const detalles = await detalleVentasRepository.findByVenta(ventaId);

      return { ...venta!, detalles: detalles.data } as VentaConDetalles;
    });
  }

  /**
   * Obtiene ingresos y ganancia estimada en un rango de fechas.
   */
  async getResumen(
    desde: string,
    hasta: string
  ): Promise<{ totalVentas: number; cantidadVentas: number }> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<{
        totalVentas: number;
        cantidadVentas: number;
      }>(
        `SELECT
           COALESCE(SUM(total), 0)  AS totalVentas,
           COUNT(*)                 AS cantidadVentas
         FROM ventas
         WHERE fecha BETWEEN ? AND ?`,
        [desde, hasta]
      );
      return { totalVentas: row?.totalVentas ?? 0, cantidadVentas: row?.cantidadVentas ?? 0 };
    } catch {
      return { totalVentas: 0, cantidadVentas: 0 };
    }
  }
}

export const ventasRepository = new VentasRepository();
export { detalleVentasRepository };

