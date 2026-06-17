import { create } from 'zustand';
import {
  configuracionRepository,
  type ConfiguracionClave,
} from '../database/repositories/configuracion.repository';

interface ConfiguracionState {
  config: Record<string, string>;
  loaded: boolean;

  cargar: () => Promise<void>;
  get: (clave: ConfiguracionClave) => string;
  getNumero: (clave: ConfiguracionClave, fallback?: number) => number;
  set: (clave: ConfiguracionClave, valor: string) => Promise<void>;
}

export const useConfiguracionStore = create<ConfiguracionState>((set, get) => ({
  config: {},
  loaded: false,

  cargar: async () => {
    const config = await configuracionRepository.getAll();
    set({ config, loaded: true });
  },

  get: (clave) => {
    return get().config[clave] ?? '';
  },

  getNumero: (clave, fallback = 0) => {
    const valor = get().config[clave];
    const num = parseFloat(valor ?? '');
    return isNaN(num) ? fallback : num;
  },

  set: async (clave, valor) => {
    await configuracionRepository.set(clave, valor);
    set((state) => ({ config: { ...state.config, [clave]: valor } }));
  },
}));
