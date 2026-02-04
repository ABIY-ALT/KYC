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
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';

export default function ReviewQueuePage() {
  const router = useRouter();
  const { submissions } = useSubmissions();
  const pendingSubmissions = submissions.filter(s => s.status === 'Pending' || s.status === 'Escalated');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Queue</CardTitle>
        <CardDescription>
          Submissions awaiting review and approval.
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
            {pendingSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  <div className="font-medium">{submission.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    ID: {submission.id}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{submission.branch}</TableCell>
                <TableCell>
                  <Badge variant={submission.status === 'Escalated' ? 'destructive' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/review-queue/${submission.id}`)}>
                        Review Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Assign</DropdownMenuItem>
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
