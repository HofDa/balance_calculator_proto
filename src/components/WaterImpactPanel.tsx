import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useModelStore } from '@/store/modelStore';
import { calcTotal } from '@/engine/calcTotal';
import { calcFactor } from '@/engine/calcFactor';

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function formatLPerDayFromYear(lPerYear: number) {
  const l = Number.isFinite(lPerYear) ? lPerYear : 0;
  const perDay = l / 365;
  const digits = perDay >= 100 ? 0 : perDay >= 10 ? 1 : 2;
  return `${perDay.toFixed(digits)} L/Tag`;
}

function formatPercent(x01: number) {
  return `${Math.round(clamp01(x01) * 100)}%`;
}

type Segment = {
  id: string;
  label: string;
  water_l_per_year: number;
};

function BreakdownBars({ segments }: { segments: Segment[] }) {
  const total = segments.reduce(
    (s, a) =>
      s +
      (Number.isFinite(a.water_l_per_year)
        ? Math.max(0, a.water_l_per_year)
        : 0),
    0
  );
  const safe = total > 0 ? total : 1;

  return (
    <div className="space-y-3">
      {segments.map((seg) => {
        const frac = clamp01(seg.water_l_per_year / safe);

        return (
          <div key={seg.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-medium">
                {seg.label}
              </div>
              <div className="shrink-0 font-mono text-xs text-muted-foreground">
                {formatLPerDayFromYear(seg.water_l_per_year)} (
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
  centerCaption,
  targetValue,
  // ratio: wie nah ist Ist am Ziel?
  // 1 = Ziel erreicht/überschritten (Ring voll), 0.5 = halb so viel wie Ziel, etc.
  targetRatio01,
}: {
  segments: Segment[];
  centerValue: string;
  centerCaption: string;
  targetValue: string;
  targetRatio01: number; // 0..1
}) {
  // Outer ring (Ist-Verteilung)
  const rOuter = 44;
  const cOuter = 2 * Math.PI * rOuter;

  // Inner ring (Ziel-Gauge)
  const rInner = 32;
  const cInner = 2 * Math.PI * rInner;

  const total = segments.reduce(
    (s, a) =>
      s +
      (Number.isFinite(a.water_l_per_year)
        ? Math.max(0, a.water_l_per_year)
        : 0),
    0
  );
  const safe = total > 0 ? total : 1;

  // Blau-Opazitäten (flat/clean)
  const opacities = [1, 0.78, 0.6, 0.45, 0.34, 0.25];

  // Ziel-Arc
  const t = clamp01(targetRatio01);
  const tDash = cInner * t;
  const tRest = cInner - tDash;

  // Outer segments offsets
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 140 140"
        className="h-44 w-44"
        role="img"
        aria-label="Wasser: Ist-Verteilung mit Ziel-Innenring"
      >
        {/* Outer background */}
        <circle
          cx="70"
          cy="70"
          r={rOuter}
          fill="none"
          stroke="currentColor"
          opacity="0.10"
          strokeWidth="14"
        />

        {/* Outer segments = Ist (aus Faktoren) */}
        {segments.map((seg, i) => {
          const frac = clamp01(seg.water_l_per_year / safe);
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

        {/* Inner background (Zielring Basis) */}
        <circle
          cx="70"
          cy="70"
          r={rInner}
          fill="none"
          stroke="currentColor"
          opacity="0.10"
          strokeWidth="10"
        />

        {/* Inner target arc */}
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

        {/* Center text */}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-current"
          fontSize="22"
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

      {/* Micro-caption under chart */}
      <div className="text-xs text-muted-foreground text-center">
        {centerCaption}
      </div>

      {/* Legend */}
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
              {Math.round(clamp01(seg.water_l_per_year / safe) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WaterImpactPanel() {
  const modules = useModelStore((s) => s.modules);
  const total = calcTotal(modules);

  // Benchmark später aus Settings; jetzt fix
  const TARGET_L_PER_DAY = 120;

  const waterPerDay = total.impact.water_l / 365;
  const deltaPct =
    TARGET_L_PER_DAY > 0
      ? (waterPerDay - TARGET_L_PER_DAY) / TARGET_L_PER_DAY
      : 0;

  // ✅ Faktor-Level Breakdown: direkt gekoppelt an UI-Eingaben
  const factorSegmentsRaw: Segment[] = modules.flatMap((m) =>
    m.factors.map((f) => {
      const r = calcFactor(f, { year: 2025 });
      return {
        id: `${m.id}:${f.id}`,
        label: `${m.label}: ${f.label}`,
        water_l_per_year: r.impact.water_l,
      };
    })
  );

  const positive = factorSegmentsRaw
    .filter(
      (s) => Number.isFinite(s.water_l_per_year) && s.water_l_per_year > 0
    )
    .sort((a, b) => b.water_l_per_year - a.water_l_per_year);

  // Top N + Sonstiges (ruhig & lesbar)
  const TOP_N = 6;
  const top = positive.slice(0, TOP_N);
  const restSum = positive
    .slice(TOP_N)
    .reduce((s, a) => s + a.water_l_per_year, 0);

  const segments: Segment[] =
    restSum > 0
      ? [...top, { id: 'other', label: 'Sonstiges', water_l_per_year: restSum }]
      : top;

  // Zielring: wie viel des Ziels ist “ausgeschöpft”
  // - unter Ziel: < 1
  // - über Ziel:  = 1 (Ring voll)
  const targetRatio01 =
    TARGET_L_PER_DAY > 0 ? clamp01(waterPerDay / TARGET_L_PER_DAY) : 0;

  return (
    <Card
      className={[
        'w-full',
        'p-5 md:p-6 space-y-6',
        'bg-gradient-to-b from-primary/6 via-background to-background',
        'border border-primary/20 shadow-sm',
      ].join(' ')}
    >
      {/* Header / Summary */}
      <div className="flex flex-col gap-1">
        <div className="text-base md:text-lg font-semibold">
          Wasserverbrauch
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-2xl md:text-3xl text-primary">
            {formatLPerDayFromYear(total.impact.water_l)}
          </span>

          <span className="text-sm text-muted-foreground">
            Ziel: <span className="font-mono">{TARGET_L_PER_DAY} L/Tag</span>
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

      {/* Donut: Ist (outer segmented) + Ziel (inner ring) */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="rounded-xl border border-primary/15 bg-background/60 p-4 text-primary">
          <DonutWithTarget
            segments={
              segments.length
                ? segments
                : [{ id: 'none', label: '—', water_l_per_year: 1 }]
            }
            centerValue={
              Number.isFinite(waterPerDay)
                ? `${Math.round(waterPerDay)} L`
                : '—'
            }
            centerCaption="Außen: Ist-Zusammensetzung (Faktoren) • Innen: Ziel-Auslastung"
            targetValue={`Ziel: ${TARGET_L_PER_DAY} L`}
            targetRatio01={targetRatio01}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            Wasserverbrauch im Detail (Faktoren)
          </div>

          {segments.length ? (
            <BreakdownBars segments={segments} />
          ) : (
            <div className="text-sm text-muted-foreground">
              Noch kein Wasser-Impact: setze bei einem Faktor einen Wert
              und/oder <span className="font-mono">k_water</span> &gt; 0.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
