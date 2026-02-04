"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { branchPerformanceData, districtPerformanceData } from "@/lib/data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";


// This mapping is inferred from sample data, in a real app this would come from a DB relation.
const branchToDistrictMap: { [key: string]: string } = {
    'Downtown': 'Metro District',
    'Uptown': 'Metro District',
    'Eastside': 'Suburban District',
    'Westend': 'Suburban District',
    'North': 'Northern District',
};
const uniqueDistricts = [...new Set(districtPerformanceData.map(item => item.name))];

export default function BranchPerformancePage() {
    const totalSubmissions = branchPerformanceData.reduce((acc, branch) => acc + branch.totalSubmissions, 0);
    const avgApprovalRate = branchPerformanceData.reduce((acc, branch, _, arr) => acc + branch.approvalRate / arr.length, 0);
    const totalAmendments = branchPerformanceData.reduce((acc, branch) => acc + branch.amendmentCount, 0);
    const avgTurnaround = branchPerformanceData.reduce((acc, branch, _, arr) => acc + branch.avgTurnaroundTime / arr.length, 0);

    const kpis = [
        { label: "Total KYC Volume", value: totalSubmissions.toLocaleString(), unit: "Submissions" },
        { label: "Avg. Approval Rate", value: `${avgApprovalRate.toFixed(1)}%`, unit: "Across all branches" },
        { label: "Total Amendments", value: totalAmendments.toLocaleString(), unit: "Requests" },
        { label: "Avg. Turnaround", value: `${avgTurnaround.toFixed(1)} days`, unit: "From submission to decision" },
    ];
    
    const [filteredData, setFilteredData] = useState(branchPerformanceData);
    const [filters, setFilters] = useState({
        name: '',
        district: 'all',
    });

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };
    
    const handleResetFilters = () => {
        setFilters({ name: '', district: 'all' });
    }

    useEffect(() => {
        let data = branchPerformanceData;

        if (filters.district !== 'all') {
            data = data.filter(branch => branchToDistrictMap[branch.name] === filters.district);
        }
        
        if (filters.name) {
            data = data.filter(branch => branch.name.toLowerCase().includes(filters.name.toLowerCase()));
        }

        setFilteredData(data);
    }, [filters]);


    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {kpis.map((kpi, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {kpi.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                            <p className="text-xs text-muted-foreground">{kpi.unit}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Branch Breakdown</CardTitle>
                    <CardDescription>
                        Detailed performance metrics for each branch. Use the filters below to refine the list.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col md:flex-row items-end gap-4 mb-6 pb-6 border-b">
                        <div className="grid gap-2 w-full md:max-w-xs">
                            <Label htmlFor="search-filter">Search by Branch Name</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search-filter"
                                    type="search"
                                    placeholder="e.g., Downtown"
                                    className="pl-8"
                                    value={filters.name}
                                    onChange={e => handleFilterChange('name', e.target.value)}
                                />
                            </div>
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
                        <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Branch</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                                <TableHead className="text-right">Approval Rate</TableHead>
                                <TableHead className="text-right">Amendments</TableHead>
                                <TableHead className="text-right">Avg. Turnaround</TableHead>
                                <TableHead>SLA Compliance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length > 0 ? (
                                filteredData.map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">{branch.name}</TableCell>
                                        <TableCell className="text-right">{branch.totalSubmissions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{branch.approvalRate.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right">{branch.amendmentCount}</TableCell>
                                        <TableCell className="text-right">{branch.avgTurnaroundTime.toFixed(1)}d</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={branch.slaCompliance} aria-label={`${branch.slaCompliance}% SLA Compliance`} />
                                                <span className="text-xs text-muted-foreground">{branch.slaCompliance}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No branches found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
