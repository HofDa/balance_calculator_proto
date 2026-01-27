export type LinearCoeffConfig = {
  k_co2: number; // kg CO2e pro Einheit
  k_land: number; // m2a pro Einheit
  k_water: number; // Liter Wasserverbrauch pro Einheit
  note?: string; // optional (Quelle/Annahme)
};

export type Factor = {
  id: string;
  label: string;
  helpText?: string;
  input: FactorInput;
  weight: number; // 0..1
  converterId: string; // später: converter registry
  converterConfig?: LinearCoeffConfig;
};

export type Module = {
  id: string;
  label: string;
  weight?: number; // optional
  factors: Factor[];
};

// Für UI-„aufklappbare Berechnungen“ als Platzhalter:
export type TraceLine =
  | { kind: 'text'; text: string }
  | { kind: 'formula'; label: string; expression: string };

export type Trace = {
  title: string;
  lines: TraceLine[];
  assumptions?: string[];
};

export type ImpactVector = {
  co2e_kg: number;
  land_m2a: number;
  water_l: number;
};

export type CalcResult = {
  impact: ImpactVector;
  trace: Trace;
};

export type NumberInput = {
  type: 'number';
  value: number;
  unit: string;
};

export type SelectInput = {
  type: 'select';
  value: string;
  options: string[];
};

export type ToggleInput = {
  type: 'toggle';
  value: boolean;
};

export type FactorInput = NumberInput | SelectInput | ToggleInput;
