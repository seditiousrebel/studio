
// src/components/politicians/politician-add-form-client.tsx
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

interface PoliticianAddFormClientProps {
  partyOptions: SearchableSelectOption[];
  existingTagsForForm: string[];
  serverInitialLoadError?: string | null;
}

export function PoliticianAddFormClient({
  partyOptions,
  existingTagsForForm,
  serverInitialLoadError,
}: PoliticianAddFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { createOrSuggestEntity, isLoading: isSubmittingEntity } = useEntityCrud('politician');

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
        title: "Error Loading Form Options",
        description: serverInitialLoadError,
        variant: "destructive",
      });
    }
  }, [serverInitialLoadError, toast]);

  const handleSubmit = async (data: PoliticianFormValues) => {
    const newPolitician = await createOrSuggestEntity(data, pathname);
    if (newPolitician) { 
      router.push(ROUTES.ADMIN.POLITICIANS);
    } else if (!isAdmin && newPolitician === null) { 
      router.push(ROUTES.POLITICIANS.LIST);
    }
  };

  if (clientIsLoadingAuth) {
     return (
      <>
        <PageHeader title={isAdmin ? "Add New Politician" : "Suggest New Politician"} description="Verifying access..." />
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

  const pageTitle = isAdmin ? "Add New Politician" : "Suggest New Politician";
  const pageDescription = isAdmin
    ? "Fill in the details to add a new politician directly to the platform."
    : "Help us expand our database. Fill in the details for a new politician to be reviewed by our team.";
  const submitButtonText = isAdmin ? "Add Politician" : "Submit Suggestion";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <PoliticianForm
            onSubmitForm={handleSubmit}
            isSubmitting={isSubmittingEntity}
            partyOptions={partyOptions}
            existingTagsForForm={existingTagsForForm}
            submitButtonText={submitButtonText}
            showCancelButton={true}
            onCancelInlineEdit={() => router.back()}
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
    