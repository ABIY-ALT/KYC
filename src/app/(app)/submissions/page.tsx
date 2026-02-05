
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
import { MoreHorizontal } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle>My Submissions</CardTitle>
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
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSubmissions.map((submission) => (
              <TableRow key={submission.id} className="cursor-pointer" onClick={() => router.push(`/review-queue/${submission.id}`)}>
                <TableCell>
                  <div className="font-medium">{submission.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    ID: {submission.id}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{submission.branch}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(submission.status)}>
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/review-queue/${submission.id}`)}>
                        View Details
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
  );
}
