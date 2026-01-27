import { AppShell } from '@/app/AppShell';
import { ModuleGrid } from '@/app/ModuleGrid';
import { ImpactSummary } from '@/components/ImpactSummary';
import { useAutoLoadPreset } from '@/app/useAutoLoadPreset';

export default function App() {
  useAutoLoadPreset();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Action row BELOW the top bar */}

        <ModuleGrid />
        <ImpactSummary />
      </div>
    </AppShell>
  );
}
