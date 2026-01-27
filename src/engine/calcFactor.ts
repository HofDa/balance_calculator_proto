// src/engine/calcFactor.ts
import type { Factor, CalcResult, ImpactVector } from './types';
import { converters } from './converters';

export function calcFactor(factor: Factor, ctx: { year: number }): CalcResult {
  // Spezialfall: Custom linear coeff
  if (factor.converterId === 'linear_coeff') {
    const input = factor.input.type === 'number' ? factor.input : null;

    const k_co2 = factor.converterConfig?.k_co2 ?? 0;
    const k_land = factor.converterConfig?.k_land ?? 0;
    const k_water = factor.converterConfig?.k_water ?? 0;

    const v = input?.value ?? 0;

    const raw: ImpactVector = {
      co2e_kg: v * k_co2,
      land_m2a: v * k_land,
      water_l: v * k_water,
    };

    const weighted: ImpactVector = {
      co2e_kg: raw.co2e_kg * factor.weight,
      land_m2a: raw.land_m2a * factor.weight,
      water_l: raw.water_l * factor.weight,
    };

    return {
      impact: weighted,
      trace: {
        title: `${factor.label} – linear_coeff`,
        lines: [
          {
            kind: 'formula',
            label: 'CO₂e',
            expression: 'co2e_kg = value × k_co2',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${v} × ${k_co2} = ${raw.co2e_kg.toFixed(2)} kg CO₂e/a`,
          },
          {
            kind: 'formula',
            label: 'Land',
            expression: 'land_m2a = value × k_land',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${v} × ${k_land} = ${raw.land_m2a.toFixed(2)} m²·a/a`,
          },
          {
            kind: 'formula',
            label: 'Wasser',
            expression: 'water_l = value × k_water',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${v} × ${k_water} = ${raw.water_l.toFixed(2)} L/a`,
          },
          {
            kind: 'formula',
            label: 'Gewichtung',
            expression: `× ${factor.weight}`,
          },
          {
            kind: 'formula',
            label: 'Gewichtetes Ergebnis',
            expression: `${weighted.co2e_kg.toFixed(
              2
            )} kg CO₂e/a; ${weighted.water_l.toFixed(
              2
            )} L/a; ${weighted.land_m2a.toFixed(2)} m²·a/a`,
          },
        ],
        assumptions: [
          factor.converterConfig?.note
            ? `Notiz: ${factor.converterConfig.note}`
            : 'Koeffizienten sind benutzerdefiniert (Prototyp).',
        ],
      },
    };
  }

  // Normalfall: vorhandene Converter
  const conv = converters[factor.converterId];

  if (!conv) {
    return {
      impact: { co2e_kg: 0, land_m2a: 0, water_l: 0 },
      trace: {
        title: 'Kein Converter',
        lines: [
          {
            kind: 'text',
            text: `Kein Converter registriert: ${factor.converterId}`,
          },
        ],
      },
    };
  }

  const raw = conv(factor.input, ctx);

  const weighted: ImpactVector = {
    co2e_kg: raw.impact.co2e_kg * factor.weight,
    land_m2a: raw.impact.land_m2a * factor.weight,
    water_l: raw.impact.water_l * factor.weight,
  };

  return {
    impact: weighted,
    trace: {
      title: `${factor.label} – gewichteter Impact`,
      lines: [
        ...raw.trace.lines,
        {
          kind: 'formula',
          label: 'Gewichtung',
          expression: `Impact × ${factor.weight}`,
        },
        {
          kind: 'formula',
          label: 'Gewichtetes Ergebnis',
          expression: `${weighted.co2e_kg.toFixed(
            2
          )} kg CO₂e/a; ${weighted.water_l.toFixed(
            2
          )} L/a; ${weighted.land_m2a.toFixed(2)} m²·a/a`,
        },
      ],
      assumptions: raw.trace.assumptions,
    },
  };
}
