import { describe, it, expect } from 'vitest';
import { calcFactor } from '@/engine/calcFactor';
import type { Factor } from '@/engine/types';

describe('linear_coeff custom converter', () => {
  it('computes weighted impact from user coefficients', () => {
    const f: Factor = {
      id: 'x',
      label: 'Custom Faktor',
      input: { type: 'number', value: 10, unit: 'unit/a' },
      weight: 0.5,
      converterId: 'linear_coeff',
      converterConfig: { k_co2: 2, k_land: 3, k_water: 4 },
    };

    const res = calcFactor(f, { year: 2025 });

    // raw: co2=20, land=30, water=40; weighted 0.5 => 10, 15, 20
    expect(res.impact.co2e_kg).toBeCloseTo(10, 10);
    expect(res.impact.land_m2a).toBeCloseTo(15, 10);
    expect(res.impact.water_l).toBeCloseTo(20, 10);
    expect(res.trace.lines.length).toBeGreaterThan(0);
  });
});
