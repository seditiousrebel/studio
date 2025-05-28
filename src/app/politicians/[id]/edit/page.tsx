
// src/app/politicians/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PoliticianEditFormClient } from '@/components/politicians/politician-edit-form-client';
import { getDetailedPoliticianDataFromDB } from '@/app/api/politicians/[id]/route';
import { getInitialPoliticianFormValues, type PoliticianFormValues } from '@/components/admin/politician-form';
import type { Politician } from '@/types';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/shared/page-header';
import { Container } from '@/components/shared/container';
import { Button } from '@/components/ui/button';
import Link from 'next/link'; // Added Link import
import { getPartyOptions, getExistingTags } from '@/lib/data/form-options-data'; // Updated import

interface PoliticianEditPageProps {
  params: { id: string };
}

export default async function EditPoliticianPage({ params }: PoliticianEditPageProps) {
  const politicianId = params.id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/politicians/${politicianId}/edit`);
  }

  let initialPolitician: Politician | null = null;
  let partyOptionsForForm: SearchableSelectOption[] = []; // Renamed for clarity
  let existingTagsForPoliticianForm: string[] = []; // Renamed for clarity
  let serverFetchError: string | null = null;
  let initialFormValues: PoliticianFormValues | null = null; 

  try {
    const { politician: fetchedPol, error: politicianError } = await getDetailedPoliticianDataFromDB(politicianId, supabase);
    if (politicianError) {
      console.error(`Error fetching politician details for edit (ID: ${politicianId}):`, politicianError.message);
      serverFetchError = politicianError.message || "Failed to load politician details.";
      if (politicianError.code === 'PGRST116' || politicianError.message === 'Politician not found') notFound();
    }
    initialPolitician = fetchedPol;

    if (!initialPolitician && !serverFetchError) {
        notFound();
    }

    if (initialPolitician) {
        initialFormValues = getInitialPoliticianFormValues(initialPolitician);
    }

    partyOptionsForForm = await getPartyOptions(supabase);
    existingTagsForPoliticianForm = await getExistingTags(supabase, 'politician_tags');

  } catch (error: any) {
    console.error(`Unhandled error fetching data for edit politician page (ID: ${politicianId}):`, error);
    if (!serverFetchError) serverFetchError = `Could not load politician data or form options. ${error.message || "Unknown error"}`;
    if (!initialPolitician && !initialFormValues) notFound();
  }
  
  if (!initialFormValues && serverFetchError) {
     return (
        <Container className="py-8 md:py-12">
            <PageHeader title="Error Loading Politician" description={serverFetchError || "Could not load data for editing."} />
            <Link href="/politicians" passHref>
              <Button variant="outline" className="mt-4">Go to Politicians List</Button>
            </Link>
        </Container>
     );
  }

  return (
    <Container className="py-8 md:py-12">
      <PoliticianEditFormClient
        initialFormValues={initialFormValues}
        politicianId={politicianId}
        politicianOriginalName={initialPolitician?.name}
        partyOptions={partyOptionsForForm}
        existingTagsForForm={existingTagsForPoliticianForm}
        serverInitialLoadError={serverFetchError}
      />
    </Container>
  );
}
