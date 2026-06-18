import { useEffect, useState } from 'react';
import { initializeDatabase } from '../services/database.service';
import { useCategoriasStore, useUnidadesStore } from '../store/catalogo.store';
import { useConfiguracionStore } from '../store/configuracion.store';

interface UseDatabaseResult {
  ready: boolean;
  error: string | null;
}

/**
 * Hook que inicializa la base de datos y carga la configuración inicial.
 * Debe usarse en el componente raíz de la app (_layout.tsx).
 */
export function useDatabase(): UseDatabaseResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargarConfiguracion = useConfiguracionStore((s) => s.cargar);
  const cargarCategorias = useCategoriasStore((s) => s.cargar);
  const cargarUnidades = useUnidadesStore((s) => s.cargar);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await initializeDatabase();
        // Cargar catálogos en paralelo para mayor velocidad
        await Promise.all([
          cargarConfiguracion(),
          cargarCategorias(),
          cargarUnidades(),
        ]);
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
