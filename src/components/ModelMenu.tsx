// src/components/ModelMenu.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

import { useModelStore } from '@/store/modelStore';
import { usePresetStore } from '@/store/presetStore';
import type { Module } from '@/engine/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// ---- JSON helpers
type PresetBundle = {
  schemaVersion: 'footprint-model-v1';
  exportedAt: string;
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

function safeParse(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? 'Invalid JSON' };
  }
}

function isBundle(x: any): x is PresetBundle {
  return (
    x &&
    x.schemaVersion === 'footprint-model-v1' &&
    typeof x.exportedAt === 'string' &&
    Array.isArray(x.modules)
  );
}

export function ModelMenu() {
  // model state
  const modules = useModelStore((s) => s.modules);
  const replaceAllModules = useModelStore((s) => s.replaceAllModules);
  const clearModules = useModelStore((s) => s.clearModules);
  const dirty = useModelStore((s) => s.dirty);
  const markClean = useModelStore((s) => s.markClean);

  // presets
  const presets = usePresetStore((s) => s.presets);
  const activePresetId = usePresetStore((s) => s.activePresetId);
  const setActivePresetId = usePresetStore((s) => s.setActivePresetId);
  const addPreset = usePresetStore((s) => s.addPreset);
  const updatePreset = usePresetStore((s) => s.updatePreset);
  const deletePreset = usePresetStore((s) => s.deletePreset);
  const duplicatePreset = usePresetStore((s) => s.duplicatePreset);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? null,
    [presets, activePresetId]
  );

  // UI state
  const [saveAsName, setSaveAsName] = useState('');
  const [note, setNote] = useState('');
  const [importText, setImportText] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // NEW: selection is separate from active
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // dirty guards
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const [pendingImportModules, setPendingImportModules] = useState<
    Module[] | null
  >(null);

  function loadPresetNow(id: string) {
    setErr(null);
    const p = presets.find((x) => x.id === id);
    if (!p) {
      setErr('Preset nicht gefunden.');
      return;
    }

    replaceAllModules(p.modules);
    setActivePresetId(id);
    setSelectedPresetId(id);
  }

  function requestLoadPreset() {
    setErr(null);

    const id = selectedPresetId || '';
    if (!id) {
      setErr('Bitte ein Preset auswählen.');
      return;
    }

    const p = presets.find((x) => x.id === id);
    if (!p) {
      setErr('Preset nicht gefunden.');
      return;
    }

    if (dirty) {
      setPendingPresetId(id);
      return;
    }

    loadPresetNow(id);
  }

  function saveToActive() {
    setErr(null);
    if (!activePresetId) {
      setErr('Kein Preset aktiv. Nutze „Speichern als…“.');
      return;
    }
    updatePreset(activePresetId, {
      modules,
      note: note.trim() || activePreset?.note,
    });
    markClean();
  }

  function saveAsNew() {
    setErr(null);
    const name = saveAsName.trim();
    if (!name) {
      setErr('Bitte einen Namen für „Speichern als…“ eingeben.');
      return;
    }
    const id = addPreset({ name, note: note.trim() || undefined, modules });
    setActivePresetId(id);
    setSelectedPresetId(id);
    setSaveAsName('');
    markClean();
  }

  function doDuplicate() {
    setErr(null);
    if (!activePresetId) return;
    const newId = duplicatePreset(activePresetId);
    if (newId) {
      setActivePresetId(newId);
      setSelectedPresetId(newId);
    }
  }

  function doDeletePreset() {
    setErr(null);
    if (!activePresetId) return;
    deletePreset(activePresetId);
    setSelectedPresetId('');
  }

  function exportJson() {
    const bundle: PresetBundle = {
      schemaVersion: 'footprint-model-v1',
      exportedAt: new Date().toISOString(),
      note: note.trim() ? note.trim() : undefined,
      modules,
    };
    const filename = `footprint-model_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '-')}.json`;
    downloadJson(filename, bundle);
  }

  function importApply() {
    setErr(null);
    const parsed = safeParse(importText);
    if (!parsed.ok) {
      setErr(`JSON-Parsefehler: ${parsed.error}`);
      return;
    }

    const payload = parsed.value;
    let incoming: Module[] | null = null;
    if (isBundle(payload)) incoming = payload.modules;
    else if (Array.isArray(payload)) incoming = payload as Module[];

    if (!incoming) {
      setErr('Unbekanntes Format. Erwartet: Bundle oder Module[].');
      return;
    }

    if (dirty) {
      setPendingImportModules(incoming);
      return;
    }

    replaceAllModules(incoming);
    setImportText('');
    // Import setzt baseline in replaceAllModules -> clean
  }

  function importFromFile(file: File) {
    setErr(null);
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ''));
    reader.onerror = () => setErr('Konnte Datei nicht lesen.');
    reader.readAsText(file);
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        // beim Öffnen: Auswahl standardmäßig auf aktives Preset setzen (falls vorhanden)
        if (open) {
          setSelectedPresetId(activePresetId ?? '');
          setErr(null);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Model{dirty ? '*' : ''}</Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[380px] p-0">
        <div className="p-3 space-y-3">
          <DropdownMenuLabel className="p-0">Model / Presets</DropdownMenuLabel>

          {/* Preset selector + load button */}
          <Card className="p-3 space-y-2">
            <div className="text-sm text-muted-foreground">
              Preset auswählen
            </div>

            <div className="flex items-center gap-2">
              <select
                className="flex-1 rounded-md border bg-background p-2 text-sm"
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
              >
                <option value="">— auswählen —</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <Button onClick={requestLoadPreset} disabled={!selectedPresetId}>
                Laden
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Aktiv:{' '}
              <span className="font-mono">
                {activePreset ? activePreset.name : '— (unsaved model)'}
              </span>{' '}
              {dirty ? (
                <span className="text-destructive">• ungespeichert</span>
              ) : null}
            </div>
          </Card>

          {/* Save */}
          <Card className="p-3 space-y-2">
            <div className="text-sm font-medium">Speichern</div>

            <div className="grid gap-2">
              <Button onClick={saveToActive} disabled={!activePresetId}>
                In aktives Preset speichern
              </Button>

              <div className="text-sm text-muted-foreground">
                Speichern als…
              </div>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Preset-Name"
              />
              <Button onClick={saveAsNew}>Als neues Preset speichern</Button>

              <div className="text-sm text-muted-foreground">
                Notiz (optional)
              </div>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="z.B. 'v0.3 – neue Koeffizienten'"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={doDuplicate}
                disabled={!activePresetId}
              >
                Duplizieren
              </Button>

              <ConfirmDialog
                title="Preset löschen?"
                description={
                  activePreset
                    ? `Preset „${activePreset.name}“ wird dauerhaft gelöscht.`
                    : 'Kein Preset ausgewählt.'
                }
                confirmLabel="Preset löschen"
                onConfirm={doDeletePreset}
                trigger={
                  <Button variant="destructive" disabled={!activePresetId}>
                    Löschen
                  </Button>
                }
              />
            </div>
          </Card>

          <DropdownMenuSeparator />

          {/* Import / Export */}
          <Card className="p-3 space-y-2">
            <div className="text-sm font-medium">Import / Export</div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportJson}>
                Export JSON
              </Button>

              <label className="flex-1">
                <input
                  className="hidden"
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importFromFile(f);
                  }}
                />
                <Button variant="secondary" className="w-full" asChild>
                  <span>Import Datei</span>
                </Button>
              </label>
            </div>

            <textarea
              className="w-full min-h-[120px] rounded-md border bg-background p-2 text-xs font-mono"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="JSON hier einfügen (Bundle oder Module[])…"
            />

            <div className="flex justify-end">
              <Button onClick={importApply} disabled={!importText.trim()}>
                Import anwenden
              </Button>
            </div>
          </Card>

          <DropdownMenuSeparator />

          {/* Clear */}
          <Card className="p-3 space-y-2">
            <div className="text-sm font-medium">Reset</div>
            <ConfirmDialog
              title="Model leeren?"
              description="Alle Module und Faktoren werden entfernt. (Presets bleiben gespeichert.)"
              confirmLabel="Leeren"
              onConfirm={clearModules}
              trigger={<Button variant="destructive">Clear Model</Button>}
            />
          </Card>

          {err ? (
            <div className="px-1 pb-2 text-sm text-red-600">{err}</div>
          ) : null}
        </div>

        {/* Dirty confirm: preset load */}
        <AlertDialog
          open={pendingPresetId !== null}
          onOpenChange={(open) => {
            if (!open) setPendingPresetId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
              <AlertDialogDescription>
                Das Laden eines Presets überschreibt dein aktuelles Modell.
                Nicht gespeicherte Änderungen gehen verloren.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const id = pendingPresetId;
                  setPendingPresetId(null);
                  if (!id) return;
                  loadPresetNow(id);
                }}
              >
                Trotzdem laden
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dirty confirm: import */}
        <AlertDialog
          open={pendingImportModules !== null}
          onOpenChange={(open) => {
            if (!open) setPendingImportModules(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
              <AlertDialogDescription>
                Der Import überschreibt dein aktuelles Modell. Nicht
                gespeicherte Änderungen gehen verloren.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const mods = pendingImportModules;
                  setPendingImportModules(null);
                  if (!mods) return;

                  replaceAllModules(mods);
                  setImportText('');
                }}
              >
                Trotzdem importieren
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
