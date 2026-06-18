import { create } from 'zustand';
import { productosRepository } from '../database/repositories/productos.repository';
import type { CategoriaProducto, Producto, ProductoInput } from '../types';

interface ProductosState {
  productos: Producto[];
  productoSeleccionado: Producto | null;
  loading: boolean;
  error: string | null;

  cargarProductos: () => Promise<void>;
  cargarPorCategoria: (categoria: CategoriaProducto) => Promise<void>;
  buscarProductos: (query: string) => Promise<void>;
  crearProducto: (input: ProductoInput) => Promise<Producto | null>;
  actualizarProducto: (id: number, changes: Partial<ProductoInput>) => Promise<Producto | null>;
  eliminarProducto: (id: number) => Promise<boolean>;
  seleccionarProducto: (producto: Producto | null) => void;

  // Precio de venta manual
  setPrecioVentaManual: (id: number, precio: number) => Promise<Producto | null>;
  restaurarPrecioVenta: (id: number) => Promise<Producto | null>;

  limpiarError: () => void;
}

export const useProductosStore = create<ProductosState>((set, get) => ({
  productos: [],
  productoSeleccionado: null,
  loading: false,
  error: null,

  cargarProductos: async () => {
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.findAll();
    set({ productos: data, loading: false, error });
  },

  cargarPorCategoria: async (categoria) => {
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.findByCategoria(categoria);
    set({ productos: data, loading: false, error });
  },

  buscarProductos: async (query) => {
    if (!query.trim()) return get().cargarProductos();
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.search(query);
    set({ productos: data, loading: false, error });
  },

  crearProducto: async (input) => {
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.insert(input);
    if (data) {
      set((state) => ({ productos: [...state.productos, data], loading: false }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  actualizarProducto: async (id, changes) => {
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.update(id, changes);
    if (data) {
      set((state) => ({
        productos: state.productos.map((p) => (p.id === id ? data : p)),
        productoSeleccionado: state.productoSeleccionado?.id === id ? data : state.productoSeleccionado,
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  eliminarProducto: async (id) => {
    set({ loading: true, error: null });
    const { data: ok, error } = await productosRepository.delete(id);
    if (ok) {
      set((state) => ({
        productos: state.productos.filter((p) => p.id !== id),
        productoSeleccionado: state.productoSeleccionado?.id === id ? null : state.productoSeleccionado,
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }
    return !!ok;
  },

  seleccionarProducto: (producto) => set({ productoSeleccionado: producto }),

  setPrecioVentaManual: async (id, precio) => {
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.setPrecioVentaManual(id, precio);
    if (data) {
      set((state) => ({
        productos: state.productos.map((p) => (p.id === id ? data : p)),
        productoSeleccionado: state.productoSeleccionado?.id === id ? data : state.productoSeleccionado,
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  restaurarPrecioVenta: async (id) => {
    set({ loading: true, error: null });
    const { data, error } = await productosRepository.restaurarPrecioVentaAutomatico(id);
    if (data) {
      set((state) => ({
        productos: state.productos.map((p) => (p.id === id ? data : p)),
        productoSeleccionado: state.productoSeleccionado?.id === id ? data : state.productoSeleccionado,
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  limpiarError: () => set({ error: null }),
}));
