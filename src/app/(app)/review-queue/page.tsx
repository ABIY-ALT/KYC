"use client";

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { type Submission } from '@/lib/data';

export default function ReviewQueuePage() {
  const router = useRouter();
  const { submissions } = useSubmissions();
  
  const [filters, setFilters] = useState({
    status: 'all',
    branch: 'all',
    searchTerm: '',
  });
  
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);

  const uniqueBranches = [...new Set(submissions.map(s => s.branch))];

  useEffect(() => {
    // Initial data is only pending or escalated
    let data = submissions.filter(s => s.status === 'Pending' || s.status === 'Escalated');

    if (filters.status !== 'all') {
        data = data.filter(s => s.status === filters.status);
    }
    
    if (filters.branch !== 'all') {
        data = data.filter(s => s.branch === filters.branch);
    }
    
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        data = data.filter(s => 
            s.customerName.toLowerCase().includes(term) ||
            s.id.toLowerCase().includes(term)
        );
    }

    setFilteredSubmissions(data);
  }, [filters, submissions]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Queue</CardTitle>
        <CardDescription>
          Submissions awaiting review and approval. Use filters to narrow down the list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-end gap-4 mb-6 pb-6 border-b">
          <div className="grid gap-2 w-full md:max-w-xs">
            <Label htmlFor="search-filter">Search by Customer or ID</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-filter"
                type="search"
                placeholder="e.g., Alice Johnson or SUB001"
                className="pl-8"
                value={filters.searchTerm}
                onChange={e => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 w-full md:max-w-xs">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
              <SelectTrigger id="status-filter"><SelectValue placeholder="Select Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pending/Escalated</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-full md:max-w-xs">
            <Label htmlFor="branch-filter">Filter by Branch</Label>
            <Select value={filters.branch} onValueChange={v => handleFilterChange('branch', v)}>
              <SelectTrigger id="branch-filter"><SelectValue placeholder="Select Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {uniqueBranches.map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
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
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No submissions match the current filters.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
