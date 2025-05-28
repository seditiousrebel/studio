
// src/app/promises/add/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { PromiseAddFormClient } from '@/components/promises/promise-add-form-client';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/shared/page-header';
import { Container } from '@/components/shared/container';
import { getPoliticianOptions, getPartyOptions, getExistingPromiseCategories, getExistingTags } from '@/lib/data/form-options-data';

export default async function UnifiedNewPromisePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let politicianOptionsForForm: SearchableSelectOption[] = [];
  let partyOptionsForForm: SearchableSelectOption[] = [];
  let existingCategoriesForForm: string[] = [];
  let existingPromiseTagsForForm: string[] = [];
  let fetchError: string | null = null;

  try {
    politicianOptionsForForm = await getPoliticianOptions(supabase);
    partyOptionsForForm = await getPartyOptions(supabase);
    existingCategoriesForForm = await getExistingPromiseCategories(supabase);
    existingPromiseTagsForForm = await getExistingTags(supabase, 'promise_tags');
  } catch (error: any) {
    console.error("Error fetching options for new promise page:", error);
    fetchError = "Could not load all necessary form options. Some selections might be unavailable.";
  }

  return (
    <Container className="py-8 md:py-12">
      <PromiseAddFormClient
        politicianOptions={politicianOptionsForForm}
        partyOptions={partyOptionsForForm}
        existingCategories={existingCategoriesForForm}
        existingPromiseTags={existingPromiseTagsForForm}
        serverFetchError={fetchError}
      />
    </Container>
  );
}
