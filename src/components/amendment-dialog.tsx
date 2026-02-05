"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import type { Submission, AmendmentRequest } from "@/lib/data";

const amendmentRequestSchema = z.object({
  type: z.enum(['REPLACE_EXISTING', 'ADD_NEW']),
  targetDocumentId: z.string().optional(),
  targetDocumentType: z.string().optional(),
  comment: z.string().min(10, "Comment must be at least 10 characters long."),
}).superRefine((data, ctx) => {
    if (data.type === 'REPLACE_EXISTING') {
        if (!data.targetDocumentId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "You must select an existing document to replace.",
                path: ["targetDocumentId"],
            });
        }
    }
    if (data.type === 'ADD_NEW') {
        if (!data.targetDocumentType || data.targetDocumentType.trim().length < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Document type is required when adding a new document.",
                path: ["targetDocumentType"],
            });
        }
    }
});


type AmendmentRequestValues = z.infer<typeof amendmentRequestSchema>;

type NewAmendmentRequest = Omit<AmendmentRequest, 'id' | 'requestedAt' | 'status'>;

interface AmendmentDialogProps {
    onStatusChange: (newStatus: Submission['status'], request: NewAmendmentRequest) => void, 
    submission: Submission, 
    trigger?: React.ReactNode
}

export function AmendmentDialog({ onStatusChange, submission, trigger }: AmendmentDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<AmendmentRequestValues>({
        resolver: zodResolver(amendmentRequestSchema),
        defaultValues: {
            type: 'REPLACE_EXISTING',
            targetDocumentId: undefined,
            targetDocumentType: '',
            comment: "",
        },
    });

    const amendmentType = form.watch('type');

    const handleSendRequest = (values: AmendmentRequestValues) => {
        let requestPayload: NewAmendmentRequest;

        if (values.type === 'REPLACE_EXISTING') {
            if (!values.targetDocumentId) return; // Should be caught by validation
            const selectedDoc = submission.documents.find(d => d.id === values.targetDocumentId);
            if (!selectedDoc) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not find the selected document to replace.' });
                return;
            }
            requestPayload = {
                type: 'REPLACE_EXISTING',
                targetDocumentId: values.targetDocumentId,
                targetDocumentType: selectedDoc.documentType,
                comment: values.comment,
            }
        } else { // ADD_NEW
            if (!values.targetDocumentType) return; // Also caught by validation
            requestPayload = {
                type: 'ADD_NEW',
                targetDocumentType: values.targetDocumentType,
                comment: values.comment,
            }
        }
        
        onStatusChange('Action Required', requestPayload);
        
        toast({
            title: "Request Sent",
            description: "An amendment request has been sent to the branch.",
        });
        form.reset();
        setIsOpen(false);
    };

    const defaultTrigger = <Button variant="outline"><AlertTriangle /> Request Amendment</Button>;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Amendment</DialogTitle>
                    <DialogDescription>
                        Specify what changes are needed for submission ID: {submission.id}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSendRequest)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Amendment Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue('targetDocumentId', undefined);
                                        form.setValue('targetDocumentType', '');
                                        form.clearErrors();
                                    }}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="REPLACE_EXISTING" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        Replace an Existing Document
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="ADD_NEW" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        Add a New Required Document
                                        </FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {amendmentType === 'REPLACE_EXISTING' && (
                        <FormField
                            control={form.control}
                            name="targetDocumentId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Document to Replace</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a document..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {submission.documents.map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>{doc.documentType} - {doc.fileName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {amendmentType === 'ADD_NEW' && (
                        <FormField
                            control={form.control}
                            name="targetDocumentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Document Type Required</FormLabel>
                                    <FormControl><Input placeholder="e.g., Proof of Address" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason / Comment</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Explain why this amendment is necessary..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Send Request</Button>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
