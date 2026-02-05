
"use client";

import { useMemo, useState } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission, type User as UserData } from "@/lib/data";
import { MoreHorizontal, RefreshCcw, FileText } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AmendmentRequestInfoModal } from '@/components/amendment-request-info-modal';

export default function MySubmissionsPage() {
  const router = useRouter();
  const { submissions } = useSubmissions();
  const [modalSubmission, setModalSubmission] = useState<Submission | null>(null);
  
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userData } = useDoc<UserData>(userDocRef);

  const userSubmissions: Submission[] = useMemo(() => {
    if (userData && (userData.role === 'Officer' || userData.role === 'Branch Manager')) {
      return submissions.filter(s => s.branch === userData.branch);
    }
    if (userData && (userData.role === 'Admin' || userData.role === 'Supervisor')) {
      return submissions;
    }
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
  
  const getStatusText = (status: Submission['status']) => {
    if (status === 'Amended - Pending Review') return 'Pending Review';
    if (status === 'Amendment') return 'Action Required';
    return status;
  }

  return (
    <>
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
              {userSubmissions.length > 0 ? (
                userSubmissions.map((submission) => (
                  <TableRow key={submission.id} className="hover-lift">
                    <TableCell>
                      <div className="font-medium">{submission.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        ID: {submission.id}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{submission.branch}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(submission.status)}>
                        {getStatusText(submission.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/review-queue/${submission.id}`)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span>View Details</span>
                              </DropdownMenuItem>
                              {submission.status === 'Amendment' && (
                                  <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                          setModalSubmission(submission);
                                      }}
                                  >
                                      <RefreshCcw className="mr-2 h-4 w-4" />
                                      <span>Re-Upload</span>
                                  </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AmendmentRequestInfoModal 
        submission={modalSubmission}
        onClose={() => setModalSubmission(null)}
      />
    </>
  );
}
