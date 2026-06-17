import { getDatabase } from '../db';
import type { ConfiguracionItem } from '../../types';

// Claves tipadas para mayor seguridad
export type ConfiguracionClave =
  | 'nombre_tienda'
  | 'moneda'
  | 'margen_defecto'
  | 'stock_minimo_defecto';

class ConfiguracionRepository {
  async get(clave: ConfiguracionClave): Promise<string | null> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<ConfiguracionItem>(
        `SELECT valor FROM configuracion WHERE clave = ?`,
        [clave]
      );
      return row?.valor ?? null;
    } catch {
      return null;
    }
  }

  async set(clave: ConfiguracionClave, valor: string): Promise<boolean> {
    try {
      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
        [clave, valor]
      );
      return true;
    } catch {
      return false;
    }
  }

  async getAll(): Promise<Record<string, string>> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<ConfiguracionItem>(
        `SELECT clave, valor FROM configuracion`
      );
      return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
    } catch {
      return {};
    }
  }

  async getNumero(clave: ConfiguracionClave, fallback = 0): Promise<number> {
    const valor = await this.get(clave);
    const num = parseFloat(valor ?? '');
    return isNaN(num) ? fallback : num;
  }
}

export const configuracionRepository = new ConfiguracionRepository();
