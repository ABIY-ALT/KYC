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
import { districtPerformanceData } from "@/lib/data";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function DistrictPerformancePage() {
    const totalSubmissions = districtPerformanceData.reduce((acc, district) => acc + district.totalSubmissions, 0);
    const avgApprovalRate = districtPerformanceData.length > 0 ? districtPerformanceData.reduce((acc, district) => acc + district.approvalRate, 0) / districtPerformanceData.length : 0;
    const avgTurnaround = districtPerformanceData.length > 0 ? districtPerformanceData.reduce((acc, district) => acc + district.avgTurnaroundTime, 0) / districtPerformanceData.length : 0;
    const totalBranches = districtPerformanceData.reduce((acc, district) => acc + district.branchCount, 0);

    const kpis = [
        { label: "Total KYC Volume", value: totalSubmissions.toLocaleString() },
        { label: "Total Branches", value: totalBranches },
        { label: "Avg. Approval Rate", value: `${avgApprovalRate.toFixed(1)}%` },
        { label: "Avg. Turnaround", value: `${avgTurnaround.toFixed(1)} days` },
    ];
    
    const chartConfig = {
        totalSubmissions: {
            label: 'Submissions',
            color: 'hsl(var(--primary))',
        },
    };

    const [filteredData, setFilteredData] = useState(districtPerformanceData);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const data = districtPerformanceData.filter(district =>
            district.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(data);
    }, [searchTerm]);

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {kpis.map((kpi, index) => (
                    <Card key={index} className="hover-lift">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {kpi.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold animate-pulse-glow">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-5">
                <Card className="lg:col-span-3 hover-lift">
                    <CardHeader>
                        <CardTitle className="gradient-text">District Breakdown</CardTitle>
                        <CardDescription>
                            Aggregated performance metrics for each district. Use the filter to refine the list.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-end gap-4 mb-6 pb-6 border-b">
                            <div className="grid gap-2 w-full md:max-w-xs">
                                <Label htmlFor="search-filter">Search by District Name</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search-filter"
                                        type="search"
                                        placeholder="e.g., Metro District"
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => setSearchTerm('')}>Reset</Button>
                        </div>
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
                                {filteredData.length > 0 ? (
                                    filteredData.map((district) => (
                                        <TableRow key={district.id} className="hover-lift">
                                            <TableCell className="font-medium">{district.name}</TableCell>
                                            <TableCell className="text-right">{district.totalSubmissions.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{district.approvalRate.toFixed(1)}%</TableCell>
                                            <TableCell className="text-right">{district.avgTurnaroundTime.toFixed(1)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={district.slaCompliance} aria-label={`${district.slaCompliance}% SLA Compliance`} className="animate-shimmer" />
                                                    <span className="text-xs text-muted-foreground">{district.slaCompliance}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No districts found for "{searchTerm}".
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 hover-lift">
                     <CardHeader>
                        <CardTitle className="gradient-text">District Volume Comparison</CardTitle>
                        <CardDescription>Comparison of submission volumes across districts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <BarChart
                                accessibilityLayer
                                data={filteredData}
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
                                    width={80}
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
