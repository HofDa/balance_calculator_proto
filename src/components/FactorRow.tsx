// src/components/FactorRow.tsx
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

import { useModelStore } from '@/store/modelStore';
import { TraceAccordion } from './TraceAccordion';
import { calcFactor } from '@/engine/calcFactor';
import type { Factor, FactorInput, NumberInput } from '@/engine/types';
import { formatWaterPerYear } from '@/lib/utils';

/* ---------- Type Guards ---------- */
function isNumberInput(input: FactorInput): input is NumberInput {
  return input.type === 'number';
}

export function FactorRow({
  moduleId,
  factor,
}: {
  moduleId: string;
  factor: Factor;
}) {
  const updateFactor = useModelStore((s) => s.updateFactor);

  const input = factor.input;
  const isLinear = factor.converterId === 'linear_coeff';

  // echte (v0) Berechnung + Trace
  const result = calcFactor(factor, { year: 2025 });

  /* ---------- Setter (alle typensicher) ---------- */

  function setLabel(label: string) {
    updateFactor(moduleId, factor.id, { label });
  }

  function setValue(value: number) {
    if (!isNumberInput(input)) return;
    updateFactor(moduleId, factor.id, {
      input: { ...input, value },
    });
  }

  function setUnit(unit: string) {
    if (!isNumberInput(input)) return;
    updateFactor(moduleId, factor.id, {
      input: { ...input, unit },
    });
  }

  function setWeight(weight: number) {
    updateFactor(moduleId, factor.id, { weight });
  }

  function setConverterId(converterId: string) {
    updateFactor(moduleId, factor.id, { converterId });
  }

  function setKCo2(k_co2: number) {
    updateFactor(moduleId, factor.id, {
      converterConfig: {
        ...(factor.converterConfig ?? { k_co2: 0, k_land: 0, k_water: 0 }),
        k_co2,
      },
    });
  }

  function setKLand(k_land: number) {
    updateFactor(moduleId, factor.id, {
      converterConfig: {
        ...(factor.converterConfig ?? { k_co2: 0, k_land: 0, k_water: 0 }),
        k_land,
      },
    });
  }

  function setKWater(k_water: number) {
    updateFactor(moduleId, factor.id, {
      converterConfig: {
        ...(factor.converterConfig ?? { k_co2: 0, k_land: 0, k_water: 0 }),
        k_water,
      },
    });
  }

  function setNote(note: string) {
    updateFactor(moduleId, factor.id, {
      converterConfig: {
        ...(factor.converterConfig ?? { k_co2: 0, k_land: 0, k_water: 0 }),
        note,
      },
    });
  }

  const k_co2 = factor.converterConfig?.k_co2 ?? 0;
  const k_land = factor.converterConfig?.k_land ?? 0;
  const k_water = factor.converterConfig?.k_water ?? 0;
  const note = factor.converterConfig?.note ?? '';

  /* ---------- Render ---------- */

  return (
    <Card className="p-4 space-y-4">
      {/* Kopf */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="text-sm text-muted-foreground">Faktor</div>
          <input
            className="w-full rounded-md border bg-background p-2 text-sm font-medium"
            value={factor.label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Rindfleisch, Flugreise, Strom…"
          />
        </div>

        <div className="text-right text-xs text-muted-foreground">
          weight: {(factor.weight * 100).toFixed(0)}%
          <div className="mt-1 font-mono">
            {result.impact.co2e_kg.toFixed(2)} CO₂e
          </div>
          <div className="font-mono">
            {(() => {
              const w = formatWaterPerYear(result.impact.water_l);
              return (
                <>
                  {w.primary}
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({w.secondary})
                  </span>
                </>
              );
            })()}
          </div>
          <div className="font-mono">
            {result.impact.land_m2a.toFixed(2)} m²·a
          </div>
        </div>
      </div>

      {/* Input */}
      {isNumberInput(input) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-sm text-muted-foreground">Wert</div>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              type="number"
              value={input.value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">Einheit (Label)</div>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={input.unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="z.B. kg/a, kWh/a, km/a"
            />
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Input-Typ „{input.type}“ wird im UI später ergänzt.
        </div>
      )}

      {/* Gewichtung */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Gewichtung</div>
        <Slider
          value={[factor.weight]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => setWeight(v[0])}
        />
      </div>

      {/* Converter Auswahl */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm text-muted-foreground">Converter</div>
        <select
          className="rounded-md border bg-background p-2 text-sm"
          value={factor.converterId}
          onChange={(e) => setConverterId(e.target.value)}
        >
          <option value="linear_coeff">linear_coeff (custom)</option>
          <option value="electricity_kwh_per_year">
            electricity_kwh_per_year
          </option>
          <option value="heating_kwh_per_year">heating_kwh_per_year</option>
        </select>
      </div>

      {/* Linear Coeff Editor */}
      {isLinear && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="text-sm font-medium">Linear-Koeffizienten</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm text-muted-foreground">
                k_co2 (kg CO₂e pro Einheit)
              </div>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                type="number"
                value={k_co2}
                onChange={(e) => setKCo2(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                k_water (L Wasser pro Einheit)
              </div>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                type="number"
                value={k_water}
                onChange={(e) => setKWater(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="text-sm text-muted-foreground">
                k_land (m²·a pro Einheit)
              </div>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                type="number"
                value={k_land}
                onChange={(e) => setKLand(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">
              Notiz (Quelle / Annahme)
            </div>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. placeholder – später Literaturwert"
            />
          </div>
        </div>
      )}

      {/* Trace */}
      <TraceAccordion trace={result.trace} />

      {/* Nerd candy */}
      <div className="text-xs text-muted-foreground">
        Beitrag (gewichtet):{' '}
        <span className="font-mono">
          {result.impact.co2e_kg.toFixed(2)} kg CO₂e/a ·{' '}
          {result.impact.water_l.toFixed(0)} L/a ·{' '}
          {result.impact.land_m2a.toFixed(2)} m²·a/a
        </span>
      </div>
    </Card>
  );
}
