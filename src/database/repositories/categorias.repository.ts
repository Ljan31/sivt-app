import { BaseRepository } from './base.repository';
import { getDatabase } from '../db';
import type {
  Categoria,
  CategoriaInput,
  RepositoryResult,
  RepositoryListResult,
} from '../../types';

class CategoriasRepository extends BaseRepository<Categoria, CategoriaInput> {
  protected tableName = 'categorias';

  /** Todas las categorías ordenadas por campo `orden`. */
  override async findAll(): Promise<RepositoryListResult<Categoria>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<Categoria>(
        `SELECT * FROM categorias ORDER BY orden ASC, nombre ASC`
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  /** Solo los nombres, útil para selectors. */
  async findNombres(): Promise<string[]> {
    const { data } = await this.findAll();
    return data.map((c) => c.nombre);
  }

  async findByNombre(nombre: string): Promise<RepositoryResult<Categoria>> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<Categoria>(
        `SELECT * FROM categorias WHERE nombre = ?`,
        [nombre]
      );
      return { data: row ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  /** Reordena una categoría (sube o baja). */
  async reordenar(id: number, nuevoOrden: number): Promise<RepositoryResult<Categoria>> {
    return this.update(id, { orden: nuevoOrden } as Partial<CategoriaInput>);
  }

  /**
   * Elimina una categoría solo si no tiene productos asociados.
   * Si tiene productos los reasigna a 'Otros' antes de eliminar.
   */
  async eliminarConReasignacion(id: number): Promise<RepositoryResult<boolean>> {
    return this.withTransaction(async () => {
      const db = getDatabase();
      const cat = await db.getFirstAsync<Categoria>(
        `SELECT * FROM categorias WHERE id = ?`, [id]
      );
      if (!cat) throw new Error('Categoría no encontrada');

      // Reasignar productos a "Otros"
      await db.runAsync(
        `UPDATE productos SET categoria = 'Otros' WHERE categoria = ?`,
        [cat.nombre]
      );

      await db.runAsync(`DELETE FROM categorias WHERE id = ?`, [id]);
      return true;
    });
  }
}

export const categoriasRepository = new CategoriasRepository();
