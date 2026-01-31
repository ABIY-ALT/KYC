"use client";

import { useState } from "react";
import { runComplianceCheck } from "@/app/(app)/review-queue/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, CheckCircle, AlertCircle } from "lucide-react";
import type { AiAssistedComplianceCheckOutput } from "@/ai/flows/ai-assisted-compliance-check";
import { useToast } from "@/hooks/use-toast";

type AIResult = AiAssistedComplianceCheckOutput & { error?: string };

export function AIComplianceCheck({ documentText }: { documentText: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AIResult | null>(null);
    const { toast } = useToast();


    const handleRunCheck = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const aiResult = await runComplianceCheck(documentText);
            if ("error" in aiResult) {
                 toast({
                    title: "AI Check Failed",
                    description: aiResult.error,
                    variant: "destructive",
                });
            }
            setResult(aiResult as AIResult);
        } catch (e) {
            toast({
                title: "AI Check Failed",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot />
                    AI Compliance Check
                </CardTitle>
                <CardDescription>
                    Pre-screen the document against regulatory guidelines for potential issues.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleRunCheck} disabled={isLoading} className="w-full">
                    {isLoading ? "Analyzing Document..." : "Run AI Check"}
                </Button>
                {isLoading && (
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                )}
                {result && !result.error && (
                    <div className="pt-2">
                        <Alert variant={result.isCompliant ? "default" : "destructive"}>
                            {result.isCompliant ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertTitle className="font-bold">
                                {result.isCompliant ? "Compliance Check Passed" : "Potential Issues Found"}
                            </AlertTitle>
                            <AlertDescription className="mt-2">
                                <p className="font-semibold mb-1">AI Summary:</p>
                                <p className="text-xs">{result.complianceSummary}</p>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
