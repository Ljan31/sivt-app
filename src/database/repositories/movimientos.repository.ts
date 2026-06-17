import { BaseRepository } from './base.repository';
import { getDatabase } from '../db';
import { productosRepository } from './productos.repository';
import type {
  MovimientoStock,
  MovimientoStockInput,
  TipoMovimiento,
  RepositoryResult,
  RepositoryListResult,
} from '../../types';

class MovimientosStockRepository extends BaseRepository<
  MovimientoStock,
  MovimientoStockInput
> {
  protected tableName = 'movimientos_stock';

  async findByProducto(
    productoId: number
  ): Promise<RepositoryListResult<MovimientoStock>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<MovimientoStock>(
        `SELECT * FROM movimientos_stock
         WHERE producto_id = ?
         ORDER BY fecha DESC`,
        [productoId]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async findByTipo(
    tipo: TipoMovimiento
  ): Promise<RepositoryListResult<MovimientoStock>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<MovimientoStock>(
        `SELECT * FROM movimientos_stock WHERE tipo = ? ORDER BY fecha DESC`,
        [tipo]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  /**
   * Registra un ajuste o merma manual de stock.
   * Para ajustes: cantidad puede ser positiva (incremento) o negativa (decremento).
   * Para mermas: cantidad siempre es positiva (se descuenta internamente).
   */
  async registrarMovimientoManual(
    productoId: number,
    tipo: Extract<TipoMovimiento, 'Ajuste' | 'Merma'>,
    cantidad: number,
    nota?: string
  ): Promise<RepositoryResult<MovimientoStock>> {
    return this.withTransaction(async () => {
      const db = getDatabase();

      // Para mermas, el delta al stock es negativo
      const deltaStock = tipo === 'Merma' ? -Math.abs(cantidad) : cantidad;

      // Verificar que no quede stock negativo
      const { data: producto } = await productosRepository.findById(productoId);
      if (!producto) throw new Error('Producto no encontrado');

      const stockResultante = producto.stock + deltaStock;
      if (stockResultante < 0) {
        throw new Error(
          `No se puede aplicar el movimiento. ` +
          `Stock actual: ${producto.stock}, resultado sería: ${stockResultante}`
        );
      }

      // Actualizar stock
      await productosRepository.ajustarStock(productoId, deltaStock);

      // Insertar movimiento
      const resultado = await db.runAsync(
        `INSERT INTO movimientos_stock (producto_id, tipo, cantidad, fecha, nota)
         VALUES (?, ?, ?, datetime('now','localtime'), ?)`,
        [productoId, tipo, Math.abs(cantidad), nota ?? null]
      );

      const movimiento = await db.getFirstAsync<MovimientoStock>(
        `SELECT * FROM movimientos_stock WHERE id = ?`,
        [resultado.lastInsertRowId]
      );

      return movimiento!;
    });
  }
}

export const movimientosStockRepository = new MovimientosStockRepository();
