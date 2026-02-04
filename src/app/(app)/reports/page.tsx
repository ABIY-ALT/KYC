
"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  branchPerformanceData,
  officerPerformanceData,
  districtPerformanceData,
  type Submission,
} from '@/lib/data';
import { useSubmissions } from '@/context/submissions-context';
import { Calendar as CalendarIcon, Download, FileText, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from "react-day-picker";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Helper to get unique values for filters
const uniqueBranches = [...new Set(branchPerformanceData.map(item => item.name))];
const uniqueOfficers = [...new Set(officerPerformanceData.map(item => item.name))];
const uniqueStatuses: Submission['status'][] = ['Pending', 'Approved', 'Rejected', 'Amendment', 'Escalated'];
const uniqueDistricts = [...new Set(districtPerformanceData.map(item => item.name))];

export default function ReportsPage() {
  const { toast } = useToast();
  const { submissions } = useSubmissions();
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState({
    branch: 'all',
    officer: 'all',
    status: 'all',
    district: 'all',
  });
  const [reportData, setReportData] = useState<Submission[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleGenerateReport = () => {
    let filteredData = submissions;

    if (date?.from) {
        const toDate = date.to ? new Date(date.to) : new Date(date.from);
        toDate.setHours(23, 59, 59, 999); // Include the whole end day

        filteredData = filteredData.filter(s => {
            const submittedDate = new Date(s.submittedAt);
            return submittedDate >= date.from! && submittedDate <= toDate;
        });
    }

    if (filters.branch !== 'all') {
      filteredData = filteredData.filter(s => s.branch === filters.branch);
    }
    
    if (filters.district !== 'all') {
        toast({
            title: "Filter Notice",
            description: "District filtering is not fully implemented in this demo as branch-to-district mapping is not available.",
        })
    }

    if (filters.officer !== 'all') {
      filteredData = filteredData.filter(s => s.officer === filters.officer);
    }

    if (filters.status !== 'all') {
      filteredData = filteredData.filter(s => s.status === filters.status);
    }

    setReportData(filteredData);
    setReportGenerated(true);
    toast({
        title: "Report Generated",
        description: `Found ${filteredData.length} records matching your criteria.`,
    });
  };
  
  const handleExport = () => {
    if (reportData.length === 0) {
        toast({
            title: "Export Failed",
            description: "No data to export. Please generate a report first.",
            variant: "destructive"
        });
        return;
    }
    // Simple CSV export logic
    const headers = ['ID', 'Customer Name', 'Branch', 'Status', 'Submitted At', 'Officer', 'Document Type'];
    const csvContent = [
        headers.join(','),
        ...reportData.map(row => [row.id, `"${row.customerName}"`, row.branch, row.status, row.submittedAt, `"${row.officer}"`, `"${row.documentType}"`].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `kyc_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: "Export Successful",
            description: "The report has been downloaded as a CSV file.",
        });
    }
  }

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" /> Report Generation
          </CardTitle>
          <CardDescription>
            Select your criteria and generate a custom KYC report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            
            <div className="grid gap-2">
                <Label htmlFor="date-range">Date Range</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className="justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={filters.branch} onValueChange={v => handleFilterChange('branch', v)}>
                <SelectTrigger id="branch"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {uniqueBranches.map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="officer">Officer</Label>
              <Select value={filters.officer} onValueChange={v => handleFilterChange('officer', v)}>
                <SelectTrigger id="officer"><SelectValue placeholder="Select Officer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Officers</SelectItem>
                  {uniqueOfficers.map(officer => <SelectItem key={officer} value={officer}>{officer}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
                <SelectTrigger id="status"><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="district">District</Label>
              <Select value={filters.district} onValueChange={v => handleFilterChange('district', v)}>
                <SelectTrigger id="district"><SelectValue placeholder="Select District" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {uniqueDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleGenerateReport}>Generate Report</Button>
            <Button variant="outline" onClick={handleExport} disabled={!reportGenerated || reportData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {reportGenerated && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Report Results
                </CardTitle>
                <CardDescription>
                    Displaying {reportData.length} submissions based on your criteria.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="hidden sm:table-cell">Branch</TableHead>
                            <TableHead className="hidden md:table-cell">Officer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell text-right">Submitted At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length > 0 ? (
                            reportData.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">{sub.customerName}</div>
                                        <div className="text-sm text-muted-foreground">{sub.id}</div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{sub.branch}</TableCell>
                                    <TableCell className="hidden md:table-cell">{sub.officer}</TableCell>
                                    <TableCell>
                                        <Badge variant={getBadgeVariant(sub.status)}>{sub.status}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-right">{format(new Date(sub.submittedAt), "PPP")}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No results found for the selected filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
