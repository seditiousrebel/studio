
// src/components/promises/promise-edit-form-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { PageHeader } from '@/components/shared/page-header';
import { PromiseForm, type PromiseFormValues, getInitialFormValues as getPromiseFormInitialValues } from '@/components/admin/promise-form';
import type { UserPromise } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { ROUTES } from '@/lib/routes';

interface PromiseEditFormClientProps {
  initialPromise: UserPromise | null;
  promiseId: string;
  politicianOptions: SearchableSelectOption[];
  partyOptions: SearchableSelectOption[];
  existingCategories: string[];
  existingPromiseTags: string[];
  serverFetchError?: string | null;
}

export function PromiseEditFormClient({
  initialPromise,
  promiseId,
  politicianOptions,
  partyOptions,
  existingCategories,
  existingPromiseTags,
  serverFetchError
}: PromiseEditFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { updateOrSuggestUpdate, isLoading: isSubmittingEntity } = useEntityCrud('promise');

  const [clientIsLoadingAuth, setClientIsLoadingAuth] = useState(true);

  useEffect(() => {
    setClientIsLoadingAuth(authIsLoading);
    if (!authIsLoading && !isAuthenticated) {
        router.replace(`${ROUTES.LOGIN}?redirectTo=${pathname}`);
    }
  }, [isAuthenticated, router, pathname, authIsLoading]);

  useEffect(() => {
    if (serverFetchError && !initialPromise) {
      toast({
        title: "Error Loading Promise Data",
        description: serverFetchError,
        variant: "destructive",
      });
    }
  }, [initialPromise, serverFetchError, toast]);

  const handleSubmit = async (data: PromiseFormValues) => {
    const updatedPromise = await updateOrSuggestUpdate(promiseId, data, initialPromise?.title || data.title || promiseId, pathname);
    if (updatedPromise) {
      router.push(ROUTES.ADMIN.PROMISES);
    } else if (!isAdmin && updatedPromise === null) {
      router.push(ROUTES.PROMISES.DETAIL(promiseId));
    }
  };

  if (clientIsLoadingAuth) {
     return (
      <>
        <PageHeader title={isAdmin ? "Edit Promise" : "Suggest Edits for Promise"} description="Verifying access..." />
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      </>
    );
  }

  if (!isAuthenticated) {
     return (
      <>
        <PageHeader title="Access Denied" description="Please log in." />
        <div className="mt-8 p-6 border border-yellow-500/50 bg-yellow-500/10 rounded-lg text-yellow-700 dark:text-yellow-400 flex items-center">
          <ShieldAlert className="h-8 w-8 mr-4 text-yellow-600 dark:text-yellow-500" />
          <div><h3 className="font-semibold text-lg">Authentication Required</h3><p className="text-sm">Redirecting to login...</p></div>
        </div>
      </>
    );
  }
  
  if (!initialPromise && !serverFetchError) {
    return (
      <>
        <PageHeader title={isAdmin ? "Edit Promise" : "Suggest Edits for Promise"} description="Loading promise data..." />
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      </>
    );
  }

  if (!initialPromise && serverFetchError) {
    return (
      <>
        <PageHeader title="Error" description="Promise not found or could not be loaded." />
        <p className="text-destructive mt-4">{serverFetchError}</p>
      </>
    );
  }

  const pageTitle = isAdmin ? `Edit Promise: ${initialPromise?.title?.substring(0,50)}...` : `Suggest Edits for: ${initialPromise?.title?.substring(0,50)}...`;
  const pageDescription = isAdmin
    ? "Update details for this promise directly."
    : "Propose changes to this promise. Your suggestions will be reviewed.";
  const submitButtonText = isAdmin ? "Save Changes" : "Submit Suggestion for Review";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <PromiseForm
            promise={initialPromise} 
            onSubmitForm={handleSubmit}
            isSubmitting={isSubmittingEntity}
            showCancelButton={true}
            onCancelInlineEdit={() => router.back()}
            submitButtonText={submitButtonText}
            politicianOptions={politicianOptions}
            partyOptions={partyOptions}
            existingCategories={existingCategories}
            existingPromiseTags={existingPromiseTags}
          />
        </CardContent>
      </Card>
       {!isAdmin && (
         <div className="mt-8 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg text-blue-700 dark:text-blue-300">
          <h3 className="font-semibold">Submission Note:</h3>
          <p className="text-sm">Your suggested changes will be reviewed. Thank you!</p>
        </div>
       )}
    </>
  );
}
    