
// src/components/politicians/politician-edit-form-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { PageHeader } from '@/components/shared/page-header';
import { PoliticianForm, type PoliticianFormValues } from '@/components/admin/politician-form';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { ROUTES } from '@/lib/routes';

interface PoliticianEditFormClientProps {
  initialFormValues: PoliticianFormValues | null;
  politicianId: string;
  politicianOriginalName?: string;
  partyOptions: SearchableSelectOption[];
  existingTagsForForm: string[];
  serverInitialLoadError?: string | null;
}

export function PoliticianEditFormClient({
  initialFormValues,
  politicianId,
  politicianOriginalName,
  partyOptions,
  existingTagsForForm,
  serverInitialLoadError,
}: PoliticianEditFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { updateOrSuggestUpdate, isLoading: isSubmittingEntity } = useEntityCrud('politician');

  const [clientIsLoadingAuth, setClientIsLoadingAuth] = useState(true);

  useEffect(() => {
    setClientIsLoadingAuth(authIsLoading);
    if (!authIsLoading && !isAuthenticated) {
        router.replace(`${ROUTES.LOGIN}?redirectTo=${pathname}`);
    }
  }, [isAuthenticated, router, pathname, authIsLoading]);

  useEffect(() => {
    if (serverInitialLoadError) {
      toast({
        title: "Error Loading Politician Data",
        description: serverInitialLoadError,
        variant: "destructive",
      });
    }
  }, [serverInitialLoadError, toast]);


  const handleSubmit = async (data: PoliticianFormValues) => {
    const updatedPolitician = await updateOrSuggestUpdate(politicianId, data, politicianOriginalName || data.name || politicianId, pathname);
    if (updatedPolitician) { 
      router.push(ROUTES.ADMIN.POLITICIANS);
    } else if (!isAdmin && updatedPolitician === null) { 
      router.push(ROUTES.POLITICIANS.DETAIL(politicianId));
    }
  };

  if (clientIsLoadingAuth) {
    return (
      <>
        <PageHeader title={isAdmin ? "Edit Politician" : "Suggest Edits for Politician"} description="Verifying access..." />
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      </>
    );
  }

  if (!isAuthenticated) {
     return (
      <>
        <PageHeader title="Access Denied" description="Please log in to continue." />
        <div className="mt-8 p-6 border border-yellow-500/50 bg-yellow-500/10 rounded-lg text-yellow-700 dark:text-yellow-400 flex items-center">
          <ShieldAlert className="h-8 w-8 mr-4 text-yellow-600 dark:text-yellow-500" />
          <div><h3 className="font-semibold text-lg">Authentication Required</h3><p className="text-sm">You must be logged in. Redirecting to login...</p></div>
        </div>
      </>
    );
  }
  
  if (!initialFormValues) {
    return (
      <>
        <PageHeader title="Error" description={serverInitialLoadError || "Politician data could not be loaded."} />
      </>
    );
  }

  const pageTitle = isAdmin ? `Edit Politician: ${initialFormValues.name || politicianOriginalName}` : `Suggest Edits for: ${politicianOriginalName || initialFormValues.name}`;
  const pageDescription = isAdmin
    ? "Update the details for this politician directly."
    : "Propose changes to this politician's profile. Your suggestions will be reviewed by administrators.";
  const submitButtonText = isAdmin ? "Save Changes" : "Submit Suggestion for Review";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <PoliticianForm
            politician={initialFormValues}
            onSubmitForm={handleSubmit}
            isSubmitting={isSubmittingEntity}
            showCancelButton={true}
            onCancelInlineEdit={() => router.back()}
            submitButtonText={submitButtonText}
            partyOptions={partyOptions}
            existingTagsForForm={existingTagsForForm}
          />
        </CardContent>
      </Card>
       {!isAdmin && (
         <div className="mt-8 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg text-blue-700 dark:text-blue-300">
          <h3 className="font-semibold">Submission Note:</h3>
          <p className="text-sm">Your suggested changes will be submitted for review. Thank you for helping keep our information accurate!</p>
        </div>
       )}
    </>
  );
}
    