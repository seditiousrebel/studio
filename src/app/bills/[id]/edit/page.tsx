
// src/app/bills/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { BillEditFormClient } from '@/components/bills/bill-edit-form-client';
import { getBillDetailsFromDb } from '@/lib/data/bill-data';
import type { Bill } from '@/types';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/shared/page-header';
import { Container } from '@/components/shared/container';
import { getPoliticianOptions, getPartyOptions, getExistingBillMinistries, getExistingTags } from '@/lib/data/form-options-data';

interface BillEditPageProps {
  params: { id: string };
}

export default async function UnifiedEditBillPage({ params }: BillEditPageProps) {
  const billId = params.id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let initialBill: Bill | null = null;
  let politicianOptionsForForm: SearchableSelectOption[] = [];
  let partyOptionsForForm: SearchableSelectOption[] = [];
  let existingBillTagsForForm: string[] = [];
  let existingMinistriesForForm: string[] = [];
  let fetchError: string | null = null;

  try {
    const { bill, error: billError } = await getBillDetailsFromDb(billId, supabase);
    if (billError) throw billError;
    if (!bill) notFound();
    initialBill = bill;

    politicianOptionsForForm = await getPoliticianOptions(supabase);
    partyOptionsForForm = await getPartyOptions(supabase);
    existingMinistriesForForm = await getExistingBillMinistries(supabase);
    existingBillTagsForForm = await getExistingTags(supabase, 'bill_tags');

  } catch (error: any) {
    console.error(`Error fetching data for edit bill page (ID: ${billId}):`, error);
    fetchError = `Could not load bill data or form options. ${error.message || "Unknown error"}`;
    if (!initialBill) notFound();
  }

  return (
    <Container className="py-8 md:py-12">
      <BillEditFormClient
        initialBill={initialBill}
        billId={billId}
        politicianOptions={politicianOptionsForForm}
        partyOptions={partyOptionsForForm}
        existingBillTags={existingBillTagsForForm}
        existingMinistries={existingMinistriesForForm}
        serverFetchError={fetchError}
      />
    </Container>
  );
}
