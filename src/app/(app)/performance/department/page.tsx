"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, XAxis, YAxis, Legend } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { departmentKpiData, submissionTrendData, statusDistributionData } from "@/lib/data";

const chartConfigBar = {
    submissions: {
        label: "Submissions",
        color: "hsl(var(--primary))",
    },
};

const chartConfigPie = {
    count: {
        label: "Count",
    },
    ...statusDistributionData.reduce((acc, cur) => ({
        ...acc,
        [cur.status]: { label: cur.status, color: cur.fill }
    }), {})
};

export default function DepartmentPerformancePage() {
    return (
        <div className="flex flex-1 flex-col gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                {departmentKpiData.map((kpi, index) => {
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {kpi.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                                <p className={`text-xs ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {kpi.change >= 0 ? '+' : ''}{kpi.change}{kpi.unit}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Submission Volume Trends</CardTitle>
                        <CardDescription>Monthly submission volume for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ChartContainer config={chartConfigBar} className="w-full h-full">
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
                        <CardTitle>Workload Distribution</CardTitle>
                        <CardDescription>Breakdown of all submissions by current status.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                         <ChartContainer
                            config={chartConfigPie}
                            className="mx-auto aspect-square h-full"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={statusDistributionData}
                                    dataKey="count"
                                    nameKey="status"
                                    innerRadius={60}
                                    strokeWidth={5}
                                >
                                    {statusDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend content={({ payload }) => {
                                    return (
                                        <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
                                            {payload?.map((entry, index) => (
                                                <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-muted-foreground">{entry.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                }} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
