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

const formSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters."),
  customerId: z.string().min(5, "Customer ID must be at least 5 characters."),
  documentType: z.string({ required_error: "Please select a document type." }),
  document: z.instanceof(File).refine(file => file?.size > 0, "Document is required."),
});

export default function NewSubmissionPage() {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerName: "",
            customerId: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Submission Successful",
            description: `KYC documents for ${values.customerName} have been submitted.`,
            variant: "default",
        });
        form.reset();
    }

  return (
    <div className="flex justify-center items-start">
        <Card className="w-full max-w-2xl">
        <CardHeader>
            <CardTitle>New KYC Submission</CardTitle>
            <CardDescription>
            Fill in the details and upload the required documents for the new customer.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer ID</FormLabel>
                    <FormControl>
                        <Input placeholder="CUST-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
                            </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="document"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                    <FormLabel>Document Upload</FormLabel>
                    <FormControl>
                        <Input 
                        type="file" 
                        onChange={(e) => {
                            if (e.target.files) onChange(e.target.files[0]);
                        }} 
                        className="file:text-primary file:font-medium"
                        {...rest}
                        />
                    </FormControl>
                    <FormDescription>Upload a single PDF, JPG, or PNG file.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit">Submit for Review</Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
