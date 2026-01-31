"use client";

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
import { branchPerformanceData } from "@/lib/data";

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
                        Detailed performance metrics for each branch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                            {branchPerformanceData.map((branch) => (
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
