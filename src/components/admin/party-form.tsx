
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller, type UseFormReturn, type ControllerRenderProps, type FieldError, type FieldPath } from "react-hook-form"; 
import * as z from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Only import necessary parts for custom renderers
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Upload, PlusCircle, Trash2 } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Separator } from "../ui/separator";
import type { Party, Tag, ElectionHistoryEntry, ElectionEventType, ControversyEntry, ControversySource } from "@/types";
import { ELECTION_EVENT_TYPES } from "@/types"; 
import { Card } from "../ui/card";
import { EntityFormBuilder, type FormFieldConfig } from "@/components/form-builder/entity-form-builder";


const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const electionHistoryEntrySchema = z.object({
  id: z.string().optional(),
  electionYear: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 20, "Year seems too far"),
  electionType: z.enum(ELECTION_EVENT_TYPES, { required_error: "Election type is required." }), 
  seatsContested: z.coerce.number().int().min(0).optional().nullable(),
  seatsWon: z.coerce.number().int().min(0).optional().nullable(),
  votePercentage: z.coerce.number().min(0).max(100).optional().nullable(),
}).refine(data => data.seatsWon === undefined || data.seatsContested === undefined || data.seatsWon === null || data.seatsContested === null || data.seatsWon <= data.seatsContested, {
  message: "Seats won cannot exceed seats contested.",
  path: ["seatsWon"],
});

export const controversySourceSchema = z.object({
  id: z.string().optional(),
  value: z.string().url({ message: "Please enter a valid URL." }).min(1, "URL is required if source entry is added."),
  description: z.string().optional().nullable(),
});

export const controversyEntrySchema = z.object({
  id: z.string().optional(),
  description: z.string().min(10, { message: "Controversy description must be at least 10 characters." }),
  eventDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid date format." }),
  sourceUrls: z.array(controversySourceSchema).optional(),
}).refine(data => {
  if (data.sourceUrls && data.sourceUrls.length > 0 && data.sourceUrls.some(s => s.value && s.value.trim() !== "")) {
    return data.eventDate && data.eventDate.trim() !== "" && !isNaN(Date.parse(data.eventDate));
  }
  return true;
}, {
  message: "Event Date is required if source URLs are provided.",
  path: ["eventDate"],
});


export const partyFormSchema = z.object({
  name: z.string().min(2, { message: "Party name must be at least 2 characters." }),
  shortName: z.string().optional(),
  logoUrl: z.string().url({ message: "Invalid URL for logo." }).optional().or(z.literal('')),
  dataAiHint: z.string().max(40, "AI hint should be concise (max 2-3 words or 40 chars)").optional(),
  ideology: z.string().min(3, { message: "Ideology must be at least 3 characters." }).optional().or(z.literal('')),
  foundingDate: z.string().refine((val) => val === "" || !val || !isNaN(Date.parse(val)), { message: "Invalid date format." }).optional().or(z.literal('')),
  chairpersonId: z.string().optional().nullable(),
  headquarters: z.string().optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).optional().or(z.literal('')),
  history: z.string().min(10, { message: "History must be at least 10 characters." }).optional().or(z.literal('')),
  electionSymbolUrl: z.string().url({ message: "Invalid URL for election symbol." }).optional().or(z.literal('')),
  dataAiHintSymbol: z.string().max(40, "AI hint for symbol should be concise (max 2-3 words or 40 chars)").optional(),
  website: z.string().url({ message: "Please enter a valid URL for the website." }).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: "Invalid email format."}).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  tags: z.string().optional().refine(
    (tagsString) => {
      if (!tagsString || tagsString.trim() === "") return true;
      const tagsArray = tagsString.split(",").map(t => t.trim()).filter(Boolean);
      return tagsArray.length <= 4;
    },
    { message: "A maximum of 4 tags can be added." }
  ),
  keyPolicyPositions: z.string().optional().or(z.literal('')),
  controversies: z.array(controversyEntrySchema).optional(), 
  electionHistory: z.array(electionHistoryEntrySchema).optional(),
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;

interface PartyFormProps {
  party?: Partial<Party> | Partial<PartyFormValues> | null;
  onSubmitForm: (data: PartyFormValues) => void;
  isSubmitting: boolean;
  showCancelButton?: boolean;
  onCancelInlineEdit?: () => void;
  submitButtonText?: string;
  politicianOptions?: SearchableSelectOption[];
  existingIdeologies?: string[];
  existingPartyTags?: string[];
}

export const getInitialFormValues = (currentParty?: Partial<Party> | Partial<PartyFormValues> | null): PartyFormValues => {
  let tagsString = "";
  if (currentParty?.tags) {
    if (Array.isArray(currentParty.tags) && currentParty.tags.length > 0 && typeof currentParty.tags[0] === 'object' && 'name' in currentParty.tags[0]) {
      tagsString = (currentParty.tags as Tag[]).map(tag => tag.name).join(", ");
    } else if (typeof currentParty.tags === 'string') {
      tagsString = currentParty.tags;
    } else if (Array.isArray(currentParty.tags) && currentParty.tags.length > 0 && typeof currentParty.tags[0] === 'string') {
      tagsString = (currentParty.tags as string[]).join(", ");
    }
  }

  const getSafeArrayWithIds = <T extends { id?: string; [key: string]: any }>(arr: T[] | undefined | null): Array<T & { id: string }> => {
    return (arr || []).map(item => ({ ...item, id: item.id || generateId() })) as Array<T & { id: string }>;
  };
  
  const mapControversySourceUrlsToFormValues = (sourceUrls?: Array<string | ControversySource | {id?: string; value: string, description?: string | null }>): Array<{ id: string, value: string, description?: string | null }> => {
    if (!sourceUrls) return [];
    return sourceUrls.map(src => {
      const urlValue = typeof src === 'string' ? src : (src as any).url || (src as any).value || "";
      const idValue = typeof src === 'string' ? generateId() : (src as any).id || generateId();
      const descriptionValue = typeof src === 'string' ? null : (src as any).description || null;
      return { id: idValue, value: urlValue, description: descriptionValue };
    });
  };

  return {
    name: currentParty?.name || "",
    shortName: currentParty?.shortName || "",
    logoUrl: currentParty?.logoUrl || "",
    dataAiHint: currentParty?.dataAiHint || "",
    ideology: currentParty?.ideology || "",
    foundingDate: currentParty?.foundingDate ? new Date(currentParty.foundingDate).toISOString().split('T')[0] : "",
    chairpersonId: currentParty?.chairpersonId || null,
    headquarters: currentParty?.headquarters || "",
    description: currentParty?.description || "",
    history: currentParty?.history || "",
    electionSymbolUrl: currentParty?.electionSymbolUrl || "",
    dataAiHintSymbol: currentParty?.dataAiHintSymbol || "",
    website: currentParty?.website || "",
    contactEmail: (currentParty as PartyFormValues)?.contactEmail || (currentParty as Party)?.contactEmail || "",
    contactPhone: (currentParty as PartyFormValues)?.contactPhone || (currentParty as Party)?.contactPhone || "",
    tags: tagsString,
    keyPolicyPositions: currentParty?.keyPolicyPositions || "",
    controversies: getSafeArrayWithIds(currentParty?.controversies).map(c => ({
      ...c,
      description: c.description || "",
      eventDate: c.eventDate ? new Date(c.eventDate).toISOString().split('T')[0] : undefined,
      sourceUrls: mapControversySourceUrlsToFormValues(c.sourceUrls),
    })),
    electionHistory: getSafeArrayWithIds(currentParty?.electionHistory).map(eh => ({
        ...eh,
        electionYear: eh.electionYear || new Date().getFullYear(),
        electionType: eh.electionType || ELECTION_EVENT_TYPES[0], 
        seatsContested: eh.seatsContested === null ? undefined : eh.seatsContested, 
        seatsWon: eh.seatsWon === null ? undefined : eh.seatsWon,
        votePercentage: eh.votePercentage === null ? undefined : eh.votePercentage,
    })),
  };
};

// --- Custom Render Components for PartyForm ---
const PartyImageUploadField: React.FC<{ field: ControllerRenderProps<PartyFormValues, 'logoUrl' | 'electionSymbolUrl'>, form: UseFormReturn<PartyFormValues>, dataAiHintFieldName: FieldPath<PartyFormValues>, fieldId: 'logoUrlUpload' | 'electionSymbolUrlUpload', labelText: string }> = ({ field, form, dataAiHintFieldName, fieldId, labelText }) => {
  const { toast } = useToast();
  const [localPreview, setLocalPreview] = useState<string | null>(field.value || null);
  const dataAiHintValue = form.watch(dataAiHintFieldName);

  useEffect(() => { setLocalPreview(field.value || null); }, [field.value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ title: "File Too Large", description: `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        if (event.target) event.target.value = ""; return;
      }
      const reader = new FileReader();
      reader.onloadend = () => { const dataUri = reader.result as string; setLocalPreview(dataUri); field.onChange(dataUri); };
      reader.readAsDataURL(file);
    }
  };
  const handleRemove = () => { setLocalPreview(null); field.onChange(""); const fileInput = document.getElementById(fieldId) as HTMLInputElement; if (fileInput) fileInput.value = ""; };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <Input type="text" placeholder="Enter image URL or Data URI" {...field} value={field.value || ''} onChange={(e) => { field.onChange(e.target.value); setLocalPreview(e.target.value); }} className="bg-background flex-grow" />
        <Input id={fieldId} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <Label htmlFor={fieldId} className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 mt-2 sm:mt-0")}><Upload className="h-4 w-4" /><span>{labelText} (Max {MAX_FILE_SIZE_MB}MB)</span></Label>
      </div>
      {localPreview && (<div className="mt-2 space-y-2"><Image src={localPreview} alt="Preview" width={100} height={100} className="rounded-md border object-contain" data-ai-hint={dataAiHintValue || 'image preview'} /><Button type="button" variant="outline" size="sm" onClick={handleRemove}>Remove Image</Button></div>)}
    </div>
  );
};

const PartyTagsInputField: React.FC<{ field: ControllerRenderProps<PartyFormValues, 'tags' | 'ideology'>, form: UseFormReturn<PartyFormValues>, existingItems: string[], error?: FieldError, isTagsField: boolean }> = ({ field, form, existingItems, error, isTagsField }) => {
  const handleBadgeClick = (itemValue: string) => {
    const currentValue = field.value || "";
    let itemsArray = currentValue.split(",").map(t => t.trim()).filter(Boolean);
    if (isTagsField && itemsArray.length >= 4 && !itemsArray.includes(itemValue)) {
      form.setError(field.name, { type: "manual", message: "A maximum of 4 tags can be added." }); return;
    }
    if (!itemsArray.includes(itemValue)) { itemsArray.push(itemValue); field.onChange(itemsArray.join(", ")); }
  };
  return (
    <div>
      <Input placeholder={isTagsField ? "e.g., Major Party, Youth Wing" : "e.g., Centrism, Social Democracy"} {...field} value={field.value || ""} className={cn("bg-background", error && "border-destructive focus-visible:ring-destructive")} />
      {existingItems.length > 0 && (<div className="flex flex-wrap gap-1 pt-2">{existingItems.slice(0, 10).map(item => (<Badge key={item} variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleBadgeClick(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBadgeClick(item); }}>{item}</Badge>))}</div>)}
    </div>
  );
};

const ControversyEntryArrayField: React.FC<{ control: UseFormReturn<PartyFormValues>['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "controversies" });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <ControversyEntryItem key={field.id} entryIndex={index} control={control} removeEntry={() => remove(index)} />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: generateId(), description: "", eventDate: undefined, sourceUrls: [] })} > <PlusCircle className="mr-2 h-4 w-4" /> Add Controversy Entry </Button>
    </div>
  );
};
const ControversyEntryItem: React.FC<{ entryIndex: number; control: UseFormReturn<PartyFormValues>['control']; removeEntry: () => void }> = ({ entryIndex, control, removeEntry }) => {
  const { fields: sourceUrlFields, append: appendSourceUrl, remove: removeSourceUrl } = useFieldArray({ control, name: `controversies.${entryIndex}.sourceUrls` });
  return (
    <Card className="p-4 space-y-4 bg-muted/50 border border-border/70">
      <Controller name={`controversies.${entryIndex}.description`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Controversy Description</Label><Textarea placeholder="Detailed description..." {...field} className={cn("min-h-[80px] bg-background", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <Controller name={`controversies.${entryIndex}.eventDate`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Date of Event (Optional)</Label><Input type="date" {...field} value={field.value || ""} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <div>
        <Label className="text-sm font-medium">Source URLs</Label>
        {sourceUrlFields.map((sourceField, sourceIndex) => (
          <Card key={sourceField.id} className="mt-1 mb-2 p-2 space-y-1 bg-background/50 border-border/50">
            <Controller name={`controversies.${entryIndex}.sourceUrls.${sourceIndex}.value`} control={control} render={({ field: urlField, fieldState }) => (<FormItem><Label>URL {sourceIndex + 1}</Label><div className="flex items-center gap-2"><Input type="url" {...urlField} className={cn("bg-background text-xs", fieldState.error && "border-destructive")} /><Button type="button" variant="destructive" size="icon" onClick={() => removeSourceUrl(sourceIndex)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button></div><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
            <Controller name={`controversies.${entryIndex}.sourceUrls.${sourceIndex}.description`} control={control} render={({ field: descField, fieldState }) => (<FormItem><Label>Description (Optional)</Label><Input {...descField} className={cn("bg-background text-xs", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" className="mt-1 text-xs" onClick={() => appendSourceUrl({ id: generateId(), value: "", description: "" })}><PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Source</Button>
      </div>
      <Button type="button" variant="destructive" size="sm" onClick={removeEntry} className="mt-4"><Trash2 className="mr-2 h-4 w-4" /> Remove Controversy</Button>
    </Card>
  );
};

const ElectionHistoryArrayField: React.FC<{ control: UseFormReturn<PartyFormValues>['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "electionHistory" });
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={field.id} className="p-4 space-y-3 bg-muted/50 border border-border/70">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Controller control={control} name={`electionHistory.${index}.electionYear`} render={({ field: yearField, fieldState }) => ( <FormItem><Label>Year</Label><Input type="number" placeholder="YYYY" {...yearField} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem> )}/>
            <Controller control={control} name={`electionHistory.${index}.electionType`} render={({ field: typeField, fieldState }) => (
              <FormItem>
                <Label>Election Type</Label>
                <Select onValueChange={typeField.onChange} value={typeField.value}><SelectTrigger className={cn("bg-background", fieldState.error && "border-destructive")}><SelectValue placeholder="Select Type" /></SelectTrigger><SelectContent>{ELECTION_EVENT_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Controller control={control} name={`electionHistory.${index}.seatsContested`} render={({ field: scField, fieldState }) => ( <FormItem><Label>Seats Contested</Label><Input type="number" {...scField} onChange={e => scField.onChange(e.target.value === '' ? null : Number(e.target.value))} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem> )}/>
            <Controller control={control} name={`electionHistory.${index}.seatsWon`} render={({ field: swField, fieldState }) => ( <FormItem><Label>Seats Won</Label><Input type="number" {...swField} onChange={e => swField.onChange(e.target.value === '' ? null : Number(e.target.value))} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem> )}/>
            <Controller control={control} name={`electionHistory.${index}.votePercentage`} render={({ field: vpField, fieldState }) => ( <FormItem><Label>Vote %</Label><Input type="number" step="0.01" {...vpField} onChange={e => vpField.onChange(e.target.value === '' ? null : Number(e.target.value))} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem> )}/>
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="mt-2"><Trash2 className="mr-1 h-4 w-4" /> Remove Entry</Button>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: generateId(), electionYear: new Date().getFullYear(), electionType: ELECTION_EVENT_TYPES[0], seatsContested: null, seatsWon: null, votePercentage: null })} > <PlusCircle className="mr-2 h-4 w-4" /> Add Election History</Button>
    </div>
  );
};


// --- Main PartyForm Component ---
export function PartyForm({
  party,
  onSubmitForm,
  isSubmitting,
  showCancelButton = true,
  onCancelInlineEdit,
  submitButtonText,
  politicianOptions = [],
  existingIdeologies = [],
  existingPartyTags = [],
}: PartyFormProps) {
  const router = useRouter();
  const formInstance = useForm<PartyFormValues>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: getInitialFormValues(party),
    mode: 'onChange',
  });

  useEffect(() => {
    formInstance.reset(getInitialFormValues(party));
  }, [party, formInstance]);

  const partyFieldsConfig: FormFieldConfig<PartyFormValues, FieldPath<PartyFormValues>>[] = [
    { name: "name", label: "Party Name", type: "text", placeholder: "Enter party's full name", required: true },
    { name: "shortName", label: "Short Name (Optional)", type: "text", placeholder: "e.g., NDP" },
    { name: "logoUrl", label: "Party Logo (Upload or URL)", type: "custom", description: "Enter a URL or upload an image. Upload converts to Data URI.", renderCustom: (field, form) => <PartyImageUploadField field={field as ControllerRenderProps<PartyFormValues, 'logoUrl'>} form={form} dataAiHintFieldName="dataAiHint" fieldId="logoUrlUpload" labelText="Choose Logo" /> },
    { name: "dataAiHint", label: "Logo AI Hint (Optional)", type: "text", placeholder: "e.g., modern flag, party symbol", description: "Keywords for the party logo image (max 2-3 words)." },
    { name: "electionSymbolUrl", label: "Election Symbol (Upload or URL)", type: "custom", description: "Enter a URL or upload an image. Upload converts to Data URI.", renderCustom: (field, form) => <PartyImageUploadField field={field as ControllerRenderProps<PartyFormValues, 'electionSymbolUrl'>} form={form} dataAiHintFieldName="dataAiHintSymbol" fieldId="electionSymbolUrlUpload" labelText="Choose Symbol" /> },
    { name: "dataAiHintSymbol", label: "Symbol AI Hint (Optional)", type: "text", placeholder: "e.g., sun, tree, book", description: "Keywords for the election symbol image (max 2-3 words)." },
    { name: "ideology", label: "Ideology", type: "custom", description: "Enter main ideologies, separated by commas. Click a suggestion to append it.", renderCustom: (field, form, error) => <PartyTagsInputField field={field as ControllerRenderProps<PartyFormValues, 'ideology'>} form={form} existingItems={existingIdeologies} error={error} isTagsField={false} /> },
    { name: "foundingDate", label: "Founding Date", type: "date", required: true },
    { name: "chairpersonId", label: "Chairperson (Optional)", type: "searchable-select", options: politicianOptions, placeholder: "Search & Select Chairperson", description: "Select the party's chairperson." },
    { name: "headquarters", label: "Headquarters (Optional)", type: "text", placeholder: "e.g., Kathmandu, Nepal" },
    { name: "website", label: "Website URL (Optional)", type: "text", placeholder: "https://example.com" },
    { name: "contactEmail", label: "Contact Email (Optional)", type: "email", placeholder: "info@example.com" },
    { name: "contactPhone", label: "Contact Phone (Optional)", type: "text", placeholder: "+977-xxxxxxxxx" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Brief description of the party... Markdown supported.", inputClassName: "min-h-[100px] bg-background", description: "Markdown supported.", required: true },
    { name: "history", label: "History", type: "textarea", placeholder: "Brief history of the party... Markdown supported.", inputClassName: "min-h-[100px] bg-background", description: "Markdown supported." },
    { name: "keyPolicyPositions", label: "Key Policy Positions (Optional)", type: "textarea", placeholder: "Outline key policy positions... Markdown supported.", inputClassName: "min-h-[100px] bg-background", description: "Markdown supported." },
    { name: "controversies", label: "Controversies", type: "custom", description: "Detail any notable controversies. Markdown supported for description.", renderCustom: (_field, form) => <ControversyEntryArrayField control={form.control} /> },
    { name: "electionHistory", label: "Election History", type: "custom", renderCustom: (_field, form) => <ElectionHistoryArrayField control={form.control} /> },
    { name: "tags", label: "Tags (Optional, Max 4)", type: "custom", description: "Enter comma-separated tags. Click a suggestion to append it. Max 4 tags.", renderCustom: (field, form, error) => <PartyTagsInputField field={field as ControllerRenderProps<PartyFormValues, 'tags'>} form={form} existingItems={existingPartyTags} error={error} isTagsField={true} /> },
  ];
  
  const SeparatorField: FormFieldConfig<PartyFormValues, any> = { name: "separator" as any, label: "", type: "custom", renderCustom: () => <Separator className="my-6" /> };

  const finalFieldsConfigWithSeparators: FormFieldConfig<PartyFormValues, FieldPath<PartyFormValues>>[] = [];
    partyFieldsConfig.forEach((field, index) => {
    finalFieldsConfigWithSeparators.push(field);
     if (["shortName", "dataAiHintSymbol", "chairpersonId", "contactPhone", "history", "keyPolicyPositions", "electionHistory"].includes(field.name)) {
        if (index < partyFieldsConfig.length - 1) {
            finalFieldsConfigWithSeparators.push(SeparatorField);
        }
    }
    });


  return (
    <EntityFormBuilder<PartyFormValues>
      schema={partyFormSchema}
      initialValues={getInitialFormValues(party)}
      onSubmit={onSubmitForm}
      fieldsConfig={finalFieldsConfigWithSeparators}
      isSubmitting={isSubmitting}
      submitButtonText={submitButtonText || (party ? 'Save Changes' : 'Submit Suggestion')}
      cancelButtonText="Cancel"
      onCancel={onCancelInlineEdit || (() => router.back())}
      form={formInstance}
    />
  );
}

    