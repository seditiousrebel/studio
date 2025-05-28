
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type ControllerRenderProps, type FieldError, type FieldPath } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserPromise, Tag } from "@/types"; 
import { PROMISE_STATUSES } from "@/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Separator } from "../ui/separator";
import { EntityFormBuilder, type FormFieldConfig } from "@/components/form-builder/entity-form-builder";
import { cn } from "@/lib/utils";

export const promiseFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).optional().or(z.literal('')),
  status: z.enum(PROMISE_STATUSES, { required_error: "Status is required." }),
  category: z.string().min(2, { message: "Category is required." }).trim(),
  deadline: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid date format." }),
  sourceUrl: z.string().url({ message: "Please enter a valid URL for the source." }).optional().or(z.literal('')),
  evidenceUrl: z.string().url({ message: "Please enter a valid URL for evidence." }).optional().or(z.literal('')),
  politicianId: z.string().optional().nullable(),
  partyId: z.string().optional().nullable(),
  tags: z.string().optional().refine(
    (tagsString) => {
      if (!tagsString || tagsString.trim() === "") return true;
      const tagsArray = tagsString.split(",").map(t => t.trim()).filter(Boolean);
      return tagsArray.length <= 4;
    },
    { message: "A maximum of 4 tags can be added." }
  ),
  dateAdded: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid date format." }),
}).refine(data => !(data.politicianId && data.partyId), {
  message: "A promise can be made by either a politician OR a party, not both.",
  path: ["politicianId"], 
});

export type PromiseFormValues = z.infer<typeof promiseFormSchema>;

interface PromiseFormProps {
  promise?: UserPromise | Partial<UserPromise> | Partial<PromiseFormValues> | null; 
  onSubmitForm: (data: PromiseFormValues) => void;
  isSubmitting: boolean;
  showCancelButton?: boolean; 
  onCancelInlineEdit?: () => void; 
  submitButtonText?: string;
  politicianOptions?: SearchableSelectOption[];
  partyOptions?: SearchableSelectOption[];
  existingCategories?: string[];
  existingPromiseTags?: string[];
}

export const getInitialFormValues = (currentPromise?: UserPromise | Partial<UserPromise> | Partial<PromiseFormValues> | null): PromiseFormValues => {
  let tagsString = "";
  if (currentPromise?.tags) {
    if (Array.isArray(currentPromise.tags) && currentPromise.tags.every(tag => typeof tag === 'object' && 'name' in tag)) {
      tagsString = (currentPromise.tags as Tag[]).map(tag => tag.name).join(", ");
    } else if (typeof currentPromise.tags === 'string') {
      tagsString = currentPromise.tags;
    } else if (Array.isArray(currentPromise.tags)) { 
      tagsString = (currentPromise.tags as string[]).join(", ");
    }
  }

  return {
    title: currentPromise?.title || "",
    description: currentPromise?.description || "",
    status: currentPromise?.status || "Pending",
    category: currentPromise?.category || "",
    deadline: currentPromise?.deadline ? new Date(currentPromise.deadline).toISOString().split('T')[0] : "",
    sourceUrl: currentPromise?.sourceUrl || "",
    evidenceUrl: currentPromise?.evidenceUrl || "",
    politicianId: currentPromise?.politicianId || null,
    partyId: currentPromise?.partyId || null,
    tags: tagsString,
    dateAdded: (currentPromise as UserPromise)?.dateAdded ? new Date((currentPromise as UserPromise).dateAdded!).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
};

// Custom Render Component for Category/Tags with Badges
const ItemWithBadgeSuggestionsField: React.FC<{
  field: ControllerRenderProps<PromiseFormValues, 'category' | 'tags'>;
  form: UseFormReturn<PromiseFormValues>;
  existingItems: string[];
  error?: FieldError;
  isTagsField: boolean;
  placeholderText: string;
}> = ({ field, form, existingItems, error, isTagsField, placeholderText }) => {
  const handleBadgeClick = (itemValue: string) => {
    const currentValue = field.value || "";
    let itemsArray = isTagsField ? currentValue.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    if (isTagsField) {
      if (itemsArray.length >= 4 && !itemsArray.includes(itemValue)) {
        form.setError(field.name, { type: "manual", message: "A maximum of 4 tags can be added." }); return;
      }
      if (!itemsArray.includes(itemValue)) { itemsArray.push(itemValue); field.onChange(itemsArray.join(", ")); }
    } else { // For category
      field.onChange(itemValue);
    }
  };
  return (
    <div>
      <Input placeholder={placeholderText} {...field} value={field.value || ""} className={cn("bg-background", error && "border-destructive focus-visible:ring-destructive")} />
      {existingItems.length > 0 && (<div className="flex flex-wrap gap-1 pt-2">{existingItems.slice(0, 10).map(item => (<Badge key={item} variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleBadgeClick(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBadgeClick(item); }}>{item}</Badge>))}</div>)}
    </div>
  );
};


export function PromiseForm({ 
  promise, 
  onSubmitForm, 
  isSubmitting, 
  showCancelButton = true, 
  onCancelInlineEdit,
  submitButtonText,
  politicianOptions = [],
  partyOptions = [],
  existingCategories = [],
  existingPromiseTags = [],
}: PromiseFormProps) {
  const router = useRouter();
  const formInstance = useForm<PromiseFormValues>({
    resolver: zodResolver(promiseFormSchema),
    defaultValues: getInitialFormValues(promise),
    mode: "onChange", 
  });

 useEffect(() => {
    formInstance.reset(getInitialFormValues(promise));
  }, [promise, formInstance]);

  const currentPoliticianId = formInstance.watch("politicianId");
  const currentPartyId = formInstance.watch("partyId");

  const promiseFieldsConfig: FormFieldConfig<PromiseFormValues, FieldPath<PromiseFormValues>>[] = [
    { name: "title", label: "Promise Title", type: "text", placeholder: "e.g., Build 100km of new roads", required: true },
    { name: "description", label: "Description", type: "textarea", placeholder: "Detailed description of the promise...", inputClassName: "min-h-[100px] bg-background" },
    { name: "status", label: "Status", type: "select", options: PROMISE_STATUSES.map(s => ({ value: s, label: s })), placeholder: "Select status", required: true },
    { name: "category", label: "Category", type: "custom", placeholderText: "e.g., Infrastructure, Healthcare", required: true, description: "Click a suggestion to set it, or type a new category.", renderCustom: (field, form, error) => <ItemWithBadgeSuggestionsField field={field as ControllerRenderProps<PromiseFormValues, 'category'>} form={form} existingItems={existingCategories} error={error} isTagsField={false} placeholderText="e.g., Infrastructure, Healthcare" /> },
    { name: "politicianId", label: "Promised by Politician (Optional)", type: "searchable-select", options: politicianOptions, placeholder: "Search & Select Politician", description: "Select the politician. To enable, ensure 'Promised by Party' is 'None'.", disabled: !!currentPartyId },
    { name: "partyId", label: "Promised by Party (Optional)", type: "searchable-select", options: partyOptions, placeholder: "Search & Select Party", description: "Select if this is a party platform promise. To enable, ensure 'Promised by Politician' is 'None'.", disabled: !!currentPoliticianId },
    { name: "deadline", label: "Deadline (Optional)", type: "date" },
    { name: "dateAdded", label: "Date Added", type: "date", required: true }, // Date added is usually set by system, but editable by admin
    { name: "tags", label: "Tags (Optional, Max 4)", type: "custom", placeholderText: "e.g., Roads, Healthcare, Bagmati", description: "Enter comma-separated tags. Click a suggestion to append it. Max 4 tags.", renderCustom: (field, form, error) => <ItemWithBadgeSuggestionsField field={field as ControllerRenderProps<PromiseFormValues, 'tags'>} form={form} existingItems={existingPromiseTags} error={error} isTagsField={true} placeholderText="e.g., Roads, Healthcare, Bagmati" /> },
    { name: "sourceUrl", label: "Source URL (Optional)", type: "text", placeholder: "https://example.com/source-of-promise", description: "Link to where the promise was officially made." },
    { name: "evidenceUrl", label: "Evidence URL (Optional)", type: "text", placeholder: "https://example.com/evidence-of-progress", description: "Link to evidence of progress or fulfillment." },
  ];

  const SeparatorField: FormFieldConfig<PromiseFormValues, any> = { name: "separator" as any, label: "", type: "custom", renderCustom: () => <Separator className="my-6" /> };

  const finalFieldsConfigWithSeparators: FormFieldConfig<PromiseFormValues, FieldPath<PromiseFormValues>>[] = [];
    promiseFieldsConfig.forEach((field, index) => {
    finalFieldsConfigWithSeparators.push(field);
     if (["description", "category", "partyId", "dateAdded"].includes(field.name)) {
        if (index < promiseFieldsConfig.length - 1) {
            finalFieldsConfigWithSeparators.push(SeparatorField);
        }
    }
    });


  return (
    <EntityFormBuilder<PromiseFormValues>
      schema={promiseFormSchema}
      initialValues={getInitialFormValues(promise)}
      onSubmit={onSubmitForm}
      fieldsConfig={finalFieldsConfigWithSeparators}
      isSubmitting={isSubmitting}
      submitButtonText={submitButtonText || (promise ? 'Save Changes' : 'Submit Suggestion')}
      cancelButtonText="Cancel"
      onCancel={onCancelInlineEdit || (() => router.back())}
      form={formInstance}
    />
  );
}

    