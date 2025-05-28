
"use client";

import { useForm, useFieldArray, Controller, type UseFormReturn, type ControllerRenderProps, type FieldError, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import type { Politician, CriminalRecordEntry as CriminalRecordType, PoliticalCareerEntry, AssetDeclarationEntry as AssetDeclarationType, SocialMediaLink, AssetDeclarationSource, CriminalRecordSource, Tag } from '@/types';
import { CRIMINAL_RECORD_SEVERITIES, CRIMINAL_RECORD_STATUSES, CRIMINAL_RECORD_OFFENSE_TYPES, ELECTION_EVENT_TYPES } from "@/types";
import { NEPAL_PROVINCES, NEPAL_CONSTITUENCIES, NONE_CONSTITUENCY_VALUE } from "@/lib/constants";
import { cn, generateId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { EntityFormBuilder, type FormFieldConfig } from "@/components/form-builder/entity-form-builder";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, PlusCircle, Trash2 } from "lucide-react";
import { FormItem, FormMessage } from "@/components/ui/form"; // For custom renderers

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- Zod Schemas ---
const politicalCareerEntrySchema = z.object({
  id: z.string().optional(),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 10, "Year seems too far in the future"),
  role: z.string().min(2, { message: "Role must be at least 2 characters." }),
});

const assetDeclarationSourceSchema = z.object({
  id: z.string().optional(),
  value: z.string().url({ message: "Please enter a valid URL." }).min(1, "URL is required if source entry is added."),
  description: z.string().optional().nullable(),
});

const assetDeclarationEntrySchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(10, { message: "Asset summary must be at least 10 characters." }),
  declarationDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid date format." }),
  sourceUrls: z.array(assetDeclarationSourceSchema).optional(),
});

const criminalRecordSourceSchema = z.object({
  id: z.string().optional(),
  value: z.string().url({ message: "Please enter a valid URL." }).min(1, "URL is required if this source entry is added."),
  description: z.string().optional().nullable(), // Added description to source
});

const criminalRecordEntrySchema = z.object({
  id: z.string().optional(),
  severity: z.enum(CRIMINAL_RECORD_SEVERITIES, { required_error: "Severity is required." }),
  status: z.enum(CRIMINAL_RECORD_STATUSES, { required_error: "Status is required." }),
  offenseType: z.enum(CRIMINAL_RECORD_OFFENSE_TYPES, { required_error: "Offense type is required." }),
  description: z.string().min(5, { message: "Description must be at least 5 characters." }),
  caseDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)) || val === "", { message: "Invalid date format." }),
  sourceUrls: z.array(criminalRecordSourceSchema).optional(),
}).refine(data => {
  if (data.status === 'Convicted') {
    return data.caseDate && data.caseDate.trim() !== "" && !isNaN(Date.parse(data.caseDate));
  }
  return true;
}, {
  message: "Case Date is required and must be valid if status is 'Convicted'.",
  path: ["caseDate"], // Path to the field this error message applies to
});


const socialMediaLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, "Platform name is required."),
  url: z.string().url({ message: "Please enter a valid URL." }).min(1, "URL is required."),
});

export const politicianFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  partyId: z.string().optional().nullable(),
  province: z.string().min(1, { message: "Province is required." }),
  constituency: z.string().optional().refine(val => val !== NONE_CONSTITUENCY_VALUE || val === "" || !val, { message: "Please select a valid constituency or 'None'." }).nullable(),
  imageUrl: z.string().url({ message: "Invalid URL for image." }).optional().or(z.literal('')),
  dataAiHint: z.string().max(40, "AI hint should be concise (max 2-3 words or 40 chars)").optional(),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters." }).optional().or(z.literal('')),
  position: z.string().optional(),
  dateOfBirth: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Valid date of birth is required." }),
  education: z.string().optional(),
  tags: z.string().optional().refine(
    (tagsString) => {
      if (!tagsString || tagsString.trim() === "") return true;
      const tagsArray = tagsString.split(",").map(t => t.trim()).filter(Boolean);
      return tagsArray.length <= 4;
    },
    { message: "A maximum of 4 tags can be added." }
  ),
  politicalCareer: z.array(politicalCareerEntrySchema).optional(),
  assetDeclarations: z.array(assetDeclarationEntrySchema).optional(),
  criminalRecordEntries: z.array(criminalRecordEntrySchema).optional(),
  contactEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactSocialEntries: z.array(socialMediaLinkSchema).optional(),
});

export type PoliticianFormValues = z.infer<typeof politicianFormSchema>;

// --- Initial Value Generator ---
export const getInitialPoliticianFormValues = (
  currentPolitician?: Partial<Politician> | Partial<PoliticianFormValues> | null
): PoliticianFormValues => {
  const getSafeArrayWithIds = <T extends { id?: string; [key: string]: any }>(arr: T[] | undefined | null): Array<T & { id: string }> => {
    return (arr || []).map(item => ({ ...item, id: item.id || generateId() })) as Array<T & { id: string }>;
  };

  const mapSourceUrlsToFormValues = (sourceUrls?: Array<string | AssetDeclarationSource | CriminalRecordSource | {id?: string; value: string, description?: string | null}>): Array<{ id: string, value: string, description?: string | null }> => {
    if (!sourceUrls) return [];
    return sourceUrls.map(src => {
      const urlValue = typeof src === 'string' ? src : (src as any).url || (src as any).value || "";
      const idValue = typeof src === 'string' ? generateId() : (src as any).id || generateId();
      const descriptionValue = typeof src === 'string' ? null : (typeof src === 'object' && 'description' in src) ? src.description : null;
      return { id: idValue, value: urlValue, description: descriptionValue };
    });
  };
  
  let tagsString = "";
  if (currentPolitician?.tags) {
    if (Array.isArray(currentPolitician.tags) && currentPolitician.tags.length > 0 && typeof currentPolitician.tags[0] === 'object' && 'name' in currentPolitician.tags[0]) {
      tagsString = (currentPolitician.tags as Tag[]).map(tag => tag.name).join(", ");
    } else if (typeof currentPolitician.tags === 'string') {
      tagsString = currentPolitician.tags;
    } else if (Array.isArray(currentPolitician.tags) && currentPolitician.tags.length > 0 && typeof currentPolitician.tags[0] === 'string') {
      tagsString = (currentPolitician.tags as string[]).join(", ");
    }
  }

  const isFullPolitician = (p: any): p is Partial<Politician> => p && typeof (p as Politician).party_id !== 'undefined';
  const isFormValues = (p: any): p is Partial<PoliticianFormValues> => p && typeof (p as PoliticianFormValues).partyId !== 'undefined';

  let partyIdToUse: string | null | undefined = null;
  if (isFullPolitician(currentPolitician)) {
    partyIdToUse = currentPolitician.party_id;
  } else if (isFormValues(currentPolitician)) {
    partyIdToUse = currentPolitician.partyId;
  }
  
  const contactSocialEntriesFromPolitician = (currentPolitician as Politician)?.socialMediaLinks || (currentPolitician as PoliticianFormValues)?.contactSocialEntries;
  const contactEmailFromPolitician = (currentPolitician as Politician)?.contactEmail || (currentPolitician as PoliticianFormValues)?.contactEmail;
  const contactPhoneFromPolitician = (currentPolitician as Politician)?.contactPhone || (currentPolitician as PoliticianFormValues)?.contactPhone;

  return {
    name: currentPolitician?.name || "",
    partyId: partyIdToUse || null, 
    province: currentPolitician?.province || "",
    constituency: currentPolitician?.constituency === NONE_CONSTITUENCY_VALUE ? "" : currentPolitician?.constituency || null,
    imageUrl: currentPolitician?.imageUrl || "",
    dataAiHint: (currentPolitician as Politician)?.data_ai_hint || (currentPolitician as PoliticianFormValues)?.dataAiHint || "",
    bio: currentPolitician?.bio || "",
    position: currentPolitician?.position || "",
    dateOfBirth: currentPolitician?.dateOfBirth ? new Date(currentPolitician.dateOfBirth).toISOString().split('T')[0] : "",
    education: currentPolitician?.education || "",
    tags: tagsString,
    politicalCareer: getSafeArrayWithIds(currentPolitician?.politicalCareer).map(pc => ({...pc, year: pc.year || new Date().getFullYear(), role: pc.role || ""})),
    assetDeclarations: getSafeArrayWithIds(currentPolitician?.assetDeclarations).map(ad => ({
        ...ad,
        summary: ad.summary || "",
        declarationDate: ad.declarationDate ? new Date(ad.declarationDate).toISOString().split('T')[0] : undefined,
        sourceUrls: mapSourceUrlsToFormValues(ad.sourceUrls)
    })),
    criminalRecordEntries: getSafeArrayWithIds(currentPolitician?.criminalRecordEntries).map(entry => ({
        ...entry,
        severity: entry.severity || CRIMINAL_RECORD_SEVERITIES[0],
        status: entry.status || CRIMINAL_RECORD_STATUSES[0],
        offenseType: (entry as any).offense_type || (entry as any).offenseType || CRIMINAL_RECORD_OFFENSE_TYPES[0], 
        description: entry.description || "",
        caseDate: entry.caseDate ? new Date(entry.caseDate).toISOString().split('T')[0] : undefined,
        sourceUrls: mapSourceUrlsToFormValues(entry.sourceUrls)
    })),
    contactEmail: contactEmailFromPolitician || "",
    contactPhone: contactPhoneFromPolitician || "",
    contactSocialEntries: getSafeArrayWithIds(contactSocialEntriesFromPolitician).map(sml => ({...sml, platform: sml.platform || "", url: sml.url || ""})),
  };
};

// --- Custom Field Render Components ---
const ImageUploadField: React.FC<{ field: ControllerRenderProps<PoliticianFormValues, 'imageUrl'>, form: UseFormReturn<PoliticianFormValues>, dataAiHintFieldName: FieldPath<PoliticianFormValues> }> = ({ field, form, dataAiHintFieldName }) => {
  const { toast } = useToast();
  const [localPreview, setLocalPreview] = useState<string | null>(field.value || null);
  const dataAiHintValue = form.watch(dataAiHintFieldName);

  useEffect(() => {
    setLocalPreview(field.value || null);
  }, [field.value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ title: "File Too Large", description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        if (event.target) event.target.value = ""; return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setLocalPreview(dataUri);
        field.onChange(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setLocalPreview(null);
    field.onChange("");
    const fileInput = document.getElementById(`${field.name}-upload`) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 items-start">
        <Input id={field.name} type="text" placeholder="Enter image URL or Data URI" {...field} value={field.value || ''} onChange={(e) => { field.onChange(e.target.value); setLocalPreview(e.target.value); }} className="bg-background flex-grow" />
        <Input id={`${field.name}-upload`} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <Label htmlFor={`${field.name}-upload`} className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 mt-2 sm:mt-0")}><Upload className="h-4 w-4" /><span>Choose Image (Max {MAX_FILE_SIZE_MB}MB)</span></Label>
      </div>
      {localPreview && (<div className="mt-2 space-y-2"><Image src={localPreview} alt="Image preview" width={100} height={100} className="rounded-md border object-cover" data-ai-hint={dataAiHintValue || "politician photo"} /><Button type="button" variant="outline" size="sm" onClick={handleRemove}>Remove Image</Button></div>)}
    </div>
  );
};

const TagsInputField: React.FC<{ field: ControllerRenderProps<PoliticianFormValues, 'tags'>, form: UseFormReturn<PoliticianFormValues>, existingTags: string[], error?: FieldError }> = ({ field, form, existingTags, error }) => {
  const handleBadgeClick = (tagValue: string) => {
    const currentTags = field.value || "";
    let tagsArray = currentTags.split(",").map(t => t.trim()).filter(Boolean);
    if (!tagsArray.includes(tagValue) && tagsArray.length < 4) {
      field.onChange(currentTags ? `${currentTags}, ${tagValue}` : tagValue);
    } else if (tagsArray.length >= 4 && !tagsArray.includes(tagValue)) {
      form.setError("tags", { type: "manual", message: "A maximum of 4 tags can be added." });
    }
  };
  return (
    <div>
      <Input placeholder="e.g., Experienced, Youth Advocate" {...field} value={field.value || ""} className={cn("bg-background", error && "border-destructive focus-visible:ring-destructive")} />
      {existingTags.length > 0 && (<div className="flex flex-wrap gap-1 pt-2">{existingTags.slice(0, 15).map(item => (<Badge key={item} variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleBadgeClick(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBadgeClick(item); }}>{item}</Badge>))}</div>)}
    </div>
  );
};

const PoliticalCareerArrayField: React.FC<{ field: { name: 'politicalCareer' }, control: UseFormReturn<PoliticianFormValues>['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "politicalCareer" });
  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <Card key={item.id} className="p-4 bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-4 items-end">
            <Controller name={`politicalCareer.${index}.year`} control={control} render={({ field: yearField, fieldState }) => ( <FormItem><Label>Year</Label><Input type="number" placeholder="YYYY" {...yearField} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem> )}/>
            <Controller name={`politicalCareer.${index}.role`} control={control} render={({ field: roleField, fieldState }) => ( <FormItem><Label>Role/Position</Label><Input placeholder="e.g., Ward Chairperson" {...roleField} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem> )}/>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="self-end mb-1"><Trash2 className="mr-1 h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Remove</span></Button>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: generateId(), year: new Date().getFullYear(), role: "" })}><PlusCircle className="mr-2 h-4 w-4" /> Add Career Entry</Button>
    </div>
  );
};

const AssetDeclarationEntryForm: React.FC<{ entryIndex: number; control: UseFormReturn<PoliticianFormValues>['control']; removeEntry: () => void }> = ({ entryIndex, control, removeEntry }) => {
  const { fields: sourceUrlFields, append: appendSourceUrl, remove: removeSourceUrl } = useFieldArray({ control, name: `assetDeclarations.${entryIndex}.sourceUrls` });
  return (
    <Card className="p-4 space-y-4 bg-muted/50 border border-border/70">
      <Controller name={`assetDeclarations.${entryIndex}.summary`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Asset Summary</Label><Textarea placeholder="Summary..." {...field} className={cn("min-h-[80px] bg-background", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <Controller name={`assetDeclarations.${entryIndex}.declarationDate`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Declaration Date (Optional)</Label><Input type="date" {...field} value={field.value || ""} className={cn("bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <div>
        <Label className="text-sm font-medium">Source URLs</Label>
        {sourceUrlFields.map((sourceField, sourceIndex) => (
          <Card key={sourceField.id} className="mt-1 mb-2 p-2 space-y-1 bg-background/50 border-border/50">
            <Controller name={`assetDeclarations.${entryIndex}.sourceUrls.${sourceIndex}.value`} control={control} render={({ field: urlField, fieldState }) => (<FormItem><Label>URL {sourceIndex + 1}</Label><div className="flex items-center gap-2"><Input type="url" {...urlField} className={cn("bg-background text-xs", fieldState.error && "border-destructive")} /><Button type="button" variant="destructive" size="icon" onClick={() => removeSourceUrl(sourceIndex)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button></div><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
            <Controller name={`assetDeclarations.${entryIndex}.sourceUrls.${sourceIndex}.description`} control={control} render={({ field: descField, fieldState }) => (<FormItem><Label>Description (Optional)</Label><Input {...descField} className={cn("bg-background text-xs", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" className="mt-1 text-xs" onClick={() => appendSourceUrl({ id: generateId(), value: "", description: "" })}><PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Asset Source</Button>
      </div>
      <Button type="button" variant="destructive" size="sm" onClick={removeEntry} className="mt-4"><Trash2 className="mr-2 h-4 w-4" /> Remove Asset Entry</Button>
    </Card>
  );
};

const AssetDeclarationsArrayField: React.FC<{ field: { name: 'assetDeclarations' }, control: UseFormReturn<PoliticianFormValues>['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "assetDeclarations" });
  return (
    <div className="space-y-4">
      {fields.map((item, index) => (<AssetDeclarationEntryForm key={item.id} entryIndex={index} control={control} removeEntry={() => remove(index)} />))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: generateId(), summary: "", declarationDate: undefined, sourceUrls: [] })}><PlusCircle className="mr-2 h-4 w-4" /> Add Asset Declaration</Button>
    </div>
  );
};

const CriminalRecordEntryForm: React.FC<{ entryIndex: number; control: UseFormReturn<PoliticianFormValues>['control']; removeEntry: () => void }> = ({ entryIndex, control, removeEntry }) => {
  const { fields: sourceUrlFields, append: appendSourceUrl, remove: removeSourceUrl } = useFieldArray({ control, name: `criminalRecordEntries.${entryIndex}.sourceUrls` });
  return (
    <Card className="p-4 space-y-4 bg-muted/50 border border-border/70">
      <Controller name={`criminalRecordEntries.${entryIndex}.severity`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Severity</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger className={cn("bg-background", fieldState.error && "border-destructive")}><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{CRIMINAL_RECORD_SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <Controller name={`criminalRecordEntries.${entryIndex}.status`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Status</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger className={cn("bg-background", fieldState.error && "border-destructive")}><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{CRIMINAL_RECORD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <Controller name={`criminalRecordEntries.${entryIndex}.offenseType`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Offense Type</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger className={cn("bg-background", fieldState.error && "border-destructive")}><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{CRIMINAL_RECORD_OFFENSE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <Controller name={`criminalRecordEntries.${entryIndex}.description`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Description</Label><Textarea {...field} className={cn("min-h-[80px] bg-background", fieldState.error && "border-destructive")} /><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <Controller name={`criminalRecordEntries.${entryIndex}.caseDate`} control={control} render={({ field, fieldState }) => (<FormItem><Label>Case Date (Optional)</Label><Input type="date" {...field} value={field.value || ""} className={cn("bg-background", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
      <div>
        <Label className="text-sm font-medium">Source URLs</Label>
        {sourceUrlFields.map((sourceField, sourceIndex) => (
          <Card key={sourceField.id} className="mt-1 mb-2 p-2 space-y-1 bg-background/50 border-border/50">
             <Controller name={`criminalRecordEntries.${entryIndex}.sourceUrls.${sourceIndex}.value`} control={control} render={({ field: urlField, fieldState }) => (<FormItem><Label>URL {sourceIndex + 1}</Label><div className="flex items-center gap-2"><Input type="url" {...urlField} className={cn("bg-background text-xs", fieldState.error && "border-destructive")} /><Button type="button" variant="destructive" size="icon" onClick={() => removeSourceUrl(sourceIndex)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button></div><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
             <Controller name={`criminalRecordEntries.${entryIndex}.sourceUrls.${sourceIndex}.description`} control={control} render={({ field: descField, fieldState }) => (<FormItem><Label>Description (Optional)</Label><Input {...descField} className={cn("bg-background text-xs", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" className="mt-1 text-xs" onClick={() => appendSourceUrl({ id: generateId(), value: "", description: "" })}><PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Record Source</Button>
      </div>
      <Button type="button" variant="destructive" size="sm" onClick={removeEntry} className="mt-4"><Trash2 className="mr-2 h-4 w-4" /> Remove Record Entry</Button>
    </Card>
  );
};

const CriminalRecordEntriesArrayField: React.FC<{ field: { name: 'criminalRecordEntries' }, control: UseFormReturn<PoliticianFormValues>['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "criminalRecordEntries" });
  return (
    <div className="space-y-4">
      {fields.map((item, index) => (<CriminalRecordEntryForm key={item.id} entryIndex={index} control={control} removeEntry={() => remove(index)} />))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: generateId(), severity: CRIMINAL_RECORD_SEVERITIES[0], status: CRIMINAL_RECORD_STATUSES[0], offenseType: CRIMINAL_RECORD_OFFENSE_TYPES[0], description: "", caseDate: undefined, sourceUrls: [] })}><PlusCircle className="mr-2 h-4 w-4" /> Add Criminal Record</Button>
    </div>
  );
};

const SocialMediaLinksArrayField: React.FC<{ field: { name: 'contactSocialEntries' }, control: UseFormReturn<PoliticianFormValues>['control'] }> = ({ control }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "contactSocialEntries" });
  return (
    <div className="space-y-3">
      {fields.map((item, index) => (
        <Card key={item.id} className="p-3 bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Controller name={`contactSocialEntries.${index}.platform`} control={control} render={({ field: platformField, fieldState}) => (<FormItem><Label>Platform</Label><Input placeholder="e.g., Twitter" {...platformField} className={cn("bg-background", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
            <Controller name={`contactSocialEntries.${index}.url`} control={control} render={({ field: urlField, fieldState }) => (<FormItem><Label>URL</Label><Input type="url" placeholder="https://..." {...urlField} className={cn("bg-background", fieldState.error && "border-destructive")}/><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>)}/>
            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} aria-label="Remove social media link"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ id: generateId(), platform: "", url: "" })}><PlusCircle className="mr-2 h-4 w-4" /> Add Social Link</Button>
    </div>
  );
};

// --- Main PoliticianForm Component ---
interface PoliticianFormProps {
  politician?: Partial<Politician> | Partial<PoliticianFormValues> | null;
  onSubmitForm: (data: PoliticianFormValues) => void;
  isSubmitting: boolean;
  showCancelButton?: boolean;
  onCancelInlineEdit?: () => void;
  submitButtonText?: string;
  partyOptions?: SearchableSelectOption[];
  existingTagsForForm?: string[];
}

export function PoliticianForm({
  politician,
  onSubmitForm,
  isSubmitting,
  showCancelButton = true,
  onCancelInlineEdit,
  submitButtonText,
  partyOptions = [],
  existingTagsForForm = [],
}: PoliticianFormProps) {
  const router = useRouter();
  const formInstance = useForm<PoliticianFormValues>({
    resolver: zodResolver(politicianFormSchema),
    defaultValues: getInitialPoliticianFormValues(politician),
    mode: 'onChange',
  });

  useEffect(() => {
    formInstance.reset(getInitialPoliticianFormValues(politician));
  }, [politician, formInstance]);

  const selectedProvince = formInstance.watch("province");
  const availableConstituencies = useMemo(() => {
    if (!selectedProvince) return [];
    const constituencies = NEPAL_CONSTITUENCIES[selectedProvince as keyof typeof NEPAL_CONSTITUENCIES];
    return Array.isArray(constituencies) ? constituencies : [];
  }, [selectedProvince]);

  const politicianFieldsConfig: FormFieldConfig<PoliticianFormValues, FieldPath<PoliticianFormValues>>[] = [
    { name: "name", label: "Full Name", type: "text", placeholder: "Enter politician's full name", required: true },
    { name: "imageUrl", label: "Politician Image (Upload or Data URI)", type: "custom", description:"Enter a URL, paste a Data URI, or upload an image. Upload converts to Data URI.", renderCustom: (field, form) => <ImageUploadField field={field as ControllerRenderProps<PoliticianFormValues, 'imageUrl'>} form={form} dataAiHintFieldName="dataAiHint" /> },
    { name: "dataAiHint", label: "Image AI Hint (Optional)", type: "text", placeholder: "e.g., official portrait, rally speech", description:"Keywords for the politician's image (max 2-3 words)." },
    { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
    { name: "partyId", label: "Political Party", type: "searchable-select", options: partyOptions, placeholder: "Select a party or None", description: "Select the politician's affiliated party." },
    { name: "province", label: "Province", type: "select", options: NEPAL_PROVINCES.map(p => ({value: p, label:p})), placeholder: "Select Province", required: true, 
      description: "Select the province. This will load relevant constituencies." },
    { name: "constituency", label: "Constituency (Optional)", type: "select", options: [{value: "", label: "None"}, ...availableConstituencies.map(c => ({value: c, label:c}))], 
      placeholder: !selectedProvince ? "Select a province first" : "Select Constituency or None", disabled: !selectedProvince || availableConstituencies.length === 0, 
      description: "Constituencies are loaded based on the selected province. Select 'None' if not applicable." },
    { name: "position", label: "Current Position (Optional)", type: "text", placeholder: "e.g., Member of Parliament" },
    { name: "education", label: "Education (Optional)", type: "textarea", placeholder: "e.g., Masters in Political Science - Tribhuvan University", inputClassName: "min-h-[80px] bg-background", description: "Markdown supported for basic formatting." },
    { name: "bio", label: "Biography", type: "textarea", placeholder: "Enter a short biography... Markdown supported.", inputClassName: "min-h-[100px] bg-background", description: "Markdown supported for basic formatting like paragraphs, bold, italics, and lists.", required: true },
    { name: "politicalCareer", label: "Political Career", type: "custom", renderCustom: (field, form) => <PoliticalCareerArrayField field={field as { name: 'politicalCareer' }} control={form.control} /> },
    { name: "assetDeclarations", label: "Asset Declarations", type: "custom", renderCustom: (field, form) => <AssetDeclarationsArrayField field={field as { name: 'assetDeclarations' }} control={form.control} /> },
    { name: "criminalRecordEntries", label: "Criminal Record Entries", type: "custom", renderCustom: (field, form) => <CriminalRecordEntriesArrayField field={field as { name: 'criminalRecordEntries' }} control={form.control} /> },
    { name: "contactEmail", label: "Contact Email (Optional)", type: "email", placeholder: "politician@example.com" },
    { name: "contactPhone", label: "Contact Phone (Optional)", type: "text", placeholder: "+977-xxxxxxxxx" },
    { name: "contactSocialEntries", label: "Social Media Links", type: "custom", description: "Add links to social media profiles. Each entry will have a platform and URL.", renderCustom: (field, form) => <SocialMediaLinksArrayField field={field as { name: 'contactSocialEntries' }} control={form.control} /> },
    { name: "tags", label: "Tags (Optional, Max 4)", type: "custom", description: "Enter comma-separated tags. Click a suggestion to append it. Max 4 tags.", renderCustom: (field, form, error) => <TagsInputField field={field as ControllerRenderProps<PoliticianFormValues, 'tags'>} form={form} existingTags={existingTagsForForm} error={error}/> },
  ];

  const SeparatorField: FormFieldConfig<PoliticianFormValues, any> = { name: "separator" as any, label: "", type: "custom", renderCustom: () => <Separator className="my-6" /> };

  const finalFieldsConfigWithSeparators: FormFieldConfig<PoliticianFormValues, FieldPath<PoliticianFormValues>>[] = [];
    politicianFieldsConfig.forEach((field, index) => {
    finalFieldsConfigWithSeparators.push(field);
    // Add a separator after specific groups of fields for better visual organization
    if (["name", "dataAiHint", "constituency", "bio", "politicalCareer", "assetDeclarations", "criminalRecordEntries", "contactSocialEntries"].includes(field.name)) {
        if (index < politicianFieldsConfig.length - 1) { // Don't add after the last field
            finalFieldsConfigWithSeparators.push(SeparatorField);
        }
    }
    });


  return (
    <EntityFormBuilder<PoliticianFormValues>
      schema={politicianFormSchema}
      initialValues={getInitialPoliticianFormValues(politician)}
      onSubmit={onSubmitForm}
      fieldsConfig={finalFieldsConfigWithSeparators}
      isSubmitting={isSubmitting}
      submitButtonText={submitButtonText || (politician ? 'Save Changes' : 'Submit Suggestion')}
      cancelButtonText="Cancel"
      onCancel={onCancelInlineEdit || (() => router.back())}
      form={formInstance}
    />
  );
}

    