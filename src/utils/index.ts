
// ─────────────────────────────────────────────
// Formateo de moneda
// ─────────────────────────────────────────────

/**
 * Formatea un número como moneda local.
 * Ej: 125.5 → "Bs 125.50"
 */
export function formatearMoneda(valor: number, moneda = 'Bs'): string {
  return `${moneda} ${valor.toFixed(2)}`;
}

/**
 * Formatea un porcentaje.
 * Ej: 25 → "25%"
 */
export function formatearPorcentaje(valor: number): string {
  return `${valor}%`;
}

// ─────────────────────────────────────────────
// Fechas
// ─────────────────────────────────────────────

/**
 * Retorna la fecha actual en formato ISO local (sin timezone).
 * Ej: "2025-07-15 14:30:00"
 */
export function fechaActualLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  );
}

/**
 * Formatea una fecha ISO a formato legible.
 * Ej: "2025-07-15 14:30:00" → "15/07/2025"
 */
export function formatearFecha(fechaIso: string): string {
  const d = new Date(fechaIso.replace(' ', 'T'));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Retorna inicio y fin del día actual en formato ISO local.
 */
export function rangoHoy(): { desde: string; hasta: string } {
  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fecha = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
  return { desde: `${fecha} 00:00:00`, hasta: `${fecha} 23:59:59` };
}

// ─────────────────────────────────────────────
// Validaciones
// ─────────────────────────────────────────────

export function validarPrecio(valor: unknown): boolean {
  return typeof valor === 'number' && valor >= 0 && isFinite(valor);
}

export function validarCantidad(valor: unknown): boolean {
  return typeof valor === 'number' && valor > 0 && isFinite(valor);
}

export function validarCodigoProducto(codigo: string): boolean {
  return codigo.trim().length > 0 && codigo.trim().length <= 50;
}

// ─────────────────────────────────────────────
// Constantes de dominio
// ─────────────────────────────────────────────

// CATEGORIAS y UNIDADES_MEDIDA ya no son listas fijas.
// Vienen de la base de datos via useCategoriasStore y useUnidadesStore.
// Se mantienen estas funciones por compatibilidad con código existente.

export const CATEGORIAS: string[] = [
  'Bebidas', 'Cervezas y tabaco', 'Limpieza', 'Higiene personal',
  'Abarrotes', 'Conservas', 'Snacks', 'Lácteos',
  'Café y bebidas calientes', 'Condimentos', 'Verduras', 'Otros',
];

export const UNIDADES_MEDIDA: string[] = [
  'Unidad', 'Paquete', 'Caja', 'Bolsa',
  'Botella', 'Lata', 'Kilogramo', 'Gramo', 'Litro',
];
