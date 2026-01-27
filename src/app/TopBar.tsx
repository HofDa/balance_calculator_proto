// src/app/TopBar.tsx
import { ModelMenu } from '@/components/ModelMenu';

export function TopBar() {
  return (
    <header className="border-b p-4 flex items-center justify-between gap-3">
      <div className="font-semibold">Ökologischer Fußabdruck – Prototyp</div>

      <div className="flex items-center gap-2">
        <ModelMenu />
      </div>
    </header>
  );
}
