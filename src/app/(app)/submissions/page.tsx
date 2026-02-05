
"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission, type User as UserData } from "@/lib/data";
import { MoreHorizontal, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


export default function MySubmissionsPage() {
  const router = useRouter();
  const { submissions } = useSubmissions();
  
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const userSubmissions: Submission[] = useMemo(() => {
    if (userData && (userData.role === 'Officer' || userData.role === 'Branch Manager')) {
      // For officers, filter submissions by their assigned branch
      return submissions.filter(s => s.branch === userData.branch);
    }
    if (userData && (userData.role === 'Admin' || userData.role === 'Supervisor')) {
      // Admins and supervisors see all submissions
      return submissions;
    }
    // Default to empty or all based on desired behavior before user data loads
    return submissions;
  }, [submissions, userData]);

  const getBadgeVariant = (status: Submission['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
      case 'Amended - Pending Review':
        return 'secondary';
      case 'Escalated':
        return 'destructive';
      case 'Rejected':
        return 'destructive';
      case 'Amendment':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="gradient-text">My Submissions</CardTitle>
        <CardDescription>
          A list of all recent KYC submissions for your branch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSubmissions.map((submission) => (
              <TableRow key={submission.id} className="hover-lift">
                <TableCell className="cursor-pointer" onClick={() => router.push(`/review-queue/${submission.id}`)}>
                  <div className="font-medium">{submission.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    ID: {submission.id}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/review-queue/${submission.id}`)}>{submission.branch}</TableCell>
                <TableCell className="cursor-pointer" onClick={() => router.push(`/review-queue/${submission.id}`)}>
                  <Badge variant={getBadgeVariant(submission.status)}>
                    {submission.status === 'Amended - Pending Review' ? 'Pending Review' : submission.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => router.push(`/review-queue/${submission.id}`)}>
                  {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                    {submission.status === 'Amendment' ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/review-queue/${submission.id}`);
                            }}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Re-Upload
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/review-queue/${submission.id}`);
                            }}
                        >
                            View Details
                        </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
