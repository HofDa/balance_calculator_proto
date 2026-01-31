import * as React from 'react';
import { Card } from '@/components/ui/card';
import { useModelStore } from '@/store/modelStore';
import { calcTotal } from '@/engine/calcTotal';
import { calcFactor } from '@/engine/calcFactor';

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function formatM2aPerYear(m2a: number) {
  const v = Number.isFinite(m2a) ? m2a : 0;
  const digits = v >= 1000 ? 0 : 1;
  return `${v.toFixed(digits)} m²·a/a`;
}

function formatPercent(x01: number) {
  return `${Math.round(clamp01(x01) * 100)}%`;
}

type Segment = {
  id: string;
  label: string;
  land_m2a_per_year: number;
};

function BreakdownBars({ segments }: { segments: Segment[] }) {
  const total = segments.reduce(
    (s, a) =>
      s +
      (Number.isFinite(a.land_m2a_per_year)
        ? Math.max(0, a.land_m2a_per_year)
        : 0),
    0
  );
  const safe = total > 0 ? total : 1;

  return (
    <div className="space-y-3">
      {segments.map((seg) => {
        const frac = clamp01(seg.land_m2a_per_year / safe);

        return (
          <div key={seg.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-medium">
                {seg.label}
              </div>
              <div className="shrink-0 font-mono text-xs text-muted-foreground">
                {formatM2aPerYear(seg.land_m2a_per_year)} ({formatPercent(frac)}
                )
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
      (Number.isFinite(a.land_m2a_per_year)
        ? Math.max(0, a.land_m2a_per_year)
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
        aria-label="Land: Ist-Verteilung mit Ziel-Innenring"
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
          const frac = clamp01(seg.land_m2a_per_year / safe);
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
          fontSize="18"
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
              {Math.round(clamp01(seg.land_m2a_per_year / safe) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandImpactPanel() {
  const modules = useModelStore((s) => s.modules);
  const total = calcTotal(modules);

  // TODO: später aus Settings (Benchmark). Platzhalter:
  const TARGET_LAND_M2A_PER_YEAR = 2500;

  const landPerYear = total.impact.land_m2a;

  const deltaPct =
    TARGET_LAND_M2A_PER_YEAR > 0
      ? (landPerYear - TARGET_LAND_M2A_PER_YEAR) / TARGET_LAND_M2A_PER_YEAR
      : 0;

  const factorSegmentsRaw: Segment[] = modules.flatMap((m) =>
    m.factors.map((f) => {
      const r = calcFactor(f, { year: 2025 });
      return {
        id: `${m.id}:${f.id}`,
        label: `${m.label}: ${f.label}`,
        land_m2a_per_year: r.impact.land_m2a,
      };
    })
  );

  const positive = factorSegmentsRaw
    .filter(
      (s) => Number.isFinite(s.land_m2a_per_year) && s.land_m2a_per_year > 0
    )
    .sort((a, b) => b.land_m2a_per_year - a.land_m2a_per_year);

  const TOP_N = 6;
  const top = positive.slice(0, TOP_N);
  const restSum = positive
    .slice(TOP_N)
    .reduce((s, a) => s + a.land_m2a_per_year, 0);

  const segments: Segment[] =
    restSum > 0
      ? [
          ...top,
          { id: 'other', label: 'Sonstiges', land_m2a_per_year: restSum },
        ]
      : top;

  const targetRatio01 =
    TARGET_LAND_M2A_PER_YEAR > 0
      ? clamp01(landPerYear / TARGET_LAND_M2A_PER_YEAR)
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
        <div className="text-base md:text-lg font-semibold">Landnutzung</div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-2xl md:text-3xl text-primary">
            {formatM2aPerYear(landPerYear)}
          </span>

          <span className="text-sm text-muted-foreground">
            Ziel:{' '}
            <span className="font-mono">
              {formatM2aPerYear(TARGET_LAND_M2A_PER_YEAR)}
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
                : [{ id: 'none', label: '—', land_m2a_per_year: 1 }]
            }
            centerValue={formatM2aPerYear(landPerYear).replace(
              ' m²·a/a',
              ' m²·a'
            )}
            targetValue={`Ziel: ${TARGET_LAND_M2A_PER_YEAR} m²·a/a`}
            caption="Außen: Ist-Zusammensetzung (Faktoren) • Innen: Ziel-Auslastung"
            targetRatio01={targetRatio01}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            Landnutzung im Detail (Faktoren)
          </div>

          {segments.length ? (
            <BreakdownBars segments={segments} />
          ) : (
            <div className="text-sm text-muted-foreground">
              Noch kein Land-Impact: setze bei einem Faktor einen Wert und/oder{' '}
              <span className="font-mono">k_land</span> &gt; 0.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
