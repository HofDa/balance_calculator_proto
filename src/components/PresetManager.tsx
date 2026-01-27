import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useModelStore } from '@/store/modelStore';
import { usePresetStore } from '@/store/presetStore';

export function PresetManager() {
  const modules = useModelStore((s) => s.modules);
  const replaceAllModules = useModelStore((s) => s.replaceAllModules);

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

  const [newName, setNewName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function loadSelected(id: string) {
    setError(null);
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    replaceAllModules(p.modules);
    setActivePresetId(id);
  }

  function saveAsNew() {
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError('Bitte einen Namen vergeben.');
      return;
    }
    const id = addPreset({ name, note: note.trim() || undefined, modules });
    setActivePresetId(id);
    setNewName('');
    setNote('');
  }

  function saveToActive() {
    setError(null);
    if (!activePresetId) {
      setError('Kein Preset ausgewählt. Nutze „Als neues Model speichern“.');
      return;
    }
    updatePreset(activePresetId, {
      modules,
      note: note.trim() || activePreset?.note,
    });
  }

  function doDelete() {
    setError(null);
    if (!activePresetId) return;
    deletePreset(activePresetId);
  }

  function doDuplicate() {
    setError(null);
    if (!activePresetId) return;
    const newId = duplicatePreset(activePresetId);
    if (newId) setActivePresetId(newId);
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Model speichern / laden</div>
          <div className="text-sm text-muted-foreground">
            Presets sind lokal gespeichert (Browser).
          </div>
        </div>
      </div>

      {/* Dropdown */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Gespeicherte Modelle
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="min-w-[260px] rounded-md border bg-background p-2 text-sm"
            value={activePresetId ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                setActivePresetId(null);
                return;
              }
              loadSelected(id);
            }}
          >
            <option value="">— auswählen —</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            onClick={doDuplicate}
            disabled={!activePresetId}
          >
            Duplizieren
          </Button>
          <Button
            variant="secondary"
            onClick={doDelete}
            disabled={!activePresetId}
          >
            Löschen
          </Button>
        </div>

        {activePreset ? (
          <div className="text-xs text-muted-foreground">
            Aktiv: <span className="font-mono">{activePreset.name}</span> ·
            gespeichert{' '}
            <span className="font-mono">{activePreset.savedAt}</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Kein Preset aktiv. Du arbeitest gerade an einem „unsaved model“.
          </div>
        )}
      </div>

      {/* Save controls */}
      <div className="border-t pt-4 space-y-3">
        <div className="text-sm font-medium">Speichern</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-muted-foreground">
              Neuer Name (für „Speichern als…“)
            </div>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. 'Preset v0.3 – Ernährung Fokus'"
            />
          </div>

          <div>
            <div className="text-sm text-muted-foreground">
              Notiz (optional)
            </div>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. 'k_co2 aus Quelle X (placeholder)'"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={saveToActive}
            disabled={!activePresetId}
          >
            In aktives Model speichern
          </Button>
          <Button onClick={saveAsNew}>Als neues Model speichern</Button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </Card>
  );
}
