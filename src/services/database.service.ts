import { initDatabase } from '../database/db';
import { runMigrations } from '../database/migrations/runner';

let initialized = false;

/**
 * Inicializa la base de datos y ejecuta las migraciones pendientes.
 * Es seguro llamarla múltiples veces; solo se ejecuta una vez.
 */
export async function initializeDatabase(): Promise<void> {
  if (initialized) return;

  try {
    const db = await initDatabase();
    await runMigrations(db);
    initialized = true;
    console.log('[DatabaseService] Base de datos lista');
  } catch (error) {
    console.error('[DatabaseService] Error al inicializar:', error);
    throw error;
  }
}

export function isDatabaseInitialized(): boolean {
  return initialized;
}
