import { useEffect, useState } from 'react';
import { productosRepository } from '../database/repositories/productos.repository';
import type { Producto } from '../types';

/**
 * Devuelve los productos cuyo stock está en o por debajo del stock mínimo.
 * Se puede refrescar manualmente llamando a `refrescar()`.
 */
export function useStockBajo(): {
  productosStockBajo: Producto[];
  cantidad: number;
  loading: boolean;
  refrescar: () => void;
} {
  const [productosStockBajo, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    productosRepository.findStockBajo().then(({ data }) => {
      if (!cancelled) {
        setProductos(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [tick]);

  return {
    productosStockBajo,
    cantidad: productosStockBajo.length,
    loading,
    refrescar: () => setTick((t) => t + 1),
  };
}
