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
import { submissions } from "@/lib/data";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function EscalationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const escalatedSubmissions = submissions.filter(s => s.status === 'Escalated');

  const handleAction = (action: string, submissionId: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Action '${action}' triggered for submission ${submissionId}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation Management</CardTitle>
        <CardDescription>
          Review and resolve high-risk cases that have been escalated for supervisor attention.
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
            {escalatedSubmissions.length > 0 ? (
              escalatedSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="font-medium">{submission.customerName}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      ID: {submission.id}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{submission.branch}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{submission.status}</Badge>
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
                        <DropdownMenuLabel>Resolution Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/review-queue/${submission.id}`)}>
                          Review Full Case
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('Assign Resolution', submission.id)}>
                          Assign Resolution
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('Override Decision', submission.id)}>
                          Override Decision
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No cases are currently escalated.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
