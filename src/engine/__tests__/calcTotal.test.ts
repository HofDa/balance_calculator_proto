import { describe, it, expect } from 'vitest';
import { calcTotal } from '@/engine/calcTotal';
import type { Module } from '@/engine/types';

describe('calcTotal', () => {
  it('sums module impacts correctly', () => {
    const m1: Module = {
      id: 'm1',
      label: 'M1',
      factors: [
        {
          id: 'f1',
          label: 'Strom',
          input: { type: 'number', value: 1000, unit: 'kWh/a' },
          weight: 1,
          converterId: 'electricity_kwh_per_year',
        },
      ],
    };

    const m2: Module = {
      id: 'm2',
      label: 'M2',
      factors: [
        {
          id: 'f2',
          label: 'Strom',
          input: { type: 'number', value: 2000, unit: 'kWh/a' },
          weight: 1,
          converterId: 'electricity_kwh_per_year',
        },
      ],
    };

    const res = calcTotal([m1, m2]);

    // m1: 1000*0.25=250; land 20; water 2000
    // m2: 2000*0.25=500; land 40; water 4000
    // total: 750; land 60; water 6000
    expect(res.impact.co2e_kg).toBeCloseTo(750, 10);
    expect(res.impact.land_m2a).toBeCloseTo(60, 10);
    expect(res.impact.water_l).toBeCloseTo(6000, 10);
  });
});
