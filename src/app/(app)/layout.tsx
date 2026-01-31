import type { ReactNode } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { FirebaseClientProvider } from '@/firebase';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
          <AppSidebar />
          <div className="flex flex-col">
              <AppHeader />
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                  {children}
              </main>
          </div>
      </div>
    </FirebaseClientProvider>
  );
}
