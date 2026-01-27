import { describe, it, expect } from 'vitest';
import { calcModule } from '@/engine/calcModule';
import type { Module } from '@/engine/types';

describe('calcModule', () => {
  it('sums weighted factors and applies module weight', () => {
    const module: Module = {
      id: 'housing',
      label: 'Wohnen',
      weight: 2, // verdoppeln
      factors: [
        {
          id: 'electricity',
          label: 'Strom',
          input: { type: 'number', value: 1000, unit: 'kWh/a' },
          weight: 0.5,
          converterId: 'electricity_kwh_per_year',
        },
        {
          id: 'electricity2',
          label: 'Strom 2',
          input: { type: 'number', value: 1000, unit: 'kWh/a' },
          weight: 0.5,
          converterId: 'electricity_kwh_per_year',
        },
      ],
    };

    const res = calcModule(module);

    // Jeder Faktor raw 250/20/2000, weighted 0.5 => 125/10/1000
    // Summe Faktoren => 250/20/2000
    // Modulgewicht 2 => 500/40/4000
    expect(res.impact.co2e_kg).toBeCloseTo(500, 10);
    expect(res.impact.land_m2a).toBeCloseTo(40, 10);
    expect(res.impact.water_l).toBeCloseTo(4000, 10);
  });
});
