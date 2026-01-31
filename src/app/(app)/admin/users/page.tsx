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
import { users as initialUsers, User, branchPerformanceData, districtPerformanceData } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";


const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters."),
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
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || 'Officer',
      branch: user?.branch || "",
      district: user?.district || "",
      status: user?.status || 'Active',
    },
  });
  const { toast } = useToast();

  const onSubmit = (data: z.infer<typeof userSchema>) => {
    const userToSave: User = {
        ...data,
        id: user?.id || `usr-${Math.random().toString(36).substring(2, 9)}`,
    };
    onSave(userToSave);
    toast({
        title: user?.id ? "User Updated" : "User Created",
        description: `${userToSave.name} has been successfully saved.`,
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
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
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
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const userAvatars = PlaceHolderImages.filter(img => img.id.includes('user-avatar'));
    const { toast } = useToast();

    const handleSaveUser = (user: User) => {
        setUsers(currentUsers => {
            const userExists = currentUsers.some(u => u.id === user.id);
            if (userExists) {
                return currentUsers.map(u => u.id === user.id ? user : u);
            }
            return [...currentUsers, user];
        });
    };

    const handleToggleStatus = (userId: string) => {
        setUsers(currentUsers =>
            currentUsers.map(u =>
                u.id === userId ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
            )
        );
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
                        {users.map((user, index) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={userAvatars[index % userAvatars.length].imageUrl} alt={user.name} data-ai-hint="person portrait" />
                                            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="font-medium">{user.name}</p>
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
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
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
