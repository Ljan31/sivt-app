import type {
  RepositoryListResult,
  RepositoryResult,
} from '../../types';
import { getDatabase } from '../db';

// Fix: re-export SQLite namespace for binding values used above
import * as SQLite from 'expo-sqlite';

/**
 * BaseRepository provee operaciones CRUD genéricas.
 * Todos los repositorios específicos extienden esta clase.
 */
export abstract class BaseRepository<T extends { id: number }, TInput> {
  protected abstract tableName: string;

  // ─────────────────────────────────────────────
  // Lectura
  // ─────────────────────────────────────────────

  async findById(id: number): Promise<RepositoryResult<T>> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<T>(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return { data: row ?? null, error: null };
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  async findAll(): Promise<RepositoryListResult<T>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<T>(`SELECT * FROM ${this.tableName}`);
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async findWhere(
    conditions: Partial<Record<keyof T, unknown>>
  ): Promise<RepositoryListResult<T>> {
    try {
      const db = getDatabase();
      const keys = Object.keys(conditions) as (keyof T)[];
      if (keys.length === 0) return this.findAll();

      const whereClause = keys.map((k) => `${String(k)} = ?`).join(' AND ');
      const values = keys.map((k) => conditions[k]);

      const rows = await db.getAllAsync<T>(
        `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
        values as SQLite.SQLiteBindValue[]
      );
      return { data: rows, error: null };
    } catch (e) {
      return { data: [], error: String(e) };
    }
  }

  async count(): Promise<number> {
    try {
      const db = getDatabase();
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) as total FROM ${this.tableName}`
      );
      return result?.total ?? 0;
    } catch {
      return 0;
    }
  }

  // ─────────────────────────────────────────────
  // Escritura
  // ─────────────────────────────────────────────

  async insert(input: TInput): Promise<RepositoryResult<T>> {
    try {
      const db = getDatabase();
      const keys = Object.keys(input as object);
      const values = Object.values(input as object);
      const placeholders = keys.map(() => '?').join(', ');
      const columns = keys.join(', ');

      const result = await db.runAsync(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
        values
      );

      return this.findById(result.lastInsertRowId);
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  async update(
    id: number,
    changes: Partial<TInput>
  ): Promise<RepositoryResult<T>> {
    try {
      const db = getDatabase();
      const keys = Object.keys(changes as object);
      const values = Object.values(changes as object);

      if (keys.length === 0) return this.findById(id);

      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      await db.runAsync(
        `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
        [...values, id]
      );

      return this.findById(id);
    } catch (e) {
      return { data: null, error: String(e) };
    }
  }

  async delete(id: number): Promise<RepositoryResult<boolean>> {
    try {
      const db = getDatabase();
      const result = await db.runAsync(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return {
        data: result.changes > 0,
        error: null,
      };
    } catch (e) {
      return { data: false, error: String(e) };
    }
  }

  // ─────────────────────────────────────────────
  // Transacciones
  // ─────────────────────────────────────────────

  /**
   * Ejecuta múltiples operaciones dentro de una transacción atómica.
   * Si cualquier operación falla, todas se revierten.
   */
  async withTransaction<R>(
    operations: () => Promise<R>
  ): Promise<RepositoryResult<R>> {
    const db = getDatabase();
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      const result = await operations();
      await db.execAsync('COMMIT;');
      return { data: result, error: null };
    } catch (e) {
      await db.execAsync('ROLLBACK;');
      return { data: null, error: String(e) };
    }
  }
}
