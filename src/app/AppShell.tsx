// src/app/AppShell.tsx
import type { ReactNode } from 'react';
import { TopBar } from '@/app/TopBar';
import { AddModuleDialog } from '@/components/AddModuleDialog';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="p-6 space-y-6">
        {/* Action row under the nav (requested) */}
        <div className="flex justify-end">
          <AddModuleDialog />
        </div>

        {children}
      </main>
    </div>
  );
}
