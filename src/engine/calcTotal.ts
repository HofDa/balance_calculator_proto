import type { Module, ImpactVector, CalcResult, TraceLine } from './types';
import { calcModule } from './calcModule';

const zero: ImpactVector = { co2e_kg: 0, land_m2a: 0, water_l: 0 };

export function calcTotal(modules: Module[]): CalcResult {
  let sum = { ...zero };

  const moduleResults = modules.map(calcModule);

  for (const r of moduleResults) {
    sum.co2e_kg += r.impact.co2e_kg;
    sum.land_m2a += r.impact.land_m2a;
    sum.water_l += r.impact.water_l;
  }

  return {
    impact: sum,
    trace: {
      title: 'Gesamtsumme – alle Module',
      lines: [
        { kind: 'text', text: 'Summe aller Modul-Ergebnisse.' },
        ...moduleResults.map<TraceLine>((r) => ({
          kind: 'formula',
          label: r.trace.title,
          expression: `${r.impact.co2e_kg.toFixed(
            1
          )} kg CO₂e/a; ${r.impact.water_l.toFixed(
            0
          )} L/a; ${r.impact.land_m2a.toFixed(1)} m²·a/a`,
        })),
        {
          kind: 'formula',
          label: 'Gesamt',
          expression: `${sum.co2e_kg.toFixed(
            1
          )} kg CO₂e/a; ${sum.water_l.toFixed(0)} L/a; ${sum.land_m2a.toFixed(
            1
          )} m²·a/a`,
        },
      ],
    },
  };
}
