import { describe, it, expect } from 'vitest';
import { calcFactor } from '@/engine/calcFactor';
import type { Factor } from '@/engine/types';

describe('calcFactor', () => {
  it('applies factor weight correctly', () => {
    const factor: Factor = {
      id: 'electricity',
      label: 'Strom',
      input: { type: 'number', value: 1000, unit: 'kWh/a' },
      weight: 0.5,
      converterId: 'electricity_kwh_per_year',
    };

    const res = calcFactor(factor, { year: 2025 });

    // raw: 250 kg CO2e, 20 m2a
    // raw water: 2000 L
    // weighted 0.5 => 125, 10, 1000
    expect(res.impact.co2e_kg).toBeCloseTo(125, 10);
    expect(res.impact.land_m2a).toBeCloseTo(10, 10);
    expect(res.impact.water_l).toBeCloseTo(1000, 10);
  });

  it('returns zero impact when weight is 0', () => {
    const factor: Factor = {
      id: 'electricity',
      label: 'Strom',
      input: { type: 'number', value: 1000, unit: 'kWh/a' },
      weight: 0,
      converterId: 'electricity_kwh_per_year',
    };

    const res = calcFactor(factor, { year: 2025 });

    expect(res.impact.co2e_kg).toBe(0);
    expect(res.impact.land_m2a).toBe(0);
    expect(res.impact.water_l).toBe(0);
  });
});
