
// src/app/parties/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { PartyEditFormClient } from '@/components/parties/party-edit-form-client';
import { getPartyDetailsFromDb } from '@/app/api/parties/[id]/route';
import type { Party } from '@/types';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { getPoliticianOptions, getExistingTags } from '@/lib/data/form-options-data'; // Updated import

interface PartyEditPageProps {
  params: { id: string };
}

export default async function EditPartyPage({ params }: PartyEditPageProps) {
  const partyId = params.id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let initialParty: Party | null = null;
  let politicianOptionsForForm: SearchableSelectOption[] = [];
  let existingIdeologiesForForm: string[] = []; // Keep this if it's fetched differently
  let existingPartyTagsForForm: string[] = [];
  let fetchError: string | null = null;

  try {
    const { party, error: partyError } = await getPartyDetailsFromDb(partyId, supabase);
    if (partyError) {
      console.error(`Error fetching party details for edit (ID: ${partyId}):`, partyError.message);
      fetchError = partyError.message || "Failed to load party details.";
      if (partyError.code === 'PGRST116') notFound(); 
    }
    initialParty = party; 

    if (!initialParty && !partyError) { 
        notFound();
    }

    politicianOptionsForForm = await getPoliticianOptions(supabase);
    existingPartyTagsForForm = await getExistingTags(supabase, 'party_tags');

    // Fetch existing ideologies (still specific to parties)
    const { data: ideologiesRows, error: ideologiesError } = await supabase
        .from('parties')
        .select('ideology');
    if (ideologiesError) throw ideologiesError;
    if (ideologiesRows) {
      existingIdeologiesForForm = Array.from(new Set(ideologiesRows.flatMap(p => (p.ideology || "").split(',').map(i => i.trim()).filter(Boolean)))).sort();
    }

  } catch (error: any) {
    console.error(`Error fetching data for edit party page (ID: ${partyId}):`, error);
    if (!fetchError) fetchError = `Could not load party data or form options. ${error.message || "Unknown error"}`;
    if (!initialParty) notFound(); 
  }

  return (
    <PartyEditFormClient
      initialParty={initialParty}
      partyId={partyId}
      politicianOptions={politicianOptionsForForm}
      existingIdeologies={existingIdeologiesForForm}
      existingPartyTags={existingPartyTagsForForm}
      serverFetchError={fetchError}
    />
  );
}
