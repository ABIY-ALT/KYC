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

export default function AmendmentsPage() {
  const router = useRouter();
  const { submissions } = useSubmissions();
  const amendmentSubmissions = submissions.filter(s => s.status === 'Amendment');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amendment Management</CardTitle>
        <CardDescription>
          Review and process submissions that require amendments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Last Updated</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {amendmentSubmissions.length > 0 ? (
                amendmentSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                    <TableCell>
                    <div className="font-medium">{submission.customerName}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                        ID: {submission.id}
                    </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{submission.branch}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{submission.status}</Badge>
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
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Process Amendment</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No submissions require amendment.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
