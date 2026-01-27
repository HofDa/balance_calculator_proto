// src/store/presetStore.ts
import { create } from 'zustand';
import type { Module } from '@/engine/types';

export type Preset = {
  id: string;
  name: string;
  savedAt: string; // ISO
  note?: string;
  modules: Module[];
};

const PRESETS_KEY = 'footprint_presets_v1';
const ACTIVE_KEY = 'footprint_active_preset_id_v1';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Preset[]) : [];
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

function loadActivePresetId(): string | null {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    return v && v.trim().length ? v : null;
  } catch {
    return null;
  }
}

function saveActivePresetId(id: string | null) {
  try {
    if (!id) localStorage.removeItem(ACTIVE_KEY);
    else localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}

type PresetState = {
  presets: Preset[];
  activePresetId: string | null;

  setActivePresetId: (id: string | null) => void;

  addPreset: (p: Omit<Preset, 'id' | 'savedAt'>) => string;
  updatePreset: (id: string, patch: Partial<Omit<Preset, 'id'>>) => void;
  deletePreset: (id: string) => void;
  duplicatePreset: (id: string) => string | null;
};

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: loadPresets(),
  activePresetId: loadActivePresetId(),

  setActivePresetId: (id) => {
    set({ activePresetId: id });
    saveActivePresetId(id);
  },

  addPreset: (p) => {
    const id = uid('preset');
    const next: Preset = {
      id,
      name: p.name,
      note: p.note,
      modules: p.modules,
      savedAt: new Date().toISOString(),
    };
    const presets = [next, ...get().presets];
    set({ presets });
    savePresets(presets);
    return id;
  },

  updatePreset: (id, patch) => {
    const presets = get().presets.map((p) =>
      p.id === id ? { ...p, ...patch, savedAt: new Date().toISOString() } : p
    );
    set({ presets });
    savePresets(presets);
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((p) => p.id !== id);
    const active = get().activePresetId === id ? null : get().activePresetId;
    set({ presets, activePresetId: active });
    savePresets(presets);
    saveActivePresetId(active);
  },

  duplicatePreset: (id) => {
    const src = get().presets.find((p) => p.id === id);
    if (!src) return null;
    const newId = uid('preset');
    const copy: Preset = {
      ...src,
      id: newId,
      name: `${src.name} (Kopie)`,
      savedAt: new Date().toISOString(),
    };
    const presets = [copy, ...get().presets];
    set({ presets });
    savePresets(presets);
    return newId;
  },
}));
