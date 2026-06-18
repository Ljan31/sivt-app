import { create } from 'zustand';
import { comprasRepository } from '../database/repositories/compras.repository';
import type { CompraConDetalles, CompraInput } from '../types';

// Ítem en el carrito de compra (antes de confirmar)
export interface ItemCarritoCompra {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface ComprasState {
  compras: CompraConDetalles[];
  carrito: ItemCarritoCompra[];
  loading: boolean;
  error: string | null;

  // Historial
  cargarCompras: () => Promise<void>;

  // Carrito
  agregarAlCarrito: (item: ItemCarritoCompra) => void;
  actualizarItemCarrito: (productoId: number, changes: Partial<ItemCarritoCompra>) => void;
  quitarDelCarrito: (productoId: number) => void;
  vaciarCarrito: () => void;

  // Confirmar compra
  confirmarCompra: (cabecera: CompraInput) => Promise<CompraConDetalles | null>;

  limpiarError: () => void;
}

export const useComprasStore = create<ComprasState>((set, get) => ({
  compras: [],
  carrito: [],
  loading: false,
  error: null,

  cargarCompras: async () => {
    set({ loading: true, error: null });
    const { data, error } = await comprasRepository.findAllConDetalles();
    set({ compras: data, loading: false, error });
  },

  agregarAlCarrito: (item) => {
    set((state) => {
      const existe = state.carrito.find((i) => i.producto_id === item.producto_id);
      if (existe) {
        return {
          carrito: state.carrito.map((i) =>
            i.producto_id === item.producto_id
              ? { ...i, cantidad: i.cantidad + item.cantidad, precio_unitario: item.precio_unitario }
              : i
          ),
        };
      }
      return { carrito: [...state.carrito, item] };
    });
  },

  actualizarItemCarrito: (productoId, changes) => {
    set((state) => ({
      carrito: state.carrito.map((i) =>
        i.producto_id === productoId ? { ...i, ...changes } : i
      ),
    }));
  },

  quitarDelCarrito: (productoId) => {
    set((state) => ({
      carrito: state.carrito.filter((i) => i.producto_id !== productoId),
    }));
  },

  vaciarCarrito: () => set({ carrito: [] }),

  confirmarCompra: async (cabecera) => {
    const { carrito } = get();
    if (carrito.length === 0) {
      set({ error: 'El carrito está vacío' });
      return null;
    }

    set({ loading: true, error: null });

    const detalles = carrito.map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }));

    const { data, error } = await comprasRepository.registrarCompra(cabecera, detalles);

    if (data) {
      set((state) => ({
        compras: [data, ...state.compras],
        carrito: [],
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }

    return data;
  },

  limpiarError: () => set({ error: null }),
}));
