import * as FileSystem from 'expo-file-system';

const IMAGES_DIR = `${FileSystem.documentDirectory}Inventario/productos/`;

async function ensureDirectoryExists(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

/**
 * Copia una imagen elegida por el usuario al directorio de la app.
 * Retorna la ruta permanente donde quedó guardada.
 */
export async function guardarImagenProducto(
  sourceUri: string,
  productoId: number
): Promise<string> {
  await ensureDirectoryExists();
  const extension = sourceUri.split('.').pop() ?? 'jpg';
  const destPath = `${IMAGES_DIR}producto_${productoId}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  return destPath;
}

/**
 * Elimina la imagen de un producto si existe.
 */
export async function eliminarImagenProducto(imagenPath: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(imagenPath);
    if (info.exists) {
      await FileSystem.deleteAsync(imagenPath, { idempotent: true });
    }
  } catch {
    // Si no existe, no es un error
  }
}

/**
 * Verifica si una imagen existe en el sistema de archivos.
 */
export async function existeImagen(imagenPath: string | null): Promise<boolean> {
  if (!imagenPath) return false;
  try {
    const info = await FileSystem.getInfoAsync(imagenPath);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Devuelve la URI de la imagen o null si no existe.
 * Los componentes deben usar una imagen predeterminada cuando reciban null.
 */
export async function resolverImagenProducto(
  imagenPath: string | null
): Promise<string | null> {
  if (!imagenPath) return null;
  const existe = await existeImagen(imagenPath);
  return existe ? imagenPath : null;
}
