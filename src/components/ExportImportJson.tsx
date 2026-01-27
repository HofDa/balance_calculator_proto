// src/components/ExportImportJson.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useModelStore } from '@/store/modelStore';
import type { Module } from '@/engine/types';

type PresetBundle = {
  schemaVersion: 'footprint-model-v1';
  exportedAt: string; // ISO
  note?: string;
  modules: Module[];
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeParseJson(
  text: string
): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Invalid JSON' };
  }
}

function isPresetBundle(x: any): x is PresetBundle {
  return (
    x &&
    x.schemaVersion === 'footprint-model-v1' &&
    typeof x.exportedAt === 'string' &&
    Array.isArray(x.modules)
  );
}

function basicValidateModules(modules: any): modules is Module[] {
  if (!Array.isArray(modules)) return false;

  for (const m of modules) {
    if (!m || typeof m.id !== 'string' || typeof m.label !== 'string')
      return false;
    if (!Array.isArray(m.factors)) return false;

    for (const f of m.factors) {
      if (!f || typeof f.id !== 'string' || typeof f.label !== 'string')
        return false;
      if (typeof f.weight !== 'number' || Number.isNaN(f.weight)) return false;
      if (typeof f.converterId !== 'string') return false;

      // input minimal check
      if (!f.input || typeof f.input.type !== 'string') return false;
      if (f.input.type === 'number') {
        if (typeof f.input.value !== 'number' || Number.isNaN(f.input.value))
          return false;
        if (typeof f.input.unit !== 'string') return false;
      }

      // converterConfig optional, but if present must be sensible for linear_coeff
      if (f.converterId === 'linear_coeff' && f.converterConfig) {
        if (
          typeof f.converterConfig.k_co2 !== 'number' ||
          Number.isNaN(f.converterConfig.k_co2)
        )
          return false;
        if (
          typeof f.converterConfig.k_land !== 'number' ||
          Number.isNaN(f.converterConfig.k_land)
        )
          return false;

        // k_water is new (v1.1): allow missing, but if present must be numeric
        if (
          'k_water' in f.converterConfig &&
          (typeof f.converterConfig.k_water !== 'number' ||
            Number.isNaN(f.converterConfig.k_water))
        )
          return false;
      }
    }
  }

  return true;
}

function mergeById(existing: Module[], incoming: Module[]): Module[] {
  const byId = new Map<string, Module>();
  for (const m of existing) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m); // incoming overwrites
  return Array.from(byId.values());
}

function normalizeWater(mods: Module[]): Module[] {
  return mods.map((m) => ({
    ...m,
    factors: (m.factors ?? []).map((f: any) => {
      if (f?.converterId !== 'linear_coeff') return f;
      const cfg = f.converterConfig ?? {};
      return {
        ...f,
        converterConfig: {
          ...cfg,
          k_co2: cfg.k_co2 ?? 0,
          k_land: cfg.k_land ?? 0,
          k_water: cfg.k_water ?? 0,
        },
      };
    }),
  }));
}

export function ExportImportJson() {
  const modules = useModelStore((s) => s.modules);
  const replaceAllModules = useModelStore((s) => s.replaceAllModules);
  const clearModules = useModelStore((s) => s.clearModules);

  const [note, setNote] = useState('');
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [error, setError] = useState<string | null>(null);

  const presetPreview = useMemo(() => {
    const bundle: PresetBundle = {
      schemaVersion: 'footprint-model-v1',
      exportedAt: new Date().toISOString(),
      note: note.trim() ? note.trim() : undefined,
      modules,
    };
    return bundle;
  }, [modules, note]);

  function handleExport() {
    const bundle = presetPreview;
    const filename = `footprint-preset_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '-')}.json`;
    downloadJson(filename, bundle);
  }

  function handleFileUpload(file: File) {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ''));
    reader.onerror = () => setError('Konnte Datei nicht lesen.');
    reader.readAsText(file);
  }

  function handleImport() {
    setError(null);

    const parsed = safeParseJson(importText);
    if (!parsed.ok) {
      setError(`JSON-Parsefehler: ${parsed.error}`);
      return;
    }

    const payload = parsed.value;

    // Accept 2 formats:
    // 1) PresetBundle (preferred)
    // 2) Module[] (simple)
    let incomingModules: Module[] | null = null;

    if (isPresetBundle(payload)) {
      incomingModules = payload.modules;
    } else if (Array.isArray(payload)) {
      incomingModules = payload as Module[];
    }

    if (!incomingModules) {
      setError(
        'Unbekanntes Format. Erwartet: PresetBundle (schemaVersion/exportedAt/modules) oder direkt Module[].'
      );
      return;
    }

    if (!basicValidateModules(incomingModules)) {
      setError(
        'Import enthält ungültige Module/Faktoren (Basis-Validierung fehlgeschlagen).'
      );
      return;
    }

    // Backwards compatibility: ensure new k_water is present
    incomingModules = normalizeWater(incomingModules);

    const next =
      importMode === 'replace'
        ? incomingModules
        : normalizeWater(mergeById(modules, incomingModules));

    replaceAllModules(next);
    setImportText('');
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">
            Preset Export / Import (JSON)
          </div>
          <div className="text-sm text-muted-foreground">
            Alles ist „custom“: Export/Import arbeitet mit allen Modulen.
          </div>
        </div>
        <Button variant="secondary" onClick={clearModules}>
          Clear
        </Button>
      </div>

      {/* EXPORT */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Preset-Notiz (optional)
        </div>
        <input
          className="w-full rounded-md border bg-background p-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z.B. 'Preset v0.2 – neue Koeffizienten Ernährung'"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleExport}>Export JSON</Button>
          <div className="text-sm text-muted-foreground">
            Exportiert ein Bundle mit{' '}
            <span className="font-mono">schemaVersion</span>.
          </div>
        </div>
      </div>

      {/* IMPORT */}
      <div className="border-t pt-4 space-y-3">
        <div className="text-sm font-medium">Import</div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground">Modus:</label>
          <select
            className="rounded-md border bg-background p-2 text-sm"
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as any)}
          >
            <option value="replace">Replace (Preset ersetzen)</option>
            <option value="merge">Merge (nach Modul-id zusammenführen)</option>
          </select>

          <input
            className="text-sm"
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
        </div>

        <textarea
          className="w-full min-h-[180px] rounded-md border bg-background p-2 text-sm font-mono"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Preset JSON hier einfügen oder Datei auswählen…"
        />

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={!importText.trim()}>
            Import anwenden
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Unterstützt: PresetBundle (
          <span className="font-mono">schemaVersion=footprint-model-v1</span>)
          oder direkt <span className="font-mono">Module[]</span>.
        </div>
      </div>

      {/* PREVIEW (optional nerd candy) */}
      <div className="border-t pt-4 space-y-2">
        <div className="text-sm font-medium">Export-Vorschau</div>
        <pre className="max-h-[200px] overflow-auto rounded-md border bg-background p-2 text-xs">
          {JSON.stringify(presetPreview, null, 2)}
        </pre>
      </div>
    </Card>
  );
}
