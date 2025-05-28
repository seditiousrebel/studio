
// src/app/politicians/add/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { PoliticianAddFormClient } from '@/components/politicians/politician-add-form-client';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { Container } from '@/components/shared/container';
import { getPartyOptions, getExistingTags } from '@/lib/data/form-options-data'; // Updated import

export default async function AddPoliticianPageServer() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let partyOptions: SearchableSelectOption[] = [];
  let existingTagsForForm: string[] = [];
  let serverFetchError: string | null = null;

  try {
    partyOptions = await getPartyOptions(supabase);
    existingTagsForForm = await getExistingTags(supabase, 'politician_tags');
  } catch (error: any) {
    console.error("Error fetching options for new politician page:", error);
    serverFetchError = `Could not load all necessary form options. ${error.message || 'Unknown error'}`;
  }

  return (
    <Container className="py-8 md:py-12">
      <PoliticianAddFormClient
        partyOptions={partyOptions}
        existingTagsForForm={existingTagsForForm}
        serverInitialLoadError={serverFetchError}
      />
    </Container>
  );
}
