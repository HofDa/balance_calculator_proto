// src/components/ModuleCard.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Module } from '@/engine/types';
import { FactorRow } from './FactorRow';
import { calcModule } from '@/engine/calcModule';
import { TraceAccordion } from './TraceAccordion';
import { useModelStore } from '@/store/modelStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatWaterPerYear } from '@/lib/utils';

export function ModuleCard({ module }: { module: Module }) {
  const result = calcModule(module);

  const addFactor = useModelStore((s) => s.addFactor);
  const removeModule = useModelStore((s) => s.removeModule);
  const updateModule = useModelStore((s) => s.updateModule);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <input
            className="w-full max-w-[360px] rounded-md border bg-background p-2 text-sm font-semibold"
            value={module.label}
            onChange={(e) => updateModule(module.id, { label: e.target.value })}
          />

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Modulgewicht</span>
            <input
              className="w-28 rounded-md border bg-background p-2 text-sm"
              type="number"
              value={module.weight ?? 1}
              onChange={(e) =>
                updateModule(module.id, { weight: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="text-right text-sm">
          <div className="font-mono">
            {result.impact.co2e_kg.toFixed(1)} kg CO₂e/a
          </div>
          <div className="font-mono text-muted-foreground">
            {(() => {
              const w = formatWaterPerYear(result.impact.water_l);
              return (
                <>
                  {w.primary}
                  <span className="ml-2 text-xs">({w.secondary})</span>
                </>
              );
            })()}
          </div>
          <div className="font-mono text-muted-foreground">
            {result.impact.land_m2a.toFixed(1)} m²·a/a
          </div>

          <div className="mt-3 flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => addFactor(module.id)}
              title="Faktor hinzufügen"
            >
              + Faktor
            </Button>

            <ConfirmDialog
              title="Modul löschen?"
              description={`Das Modul „${module.label}“ und alle enthaltenen Faktoren werden dauerhaft entfernt. Die Berechnung ändert sich sofort.`}
              confirmLabel="Modul löschen"
              onConfirm={() => removeModule(module.id)}
              trigger={
                <Button variant="destructive" title="Modul löschen">
                  – Modul
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {module.factors.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Keine Faktoren. Klicke „+ Faktor“.
          </div>
        ) : (
          module.factors.map((f) => (
            <div key={f.id} className="flex items-start gap-2">
              <div className="flex-1">
                <FactorRow moduleId={module.id} factor={f} />
              </div>
              <FactorRemoveButton
                moduleLabel={module.label}
                moduleId={module.id}
                factorLabel={f.label}
                factorId={f.id}
              />
            </div>
          ))
        )}
      </div>

      <TraceAccordion trace={result.trace} />
    </Card>
  );
}

function FactorRemoveButton({
  moduleLabel,
  moduleId,
  factorLabel,
  factorId,
}: {
  moduleLabel: string;
  moduleId: string;
  factorLabel: string;
  factorId: string;
}) {
  const removeFactor = useModelStore((s) => s.removeFactor);

  return (
    <ConfirmDialog
      title="Faktor löschen?"
      description={`Der Faktor „${factorLabel}“ (Modul „${moduleLabel}“) wird dauerhaft entfernt. Die Berechnung ändert sich sofort.`}
      confirmLabel="Faktor löschen"
      onConfirm={() => removeFactor(moduleId, factorId)}
      trigger={
        <Button variant="destructive" className="mt-1" title="Faktor löschen">
          – Faktor
        </Button>
      }
    />
  );
}
