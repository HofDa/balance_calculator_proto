import { useModelStore } from '@/store/modelStore';
import { ModuleCard } from '@/components/ModuleCard';

export function ModuleGrid() {
  const modules = useModelStore((s) => s.modules);

  if (modules.length === 0) {
    return (
      <p className="text-muted-foreground">Noch keine Module definiert.</p>
    );
  }

  return (
    <div className="module-grid">
      {modules.map((m) => (
        <ModuleCard key={m.id} module={m} />
      ))}
    </div>
  );
}
