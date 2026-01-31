import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <Wrench className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This page is under construction. Check back later!</p>
                </CardContent>
            </Card>
        </div>
    );
}
