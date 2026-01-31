'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserData } from '@/lib/data';
import { users as mockUsers } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ShieldCheck, KeyRound } from 'lucide-react';


const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});


// Mock permissions based on role
const rolePermissions = {
    'Admin': ['Manage Users', 'Manage Settings', 'View All Reports', 'Override Decisions'],
    'Supervisor': ['View Reports', 'Override Decisions', 'Review Escalations'],
    'Officer': ['Review Submissions'],
    'Branch Manager': ['View Branch Reports'],
};

export default function ProfilePage() {
    const { isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // For demo purposes, we are consistently viewing/editing the 'usr-admin' profile.
    const adminId = 'usr-admin';
    const userDocRef = useMemoFirebase(() => doc(firestore, 'users', adminId), [firestore, adminId]);
    const { data: userData, isLoading: isProfileLoading } = useDoc<UserData>(userDocRef);

    // This effect ensures that the admin user exists in Firestore for the demo.
    // If not found, it's created from the mock data.
    useEffect(() => {
        if (!isProfileLoading && !userData && userDocRef) {
            const adminMockData = mockUsers.find(u => u.id === adminId);
            if (adminMockData) {
                // Using set with merge:false to create the document only if it doesn't exist.
                setDocumentNonBlocking(userDocRef, adminMockData, { merge: false });
            }
        }
    }, [isProfileLoading, userData, userDocRef, adminId]);


    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        values: {
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            email: userData?.email || '',
        }
    });

    // Sync form with fetched data
    useEffect(() => {
        if (userData) {
            profileForm.reset({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
            });
        }
    }, [userData, profileForm]);

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
        if (!userDocRef) return;
        updateDocumentNonBlocking(userDocRef, {
            firstName: data.firstName,
            lastName: data.lastName
        });
        toast({
            title: 'Profile Updated',
            description: 'Your personal information has been saved.',
        });
    };
    
    const onPasswordSubmit = () => {
        // In a real app, this would call Firebase Auth's password update method.
        // This is disabled for the demo anonymous user.
        toast({
            title: 'Password Change Disabled',
            description: 'Password changes are not available for anonymous demo users.',
            variant: 'destructive',
        });
        passwordForm.reset();
    };

    const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1');

    if (isUserLoading || isProfileLoading || !userData) {
        return (
             <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-64" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </CardHeader>
                </Card>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-32 mb-4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-40 mb-4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                </div>
            </div>
        );
    }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6">
            <Avatar className="h-24 w-24">
                <AvatarImage src={userAvatar?.imageUrl} alt={userData.firstName} data-ai-hint="person portrait" />
                <AvatarFallback>{userData.firstName?.[0]}{userData.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
                <CardTitle className="text-3xl">{userData.firstName} {userData.lastName}</CardTitle>
                <CardDescription className="text-base">{userData.email}</CardDescription>
                <div className="flex items-center gap-2 pt-2">
                    <Badge>{userData.role}</Badge>
                    <Badge variant="outline">{userData.branch}</Badge>
                </div>
            </div>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-4">
                     <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={profileForm.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input {...field} disabled /></FormControl>
                             <FormDescription>You cannot change your email address.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </form>
            </Form>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Change Password</CardTitle>
                <CardDescription>Update your account password. This is disabled for the anonymous demo user.</CardDescription>
            </CardHeader>
            <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="space-y-4">
                     <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl><Input type="password" {...field} disabled /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl><Input type="password" {...field} disabled /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl><Input type="password" {...field} disabled /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" disabled>Update Password</Button>
                </CardFooter>
            </form>
            </Form>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck /> Roles & Permissions</CardTitle>
                <CardDescription>
                    Your assigned role determines what you can see and do within the application. These are managed by your administrator.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     <div>
                        <Label className="text-xs text-muted-foreground">Your Role</Label>
                        <p className="font-semibold">{userData.role}</p>
                    </div>
                     <div>
                        <Label className="text-xs text-muted-foreground">Your Permissions</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                           {(rolePermissions[userData.role as keyof typeof rolePermissions] || []).map(permission => (
                               <Badge key={permission} variant="secondary">{permission}</Badge>
                           ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
