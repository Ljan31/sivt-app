// ─── Base de datos ───────────────────────────
export { initDatabase, getDatabase, closeDatabase } from './database/db';

// ─── Migraciones ─────────────────────────────
export { runMigrations } from './database/migrations/runner';

// ─── Repositorios ────────────────────────────
export { productosRepository, calcularPrecioVenta } from './database/repositories/productos.repository';
export { comprasRepository } from './database/repositories/compras.repository';
export { ventasRepository } from './database/repositories/ventas.repository';
export { movimientosStockRepository } from './database/repositories/movimientos.repository';
export { configuracionRepository } from './database/repositories/configuracion.repository';

// ─── Servicios ───────────────────────────────
export { initializeDatabase } from './services/database.service';
export * from './services/image.service';
export * from './services/backup.service';

// ─── Stores ──────────────────────────────────
export { useProductosStore } from './store/productos.store';
export { useComprasStore } from './store/compras.store';
export { useVentasStore } from './store/ventas.store';
export { useConfiguracionStore } from './store/configuracion.store';

// ─── Hooks ───────────────────────────────────
export { useDatabase } from './hooks/useDatabase';
export { useStockBajo } from './hooks/useStockBajo';

// ─── Utilidades ──────────────────────────────
export * from './utils/index';

// ─── Tipos ───────────────────────────────────
export type * from './types/index';
