import type { SQLiteDatabase } from 'expo-sqlite';
import { migration_001_initial } from './001_initial';
import { migration_002_categorias_unidades } from './002_categorias_unidades';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// Registrar aquí todas las migraciones en orden
const ALL_MIGRATIONS: Migration[] = [
  migration_001_initial,
  migration_002_categorias_unidades,
];

async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _schema_version (
        version INTEGER NOT NULL
      );
    `);
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM _schema_version LIMIT 1'
    );
    return result?.version ?? 0;
  } catch {
    return 0;
  }
}

async function setCurrentVersion(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.execAsync('DELETE FROM _schema_version;');
  await db.runAsync('INSERT INTO _schema_version (version) VALUES (?);', [
    version,
  ]);
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  const pending = ALL_MIGRATIONS.filter((m) => m.version > currentVersion);

  if (pending.length === 0) {
    console.log(`[DB] Schema actualizado (versión ${currentVersion})`);
    return;
  }

  for (const migration of pending) {
    console.log(`[DB] Aplicando migración v${migration.version}...`);
    await migration.up(db);
    await setCurrentVersion(db, migration.version);
    console.log(`[DB] Migración v${migration.version} aplicada`);
  }
}
