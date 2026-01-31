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
import { districtPerformanceData } from "@/lib/data";
import { Warehouse, TrendingUp, Clock, Building } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function DistrictPerformancePage() {
    const totalSubmissions = districtPerformanceData.reduce((acc, district) => acc + district.totalSubmissions, 0);
    const avgApprovalRate = districtPerformanceData.length > 0 ? districtPerformanceData.reduce((acc, district) => acc + district.approvalRate, 0) / districtPerformanceData.length : 0;
    const avgTurnaround = districtPerformanceData.length > 0 ? districtPerformanceData.reduce((acc, district) => acc + district.avgTurnaroundTime, 0) / districtPerformanceData.length : 0;
    const totalBranches = districtPerformanceData.reduce((acc, district) => acc + district.branchCount, 0);

    const kpis = [
        { label: "Total KYC Volume", value: totalSubmissions.toLocaleString(), icon: Warehouse },
        { label: "Total Branches", value: totalBranches, icon: Building },
        { label: "Avg. Approval Rate", value: `${avgApprovalRate.toFixed(1)}%`, icon: TrendingUp },
        { label: "Avg. Turnaround", value: `${avgTurnaround.toFixed(1)} days`, icon: Clock },
    ];
    
    const chartConfig = {
        totalSubmissions: {
            label: 'Submissions',
            color: 'hsl(var(--primary))',
        },
    };

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {kpis.map((kpi, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {kpi.label}
                            </CardTitle>
                            <kpi.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>District Breakdown</CardTitle>
                        <CardDescription>
                            Aggregated performance metrics for each district.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>District</TableHead>
                                    <TableHead className="text-right">Volume</TableHead>
                                    <TableHead className="text-right">Approval Rate</TableHead>
                                    <TableHead className="text-right">Avg. Turnaround (d)</TableHead>
                                    <TableHead>SLA Compliance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {districtPerformanceData.map((district) => (
                                    <TableRow key={district.id}>
                                        <TableCell className="font-medium">{district.name}</TableCell>
                                        <TableCell className="text-right">{district.totalSubmissions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{district.approvalRate.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right">{district.avgTurnaroundTime.toFixed(1)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={district.slaCompliance} aria-label={`${district.slaCompliance}% SLA Compliance`} />
                                                <span className="text-xs text-muted-foreground">{district.slaCompliance}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>District Volume Comparison</CardTitle>
                        <CardDescription>Comparison of submission volumes across districts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart
                                accessibilityLayer
                                data={districtPerformanceData}
                                layout="vertical"
                                margin={{ left: 10 }}
                            >
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    stroke="hsl(var(--muted-foreground))"
                                    className="text-xs"
                                    interval={0}
                                />
                                <XAxis dataKey="totalSubmissions" type="number" hide />
                                <CartesianGrid horizontal={false} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="totalSubmissions" fill="var(--color-totalSubmissions)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
