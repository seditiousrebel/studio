
// src/app/parties/add/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { PartyAddFormClient } from '@/components/parties/party-add-form-client';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { getPoliticianOptions, getExistingTags } from '@/lib/data/form-options-data'; // Updated import

export default async function AddPartyPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let politicianOptionsForForm: SearchableSelectOption[] = [];
  let existingIdeologiesForForm: string[] = []; // Keep this if it's fetched differently
  let existingPartyTagsForForm: string[] = [];
  let fetchError: string | null = null;

  try {
    politicianOptionsForForm = await getPoliticianOptions(supabase);
    existingPartyTagsForForm = await getExistingTags(supabase, 'party_tags');
    
    // Fetch existing ideologies (still specific to parties, might keep here or move to form-options-data)
    const { data: ideologiesRows, error: ideologiesError } = await supabase
        .from('parties')
        .select('ideology');
    if (ideologiesError) throw ideologiesError;
    if (ideologiesRows) {
      existingIdeologiesForForm = Array.from(new Set(ideologiesRows.flatMap(p => (p.ideology || "").split(',').map(i => i.trim()).filter(Boolean)))).sort();
    }

  } catch (error: any) {
    console.error("Error fetching options for new party page:", error);
    fetchError = `Could not load all necessary form options. ${error.message || 'Unknown error'}`;
  }

  return (
    <PartyAddFormClient
      politicianOptions={politicianOptionsForForm}
      existingIdeologies={existingIdeologiesForForm}
      existingPartyTags={existingPartyTagsForForm}
      serverFetchError={fetchError}
    />
  );
}
