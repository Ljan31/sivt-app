import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DB_PATH = `${FileSystem.documentDirectory}SQLite/inventario.db`;
const IMAGES_DIR = `${FileSystem.documentDirectory}Inventario/productos/`;
const BACKUPS_DIR = `${FileSystem.documentDirectory}Inventario/respaldos/`;

export interface BackupMetadata {
  version: string;
  fecha: string;
  appVersion: string;
}

async function ensureBackupDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BACKUPS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUPS_DIR, { intermediates: true });
  }
}

/**
 * Genera un nombre de archivo con timestamp para el respaldo.
 */
function generarNombreBackup(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return `inventario_backup_${ts}.zip`;
}

/**
 * Crea un respaldo de la base de datos y las imágenes.
 *
 * NOTA: La compresión ZIP real requiere expo-zip o similar.
 * Esta implementación copia el archivo DB como respaldo plano y puede
 * extenderse con una librería ZIP cuando esté disponible en el proyecto.
 *
 * Retorna la ruta del archivo de respaldo generado.
 */
export async function crearRespaldo(): Promise<string> {
  await ensureBackupDir();

  const nombreArchivo = generarNombreBackup();
  const destPath = `${BACKUPS_DIR}${nombreArchivo}`;

  // Por ahora copiamos el archivo DB directamente.
  // Cuando se agregue expo-zip, se puede empaquetar DB + imágenes.
  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) {
    throw new Error('No se encontró la base de datos para respaldar');
  }

  await FileSystem.copyAsync({ from: DB_PATH, to: destPath });

  // Guardar metadata junto al backup
  const metadata: BackupMetadata = {
    version: '1',
    fecha: new Date().toISOString(),
    appVersion: '1.0.0',
  };
  await FileSystem.writeAsStringAsync(
    `${BACKUPS_DIR}metadata_${Date.now()}.json`,
    JSON.stringify(metadata, null, 2)
  );

  console.log(`[BackupService] Respaldo creado: ${destPath}`);
  return destPath;
}

/**
 * Comparte el último respaldo disponible usando expo-sharing.
 * Compatible con WhatsApp, Telegram, correo, etc.
 */
export async function compartirRespaldo(rutaRespaldo: string): Promise<void> {
  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('La función de compartir no está disponible en este dispositivo');
  }
  await Sharing.shareAsync(rutaRespaldo, {
    mimeType: 'application/zip',
    dialogTitle: 'Compartir respaldo de inventario',
  });
}

/**
 * Lista todos los respaldos disponibles en el directorio local.
 */
export async function listarRespaldos(): Promise<
  Array<{ nombre: string; ruta: string; fecha: Date }>
> {
  try {
    await ensureBackupDir();
    const contenido = await FileSystem.readDirectoryAsync(BACKUPS_DIR);
    const respaldos = contenido
      .filter((f) => f.endsWith('.zip') || f.endsWith('.db'))
      .map((nombre) => ({
        nombre,
        ruta: `${BACKUPS_DIR}${nombre}`,
        fecha: new Date(), // se puede mejorar leyendo metadata
      }));
    return respaldos;
  } catch {
    return [];
  }
}

/**
 * Restaura la base de datos desde un archivo de respaldo.
 * ⚠️ Esta operación reemplaza todos los datos actuales.
 */
export async function restaurarRespaldo(rutaRespaldo: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(rutaRespaldo);
  if (!info.exists) {
    throw new Error('El archivo de respaldo no existe');
  }

  // Crear respaldo de seguridad antes de restaurar
  await crearRespaldo();

  // Reemplazar la base de datos
  await FileSystem.copyAsync({ from: rutaRespaldo, to: DB_PATH });

  console.log('[BackupService] Restauración completada. Reiniciar la app.');
}
