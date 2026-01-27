import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useModelStore } from '@/store/modelStore';
import type { Module, Factor } from '@/engine/types';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

type DraftFactor = {
  label: string;
  unit: string;
  value: number;
  weight: number;
  k_co2: number;
  k_land: number;
  k_water: number;
  note?: string;
};

export function AddModuleDialog() {
  const addModule = useModelStore((s) => s.addModule);

  const [open, setOpen] = useState(false);
  const [moduleLabel, setModuleLabel] = useState('Neues Modul');
  const [moduleWeight, setModuleWeight] = useState(1);

  const [factors, setFactors] = useState<DraftFactor[]>([
    {
      label: 'Neuer Faktor',
      unit: 'unit/a',
      value: 0,
      weight: 1,
      k_co2: 0,
      k_land: 0,
      k_water: 0,
    },
  ]);

  function addFactor() {
    setFactors((fs) => [
      ...fs,
      {
        label: 'Neuer Faktor',
        unit: 'unit/a',
        value: 0,
        weight: 1,
        k_co2: 0,
        k_land: 0,
        k_water: 0,
      },
    ]);
  }

  function save() {
    const moduleId = uid('custom');

    const builtFactors: Factor[] = factors.map((f) => ({
      id: uid('factor'),
      label: f.label.trim() || 'Faktor',
      input: { type: 'number', value: f.value, unit: f.unit || 'unit/a' },
      weight: clamp01(f.weight),
      converterId: 'linear_coeff',
      converterConfig: {
        k_co2: f.k_co2,
        k_land: f.k_land,
        k_water: f.k_water,
        note: f.note,
      },
    }));

    const mod: Module = {
      id: moduleId,
      label: moduleLabel.trim() || 'Custom Modul',
      weight: moduleWeight,
      factors: builtFactors,
    };

    addModule(mod);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Modul hinzufügen</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom Modul erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Modulname</div>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={moduleLabel}
                onChange={(e) => setModuleLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Modulgewicht:{' '}
                <span className="font-mono">{moduleWeight.toFixed(2)}</span>
              </div>
              <Slider
                value={[moduleWeight]}
                min={0}
                max={2}
                step={0.01}
                onValueChange={(v) => setModuleWeight(v[0])}
              />
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <div className="font-medium">Faktoren</div>
            <Button variant="secondary" onClick={addFactor}>
              + Faktor
            </Button>
          </div>

          <div className="space-y-3">
            {factors.map((f, idx) => (
              <Card key={idx} className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Label</div>
                    <input
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      value={f.label}
                      onChange={(e) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx ? { ...x, label: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Einheit</div>
                    <input
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      value={f.unit}
                      onChange={(e) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx ? { ...x, unit: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Default Wert
                    </div>
                    <input
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      type="number"
                      value={f.value}
                      onChange={(e) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx
                              ? { ...x, value: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Gewicht:{' '}
                      <span className="font-mono">
                        {clamp01(f.weight).toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[f.weight]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(v) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx ? { ...x, weight: v[0] } : x
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      k_co2 (kg CO₂e pro Einheit)
                    </div>
                    <input
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      type="number"
                      value={f.k_co2}
                      onChange={(e) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx
                              ? { ...x, k_co2: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      k_water (L Wasser pro Einheit)
                    </div>
                    <input
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      type="number"
                      value={f.k_water}
                      onChange={(e) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx
                              ? { ...x, k_water: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      k_land (m²·a pro Einheit)
                    </div>
                    <input
                      className="w-full rounded-md border bg-background p-2 text-sm"
                      type="number"
                      value={f.k_land}
                      onChange={(e) =>
                        setFactors((fs) =>
                          fs.map((x, i) =>
                            i === idx
                              ? { ...x, k_land: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">
                    Notiz (Quelle/Annahme)
                  </div>
                  <input
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={f.note ?? ''}
                    onChange={(e) =>
                      setFactors((fs) =>
                        fs.map((x, i) =>
                          i === idx ? { ...x, note: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={save}>Speichern</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
