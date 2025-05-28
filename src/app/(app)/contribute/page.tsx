'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { placeholderContributions } from "@/lib/placeholder-data";
import type { Contribution } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, History } from 'lucide-react';

const contributionFormSchema = z.object({
  entityType: z.enum(["politician", "party", "bill", "promise"], {
    required_error: "You need to select an entity type.",
  }),
  entityId: z.string().min(1, { message: "Entity ID is required." }),
  fieldName: z.string().min(1, { message: "Field name is required." }),
  proposedValue: z.string().min(1, { message: "Proposed value is required." }),
  reason: z.string().min(10, { message: "Please provide a brief reason for your change (min 10 characters)." }),
  sourceUrl: z.string().url({ message: "Please enter a valid URL for the source." }).optional().or(z.literal('')),
});

type ContributionFormValues = z.infer<typeof contributionFormSchema>;

// This can be extracted into a server action
async function submitContribution(data: ContributionFormValues) {
  console.log("Submitting contribution:", data);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  // For demo purposes, assume success
  return { success: true, message: "Contribution submitted successfully for review!" };
}


export default function ContributePage() {
  const { toast } = useToast();
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      entityType: undefined,
      entityId: "",
      fieldName: "",
      proposedValue: "",
      reason: "",
      sourceUrl: "",
    },
  });

  async function onSubmit(data: ContributionFormValues) {
    const result = await submitContribution(data);
    if (result.success) {
      toast({
        title: "Contribution Submitted!",
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        title: "Submission Failed",
        description: result.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Contribute to NetaVerse</h1>
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Submit an Edit or New Information</CardTitle>
          <CardDescription>
            Help us keep NetaVerse accurate and up-to-date. All contributions are subject to moderation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="politician">Politician</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                        <SelectItem value="bill">Bill</SelectItem>
                        <SelectItem value="promise">Promise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity ID or Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter existing ID or name of the entity" {...field} />
                    </FormControl>
                    <FormDescription>
                      If suggesting a new entity, type "NEW" and describe in reason.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fieldName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field to Update/Add</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'description', 'status', 'new_member_count'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed New Value</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the new information for this field" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Change / Additional Details</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain why this change is needed or provide context." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sourceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="e.g., https://news-article.com/info" {...field} />
                    </FormControl>
                    <FormDescription>
                      Link to a reliable source validating your contribution, if available.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Your Contribution History</CardTitle>
          <CardDescription>Track the status of your submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {placeholderContributions.length > 0 ? (
            <ul className="space-y-3">
              {placeholderContributions.map((contrib: Contribution) => (
                <li key={contrib.id} className="p-3 border rounded-md bg-muted/50">
                  <p className="font-medium text-sm">Edit for: {contrib.entityType} - {contrib.entityId}</p>
                  <p className="text-xs text-muted-foreground">Submitted: {new Date(contrib.submissionDate).toLocaleDateString()}</p>
                  <p className="text-xs">Status: <span className={`font-semibold ${
                    contrib.status === 'Approved' ? 'text-green-600' :
                    contrib.status === 'Rejected' ? 'text-red-600' :
                    'text-yellow-600' // Pending
                  }`}>{contrib.status}</span></p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">You have not made any contributions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
