
// src/components/parties/party-add-form-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { PageHeader } from '@/components/shared/page-header';
import { PartyForm, type PartyFormValues } from '@/components/admin/party-form';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { ROUTES } from '@/lib/routes';

interface PartyAddFormClientProps {
  politicianOptions: SearchableSelectOption[];
  existingIdeologies: string[];
  existingPartyTags: string[];
  serverFetchError?: string | null;
}

export function PartyAddFormClient({
  politicianOptions,
  existingIdeologies,
  existingPartyTags,
  serverFetchError,
}: PartyAddFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { createOrSuggestEntity, isLoading: isSubmittingEntity } = useEntityCrud('party');

  const [clientIsLoadingAuth, setClientIsLoadingAuth] = useState(true);

  useEffect(() => {
    setClientIsLoadingAuth(authIsLoading);
    if (!authIsLoading && !isAuthenticated) {
        router.replace(`${ROUTES.LOGIN}?redirectTo=${pathname}`);
    }
  }, [isAuthenticated, router, pathname, authIsLoading]);

  useEffect(() => {
    if (serverFetchError) {
      toast({
        title: "Error Loading Form Options",
        description: serverFetchError,
        variant: "destructive",
      });
    }
  }, [serverFetchError, toast]);

  const handleSubmit = async (data: PartyFormValues) => {
    const newParty = await createOrSuggestEntity(data, pathname);
    if (newParty) {
      router.push(ROUTES.ADMIN.PARTIES);
    } else if (!isAdmin && newParty === null) {
      router.push(ROUTES.PARTIES.LIST);
    }
  };

  if (clientIsLoadingAuth) {
     return (
      <>
        <PageHeader title={isAdmin ? "Add New Party" : "Suggest New Party"} description="Verifying access..." />
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
          <div>
            <h3 className="font-semibold text-lg">Authentication Required</h3>
            <p className="text-sm">
              You need to be logged in to perform this action. Redirecting to login...
            </p>
          </div>
        </div>
      </>
    );
  }

  const pageTitle = isAdmin ? "Add New Political Party" : "Suggest New Political Party";
  const pageDescription = isAdmin
    ? "Fill in the details to add a new party directly to the platform."
    : "Help us expand our database. Fill in the details for a new party to be reviewed by our team.";
  const submitButtonText = isAdmin ? "Add Party" : "Submit Suggestion";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <PartyForm
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
          <p className="text-sm">
           Your suggestion will be submitted for review by administrators. Thank you for your contribution!
          </p>
        </div>
       )}
    </>
  );
}
    