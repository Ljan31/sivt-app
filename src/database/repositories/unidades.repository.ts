import { BaseRepository } from './base.repository';
import { getDatabase } from '../db';
import type {
  UnidadMedidaItem,
  UnidadMedidaInput,
  RepositoryResult,
  RepositoryListResult,
} from '../../types';

class UnidadesMedidaRepository extends BaseRepository<UnidadMedidaItem, UnidadMedidaInput> {
  protected tableName = 'unidades_medida';

  override async findAll(): Promise<RepositoryListResult<UnidadMedidaItem>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<UnidadMedidaItem>(
        `SELECT * FROM unidades_medida ORDER BY nombre ASC`
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async findNombres(): Promise<string[]> {
    const { data } = await this.findAll();
    return data.map((u) => u.nombre);
  }

  async findByNombre(nombre: string): Promise<RepositoryResult<UnidadMedidaItem>> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<UnidadMedidaItem>(
        `SELECT * FROM unidades_medida WHERE nombre = ?`,
        [nombre]
      );
      return { data: row ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  /**
   * Elimina una unidad solo si no hay productos usándola.
   * Retorna error descriptivo si hay productos asociados.
   */
  async eliminarSiSinUso(id: number): Promise<RepositoryResult<boolean>> {
    try {
      const db = getDatabase();
      const unidad = await db.getFirstAsync<UnidadMedidaItem>(
        `SELECT * FROM unidades_medida WHERE id = ?`, [id]
      );
      if (!unidad) return { data: false, error: 'Unidad no encontrada' };

      const uso = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM productos WHERE unidad_medida = ?`,
        [unidad.nombre]
      );

      if ((uso?.total ?? 0) > 0) {
        return {
          data: false,
          error: `No se puede eliminar: ${uso!.total} producto(s) usan esta unidad`,
        };
      }

      await db.runAsync(`DELETE FROM unidades_medida WHERE id = ?`, [id]);
      return { data: true, error: null };
    } catch (e) {
      return { data: false, error: String(e) };
    }
  }
}

export const unidadesMedidaRepository = new UnidadesMedidaRepository();
