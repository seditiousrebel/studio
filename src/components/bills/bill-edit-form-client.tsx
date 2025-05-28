
// src/components/bills/bill-edit-form-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { PageHeader } from '@/components/shared/page-header';
import { BillForm, type BillFormValues, getInitialFormValues as getBillFormInitialValues } from '@/components/admin/bill-form';
import type { Bill } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { ROUTES } from '@/lib/routes';

interface BillEditFormClientProps {
  initialBill: Bill | null;
  billId: string;
  politicianOptions: SearchableSelectOption[];
  partyOptions: SearchableSelectOption[];
  existingBillTags: string[];
  existingMinistries: string[];
  serverFetchError?: string | null;
}

export function BillEditFormClient({
  initialBill,
  billId,
  politicianOptions,
  partyOptions,
  existingBillTags,
  existingMinistries,
  serverFetchError
}: BillEditFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { updateOrSuggestUpdate, isLoading: isSubmittingEntity } = useEntityCrud('bill');

  const [clientIsLoadingAuth, setClientIsLoadingAuth] = useState(true);

  useEffect(() => {
    setClientIsLoadingAuth(authIsLoading);
    if (!authIsLoading && !isAuthenticated) {
        router.replace(`${ROUTES.LOGIN}?redirectTo=${pathname}`);
    }
  }, [isAuthenticated, router, pathname, authIsLoading]);
  
  useEffect(() => {
    if (serverFetchError && !initialBill) {
      toast({
        title: "Error Loading Bill Data",
        description: serverFetchError,
        variant: "destructive",
      });
    }
  }, [initialBill, serverFetchError, toast]);

  const handleSubmit = async (data: BillFormValues) => {
    const updatedBill = await updateOrSuggestUpdate(billId, data, initialBill?.title || data.title || billId, pathname);
    if (updatedBill) {
      router.push(ROUTES.ADMIN.BILLS);
    } else if (!isAdmin && updatedBill === null) {
      router.push(ROUTES.BILLS.DETAIL(billId));
    }
  };

  if (clientIsLoadingAuth) {
    return (
      <>
        <PageHeader title={isAdmin ? "Edit Bill" : "Suggest Edits for Bill"} description="Verifying access..." />
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
  
  if (!initialBill && !serverFetchError) {
    return (
      <>
        <PageHeader title={isAdmin ? "Edit Bill" : "Suggest Edits for Bill"} description="Loading bill data..." />
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
      </>
    );
  }

  if (!initialBill && serverFetchError) {
    return (
      <>
        <PageHeader title="Error" description="Bill not found or could not be loaded." />
        <p className="text-destructive mt-4">{serverFetchError}</p>
      </>
    );
  }

  const pageTitle = isAdmin ? `Edit Bill: ${initialBill?.title?.substring(0,50)}...` : `Suggest Edits for: ${initialBill?.title?.substring(0,50)}...`;
  const pageDescription = isAdmin
    ? "Update the details for this legislative bill directly."
    : "Propose changes to this bill's profile. Your suggestions will be reviewed by administrators.";
  const submitButtonText = isAdmin ? "Save Changes" : "Submit Suggestion for Review";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <BillForm
            bill={getBillFormInitialValues(initialBill)}
            onSubmitForm={handleSubmit}
            isSubmitting={isSubmittingEntity}
            showCancelButton={true}
            onCancelInlineEdit={() => router.back()}
            submitButtonText={submitButtonText}
            politicianOptions={politicianOptions}
            partyOptions={partyOptions}
            existingBillTags={existingBillTags}
            existingMinistries={existingMinistries}
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
    