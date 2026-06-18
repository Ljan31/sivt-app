import { create } from 'zustand';
import { categoriasRepository } from '../database/repositories/categorias.repository';
import { unidadesMedidaRepository } from '../database/repositories/unidades.repository';
import type { Categoria, CategoriaInput, UnidadMedidaItem, UnidadMedidaInput } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────────────────────────────────────

interface CategoriasState {
  categorias: Categoria[];
  loading: boolean;
  error: string | null;

  cargar: () => Promise<void>;
  crear: (input: CategoriaInput) => Promise<Categoria | null>;
  actualizar: (id: number, changes: Partial<CategoriaInput>) => Promise<Categoria | null>;
  eliminar: (id: number) => Promise<boolean>;
  // Solo los nombres — útil para selectors
  getNombres: () => string[];
  limpiarError: () => void;
}

export const useCategoriasStore = create<CategoriasState>((set, get) => ({
  categorias: [],
  loading: false,
  error: null,

  cargar: async () => {
    set({ loading: true, error: null });
    const { data, error } = await categoriasRepository.findAll();
    set({ categorias: data, loading: false, error });
  },

  crear: async (input) => {
    set({ loading: true, error: null });
    const { data, error } = await categoriasRepository.insert(input);
    if (data) {
      set((s) => ({ categorias: [...s.categorias, data], loading: false }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  actualizar: async (id, changes) => {
    set({ loading: true, error: null });
    const { data, error } = await categoriasRepository.update(id, changes);
    if (data) {
      set((s) => ({
        categorias: s.categorias.map((c) => (c.id === id ? data : c)),
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  eliminar: async (id) => {
    set({ loading: true, error: null });
    const { data: ok, error } = await categoriasRepository.eliminarConReasignacion(id);
    if (ok) {
      set((s) => ({ categorias: s.categorias.filter((c) => c.id !== id), loading: false }));
    } else {
      set({ loading: false, error });
    }
    return !!ok;
  },

  getNombres: () => get().categorias.map((c) => c.nombre),

  limpiarError: () => set({ error: null }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Unidades de Medida
// ─────────────────────────────────────────────────────────────────────────────

interface UnidadesState {
  unidades: UnidadMedidaItem[];
  loading: boolean;
  error: string | null;

  cargar: () => Promise<void>;
  crear: (input: UnidadMedidaInput) => Promise<UnidadMedidaItem | null>;
  actualizar: (id: number, changes: Partial<UnidadMedidaInput>) => Promise<UnidadMedidaItem | null>;
  eliminar: (id: number) => Promise<boolean>;
  getNombres: () => string[];
  limpiarError: () => void;
}

export const useUnidadesStore = create<UnidadesState>((set, get) => ({
  unidades: [],
  loading: false,
  error: null,

  cargar: async () => {
    set({ loading: true, error: null });
    const { data, error } = await unidadesMedidaRepository.findAll();
    set({ unidades: data, loading: false, error });
  },

  crear: async (input) => {
    set({ loading: true, error: null });
    const { data, error } = await unidadesMedidaRepository.insert(input);
    if (data) {
      set((s) => ({ unidades: [...s.unidades, data], loading: false }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  actualizar: async (id, changes) => {
    set({ loading: true, error: null });
    const { data, error } = await unidadesMedidaRepository.update(id, changes);
    if (data) {
      set((s) => ({
        unidades: s.unidades.map((u) => (u.id === id ? data : u)),
        loading: false,
      }));
    } else {
      set({ loading: false, error });
    }
    return data;
  },

  eliminar: async (id) => {
    set({ loading: true, error: null });
    const { data: ok, error } = await unidadesMedidaRepository.eliminarSiSinUso(id);
    if (ok) {
      set((s) => ({ unidades: s.unidades.filter((u) => u.id !== id), loading: false }));
    } else {
      set({ loading: false, error });
    }
    return !!ok;
  },

  getNombres: () => get().unidades.map((u) => u.nombre),

  limpiarError: () => set({ error: null }),
}));
