
// src/components/parties/party-edit-form-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { PageHeader } from '@/components/shared/page-header';
import { PartyForm, type PartyFormValues, getInitialFormValues as getPartyFormInitialValues } from '@/components/admin/party-form';
import type { Party } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { ROUTES } from '@/lib/routes';


interface PartyEditFormClientProps {
  initialParty: Party | null;
  partyId: string;
  politicianOptions: SearchableSelectOption[];
  existingIdeologies: string[];
  existingPartyTags: string[];
  serverFetchError?: string | null;
}

export function PartyEditFormClient({
  initialParty,
  partyId,
  politicianOptions,
  existingIdeologies,
  existingPartyTags,
  serverFetchError
}: PartyEditFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { updateOrSuggestUpdate, isLoading: isSubmittingEntity } = useEntityCrud('party');

  const [clientIsLoadingAuth, setClientIsLoadingAuth] = useState(true);

  useEffect(() => {
    setClientIsLoadingAuth(authIsLoading);
    if (!authIsLoading && !isAuthenticated) {
        router.replace(`${ROUTES.LOGIN}?redirectTo=${pathname}`);
    }
  }, [isAuthenticated, router, pathname, authIsLoading]);

  useEffect(() => {
    if (serverFetchError && !initialParty) { 
      toast({
        title: "Error Loading Party Data",
        description: serverFetchError,
        variant: "destructive",
      });
    }
  }, [initialParty, serverFetchError, toast]);


  const handleSubmit = async (data: PartyFormValues) => {
    const updatedParty = await updateOrSuggestUpdate(partyId, data, initialParty?.name || data.name || partyId, pathname);
     if (updatedParty) { 
      router.push(ROUTES.ADMIN.PARTIES);
    } else if (!isAdmin && updatedParty === null) {
      router.push(ROUTES.PARTIES.DETAIL(partyId));
    }
  };

  if (clientIsLoadingAuth) {
    return (
      <>
        <PageHeader title={isAdmin ? "Edit Party" : "Suggest Edits for Party"} description="Verifying access..." />
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
  
  if (!initialParty && !serverFetchError) { 
    return (
      <>
        <PageHeader title={isAdmin ? "Edit Party" : "Suggest Edits for Party"} description="Loading party data..." />
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      </>
    );
  }

  if (!initialParty && serverFetchError) { 
    return (
       <>
        <PageHeader title="Error" description="Party not found or could not be loaded." />
         <p className="text-destructive mt-4">{serverFetchError}</p>
       </>
    );
  }
  
  const pageTitle = isAdmin ? `Edit Party: ${initialParty?.name}` : `Suggest Edits for: ${initialParty?.name}`;
  const pageDescription = isAdmin
    ? "Update the details for this political party directly."
    : "Propose changes to this party's profile. Your suggestions will be reviewed by administrators.";
  const submitButtonText = isAdmin ? "Save Changes" : "Submit Suggestion for Review";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <PartyForm
            party={getPartyFormInitialValues(initialParty)}
            onSubmitForm={handleSubmit}
            isSubmitting={isSubmittingEntity}
            showCancelButton={true}
            onCancelInlineEdit={() => router.back()}
            submitButtonText={submitButtonText}
            politicianOptions={politicianOptions}
            existingIdeologies={existingIdeologies}
            existingPartyTags={existingPartyTags}
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
    