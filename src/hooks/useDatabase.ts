import { useEffect, useState } from 'react';
import { initializeDatabase } from '../services/database.service';
import { useConfiguracionStore } from '../store/configuracion.store';

interface UseDatabaseResult {
  ready: boolean;
  error: string | null;
}

/**
 * Hook que inicializa la base de datos y carga la configuración inicial.
 * Debe usarse en el componente raíz de la app (_layout.tsx).
 *
 * @example
 * function RootLayout() {
 *   const { ready, error } = useDatabase();
 *   if (!ready) return <SplashScreen />;
 *   if (error) return <ErrorScreen message={error} />;
 *   return <Slot />;
 * }
 */
export function useDatabase(): UseDatabaseResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargarConfiguracion = useConfiguracionStore((s) => s.cargar);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await initializeDatabase();
        await cargarConfiguracion();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return { ready, error };
}
