import Link from 'next/link';
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from '@/components/logo';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { CircleUser, LogOut } from 'lucide-react';

export default function AppSidebar() {
  return (
    <div className="hidden border-r bg-card lg:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <ScrollArea className="flex-1 py-2">
          <AppNav />
        </ScrollArea>
        <div className="mt-auto p-4 space-y-2 border-t">
            <Link href="/profile" passHref>
              <Button variant="ghost" className="w-full justify-start">
                  <CircleUser className="mr-2 h-4 w-4" />
                  My Profile
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
      </div>
    </div>
  );
}
