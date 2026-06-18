// ─── Base de datos ───────────────────────────
export { closeDatabase, getDatabase, initDatabase } from './database/db';

// ─── Migraciones ─────────────────────────────
export { runMigrations } from './database/migrations/runner';

// ─── Repositorios ────────────────────────────
export { categoriasRepository } from './database/repositories/categorias.repository';
export { comprasRepository } from './database/repositories/compras.repository';
export { configuracionRepository } from './database/repositories/configuracion.repository';
export { movimientosStockRepository } from './database/repositories/movimientos.repository';
export { calcularPrecioVenta, productosRepository } from './database/repositories/productos.repository';
export { unidadesMedidaRepository } from './database/repositories/unidades.repository';
export { ventasRepository } from './database/repositories/ventas.repository';

// ─── Servicios ───────────────────────────────
export * from './services/backup.service';
export { initializeDatabase } from './services/database.service';
export * from './services/image.service';

// ─── Stores ──────────────────────────────────
export { useCategoriasStore, useUnidadesStore } from './store/catalogo.store';
export { useComprasStore } from './store/compras.store';
export { useConfiguracionStore } from './store/configuracion.store';
export { useProductosStore } from './store/productos.store';
export { useVentasStore } from './store/ventas.store';

// ─── Hooks ───────────────────────────────────
export { useDatabase } from './hooks/useDatabase';
export { useStockBajo } from './hooks/useStockBajo';

// ─── Utilidades ──────────────────────────────
export * from './utils/index';

// ─── Tipos ───────────────────────────────────
export type * from './types/index';

