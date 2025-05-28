
// src/app/bills/add/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { BillAddFormClient } from '@/components/bills/bill-add-form-client';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/shared/page-header';
import { Container } from '@/components/shared/container';
import { getPoliticianOptions, getPartyOptions, getExistingBillMinistries, getExistingTags } from '@/lib/data/form-options-data';

export default async function UnifiedNewBillPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let politicianOptionsForForm: SearchableSelectOption[] = [];
  let partyOptionsForForm: SearchableSelectOption[] = [];
  let existingBillTagsForForm: string[] = [];
  let existingMinistriesForForm: string[] = [];
  let fetchError: string | null = null;

  try {
    politicianOptionsForForm = await getPoliticianOptions(supabase);
    partyOptionsForForm = await getPartyOptions(supabase);
    existingMinistriesForForm = await getExistingBillMinistries(supabase);
    existingBillTagsForForm = await getExistingTags(supabase, 'bill_tags');
  } catch (error: any) {
    console.error("Error fetching options for new bill page:", error);
    fetchError = "Could not load all necessary form options. Some selections might be unavailable.";
  }
  
  return (
    <Container className="py-8 md:py-12">
      <BillAddFormClient
        politicianOptions={politicianOptionsForForm}
        partyOptions={partyOptionsForForm}
        existingBillTags={existingBillTagsForForm}
        existingMinistries={existingMinistriesForForm}
        serverFetchError={fetchError}
      />
    </Container>
  );
}
