
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type ControllerRenderProps, type FieldError, type FieldPath, type UseFormReturn } from "react-hook-form";
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
import type { Bill, Tag } from "@/types"; 
import { BILL_STATUSES } from "@/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Separator } from "../ui/separator";
import { EntityFormBuilder, type FormFieldConfig } from "@/components/form-builder/entity-form-builder";
import { cn } from "@/lib/utils";

export const billFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  summary: z.string().min(10, { message: "Summary must be at least 10 characters." }).optional().or(z.literal('')),
  status: z.enum(BILL_STATUSES, { required_error: "Status is required." }),
  registrationNumber: z.string().optional(),
  registrationDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid registration date format." }).or(z.literal('')),
  proposalDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid proposal date format." }).or(z.literal('')),
  ministry: z.string().optional(),
  parliamentInfoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  sponsorPoliticianId: z.string().optional().nullable(),
  sponsorPartyId: z.string().optional().nullable(),
  tags: z.string().optional().refine(
    (tagsString) => {
      if (!tagsString || tagsString.trim() === "") return true;
      const tagsArray = tagsString.split(",").map(t => t.trim()).filter(Boolean);
      return tagsArray.length <= 4;
    },
    { message: "A maximum of 4 tags can be added." }
  ),
  dataAiHint: z.string().optional(),
}).refine(data => !(data.sponsorPoliticianId && data.sponsorPartyId), {
  message: "A bill can be sponsored by either a politician OR a party, not both.",
  path: ["sponsorPoliticianId"],
});

export type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  bill?: Partial<Bill> | Partial<BillFormValues> | null; 
  onSubmitForm: (data: BillFormValues) => void;
  isSubmitting: boolean;
  showCancelButton?: boolean;
  onCancelInlineEdit?: () => void;
  submitButtonText?: string;
  politicianOptions?: SearchableSelectOption[]; 
  partyOptions?: SearchableSelectOption[]; 
  existingBillTags?: string[];
  existingMinistries?: string[];
}

export const getInitialFormValues = (currentBill?: Partial<Bill> | Partial<BillFormValues> | null): BillFormValues => {
  let tagsString = "";
  if (currentBill?.tags) {
    if (Array.isArray(currentBill.tags) && currentBill.tags.every(tag => typeof tag === 'object' && 'name' in tag)) {
      tagsString = (currentBill.tags as Tag[]).map(tag => tag.name).join(", ");
    } else if (typeof currentBill.tags === 'string') {
      tagsString = currentBill.tags;
    } else if (Array.isArray(currentBill.tags)) { 
      tagsString = (currentBill.tags as string[]).join(", ");
    }
  }

  return {
    title: currentBill?.title || "",
    summary: currentBill?.summary || "",
    status: currentBill?.status || "Proposed",
    registrationNumber: currentBill?.registrationNumber || "",
    registrationDate: currentBill?.registrationDate ? new Date(currentBill.registrationDate).toISOString().split('T')[0] : "",
    proposalDate: currentBill?.proposalDate ? new Date(currentBill.proposalDate).toISOString().split('T')[0] : "",
    ministry: currentBill?.ministry || "",
    parliamentInfoUrl: currentBill?.parliamentInfoUrl || "",
    sponsorPoliticianId: currentBill?.sponsorPoliticianId || null,
    sponsorPartyId: currentBill?.sponsorPartyId || null,
    tags: tagsString,
    dataAiHint: currentBill?.dataAiHint || "",
  };
};

// Custom Render Component for Ministry/Tags with Badges
const ItemWithBadgeSuggestionsFieldBill: React.FC<{
  field: ControllerRenderProps<BillFormValues, 'ministry' | 'tags'>;
  form: UseFormReturn<BillFormValues>;
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
    } else { // For ministry
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


export function BillForm({
  bill,
  onSubmitForm,
  isSubmitting,
  showCancelButton = true,
  onCancelInlineEdit,
  submitButtonText,
  politicianOptions = [],
  partyOptions = [],
  existingBillTags = [],
  existingMinistries = [],
}: BillFormProps) {
  const router = useRouter();
  const formInstance = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: getInitialFormValues(bill),
    mode: "onChange",
  });

 useEffect(() => {
    formInstance.reset(getInitialFormValues(bill));
  }, [bill, formInstance]);

  const currentSponsorPoliticianId = formInstance.watch("sponsorPoliticianId");
  const currentSponsorPartyId = formInstance.watch("sponsorPartyId");

  const billFieldsConfig: FormFieldConfig<BillFormValues, FieldPath<BillFormValues>>[] = [
    { name: "title", label: "Bill Title", type: "text", placeholder: "Enter the official title of the bill", required: true },
    { name: "summary", label: "Summary", type: "textarea", placeholder: "Brief summary...", inputClassName: "min-h-[100px] bg-background" },
    { name: "dataAiHint", label: "Image AI Hint (Optional)", type: "text", placeholder: "e.g., parliament building, legal document", description: "Keywords for image generation (if applicable)." },
    { name: "status", label: "Status", type: "select", options: BILL_STATUSES.map(s => ({ value: s, label: s })), placeholder: "Select bill status", required: true },
    { name: "ministry", label: "Responsible Ministry (Optional)", type: "custom", placeholderText: "e.g., Ministry of Finance", description: "Click a suggestion or type a new ministry.", renderCustom: (field, form, error) => <ItemWithBadgeSuggestionsFieldBill field={field as ControllerRenderProps<BillFormValues, 'ministry'>} form={form} existingItems={existingMinistries} error={error} isTagsField={false} placeholderText="e.g., Ministry of Finance" /> },
    { name: "registrationNumber", label: "Registration Number (Optional)", type: "text", placeholder: "e.g., 2081-XYZ-001" },
    { name: "registrationDate", label: "Registration Date (Optional)", type: "date" },
    { name: "proposalDate", label: "Proposal Date (Optional)", type: "date", description: "Date the bill was initially proposed or introduced." },
    { name: "sponsorPoliticianId", label: "Sponsored by Politician (Optional)", type: "searchable-select", options: politicianOptions, placeholder: "Search & Select Politician Sponsor", description: "To enable, ensure 'Sponsored by Party' is 'None'.", disabled: !!currentSponsorPartyId },
    { name: "sponsorPartyId", label: "Sponsored by Party (Optional)", type: "searchable-select", options: partyOptions, placeholder: "Search & Select Party Sponsor", description: "To enable, ensure 'Sponsored by Politician' is 'None'.", disabled: !!currentSponsorPoliticianId },
    { name: "parliamentInfoUrl", label: "Parliament Info URL (Optional)", type: "text", placeholder: "https://hr.parliament.gov.np/en/bill/...", description: "Link to official parliament website." },
    { name: "tags", label: "Tags (Optional, Max 4)", type: "custom", placeholderText: "e.g., Economy, Reform, Governance", description: "Comma-separated. Click suggestion to append. Max 4 tags.", renderCustom: (field, form, error) => <ItemWithBadgeSuggestionsFieldBill field={field as ControllerRenderProps<BillFormValues, 'tags'>} form={form} existingItems={existingBillTags} error={error} isTagsField={true} placeholderText="e.g., Economy, Reform, Governance" /> },
  ];

  const SeparatorField: FormFieldConfig<BillFormValues, any> = { name: "separator" as any, label: "", type: "custom", renderCustom: () => <Separator className="my-6" /> };
  
  const finalFieldsConfigWithSeparators: FormFieldConfig<BillFormValues, FieldPath<BillFormValues>>[] = [];
    billFieldsConfig.forEach((field, index) => {
    finalFieldsConfigWithSeparators.push(field);
    if (["dataAiHint", "ministry", "proposalDate", "sponsorPartyId"].includes(field.name)) {
        if (index < billFieldsConfig.length - 1) {
            finalFieldsConfigWithSeparators.push(SeparatorField);
        }
    }
    });

  return (
    <EntityFormBuilder<BillFormValues>
      schema={billFormSchema}
      initialValues={getInitialFormValues(bill)}
      onSubmit={onSubmitForm}
      fieldsConfig={finalFieldsConfigWithSeparators}
      isSubmitting={isSubmitting}
      submitButtonText={submitButtonText || (bill ? 'Save Changes' : 'Submit Suggestion')}
      cancelButtonText="Cancel"
      onCancel={onCancelInlineEdit || (() => router.back())}
      form={formInstance}
    />
  );
}

    