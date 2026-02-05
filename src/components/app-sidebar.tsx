'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from '@/components/logo';
import { AppNav } from '@/components/app-nav';
import type { User } from '@/lib/data';

export default function AppSidebar({ user }: { user: User | null }) {

  return (
    <div className="hidden border-r bg-card lg:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <ScrollArea className="flex-1 py-2">
          <AppNav user={user} />
        </ScrollArea>
      </div>
    </div>
  );
}
