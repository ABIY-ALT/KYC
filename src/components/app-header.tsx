
'use client';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Logo from '@/components/logo';
import { AppNav } from '@/components/app-nav';
import { ScrollArea } from './ui/scroll-area';
import { ThemeToggle } from './theme-toggle';
import type { User } from '@/lib/data';

export default function AppHeader({ user }: { user: User | null }) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-72 bg-card">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex h-16 items-center border-b px-6">
                <Logo />
            </div>
            <ScrollArea className="flex-1 py-2">
                <AppNav isMobile user={user} />
            </ScrollArea>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        
      </div>
      <ThemeToggle />
    </header>
  );
}
