
// src/components/bills/bill-add-form-client.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { PageHeader } from '@/components/shared/page-header';
import { BillForm, type BillFormValues } from '@/components/admin/bill-form';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { ROUTES } from '@/lib/routes';


interface BillAddFormClientProps {
  politicianOptions: SearchableSelectOption[];
  partyOptions: SearchableSelectOption[];
  existingBillTags: string[];
  existingMinistries: string[];
  serverFetchError?: string | null;
}

export function BillAddFormClient({
  politicianOptions,
  partyOptions,
  existingBillTags,
  existingMinistries,
  serverFetchError
}: BillAddFormClientProps) {
  const { isAuthenticated, isAdmin, isLoadingAuth: authIsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { createOrSuggestEntity, isLoading: isSubmittingEntity } = useEntityCrud('bill');

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

  const handleSubmit = async (data: BillFormValues) => {
    const newBill = await createOrSuggestEntity(data, pathname);
    if (newBill) {
      router.push(ROUTES.ADMIN.BILLS);
    } else if (!isAdmin && newBill === null) {
      router.push(ROUTES.BILLS.LIST);
    }
  };

  if (clientIsLoadingAuth) {
     return (
      <>
        <PageHeader title={isAdmin ? "Add New Bill" : "Suggest New Bill"} description="Verifying access..." />
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

  const pageTitle = isAdmin ? "Add New Legislative Bill" : "Suggest New Legislative Bill";
  const pageDescription = isAdmin
    ? "Fill in the details to add a new bill directly to the platform."
    : "Help us track legislation. Fill in the details for a new bill to be reviewed by our team.";
  const submitButtonText = isAdmin ? "Add Bill" : "Submit Suggestion";

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      <Card className="mt-6 shadow-xl">
        <CardContent className="pt-6">
          <BillForm
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
          <p className="text-sm">
           Your suggestion will be submitted for review by administrators. Thank you for your contribution!
          </p>
        </div>
       )}
    </>
  );
}
    