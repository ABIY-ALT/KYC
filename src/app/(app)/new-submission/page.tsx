"use client"

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Building, Clock } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  documentType: z.string({ required_error: "Please select a document type." }),
  documents: z.array(z.instanceof(File))
    .nonempty("At least one document is required.")
    .refine(files => files.every(file => file.size > 0), "One of the files is empty."),
});

// Mock user data for "automatic branch tagging"
const MOCK_USER_BRANCH = "Downtown";

export default function NewSubmissionPage() {
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            documents: [],
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log({
            ...values,
            branch: MOCK_USER_BRANCH,
            timestamp: new Date().toISOString(),
        });
        toast({
            title: "Submission Successful",
            description: `${values.documents.length} document(s) have been submitted for branch ${MOCK_USER_BRANCH}.`,
            variant: "default",
        });
        form.reset();
    }

  return (
    <div className="flex justify-center items-start">
        <Card className="w-full max-w-2xl hover-lift">
        <CardHeader>
            <CardTitle className="gradient-text">New KYC Submission</CardTitle>
            <CardDescription>
            Upload customer documents for review. The submission will be automatically tagged with your branch and the current timestamp.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">Branch</p>
                        <p className="font-medium">{MOCK_USER_BRANCH}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">Submission Time</p>
                        <p className="font-medium">
                            {currentTime ? format(currentTime, "PPP p") : "Loading time..."}
                        </p>
                    </div>
                </div>
            </div>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a document type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="passport">Passport</SelectItem>
                                <SelectItem value="drivers_license">Driver's License</SelectItem>
                                <SelectItem value="national_id">National ID Card</SelectItem>
                                <SelectItem value="utility_bill">Utility Bill</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="documents"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                    <FormLabel>Document Uploads</FormLabel>
                    <FormControl>
                        <Input
                            {...fieldProps}
                            type="file"
                            multiple
                            onChange={(event) =>
                              onChange(event.target.files && Array.from(event.target.files))
                            }
                            className="file:text-primary file:font-medium"
                        />
                    </FormControl>
                    <FormDescription>Upload one or more PDF, JPG, or PNG files.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {form.watch("documents") && form.watch("documents").length > 0 && (
                    <div className="space-y-2">
                        <Label>Selected files:</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border max-h-48 overflow-y-auto">
                            {form.watch("documents").map((file: File, index) => (
                                <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                            ))}
                        </ul>
                    </div>
                )}

                <Button type="submit">Submit for Review</Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
