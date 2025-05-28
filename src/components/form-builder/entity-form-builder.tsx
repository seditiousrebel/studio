
// src/components/form-builder/entity-form-builder.tsx
"use client";

import React, { useState } from 'react';
import { useForm, FormProvider, Controller, type UseFormReturn, type FieldValues, type FieldPath, type ControllerRenderProps, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType, ZodTypeDef } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form as ShadcnForm, FormControl, FormDescription, FormField as ShadcnFormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Define field types for the builder
export type FormFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'date' 
  | 'select' 
  | 'searchable-select'
  | 'checkbox'
  | 'file' // Basic file input, actual upload handling is complex
  | 'custom'; // For more complex fields

export interface FormFieldConfig<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> {
  name: TName;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  description?: string;
  options?: SearchableSelectOption[]; // For select and searchable-select
  defaultValue?: any;
  validation?: ZodType<any, ZodTypeDef, any>; // Optional Zod schema for this field (usually part of main schema)
  renderCustom?: (
    field: ControllerRenderProps<TFieldValues, TName>, 
    form: UseFormReturn<TFieldValues>,
    error?: FieldError
  ) => React.ReactNode; // For 'custom' type
  disabled?: boolean;
  required?: boolean; // For basic HTML5 validation indication
  className?: string; // Class for the FormItem
  inputClassName?: string; // Class for the input element itself
}

interface EntityFormBuilderProps<TFormValues extends Record<string, any>> {
  schema: ZodType<TFormValues, ZodTypeDef, TFormValues>;
  initialValues?: Partial<TFormValues>; 
  onSubmit: (data: TFormValues) => Promise<void> | void;
  fieldsConfig: FormFieldConfig<TFormValues, FieldPath<TFormValues>>[];
  submitButtonText?: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  formClassName?: string; 
  form?: UseFormReturn<TFormValues>; 
}

export function EntityFormBuilder<TFormValues extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit,
  fieldsConfig,
  submitButtonText = "Submit",
  cancelButtonText = "Cancel",
  onCancel,
  isSubmitting: externalIsSubmitting,
  formClassName,
  form: externalForm,
}: EntityFormBuilderProps<TFormValues>) {
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const isActuallySubmitting = externalIsSubmitting ?? internalIsSubmitting;

  const internalForm = useForm<TFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues as any, 
    mode: 'onChange', 
  });

  const form = externalForm || internalForm;

  const handleFormSubmit = async (data: TFormValues) => {
    if (externalIsSubmitting === undefined) { 
      setInternalIsSubmitting(true);
    }
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      if (externalIsSubmitting === undefined) {
        setInternalIsSubmitting(false);
      }
    }
  };

  return (
    <FormProvider {...form}>
      <ShadcnForm {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className={formClassName || "space-y-6"}>
          {fieldsConfig.map((fieldConfig) => (
            <ShadcnFormField
              key={fieldConfig.name}
              control={form.control}
              name={fieldConfig.name}
              render={({ field, fieldState: { error } }) => (
                <FormItem className={fieldConfig.className}>
                  <FormLabel htmlFor={fieldConfig.name} className={error ? "text-destructive" : ""}>
                    {fieldConfig.label} {fieldConfig.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <>
                      {fieldConfig.type === 'text' && <Input id={fieldConfig.name} type="text" placeholder={fieldConfig.placeholder} {...field} value={field.value || ''} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}/>}
                      {fieldConfig.type === 'textarea' && <Textarea id={fieldConfig.name} placeholder={fieldConfig.placeholder} {...field} value={field.value || ''} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}/>}
                      {fieldConfig.type === 'number' && <Input id={fieldConfig.name} type="number" placeholder={fieldConfig.placeholder} {...field} value={field.value === undefined || field.value === null ? '' : String(field.value)} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}/>}
                      {fieldConfig.type === 'email' && <Input id={fieldConfig.name} type="email" placeholder={fieldConfig.placeholder} {...field} value={field.value || ''} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}/>}
                      {fieldConfig.type === 'password' && <Input id={fieldConfig.name} type="password" placeholder={fieldConfig.placeholder} {...field} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}/>}
                      {fieldConfig.type === 'date' && <Input id={fieldConfig.name} type="date" {...field} value={field.value || ''} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}/>}
                      {fieldConfig.type === 'select' && fieldConfig.options && (
                        <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined} disabled={fieldConfig.disabled || isActuallySubmitting}>
                           <SelectTrigger id={fieldConfig.name} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")}><SelectValue placeholder={fieldConfig.placeholder} /></SelectTrigger>
                          <SelectContent>
                            {fieldConfig.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {fieldConfig.type === 'searchable-select' && fieldConfig.options && (
                        <SearchableSelect 
                          options={fieldConfig.options} 
                          value={field.value || undefined} 
                          onChange={(val) => field.onChange(val || null)} // Ensure null for "None"
                          placeholder={fieldConfig.placeholder}
                          disabled={fieldConfig.disabled || isActuallySubmitting}
                          noneOptionLabel={fieldConfig.options.find(o => o.value === "")?.label || "None"}
                        />
                      )}
                      {fieldConfig.type === 'checkbox' && (
                        <div className="flex items-center space-x-2 pt-1">
                           <Checkbox id={fieldConfig.name} checked={!!field.value} onCheckedChange={field.onChange} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn(fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")} />
                           {fieldConfig.description && <FormDescription className="ml-2 !mt-0">{fieldConfig.description}</FormDescription>}
                        </div>
                      )}
                       {fieldConfig.type === 'file' && <Input id={fieldConfig.name} type="file" {...form.register(fieldConfig.name)} disabled={fieldConfig.disabled || isActuallySubmitting} className={cn("bg-background", fieldConfig.inputClassName, error && "border-destructive focus-visible:ring-destructive")} />}
                      {fieldConfig.type === 'custom' && fieldConfig.renderCustom && fieldConfig.renderCustom(field, form, error)}
                    </>
                  </FormControl>
                  {fieldConfig.description && fieldConfig.type !== 'checkbox' && <FormDescription className={error ? "text-destructive" : ""}>{fieldConfig.description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isActuallySubmitting} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
              {isActuallySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isActuallySubmitting ? "Submitting..." : submitButtonText}
            </Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isActuallySubmitting}>{cancelButtonText}</Button>}
          </div>
        </form>
      </ShadcnForm>
    </FormProvider>
  );
}
