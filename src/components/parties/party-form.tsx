
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { mockParties, mockPoliticians } from "@/lib/data/mock";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Upload, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Separator } from "../ui/separator";

const partyFormSchema = z.object({
  name: z.string().min(2, { message: "Party name must be at least 2 characters." }),
  shortName: z.string().optional(),
  logoUrl: z.string().optional().or(z.literal('')),
  ideology: z.string().min(3, { message: "Ideology must be at least 3 characters." }),
  foundingDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  chairpersonId: z.string().optional(),
  headquarters: z.string().optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  history: z.string().min(10, { message: "History must be at least 10 characters." }),
  electionSymbolUrl: z.string().optional().or(z.literal('')),
  website: z.string().url({ message: "Please enter a valid URL for the website." }).optional().or(z.literal('')),
  tags: z.string().optional().refine(
    (tagsString) => {
      if (!tagsString || tagsString.trim() === "") return true;
      const tagsArray = tagsString.split(",").map(t => t.trim()).filter(Boolean);
      return tagsArray.length <= 4;
    },
    { message: "A maximum of 4 tags can be added." }
  ),
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;

interface PartyFormProps {
  party?: Party | Partial<Party> | null;
  onSubmitForm: (data: PartyFormValues) => void;
  isSubmitting: boolean;
  showCancelButton?: boolean; 
  onCancelInlineEdit?: () => void; 
  submitButtonText?: string;
}

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const getInitialFormValues = (currentParty?: Party | Partial<Party> | null): PartyFormValues => ({
  name: currentParty?.name || "",
  shortName: currentParty?.shortName || "",
  logoUrl: currentParty?.logoUrl || "",
  ideology: currentParty?.ideology || "",
  foundingDate: currentParty?.foundingDate ? new Date(currentParty.foundingDate).toISOString().split('T')[0] : "",
  chairpersonId: currentParty?.chairpersonId || "",
  headquarters: currentParty?.headquarters || "",
  description: currentParty?.description || "",
  history: currentParty?.history || "",
  electionSymbolUrl: currentParty?.electionSymbolUrl || "",
  website: currentParty?.website || "",
  tags: Array.isArray(currentParty?.tags) ? currentParty.tags.join(", ") : (typeof currentParty?.tags === 'string' ? currentParty.tags : ""),
});

export function PartyForm({ 
  party, 
  onSubmitForm, 
  isSubmitting, 
  showCancelButton = true, 
  onCancelInlineEdit,
  submitButtonText
}: PartyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(party?.logoUrl || null);
  const [symbolPreview, setSymbolPreview] = useState<string | null>(party?.electionSymbolUrl || null);

  const existingIdeologies = useMemo(() => {
    return Array.from(new Set(mockParties.flatMap(p => p.ideology.split(',').map(i => i.trim()).filter(Boolean)))).sort();
  }, []);

  const existingTags = useMemo(() => {
    return Array.from(new Set(mockParties.flatMap(p => p.tags || []).map(t => t.trim()).filter(Boolean))).sort();
  }, []);
  
  const politicianOptions: SearchableSelectOption[] = useMemo(() => {
    return mockPoliticians.map(p => ({ value: p.id, label: p.name })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: getInitialFormValues(party),
  });

 useEffect(() => {
    const initialValues = getInitialFormValues(party);
    form.reset(initialValues);
    setLogoPreview(initialValues.logoUrl || null);
    setSymbolPreview(initialValues.electionSymbolUrl || null);
  }, [party, form]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: "logoUrl" | "electionSymbolUrl") => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        if (event.target) event.target.value = "";
        return;
      }
      console.log("Placeholder: Ideal place for client-side image compression before Data URI conversion.");
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        if (fieldName === "logoUrl") setLogoPreview(dataUri);
        if (fieldName === "electionSymbolUrl") setSymbolPreview(dataUri);
        form.setValue(fieldName, dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (fieldName: "logoUrl" | "electionSymbolUrl") => {
    if (fieldName === "logoUrl") setLogoPreview(null);
    if (fieldName === "electionSymbolUrl") setSymbolPreview(null);
    form.setValue(fieldName, "", { shouldValidate: true });
    const fileInput = document.getElementById(fieldName) as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  };

  const handleBadgeClick = (fieldName: "ideology" | "tags", value: string) => {
    const currentFieldValue = form.getValues(fieldName as keyof PartyFormValues) || "";
    let itemsArray = currentFieldValue.split(",").map(item => item.trim()).filter(Boolean);
    
    if (fieldName === 'tags' && itemsArray.length >= 4 && !itemsArray.includes(value)) {
      form.setError("tags", { type: "manual", message: "A maximum of 4 tags can be added." });
      return;
    }

    if (!itemsArray.includes(value)) {
      itemsArray.push(value);
      form.setValue(fieldName as keyof PartyFormValues, itemsArray.join(", "), { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-8">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Party Name</FormLabel>
                <FormControl><Input placeholder="Enter party's full name" {...field} className="bg-background" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Name (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., NDP" {...field} className="bg-background" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        
        <Separator />

        <FormItem>
            <FormLabel>Party Logo (Placeholder for Upload)</FormLabel>
            <FormControl>
              <div>
                <Input
                  id="logoUrl"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "logoUrl")}
                  className="hidden"
                />
                <Label
                  htmlFor="logoUrl"
                  className={cn(
                      buttonVariants({ variant: "outline" }),
                      "cursor-pointer w-full md:w-auto flex items-center justify-center gap-2"
                  )}
                  >
                  <Upload className="h-4 w-4" />
                  <span>Choose Logo (Max {MAX_FILE_SIZE_MB}MB)</span>
                </Label>
              </div>
            </FormControl>
            <FormDescription>Enter a publicly accessible URL for the image or upload a file. Direct file upload functionality is planned for a future update.</FormDescription>
            {logoPreview && (
            <div className="mt-2 space-y-2">
                <Image src={logoPreview} alt="Logo preview" width={100} height={100} className="rounded-md border object-contain" data-ai-hint="party logo preview"/>
                <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveImage("logoUrl")}>Remove Logo</Button>
            </div>
            )}
            {form.formState.errors.logoUrl && <FormMessage>{form.formState.errors.logoUrl.message}</FormMessage>}
        </FormItem>

         <FormItem>
              <FormLabel>Election Symbol Image (Placeholder for Upload)</FormLabel>
              <FormControl>
                <div>
                  <Input
                    id="electionSymbolUrl"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "electionSymbolUrl")}
                    className="hidden"
                  />
                   <Label
                    htmlFor="electionSymbolUrl"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "cursor-pointer w-full md:w-auto flex items-center justify-center gap-2"
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Choose Symbol (Max {MAX_FILE_SIZE_MB}MB)</span>
                  </Label>
                </div>
              </FormControl>
               <FormDescription>Enter a publicly accessible URL for the image or upload a file. Direct file upload functionality is planned for a future update.</FormDescription>
              {symbolPreview && (
                <div className="mt-2 space-y-2">
                  <Image src={symbolPreview} alt="Election symbol preview" width={100} height={100} className="rounded-md border object-contain" data-ai-hint="election symbol preview"/>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveImage("electionSymbolUrl")}>Remove Symbol</Button>
                </div>
              )}
              {form.formState.errors.electionSymbolUrl && <FormMessage>{form.formState.errors.electionSymbolUrl.message}</FormMessage>}
            </FormItem>

        <Separator />
        
        <FormField
          control={form.control}
          name="ideology"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ideology</FormLabel>
              <FormControl><Input placeholder="e.g., Centrism, Social Democracy" {...field} className="bg-background" /></FormControl>
              <FormDescription>
                Enter main ideologies, separated by commas. Click a suggestion to append it.
              </FormDescription>
              {existingIdeologies.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {existingIdeologies.slice(0,10).map(ideo => (
                    <Badge
                      key={ideo}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleBadgeClick("ideology", ideo)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBadgeClick("ideology", ideo); }}
                    >
                      {ideo}
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="foundingDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Founding Date</FormLabel>
                <FormControl><Input type="date" {...field} className="bg-background" /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
              control={form.control}
              name="chairpersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chairperson (Optional)</FormLabel>
                   <SearchableSelect
                      options={politicianOptions}
                      value={field.value || undefined}
                      onChange={(selectedValue) => field.onChange(selectedValue || "")}
                      placeholder="Search & Select Chairperson"
                      emptyMessage="No politician found."
                      noneOptionLabel="None"
                      disabled={isSubmitting}
                    />
                  <FormDescription>
                    Select the party's chairperson. The name will be synced automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        
        <Separator />

        <FormField
          control={form.control}
          name="headquarters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Headquarters (Optional)</FormLabel>
              <FormControl><Input placeholder="e.g., Kathmandu, Nepal" {...field} className="bg-background" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Website URL (Optional)</FormLabel>
                <FormControl><Input type="url" placeholder="https://example.com" {...field} className="bg-background" /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Separator />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Brief description of the party..." {...field} className="min-h-[100px] bg-background" /></FormControl>
               <FormDescription>Markdown supported for basic formatting like paragraphs, bold, italics, and lists.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="history"
          render={({ field }) => (
            <FormItem>
              <FormLabel>History</FormLabel>
              <FormControl><Textarea placeholder="Brief history of the party..." {...field} className="min-h-[100px] bg-background" /></FormControl>
               <FormDescription>Markdown supported for basic formatting like paragraphs, bold, italics, and lists.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional, Max 4)</FormLabel>
              <FormControl><Input placeholder="e.g., Major Party, Regional Focus, Youth Wing" {...field} className="bg-background" /></FormControl>
              <FormDescription>
                Enter comma-separated tags. Click a suggestion to append it. Max 4 tags.
                </FormDescription>
               {existingTags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {existingTags.slice(0,10).map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleBadgeClick("tags", tag)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBadgeClick("tags", tag); }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
            {submitButtonText || (isSubmitting ? (party ? 'Saving...' : 'Creating...') : (party ? 'Save Changes' : 'Create Party'))}
          </Button>
          {onCancelInlineEdit && (
            <Button type="button" variant="outline" onClick={onCancelInlineEdit} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          {showCancelButton && !onCancelInlineEdit && (
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
