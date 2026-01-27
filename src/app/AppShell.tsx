// src/app/AppShell.tsx
import type { ReactNode } from 'react';
import { TopBar } from '@/app/TopBar';
import { AddModuleDialog } from '@/components/AddModuleDialog';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex justify-end">
          <AddModuleDialog />
        </div>

        {children}
      </main>
    </div>
  );
}
