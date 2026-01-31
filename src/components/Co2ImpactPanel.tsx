import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useModelStore } from '@/store/modelStore';
import { calcTotal } from '@/engine/calcTotal';
import { calcFactor } from '@/engine/calcFactor';

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function formatKgPerDayFromYear(kgPerYear: number) {
  const kg = Number.isFinite(kgPerYear) ? kgPerYear : 0;
  const perDay = kg / 365;
  const digits = perDay >= 10 ? 1 : 2;
  return `${perDay.toFixed(digits)} kg/Tag`;
}

function formatKgPerYear(kgPerYear: number) {
  const kg = Number.isFinite(kgPerYear) ? kgPerYear : 0;
  const digits = kg >= 1000 ? 0 : 1;
  return `${kg.toFixed(digits)} kg CO₂e/a`;
}

function formatPercent(x01: number) {
  return `${Math.round(clamp01(x01) * 100)}%`;
}

type Segment = {
  id: string;
  label: string;
  co2e_kg_per_year: number;
};

function BreakdownBars({ segments }: { segments: Segment[] }) {
  const total = segments.reduce(
    (s, a) =>
      s +
      (Number.isFinite(a.co2e_kg_per_year)
        ? Math.max(0, a.co2e_kg_per_year)
        : 0),
    0
  );
  const safe = total > 0 ? total : 1;

  return (
    <div className="space-y-3">
      {segments.map((seg) => {
        const frac = clamp01(seg.co2e_kg_per_year / safe);

        return (
          <div key={seg.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-medium">
                {seg.label}
              </div>
              <div className="shrink-0 font-mono text-xs text-muted-foreground">
                {formatKgPerDayFromYear(seg.co2e_kg_per_year)} (
                {formatPercent(frac)})
              </div>
            </div>

            <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.round(frac * 100)}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutWithTarget({
  segments,
  centerValue,
  targetValue,
  caption,
  targetRatio01,
}: {
  segments: Segment[];
  centerValue: string;
  targetValue: string;
  caption: string;
  targetRatio01: number; // 0..1
}) {
  const rOuter = 44;
  const cOuter = 2 * Math.PI * rOuter;

  const rInner = 32;
  const cInner = 2 * Math.PI * rInner;

  const total = segments.reduce(
    (s, a) =>
      s +
      (Number.isFinite(a.co2e_kg_per_year)
        ? Math.max(0, a.co2e_kg_per_year)
        : 0),
    0
  );
  const safe = total > 0 ? total : 1;

  const opacities = [1, 0.78, 0.6, 0.45, 0.34, 0.25];

  const t = clamp01(targetRatio01);
  const tDash = cInner * t;
  const tRest = cInner - tDash;

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 140 140"
        className="h-44 w-44"
        role="img"
        aria-label="CO2e: Ist-Verteilung mit Ziel-Innenring"
      >
        <circle
          cx="70"
          cy="70"
          r={rOuter}
          fill="none"
          stroke="currentColor"
          opacity="0.10"
          strokeWidth="14"
        />

        {segments.map((seg, i) => {
          const frac = clamp01(seg.co2e_kg_per_year / safe);
          const dash = cOuter * frac;
          const rest = cOuter - dash;

          const dashOffset = cOuter * offset;
          offset += frac;

          return (
            <circle
              key={seg.id}
              cx="70"
              cy="70"
              r={rOuter}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${rest}`}
              strokeDashoffset={-dashOffset}
              transform="rotate(-90 70 70)"
              opacity={opacities[i] ?? 0.22}
            />
          );
        })}

        <circle
          cx="70"
          cy="70"
          r={rInner}
          fill="none"
          stroke="currentColor"
          opacity="0.10"
          strokeWidth="10"
        />

        <circle
          cx="70"
          cy="70"
          r={rInner}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${tDash} ${tRest}`}
          transform="rotate(-90 70 70)"
          opacity="0.9"
        />

        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-current"
          fontSize="20"
          fontWeight="700"
          dominantBaseline="middle"
        >
          {centerValue}
        </text>

        <text
          x="70"
          y="88"
          textAnchor="middle"
          className="fill-current"
          opacity="0.75"
          fontSize="12"
          dominantBaseline="middle"
        >
          {targetValue}
        </text>
      </svg>

      <div className="text-xs text-muted-foreground text-center">{caption}</div>

      <div className="w-full max-w-sm space-y-2 text-sm">
        {segments.map((seg, i) => (
          <div key={seg.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-current"
                style={{ opacity: opacities[i] ?? 0.22 }}
                aria-hidden="true"
              />
              <span className="truncate">{seg.label}</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.round(clamp01(seg.co2e_kg_per_year / safe) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Co2ImpactPanel() {
  const modules = useModelStore((s) => s.modules);
  const total = calcTotal(modules);

  // TODO: später aus Settings (Benchmark). Platzhalter:
  const TARGET_CO2E_KG_PER_YEAR = 2000;

  const co2PerYear = total.impact.co2e_kg;
  const co2PerDay = co2PerYear / 365;

  const deltaPct =
    TARGET_CO2E_KG_PER_YEAR > 0
      ? (co2PerYear - TARGET_CO2E_KG_PER_YEAR) / TARGET_CO2E_KG_PER_YEAR
      : 0;

  const factorSegmentsRaw: Segment[] = modules.flatMap((m) =>
    m.factors.map((f) => {
      const r = calcFactor(f, { year: 2025 });
      return {
        id: `${m.id}:${f.id}`,
        label: `${m.label}: ${f.label}`,
        co2e_kg_per_year: r.impact.co2e_kg,
      };
    })
  );

  const positive = factorSegmentsRaw
    .filter(
      (s) => Number.isFinite(s.co2e_kg_per_year) && s.co2e_kg_per_year > 0
    )
    .sort((a, b) => b.co2e_kg_per_year - a.co2e_kg_per_year);

  const TOP_N = 6;
  const top = positive.slice(0, TOP_N);
  const restSum = positive
    .slice(TOP_N)
    .reduce((s, a) => s + a.co2e_kg_per_year, 0);

  const segments: Segment[] =
    restSum > 0
      ? [...top, { id: 'other', label: 'Sonstiges', co2e_kg_per_year: restSum }]
      : top;

  const targetRatio01 =
    TARGET_CO2E_KG_PER_YEAR > 0
      ? clamp01(co2PerYear / TARGET_CO2E_KG_PER_YEAR)
      : 0;

  return (
    <Card
      className={[
        'w-full',
        'p-5 md:p-6 space-y-6',
        'bg-gradient-to-b from-primary/6 via-background to-background',
        'border border-primary/20 shadow-sm',
      ].join(' ')}
    >
      <div className="flex flex-col gap-1">
        <div className="text-base md:text-lg font-semibold">CO₂e</div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-2xl md:text-3xl text-primary">
            {Number.isFinite(co2PerDay)
              ? `${co2PerDay.toFixed(2)} kg/Tag`
              : '—'}
          </span>

          <span className="text-sm text-muted-foreground">
            Ziel:{' '}
            <span className="font-mono">
              {formatKgPerYear(TARGET_CO2E_KG_PER_YEAR)}
            </span>
          </span>

          <span className="text-sm text-muted-foreground">
            Abweichung:{' '}
            <span className="font-mono text-primary">
              {deltaPct >= 0 ? '+' : ''}
              {Math.round(deltaPct * 100)}%
            </span>
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          Istwert aus Faktor-Impacts (Engine:{' '}
          <span className="font-mono">calcFactor</span> →{' '}
          <span className="font-mono">calcTotal</span>).
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="rounded-xl border border-primary/15 bg-background/60 p-4 text-primary">
          <DonutWithTarget
            segments={
              segments.length
                ? segments
                : [{ id: 'none', label: '—', co2e_kg_per_year: 1 }]
            }
            centerValue={formatKgPerDayFromYear(co2PerYear).replace(
              ' kg/Tag',
              ' kg/Tag'
            )}
            targetValue={`Ziel: ${TARGET_CO2E_KG_PER_YEAR} kg/a`}
            caption="Außen: Ist-Zusammensetzung (Faktoren) • Innen: Ziel-Auslastung"
            targetRatio01={targetRatio01}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            CO₂e im Detail (Faktoren)
          </div>

          {segments.length ? (
            <BreakdownBars segments={segments} />
          ) : (
            <div className="text-sm text-muted-foreground">
              Noch kein CO₂e-Impact: setze bei einem Faktor einen Wert und/oder{' '}
              <span className="font-mono">k_co2</span> &gt; 0.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
