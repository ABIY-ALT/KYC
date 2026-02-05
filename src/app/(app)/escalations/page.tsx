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
import { type Submission, districtPerformanceData } from "@/lib/data";
import { MoreHorizontal, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Mapping to enable filtering by district
const branchToDistrictMap: { [key: string]: string } = {
    'Downtown': 'Metro District',
    'Uptown': 'Metro District',
    'Eastside': 'Suburban District',
    'Westend': 'Suburban District',
    'North': 'Northern District',
};
const uniqueDistricts = [...new Set(districtPerformanceData.map(item => item.name))];


export default function EscalationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { submissions, updateSubmissionStatus } = useSubmissions();
  
  const [filters, setFilters] = useState({
    branch: 'all',
    district: 'all',
    searchTerm: '',
  });

  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);

  const uniqueBranches = [...new Set(submissions.map(s => s.branch))];

  useEffect(() => {
    // Start with submissions that are escalated
    let data = submissions.filter(s => s.status === 'Escalated');

    if (filters.branch !== 'all') {
        data = data.filter(s => s.branch === filters.branch);
    }
    
    if (filters.district !== 'all') {
        data = data.filter(s => branchToDistrictMap[s.branch] === filters.district);
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
  
  const handleAction = (action: 'Approve' | 'Reject', submissionId: string) => {
    const newStatus = action === 'Approve' ? 'Approved' : 'Rejected';
    updateSubmissionStatus(submissionId, newStatus);
    toast({
      title: `Submission ${action}d`,
      description: `Submission ${submissionId} has been resolved.`,
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
        <div className="flex flex-col md:flex-row items-end gap-4 mb-6 pb-6 border-b">
          <div className="grid gap-2 w-full md:max-w-xs">
            <Label htmlFor="search-filter">Search by Customer or ID</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-filter"
                type="search"
                placeholder="e.g., David Green or SUB004"
                className="pl-8"
                value={filters.searchTerm}
                onChange={e => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
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
          <div className="grid gap-2 w-full md:max-w-xs">
            <Label htmlFor="district-filter">Filter by District</Label>
            <Select value={filters.district} onValueChange={v => handleFilterChange('district', v)}>
              <SelectTrigger id="district-filter"><SelectValue placeholder="Select District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {uniqueDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
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
                        <DropdownMenuItem onClick={() => handleAction('Approve', submission.id)}>
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('Reject', submission.id)}>
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No cases are currently escalated or match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
