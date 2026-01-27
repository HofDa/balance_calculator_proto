import type { Module, CalcResult, ImpactVector } from './types';
import { calcFactor } from './calcFactor';

const zero: ImpactVector = { co2e_kg: 0, land_m2a: 0, water_l: 0 };

export function calcModule(module: Module): CalcResult {
  let sum = { ...zero };

  const factorResults = module.factors.map((f) =>
    calcFactor(f, { year: 2025 })
  );

  for (const r of factorResults) {
    sum.co2e_kg += r.impact.co2e_kg;
    sum.land_m2a += r.impact.land_m2a;
    sum.water_l += r.impact.water_l;
  }

  const w = module.weight ?? 1;

  const weighted = {
    co2e_kg: sum.co2e_kg * w,
    land_m2a: sum.land_m2a * w,
    water_l: sum.water_l * w,
  };

  return {
    impact: weighted,
    trace: {
      title: `Modul ${module.label} – Summe`,
      lines: [
        { kind: 'text', text: 'Summe aller gewichteten Faktoren.' },
        {
          kind: 'formula',
          label: 'Modulgewicht',
          expression: `× ${w}`,
        },
        {
          kind: 'formula',
          label: 'Modulergebnis',
          expression: `${weighted.co2e_kg.toFixed(
            2
          )} kg CO₂e/a; ${weighted.water_l.toFixed(
            2
          )} L/a; ${weighted.land_m2a.toFixed(2)} m²·a/a`,
        },
      ],
    },
  };
}
