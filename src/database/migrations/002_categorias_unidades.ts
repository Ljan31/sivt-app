import type { SQLiteDatabase } from 'expo-sqlite';

export const migration_002_categorias_unidades = {
  version: 2,
  up: async (db: SQLiteDatabase): Promise<void> => {
    await db.execAsync(`
      -- ─────────────────────────────────────────
      -- Tabla: categorias (CRUD dinámico)
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS categorias (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT    NOT NULL UNIQUE,
        icono  TEXT,
        orden  INTEGER NOT NULL DEFAULT 0
      );

      -- ─────────────────────────────────────────
      -- Tabla: unidades_medida (CRUD dinámico)
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS unidades_medida (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre      TEXT    NOT NULL UNIQUE,
        icono       TEXT,
        abreviatura TEXT
      );

      -- ─────────────────────────────────────────
      -- Agregar columna precio_venta_manual
      -- 0 = calculado automáticamente por fórmula
      -- 1 = editado manualmente por el usuario
      -- ─────────────────────────────────────────
      ALTER TABLE productos ADD COLUMN precio_venta_manual INTEGER NOT NULL DEFAULT 0;

      -- ─────────────────────────────────────────
      -- Categorías iniciales
      -- ─────────────────────────────────────────
      INSERT OR IGNORE INTO categorias (nombre, icono, orden) VALUES
        ('Bebidas',                '🥤', 1),
        ('Cervezas y tabaco',      '🍺', 2),
        ('Limpieza',               '🧹', 3),
        ('Higiene personal',       '🧴', 4),
        ('Abarrotes',              '🛒', 5),
        ('Conservas',              '🥫', 6),
        ('Snacks',                 '🍿', 7),
        ('Lácteos',                '🥛', 8),
        ('Café y bebidas calientes','☕', 9),
        ('Condimentos',            '🧂', 10),
        ('Verduras',               '🥦', 11),
        ('Otros',                  '📦', 12);

      -- ─────────────────────────────────────────
      -- Unidades de medida iniciales
      -- ─────────────────────────────────────────
      INSERT OR IGNORE INTO unidades_medida (nombre, icono, abreviatura) VALUES
        ('Unidad',     '▫️',  'u'),
        ('Paquete',    '📦',  'paq'),
        ('Caja',       '🗃️', 'cja'),
        ('Bolsa',      '🛍️', 'bsa'),
        ('Botella',    '🍶',  'bot'),
        ('Lata',       '🥫',  'lat'),
        ('Kilogramo',  '⚖️',  'kg'),
        ('Gramo',      '⚖️',  'g'),
        ('Litro',      '🧴',  'L');
    `);
  },
};
