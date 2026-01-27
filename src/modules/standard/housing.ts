import type { Module } from '@/engine/types';

export const housingModule: Module = {
  id: 'housing',
  label: 'Wohnen',
  weight: 1,
  factors: [
    {
      id: 'electricity',
      label: 'Stromverbrauch',
      helpText: 'Jährlicher Haushaltsstrom (pro Person).',
      input: { type: 'number', value: 1000, unit: 'kWh/a' },
      weight: 0.5,
      converterId: 'electricity_kwh_per_year',
    },
    {
      id: 'heating',
      label: 'Heizenergie',
      helpText: 'Jährliche Heizenergie (pro Person).',
      input: { type: 'number', value: 4000, unit: 'kWh/a' },
      weight: 0.5,
      converterId: 'heating_kwh_per_year',
    },
  ],
};
