// src/app/useAutoLoadPreset.ts
import { useEffect, useRef } from 'react';
import { usePresetStore } from '@/store/presetStore';
import { useModelStore } from '@/store/modelStore';

export function useAutoLoadPreset() {
  const ran = useRef(false);

  const activePresetId = usePresetStore((s) => s.activePresetId);
  const presets = usePresetStore((s) => s.presets);
  const replaceAllModules = useModelStore((s) => s.replaceAllModules);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!activePresetId) return;

    const preset = presets.find((p) => p.id === activePresetId);
    if (!preset) return;

    replaceAllModules(preset.modules);
  }, [activePresetId, presets, replaceAllModules]);
}
