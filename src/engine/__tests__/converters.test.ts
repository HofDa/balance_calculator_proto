import { describe, it, expect } from 'vitest';
import { converters } from '@/engine/converters';

describe('converters.electricity_kwh_per_year', () => {
  it('converts kWh/a to co2e_kg and land_m2a with placeholder factors', () => {
    const res = converters.electricity_kwh_per_year(
      { type: 'number', value: 1000, unit: 'kWh/a' },
      { year: 2025 }
    );

    // EF_CO2=0.25 => 250
    // EF_LAND=0.02 => 20
    // EF_WATER=2.0 => 2000
    expect(res.impact.co2e_kg).toBeCloseTo(250, 10);
    expect(res.impact.land_m2a).toBeCloseTo(20, 10);
    expect(res.impact.water_l).toBeCloseTo(2000, 10);

    // Trace should be present (Transparenz ist ein Feature!)
    expect(res.trace.title).toContain('Strom');
    expect(res.trace.lines.length).toBeGreaterThan(0);
  });
});
