
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { PoliticianForm, type PoliticianFormValues, getInitialPoliticianFormValues } from '@/components/admin/politician-form';
import type { Politician, EditSuggestion, Tag } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { AdminLayout } from '@/components/layout/admin-layout'; // Import AdminLayout

export default function AdminEditPoliticianSuggestionPage() {
  const { supabase } = useAuth(); // Auth checks are handled by AdminLayout
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const suggestionId = params.suggestionId as string;
  const { toast } = useToast();

  const [suggestion, setSuggestion] = useState<EditSuggestion | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partyOptions, setPartyOptions] = useState<SearchableSelectOption[]>([]);
  const [existingTagsForForm, setExistingTagsForForm] = useState<string[]>([]);
  const [politicianDataForForm, setPoliticianDataForForm] = useState<Partial<PoliticianFormValues> | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);


  useEffect(() => {
    if (suggestionId) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setIsLoadingOptions(true);
        try {
          const { data: fetchedSuggestion, error: suggestionError } = await supabase
            .from('suggestions')
            .select('*')
            .eq('id', suggestionId)
            .single();

          if (suggestionError || !fetchedSuggestion) {
            toast({ title: "Error", description: `Suggestion not found or error: ${String(suggestionError?.message || 'Unknown error')}`, variant: "destructive" });
            router.push('/admin/suggestions');
            return;
          }
          if (fetchedSuggestion.entity_type !== 'politician') {
            toast({ title: "Error", description: "Invalid suggestion type for this page.", variant: "destructive" });
            router.push('/admin/suggestions');
            return;
          }
          setSuggestion(fetchedSuggestion as EditSuggestion);
          
          setPoliticianDataForForm(getInitialPoliticianFormValues(fetchedSuggestion.suggested_data as Partial<Politician> | Partial<PoliticianFormValues>));

          const { data: partiesData, error: partiesError } = await supabase.from('parties').select('id, name').order('name');
          if (partiesError) throw partiesError;
          setPartyOptions((partiesData || []).map(p => ({ value: p.id, label: p.name })));
          
          const { data: tagLinks } = await supabase.from('politician_tags').select('tags(name)');
          if (tagLinks) {
              const distinctTags = Array.from(new Set(tagLinks.map(tl => tl.tags?.name).filter(Boolean) as string[])).sort();
              setExistingTagsForForm(distinctTags);
          }
          setIsLoadingOptions(false);
        } catch (error: any) {
          toast({ title: "Error Loading Data", description: String(error.message), variant: "destructive" });
          router.push('/admin/suggestions');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [suggestionId, router, toast, supabase, pathname]);

  const handleSubmitSuggestionEdits = async (formData: PoliticianFormValues) => {
    if (!suggestion) return;
    setIsSubmitting(true);
    
    const updatedSuggestedData: Partial<PoliticianFormValues> = { ...formData };
    if (Array.isArray(formData.tags)) {
      updatedSuggestedData.tags = formData.tags.map(t => (typeof t === 'object' && t.name ? t.name : String(t))).join(',');
    } else {
      updatedSuggestedData.tags = String(formData.tags || '');
    }
    
    try {
      const response = await fetch('/api/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ suggestionId: suggestion.id, action: 'update_data', updatedSuggestedData }),
      });

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}.`;
        let errorResponseText = "";
        try {
          errorResponseText = await response.text();
          if (errorResponseText) {
            try {
              const errorJson = JSON.parse(errorResponseText);
              errorMessage = String(errorJson.error?.message || errorJson.message || errorResponseText.substring(0, 200) || "Error processing server response.");
            } catch (jsonError) {
              errorMessage = `Server returned non-JSON error: ${String(errorResponseText).substring(0, 200)}`;
            }
          } else {
            errorMessage += " The error response body was empty.";
          }
        } catch (textError: any) {
          errorMessage += ` Failed to read response body: ${String(textError.message || "details unavailable")}.`;
        }
        
        if (errorMessage.includes("Unauthorized. User not authenticated.") || response.status === 401) {
            toast({ title: "Authentication Failed", description: "Your session might have expired. Please log in again.", variant: "destructive" });
            router.push(`/login?redirectTo=${pathname}`);
            setIsSubmitting(false);
            return;
        }
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Suggestion Updated",
        description: "The suggested data has been modified. You can now approve or deny it from the main list.",
      });
      router.refresh(); 
      router.push('/admin/suggestions'); 
    } catch (error: any) {
      toast({ title: "Error Updating Suggestion", description: String(error.message), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData || isLoadingOptions || !suggestion || !politicianDataForForm) { 
    return (
      <AdminLayout pageTitle="Edit Politician Suggestion" pageDescription="Loading suggestion data...">
        <Container className="py-8 md:py-12"><PageHeader title="Edit Politician Suggestion" description="Loading suggestion data and options..." /> <Skeleton className="h-[calc(100vh-200px)] w-full" /></Container>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout
      pageTitle={`Edit Suggestion for: ${suggestion.is_new_item_suggestion ? 'New Politician' : ((politicianDataForForm as Partial<Politician>)?.name || suggestion.entity_id)}`}
      pageDescription="Modify the suggested politician data below. These changes will update the suggestion itself, which you can then approve or deny from the main suggestions list."
    >
      <Container className="py-8 md:py-12">
        <PageHeader
          title={`Edit Suggestion for: ${suggestion.is_new_item_suggestion ? 'New Politician' : ((politicianDataForForm as Partial<Politician>)?.name || suggestion.entity_id)}`}
          description="Modify the suggested politician data below. These changes will update the suggestion itself, which you can then approve or deny from the main suggestions list."
        />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <PoliticianForm
              politician={politicianDataForForm} 
              onSubmitForm={handleSubmitSuggestionEdits}
              isSubmitting={isSubmitting}
              showCancelButton={true} 
              onCancelInlineEdit={() => router.push('/admin/suggestions')} 
              submitButtonText="Save Suggested Changes"
              partyOptions={partyOptions}
              existingTagsForForm={existingTagsForForm}
            />
          </CardContent>
        </Card>
        <div className="mt-8 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg text-blue-700 dark:text-blue-300">
          <h3 className="font-semibold">Admin Workflow Note:</h3>
          <p className="text-sm">
          Saving changes here updates the suggestion. Final approval or denial happens on the main suggestions list page.
          </p>
        </div>
      </Container>
    </AdminLayout>
  );
}
