// src/engine/converters.ts
import type { CalcResult, FactorInput } from './types';

export type ConverterContext = {
  year: number;
};

export type Converter = (
  input: FactorInput,
  ctx: ConverterContext
) => CalcResult;

function ensureNumberInput(input: FactorInput, expectedUnit?: string) {
  if (input.type !== 'number') {
    throw new Error(`Expected number input, got ${input.type}`);
  }
  // Unit ist v1 nur Label – optional prüfen:
  if (expectedUnit && input.unit !== expectedUnit) {
    // nur warnen/ignorieren, weil v1 keine echte Unit-Conversion macht
  }
  return input.value;
}

export const converters: Record<string, Converter> = {
  electricity_kwh_per_year: (input, ctx) => {
    const kwh = ensureNumberInput(input, 'kWh/a');

    // ⚠️ Platzhalter-Koeffizienten (für Prototyp bewusst konfigurierbar später)
    const EF_CO2 = 0.25; // kg CO2e / kWh
    const EF_LAND = 0.02; // m²·a / kWh
    const EF_WATER = 2.0; // L / kWh (Platzhalter)

    const co2e = kwh * EF_CO2;
    const land = kwh * EF_LAND;
    const water = kwh * EF_WATER;

    return {
      impact: { co2e_kg: co2e, land_m2a: land, water_l: water },
      trace: {
        title: 'Strom → Impact',
        lines: [
          {
            kind: 'formula',
            label: 'CO₂e',
            expression: 'co2e_kg = kWh × EF_CO2',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${kwh} × ${EF_CO2} = ${co2e.toFixed(2)} kg CO₂e/a`,
          },
          {
            kind: 'formula',
            label: 'Land',
            expression: 'land_m2a = kWh × EF_LAND',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${kwh} × ${EF_LAND} = ${land.toFixed(2)} m²·a/a`,
          },
          {
            kind: 'formula',
            label: 'Wasser',
            expression: 'water_l = kWh × EF_WATER',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${kwh} × ${EF_WATER} = ${water.toFixed(2)} L/a`,
          },
        ],
        assumptions: [
          `Kontext: year=${ctx.year}`,
          'EF_CO2, EF_LAND und EF_WATER sind Platzhalter.',
          'Systemgrenze: pro Person und Jahr.',
        ],
      },
    };
  },

  heating_kwh_per_year: (input, ctx) => {
    const kwh = ensureNumberInput(input, 'kWh/a');

    // ⚠️ Platzhalter (später: Heiztyp + echte Faktoren)
    const EF_CO2 = 0.2; // kg CO2e / kWh
    const EF_LAND = 0.01; // m²·a / kWh
    const EF_WATER = 1.5; // L / kWh (Platzhalter)

    const co2e = kwh * EF_CO2;
    const land = kwh * EF_LAND;
    const water = kwh * EF_WATER;

    return {
      impact: { co2e_kg: co2e, land_m2a: land, water_l: water },
      trace: {
        title: 'Heizung → Impact',
        lines: [
          {
            kind: 'formula',
            label: 'CO₂e',
            expression: 'co2e_kg = kWh × EF_CO2',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${kwh} × ${EF_CO2} = ${co2e.toFixed(2)} kg CO₂e/a`,
          },
          {
            kind: 'formula',
            label: 'Land',
            expression: 'land_m2a = kWh × EF_LAND',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${kwh} × ${EF_LAND} = ${land.toFixed(2)} m²·a/a`,
          },
          {
            kind: 'formula',
            label: 'Wasser',
            expression: 'water_l = kWh × EF_WATER',
          },
          {
            kind: 'formula',
            label: 'Einsetzen',
            expression: `${kwh} × ${EF_WATER} = ${water.toFixed(2)} L/a`,
          },
        ],
        assumptions: [
          `Kontext: year=${ctx.year}`,
          'EF_CO2, EF_LAND und EF_WATER sind Platzhalter.',
          'Systemgrenze: pro Person und Jahr.',
        ],
      },
    };
  },
};
