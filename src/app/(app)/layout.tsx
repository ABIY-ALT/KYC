'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as UserData } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionsProvider } from '@/context/submissions-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user: authUser, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userData, isLoading: isProfileLoading } = useDoc<UserData>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.replace('/login');
    }
  }, [authUser, isUserLoading, router]);

  // Show loading skeleton while either auth state or profile data is being determined.
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !authUser) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="flex-1 py-2 px-2 space-y-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-30">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  // If user is authenticated but no profile data is found, create a fallback object.
  // This prevents crashes if the Firestore doc doesn't exist yet (e.g. after signup).
  const displayUser = userData ?? (authUser ? { 
    id: authUser.uid,
    email: authUser.email || 'new.user@kycflow.com',
    firstName: 'New',
    lastName: 'User',
    username: authUser.email?.split('@')[0] || 'newuser',
    role: 'Officer',
    branch: 'Unassigned',
    district: 'Unassigned',
    status: 'Active',
  } : null);

  return (
    <SubmissionsProvider>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <AppSidebar user={displayUser} />
        <div className="flex flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SubmissionsProvider>
  );
}
