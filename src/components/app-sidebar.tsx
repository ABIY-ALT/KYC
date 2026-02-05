
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from '@/components/logo';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { CircleUser, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/firebase';
import type { User } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';


export default function AppSidebar({ user }: { user: User | null }) {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    auth.signOut();
    router.replace('/login');
  };

  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1');

  return (
    <div className="hidden border-r bg-card lg:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <ScrollArea className="flex-1 py-2">
          <AppNav user={user} />
        </ScrollArea>
        <div className="mt-auto p-2 border-t">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start h-auto p-2 text-left">
                        <Avatar className="h-9 w-9 mr-3">
                            <AvatarImage src={userAvatar?.imageUrl} alt={user?.firstName || 'User'} data-ai-hint="person portrait" />
                            <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm leading-tight">{user?.firstName} {user?.lastName}</span>
                            <span className="text-xs text-muted-foreground leading-tight">{user?.email}</span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-64 mb-2">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile" passHref>
                        <DropdownMenuItem>
                            <CircleUser className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/settings" passHref>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
