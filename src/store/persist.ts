// src/store/persist.ts
import type { Module, Factor } from '@/engine/types';

const KEY = 'footprint_preset_modules_v1';

export function loadModules(): Module[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Module[];

    // Backwards compatibility: older models may miss k_water
    return parsed.map((m) => ({
      ...m,
      factors: (m.factors ?? []).map((f: Factor) => {
        if (f.converterId !== 'linear_coeff') return f;
        const cfg = f.converterConfig ?? { k_co2: 0, k_land: 0, k_water: 0 };
        return {
          ...f,
          converterConfig: {
            k_co2: (cfg as any).k_co2 ?? 0,
            k_land: (cfg as any).k_land ?? 0,
            k_water: (cfg as any).k_water ?? 0,
            note: (cfg as any).note,
          },
        };
      }),
    }));
  } catch {
    return null;
  }
}

export function saveModules(modules: Module[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(modules));
  } catch {
    // ignore (private mode etc.)
  }
}
