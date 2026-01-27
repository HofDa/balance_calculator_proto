// src/store/modelStore.ts
import { create } from 'zustand';
import type { Module, Factor } from '@/engine/types';
import { loadModules, saveModules } from '@/store/persist';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function hashModules(modules: Module[]) {
  // v1: stabil genug; Reihenfolge bleibt im UI konstant
  return JSON.stringify(modules);
}

const initialModules = loadModules() ?? [];
const initialBaseline = hashModules(initialModules);

type ModelState = {
  modules: Module[];

  // Dirty tracking
  baselineHash: string;
  dirty: boolean;
  markClean: () => void;

  // Module CRUD
  setModules: (modules: Module[]) => void;
  addModule: (module: Module) => void;
  removeModule: (moduleId: string) => void;
  updateModule: (
    moduleId: string,
    patch: Partial<Omit<Module, 'factors'>>
  ) => void;

  // Factor CRUD
  addFactor: (moduleId: string, factor?: Partial<Factor>) => void;
  removeFactor: (moduleId: string, factorId: string) => void;
  updateFactor: (
    moduleId: string,
    factorId: string,
    patch: Partial<Factor>
  ) => void;

  // Bulk
  replaceAllModules: (modules: Module[]) => void; // Load -> clean
  clearModules: () => void; // dirty stays true (unless baseline is empty)
};

export const useModelStore = create<ModelState>((set, get) => ({
  modules: initialModules,

  baselineHash: initialBaseline,
  dirty: false,

  markClean: () => {
    const current = hashModules(get().modules);
    set({ baselineHash: current, dirty: false });
  },

  setModules: (modules) => {
    const baselineHash = get().baselineHash;
    const dirty = hashModules(modules) !== baselineHash;
    set({ modules, dirty });
    saveModules(modules);
  },

  addModule: (module) => {
    const next = [...get().modules, module];
    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },

  removeModule: (moduleId) => {
    const next = get().modules.filter((m) => m.id !== moduleId);
    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },

  updateModule: (moduleId, patch) => {
    const next = get().modules.map((m) =>
      m.id === moduleId ? { ...m, ...patch } : m
    );
    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },

  addFactor: (moduleId, factor) => {
    const next = get().modules.map((m) => {
      if (m.id !== moduleId) return m;

      const newFactor: Factor = {
        id: uid('factor'),
        label: factor?.label ?? 'Neuer Faktor',
        helpText: factor?.helpText,
        input: factor?.input ?? { type: 'number', value: 0, unit: 'unit/a' },
        weight: factor?.weight ?? 1,
        converterId: factor?.converterId ?? 'linear_coeff',
        converterConfig: factor?.converterConfig ?? {
          k_co2: 0,
          k_land: 0,
          k_water: 0,
          note: 'user-defined',
        },
      };

      return { ...m, factors: [...m.factors, newFactor] };
    });

    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },

  removeFactor: (moduleId, factorId) => {
    const next = get().modules.map((m) => {
      if (m.id !== moduleId) return m;
      return { ...m, factors: m.factors.filter((f) => f.id !== factorId) };
    });

    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },

  updateFactor: (moduleId, factorId, patch) => {
    const next = get().modules.map((m) => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        factors: m.factors.map((f) =>
          f.id === factorId ? { ...f, ...patch } : f
        ),
      };
    });

    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },

  replaceAllModules: (modules) => {
    // Load/Import: baseline wird neu gesetzt -> clean
    const nextHash = hashModules(modules);
    set({ modules, baselineHash: nextHash, dirty: false });
    saveModules(modules);
  },

  clearModules: () => {
    const next: Module[] = [];
    const baselineHash = get().baselineHash;
    const dirty = hashModules(next) !== baselineHash;
    set({ modules: next, dirty });
    saveModules(next);
  },
}));
