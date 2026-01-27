import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Wasser intern in Litern; Anzeige in m³ + (L)
export function formatWaterPerYear(water_l: number) {
  const l = Number.isFinite(water_l) ? water_l : 0;
  const m3 = l / 1000;
  const m3Digits = m3 >= 10 ? 1 : 2;
  const lDigits = l >= 100 ? 0 : 1;
  return {
    m3,
    l,
    primary: `${m3.toFixed(m3Digits)} m³/a`,
    secondary: `${l.toFixed(lDigits)} L/a`,
  };
}
