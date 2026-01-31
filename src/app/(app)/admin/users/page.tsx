"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Edit, UserX, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type User, branchPerformanceData, districtPerformanceData } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useFirestore, useCollection, setDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters."),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(['Admin', 'Supervisor', 'Officer', 'Branch Manager']),
  branch: z.string().min(1, "Branch is required."),
  district: z.string().min(1, "District is required."),
  status: z.enum(['Active', 'Inactive']),
});

const userRoles: User['role'][] = ['Admin', 'Supervisor', 'Officer', 'Branch Manager'];
const uniqueBranches = [...new Set(branchPerformanceData.map(item => item.name))];
const uniqueDistricts = [...new Set(districtPerformanceData.map(item => item.name))];

function UserForm({ user, onSave, onOpenChange }: { user: Partial<User> | null, onSave: (data: User) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: user?.id,
      username: user?.username || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      role: user?.role || 'Officer',
      branch: user?.branch || "",
      district: user?.district || "",
      status: user?.status || 'Active',
    },
  });
  const { toast } = useToast();

  const onSubmit = (data: z.infer<typeof userSchema>) => {
    const firestore = useFirestore();
    const userToSave: User = {
        ...data,
        id: user?.id || doc(collection(firestore, 'users')).id,
    };
    onSave(userToSave);
    toast({
        title: user?.id ? "User Updated" : "User Created",
        description: `${userToSave.firstName} ${userToSave.lastName} has been successfully saved.`,
    });
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{user?.id ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogDescription>
          {user?.id ? "Update the user's details below." : "Fill in the details to create a new user."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input placeholder="johndoe" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {userRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="branch" render={({ field }) => (
                <FormItem>
                    <FormLabel>Branch</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a branch" /></SelectTrigger></FormControl>
                        <SelectContent>
                           {uniqueBranches.map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                           <SelectItem value="Corporate">Corporate</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="district" render={({ field }) => (
                <FormItem>
                    <FormLabel>District</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a district" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {uniqueDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
                            <SelectItem value="Corporate">Corporate</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Status</FormLabel>
                        <FormMessage />
                    </div>
                    <FormControl>
                        <Switch
                            checked={field.value === 'Active'}
                            onCheckedChange={checked => field.onChange(checked ? 'Active' : 'Inactive')}
                        />
                    </FormControl>
                </FormItem>
            )} />
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save User</Button>
            </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function UserManagementPage() {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const userAvatars = PlaceHolderImages.filter(img => img.id.includes('user-avatar'));
    const { toast } = useToast();

    const handleSaveUser = (user: User) => {
        const userRef = doc(firestore, 'users', user.id);
        setDocumentNonBlocking(userRef, user, { merge: true });
    };

    const handleToggleStatus = (userId: string, currentStatus: 'Active' | 'Inactive') => {
        const userRef = doc(firestore, 'users', userId);
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        updateDocumentNonBlocking(userRef, { status: newStatus });

        toast({
            title: "User Status Updated",
            description: "The user's status has been changed.",
        });
    };
    
    const handleAddNewUser = () => {
        setEditingUser(null);
        setIsDialogOpen(true);
    }
    
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="grid gap-2">
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        Add, edit, and manage user accounts and their roles.
                    </CardDescription>
                </div>
                <Button onClick={handleAddNewUser}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="hidden sm:table-cell">Role</TableHead>
                            <TableHead className="hidden md:table-cell">Branch / District</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 5 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="grid gap-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && users && users.map((user, index) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={userAvatars[index % userAvatars.length].imageUrl} alt={`${user.firstName} ${user.lastName}`} data-ai-hint="person portrait" />
                                            <AvatarFallback>{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{user.role}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="font-medium">{user.branch}</div>
                                    <div className="text-sm text-muted-foreground">{user.district}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'Active' ? 'default' : 'outline'}>{user.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                                                {user.status === 'Active' ? (
                                                    <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                                                ) : (
                                                    <><UserCheck className="mr-2 h-4 w-4" /> Activate</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        {isDialogOpen && <UserForm user={editingUser} onSave={handleSaveUser} onOpenChange={setIsDialogOpen} />}
    </Dialog>
  );
}
    