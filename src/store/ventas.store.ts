import { create } from 'zustand';
import { ventasRepository } from '../database/repositories/ventas.repository';
import type { Producto, VentaConDetalles } from '../types';

export interface ItemCarritoVenta {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  stock_disponible: number;
}

interface VentasState {
  ventas: VentaConDetalles[];
  carrito: ItemCarritoVenta[];
  loading: boolean;
  error: string | null;

  // Historial
  cargarVentas: () => Promise<void>;
  getResumen: (desde: string, hasta: string) => Promise<{ totalVentas: number; cantidadVentas: number }>;

  // Carrito de venta (punto de venta)
  agregarAlCarrito: (producto: Producto) => void;
  actualizarCantidad: (productoId: number, cantidad: number) => void;
  quitarDelCarrito: (productoId: number) => void;
  vaciarCarrito: () => void;
  getTotalCarrito: () => number;

  // Confirmar venta
  confirmarVenta: () => Promise<VentaConDetalles | null>;

  limpiarError: () => void;
}

export const useVentasStore = create<VentasState>((set, get) => ({
  ventas: [],
  carrito: [],
  loading: false,
  error: null,

  cargarVentas: async () => {
    set({ loading: true, error: null });
    const { data, error } = await ventasRepository.findAllConDetalles();
    set({ ventas: data, loading: false, error });
  },

  getResumen: (desde, hasta) => {
    return ventasRepository.getResumen(desde, hasta);
  },

  agregarAlCarrito: (producto) => {
    set((state) => {
      const existe = state.carrito.find((i) => i.producto_id === producto.id);
      if (existe) {
        // Incrementar cantidad si no supera el stock
        if (existe.cantidad >= producto.stock) return state;
        return {
          carrito: state.carrito.map((i) =>
            i.producto_id === producto.id
              ? { ...i, cantidad: i.cantidad + 1 }
              : i
          ),
        };
      }
      if (producto.stock <= 0) return state;
      return {
        carrito: [
          ...state.carrito,
          {
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            cantidad: 1,
            precio_unitario: producto.precio_venta,
            stock_disponible: producto.stock,
          },
        ],
      };
    });
  },

  actualizarCantidad: (productoId, cantidad) => {
    set((state) => ({
      carrito: state.carrito
        .map((i) =>
          i.producto_id === productoId
            ? { ...i, cantidad: Math.min(cantidad, i.stock_disponible) }
            : i
        )
        .filter((i) => i.cantidad > 0),
    }));
  },

  quitarDelCarrito: (productoId) => {
    set((state) => ({
      carrito: state.carrito.filter((i) => i.producto_id !== productoId),
    }));
  },

  vaciarCarrito: () => set({ carrito: [] }),

  getTotalCarrito: () => {
    return get().carrito.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario,
      0
    );
  },

  confirmarVenta: async () => {
    const { carrito } = get();
    if (carrito.length === 0) {
      set({ error: 'El carrito está vacío' });
      return null;
    }

    set({ loading: true, error: null });

    const fecha = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const items = carrito.map((i) => ({
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }));

    const { data, error } = await ventasRepository.registrarVenta(fecha, items);

    if (data) {
      set((state) => ({
        ventas: [data, ...state.ventas],
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
