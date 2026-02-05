
"use client";

import { useMemo } from "react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { kpiData, submissionTrendData, type User as UserData } from "@/lib/data";
import { useSubmissions } from "@/context/submissions-context";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


export default function DashboardPage() {
    const { submissions } = useSubmissions();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
    const { data: userData } = useDoc<UserData>(userDocRef);

    const userAvatars = PlaceHolderImages.filter(img => img.id.includes('user-avatar'));

    const recentSubmissions = useMemo(() => {
        let subs = submissions;
        if (userData && (userData.role === 'Officer' || userData.role === 'Branch Manager')) {
            subs = subs.filter(s => s.branch === userData.branch);
        }
        return subs.slice(0, 5);
    }, [submissions, userData]);

    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {kpiData.map((kpi, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {kpi.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value.toLocaleString()}</div>
                            <p className={`text-xs ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {kpi.change >= 0 ? '+' : ''}{kpi.change}% from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Submission Trends</CardTitle>
                        <CardDescription>Monthly submission volume for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{ submissions: { label: 'Submissions', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={submissionTrendData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="submissions" fill="var(--color-submissions)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Submissions</CardTitle>
                        <CardDescription>
                            A list of the most recent submissions from your branch.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {recentSubmissions.map((submission, index) => (
                            <div key={submission.id} className="flex items-center gap-4">
                                <Avatar className="hidden h-9 w-9 sm:flex">
                                    <AvatarImage src={userAvatars[index % userAvatars.length].imageUrl} alt="Avatar" data-ai-hint={userAvatars[index % userAvatars.length].imageHint} />
                                    <AvatarFallback>{submission.customerName.slice(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none">
                                        {submission.customerName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {submission.branch}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">
                                    <Badge variant={
                                        submission.status === 'Approved' ? 'default'
                                        : submission.status === 'Pending' ? 'secondary'
                                        : submission.status === 'Escalated' ? 'destructive'
                                        : 'outline'
                                    }>{submission.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
