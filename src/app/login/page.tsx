'use client';

import { useRouter, type NextRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from "framer-motion";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Logo from '@/components/logo';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

// Admin credentials for demo purposes
const ADMIN_EMAIL = 'alex.ray@kycflow.com';
const ADMIN_PASSWORD = 'password123';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router: NextRouter = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // The onAuthStateChanged listener in the provider will handle the redirect.
    } catch (error: any) {
        // Special handling for the demo admin user.
        // `auth/invalid-credential` can mean user not found OR wrong password.
        // We attempt to create the user if it seems they don't exist.
        if (values.email === ADMIN_EMAIL && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
            try {
                // Attempt to create the user with the correct admin credentials.
                const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                const authUser = userCredential.user;
                const adminUser: User = {
                    id: authUser.uid,
                    username: 'aray',
                    firstName: 'Alex',
                    lastName: 'Ray',
                    email: ADMIN_EMAIL,
                    role: 'Admin',
                    branch: 'Corporate',
                    district: 'Corporate',
                    status: 'Active',
                };
                const userRef = doc(firestore, 'users', authUser.uid);
                // Use await here to ensure the user doc is created before the page might redirect.
                await setDoc(userRef, adminUser);
                
                toast({
                    title: "Admin Account Created",
                    description: "Welcome, Admin! Your account has been set up.",
                });
                // The onAuthStateChanged listener will now handle the redirect.
                return;
            } catch (creationError: any) {
                 // If creation fails, it's likely because the user already exists, which means the original password was wrong.
                 if (creationError.code === 'auth/email-already-in-use') {
                     toast({
                        variant: "destructive",
                        title: "Login Failed",
                        description: "Invalid password for the admin account. Please try again.",
                    });
                 } else {
                    toast({
                        variant: "destructive",
                        title: "Admin Setup Failed",
                        description: creationError.message || "Could not create the admin demo user.",
                    });
                 }
                return;
            }
        }
      
      // For non-admin users or other errors
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  if (isUserLoading || (!isUserLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-muted-foreground mb-6">Sign in to your KYC Flow account.</p>


        <Alert className="mb-6 text-left">
            <Info className="h-4 w-4" />
            <AlertTitle>Demo Admin Credentials</AlertTitle>
            <AlertDescription>
              <p>Use the following to sign in as an administrator:</p>
              <p className="font-semibold">Email: {ADMIN_EMAIL}</p>
              <p className="font-semibold">Password: {ADMIN_PASSWORD}</p>
            </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Username" {...field} className="p-3 focus:ring-2 focus:ring-primary outline-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} className="p-3 focus:ring-2 focus:ring-primary outline-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button type="submit" className="w-full py-3 font-medium text-base" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Logging In...' : 'Login'}
              </Button>
            </motion.div>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
