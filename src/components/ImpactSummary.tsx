import { Card } from '@/components/ui/card';
import { useModelStore } from '@/store/modelStore';
import { calcTotal } from '@/engine/calcTotal';
import { TraceAccordion } from './TraceAccordion';
import { formatWaterPerYear } from '@/lib/utils';

export function ImpactSummary() {
  const modules = useModelStore((s) => s.modules);
  const total = calcTotal(modules);

  return (
    <Card className="p-4 space-y-3 border-2">
      <div className="text-lg font-semibold">
        Gesamter ökologischer Fußabdruck
      </div>

      <div className="flex gap-6 text-sm">
        <div>
          <div className="text-muted-foreground">CO₂-Äquivalente</div>
          <div className="font-mono text-lg">
            {total.impact.co2e_kg.toFixed(1)} kg CO₂e/a
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">Wasserverbrauch</div>
          <div className="font-mono text-lg">
            {(() => {
              const w = formatWaterPerYear(total.impact.water_l);
              return (
                <>
                  {w.primary}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({w.secondary})
                  </span>
                </>
              );
            })()}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Landnutzung</div>
          <div className="font-mono text-lg">
            {total.impact.land_m2a.toFixed(1)} m²·a/a
          </div>
        </div>
      </div>

      <TraceAccordion trace={total.trace} />
    </Card>
  );
}
