// src/app/parties/[id]/page.tsx
"use server"; 

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { PartyDetailClient } from '@/components/parties/party-detail-client';
import type { Party } from '@/types';
import { fetchEntityData } from '@/lib/data-fetcher';
import { getPoliticianOptions, getExistingTags } from '@/lib/data/form-options-data';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { notFound } from 'next/navigation';

interface PartyProfilePageProps {
  params: {
    id: string;
  };
}

export default async function PartyProfilePage({ params }: PartyProfilePageProps) {
  const partyId = params.id;
  const cookieStore = cookies();
  const supabase: SupabaseClient<Database> = createClient(cookieStore);

  const { data: partyData, error } = await fetchEntityData(supabase, 'party', {
    id: partyId,
    includeRelations: true 
  });
  
  if (error || !partyData) {
    if (error) {
      console.error(`Error fetching party details for page (ID: ${partyId}):`, error.message, error.details, error.code);
      if (error.code === 'NOT_FOUND') notFound();
    }
    notFound();
  }
  
  const typedPartyData = partyData as Party;

  return (
    <Container className="py-8 md:py-12">
      <PageHeader 
        title={typedPartyData.name} 
        description={typedPartyData.shortName ? `(${typedPartyData.shortName}) - Learn more about their platform, history, and members.` : `Learn more about ${typedPartyData.name}'s platform, history, and members.`} 
        className="mb-6" 
      />
      <PartyDetailClient
        partyProp={typedPartyData}
      />
    </Container>
  );
}
