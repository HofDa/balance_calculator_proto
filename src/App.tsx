import { AppShell } from '@/app/AppShell';
import { ModuleGrid } from '@/app/ModuleGrid';
import { ImpactSummary } from '@/components/ImpactSummary';
import { useAutoLoadPreset } from '@/app/useAutoLoadPreset';
import { WaterImpactPanel } from '@/components/WaterImpactPanel';
import { Co2ImpactPanel } from '@/components/Co2ImpactPanel';
import { LandImpactPanel } from '@/components/LandImpactPanel';

export default function App() {
  useAutoLoadPreset();

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleGrid />

        <div className="mx-auto w-full max-w-6xl px-4 space-y-6">
          <ImpactSummary />

          <div className="grid gap-6 lg:grid-cols-3 items-start">
            <WaterImpactPanel />
            <Co2ImpactPanel />
            <LandImpactPanel />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
