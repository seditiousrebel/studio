
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { PartyForm, type PartyFormValues, getInitialFormValues as getPartyFormInitialValues } from '@/components/admin/party-form';
import type { Party, EditSuggestion } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { AdminLayout } from '@/components/layout/admin-layout'; // Import AdminLayout

export default function AdminEditPartySuggestionPage() {
  const { supabase } = useAuth(); // Auth checks are handled by AdminLayout
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const suggestionId = params.suggestionId as string;
  const { toast } = useToast();

  const [suggestion, setSuggestion] = useState<EditSuggestion | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [politicianOptions, setPoliticianOptions] = useState<SearchableSelectOption[]>([]);
  const [existingIdeologies, setExistingIdeologies] = useState<string[]>([]);
  const [existingPartyTags, setExistingPartyTags] = useState<string[]>([]);
  const [partyDataForForm, setPartyDataForForm] = useState<Partial<PartyFormValues> | null>(null);

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
            toast({ title: "Error", description: `Suggestion not found: ${String(suggestionError?.message)}`, variant: "destructive" });
            router.push('/admin/suggestions');
            return;
          }
          if (fetchedSuggestion.entity_type !== 'party') {
            toast({ title: "Error", description: "Invalid suggestion type.", variant: "destructive" });
            router.push('/admin/suggestions');
            return;
          }
          setSuggestion(fetchedSuggestion as EditSuggestion);
          setPartyDataForForm(getPartyFormInitialValues(fetchedSuggestion.suggested_data as Partial<Party> | Partial<PartyFormValues> | null));

          const { data: polsData, error: polsError } = await supabase.from('politicians').select('id, name').order('name');
          if (polsError) throw polsError;
          setPoliticianOptions((polsData || []).map(p => ({ value: p.id, label: p.name })));

          const { data: ideologiesRows, error: ideologiesError } = await supabase.from('parties').select('ideology');
          if (ideologiesError) throw ideologiesError;
          if (ideologiesRows) {
            setExistingIdeologies(Array.from(new Set(ideologiesRows.flatMap(p => (p.ideology || "").split(',').map(i => i.trim()).filter(Boolean)))).sort());
          }
          
          const { data: tagLinks, error: tagsError } = await supabase.from('party_tags').select('tags(name)');
          if (tagsError) throw tagsError;
          if (tagLinks) setExistingPartyTags(Array.from(new Set(tagLinks.map(tl => tl.tags?.name).filter(Boolean) as string[])).sort());
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

  const handleSubmitPartySuggestionEdits = async (formData: PartyFormValues) => {
    if (!suggestion) return;
    setIsSubmitting(true);

    const updatedSuggestedData: Partial<PartyFormValues> = { ...formData };
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
        description: "The suggested party data has been modified.",
      });
      router.refresh(); 
      router.push('/admin/suggestions');
    } catch (error: any) {
      toast({ title: "Error", description: `Could not update suggestion: ${String(error.message)}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingData || isLoadingOptions || !suggestion || !partyDataForForm) { 
    return (
      <AdminLayout pageTitle="Edit Party Suggestion" pageDescription="Loading data...">
        <Container className="py-8 md:py-12"><PageHeader title="Edit Party Suggestion" description="Loading..." /><Skeleton className="h-[calc(100vh-200px)] w-full" /></Container>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout
        pageTitle={`Edit Suggestion for: ${suggestion.is_new_item_suggestion ? 'New Party' : ((partyDataForForm as PartyFormValues).name || suggestion.entity_id)}`}
        pageDescription="Modify the suggested party data. These changes will update the suggestion itself."
    >
      <Container className="py-8 md:py-12">
        <PageHeader
          title={`Edit Suggestion for: ${suggestion.is_new_item_suggestion ? 'New Party' : ((partyDataForForm as PartyFormValues).name || suggestion.entity_id)}`}
          description="Modify the suggested party data. These changes will update the suggestion itself."
        />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <PartyForm
              party={partyDataForForm}
              onSubmitForm={handleSubmitPartySuggestionEdits}
              isSubmitting={isSubmitting}
              showCancelButton={true} 
              onCancelInlineEdit={() => router.push('/admin/suggestions')}
              submitButtonText="Save Suggested Changes"
              politicianOptions={politicianOptions}
              existingIdeologies={existingIdeologies}
              existingPartyTags={existingPartyTags}
            />
          </CardContent>
        </Card>
      </Container>
    </AdminLayout>
  );
}
