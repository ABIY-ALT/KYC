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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { officerPerformanceData } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Users, FileStack, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";


export default function OfficerPerformancePage() {
    const userAvatars = PlaceHolderImages.filter(img => img.id.includes('user-avatar'));
    
    const totalCases = officerPerformanceData.reduce((acc, officer) => acc + officer.casesReviewed, 0);
    const avgApprovalRate = officerPerformanceData.reduce((acc, officer, _, arr) => acc + officer.approvalRate / arr.length, 0);
    const avgProcessingTime = officerPerformanceData.reduce((acc, officer, _, arr) => acc + officer.avgProcessingTime / arr.length, 0);

    const kpis = [
        { label: "Total Cases Reviewed", value: totalCases.toLocaleString(), icon: FileStack },
        { label: "Avg. Approval Rate", value: `${avgApprovalRate.toFixed(1)}%`, icon: TrendingUp },
        { label: "Avg. Processing Time", value: `${avgProcessingTime.toFixed(1)} hrs`, icon: Clock },
        { label: "Total Officers", value: officerPerformanceData.length, icon: Users },
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
                            <kpi.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Individual Officer Performance</CardTitle>
                    <CardDescription>
                        Detailed performance metrics for each KYC officer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Officer</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead className="text-right">Cases Reviewed</TableHead>
                                <TableHead>Approval Rate</TableHead>
                                <TableHead>Amendment Rate</TableHead>
                                <TableHead className="text-right">Avg. Time (hrs)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {officerPerformanceData.map((officer, index) => (
                                <TableRow key={officer.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={userAvatars[index % userAvatars.length].imageUrl} alt={officer.name} data-ai-hint="person portrait" />
                                                <AvatarFallback>{officer.name.slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none">{officer.name}</p>
                                                <p className="text-xs text-muted-foreground">{officer.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{officer.team}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{officer.casesReviewed}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={officer.approvalRate} aria-label={`${officer.approvalRate}% approval rate`} />
                                            <span className="text-xs text-muted-foreground">{officer.approvalRate}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={officer.amendmentRate} aria-label={`${officer.amendmentRate}% amendment rate`} />
                                            <span className="text-xs text-muted-foreground">{officer.amendmentRate}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{officer.avgProcessingTime.toFixed(1)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
