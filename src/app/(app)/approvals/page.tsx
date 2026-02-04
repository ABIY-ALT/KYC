"use client";

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
import { type Submission } from "@/lib/data";
import { MoreHorizontal, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function ApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { submissions, updateSubmissionStatus } = useSubmissions();

  // For this page, we'll consider 'Pending' submissions as those awaiting final approval.
  const submissionsForApproval = submissions.filter(s => s.status === 'Pending');

  const handleApprove = (submissionId: string) => {
    updateSubmissionStatus(submissionId, 'Approved');
    
    toast({
        title: "Submission Approved",
        description: `Submission ${submissionId} has been successfully approved.`,
    });
    // The submission will disappear from this list automatically on re-render.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Approvals</CardTitle>
        <CardDescription>
          Review and grant final approval for compliant KYC submissions.
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
            {submissionsForApproval.length > 0 ? (
                submissionsForApproval.map((submission) => (
                <TableRow key={submission.id}>
                    <TableCell>
                        <div className="font-medium">{submission.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                            ID: {submission.id}
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{submission.branch}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{submission.status}</Badge>
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
                                <DropdownMenuItem onClick={() => router.push(`/review-queue/${submission.id}`)}>
                                    View Full Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApprove(submission.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No submissions are currently awaiting approval.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
