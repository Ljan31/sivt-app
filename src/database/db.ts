import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'inventario.db';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error(
      'La base de datos no ha sido inicializada. Llama a initDatabase() primero.'
    );
  }
  return db;
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Habilitar WAL para mejor rendimiento y concurrencia
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
