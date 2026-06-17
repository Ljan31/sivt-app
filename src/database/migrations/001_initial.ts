import type { SQLiteDatabase } from 'expo-sqlite';

export const migration_001_initial = {
  version: 1,
  up: async (db: SQLiteDatabase): Promise<void> => {
    await db.execAsync(`
      -- ─────────────────────────────────────────
      -- Tabla: productos
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS productos (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo          TEXT    NOT NULL UNIQUE,
        nombre          TEXT    NOT NULL,
        categoria       TEXT    NOT NULL DEFAULT 'Otros',
        descripcion     TEXT,
        unidad_medida   TEXT    NOT NULL DEFAULT 'Unidad',
        precio_compra   REAL    NOT NULL DEFAULT 0,
        margen_ganancia REAL    NOT NULL DEFAULT 0,
        precio_venta    REAL    NOT NULL DEFAULT 0,
        stock           REAL    NOT NULL DEFAULT 0,
        stock_minimo    REAL    NOT NULL DEFAULT 0,
        imagen_path     TEXT,
        fecha_creacion  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );

      -- ─────────────────────────────────────────
      -- Tabla: compras
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS compras (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_factura  TEXT,
        proveedor       TEXT,
        fecha           TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );

      -- ─────────────────────────────────────────
      -- Tabla: detalle_compras
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS detalle_compras (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        compra_id       INTEGER NOT NULL,
        producto_id     INTEGER NOT NULL,
        cantidad        REAL    NOT NULL DEFAULT 0,
        precio_unitario REAL    NOT NULL DEFAULT 0,
        FOREIGN KEY (compra_id)   REFERENCES compras(id)   ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
      );

      -- ─────────────────────────────────────────
      -- Tabla: ventas
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS ventas (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha           TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
        total           REAL    NOT NULL DEFAULT 0
      );

      -- ─────────────────────────────────────────
      -- Tabla: detalle_ventas
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS detalle_ventas (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id        INTEGER NOT NULL,
        producto_id     INTEGER NOT NULL,
        cantidad        REAL    NOT NULL DEFAULT 0,
        precio_unitario REAL    NOT NULL DEFAULT 0,
        FOREIGN KEY (venta_id)    REFERENCES ventas(id)    ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
      );

      -- ─────────────────────────────────────────
      -- Tabla: movimientos_stock
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS movimientos_stock (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        tipo        TEXT    NOT NULL CHECK(tipo IN ('Entrada','Venta','Ajuste','Merma')),
        cantidad    REAL    NOT NULL,
        fecha       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
        nota        TEXT,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
      );

      -- ─────────────────────────────────────────
      -- Tabla: configuracion
      -- ─────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS configuracion (
        clave   TEXT PRIMARY KEY,
        valor   TEXT NOT NULL
      );

      -- ─────────────────────────────────────────
      -- Índices para mejorar rendimiento
      -- ─────────────────────────────────────────
      CREATE INDEX IF NOT EXISTS idx_productos_categoria   ON productos(categoria);
      CREATE INDEX IF NOT EXISTS idx_productos_codigo      ON productos(codigo);
      CREATE INDEX IF NOT EXISTS idx_detalle_compras_compra ON detalle_compras(compra_id);
      CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta   ON detalle_ventas(venta_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_producto  ON movimientos_stock(producto_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_fecha     ON movimientos_stock(fecha);

      -- ─────────────────────────────────────────
      -- Configuración inicial
      -- ─────────────────────────────────────────
      INSERT OR IGNORE INTO configuracion (clave, valor)
      VALUES
        ('nombre_tienda',     'Mi Tienda'),
        ('moneda',            'Bs'),
        ('margen_defecto',    '25'),
        ('stock_minimo_defecto', '5');
    `);
  },
};
