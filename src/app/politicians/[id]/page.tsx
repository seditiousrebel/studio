// src/app/politicians/[id]/page.tsx
import { notFound } from 'next/navigation';
import { PoliticianDetailClient } from '@/components/politicians/politician-detail-client';
import { createClient } from '@/lib/supabase/server';
import { fetchEntityData } from '@/lib/data-fetcher';
import type { Politician } from '@/types';
import { cookies } from 'next/headers'; 

export default async function Page({ params }: { params: { id: string } }) {
  const politicianId = params.id;

  if (!politicianId) {
    console.error('Politician detail page: No ID provided in params.');
    notFound();
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: politicianData, error: politicianError } = await fetchEntityData(supabase, 'politician', {
    id: politicianId,
    includeRelations: true 
  });

  if (politicianError || !politicianData) {
    if (politicianError) {
      console.error(`Error fetching detailed politician data for page (ID: ${politicianId}):`, politicianError);
      if (politicianError.code === 'NOT_FOUND') notFound();
    } else {
      console.error(`Politician not found for page (ID: ${politicianId})`);
    }
    notFound();
  }
  
  return <PoliticianDetailClient politicianProp={politicianData as Politician} />;
}
