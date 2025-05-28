// src/app/promises/[id]/page.tsx
import { notFound } from 'next/navigation';
import { PromiseDetailClient } from '@/components/promises/promise-detail-client';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { fetchEntityData } from '@/lib/data-fetcher';
import type { UserPromise } from '@/types';

interface PromiseProfilePageProps {
  params: {
    id: string;
  };
}

export default async function PromiseProfilePage({ params }: PromiseProfilePageProps) {
  const promiseId = params.id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: promiseData, error } = await fetchEntityData(supabase, 'promise', {
    id: promiseId,
    includeRelations: true
  });

  if (error || !promiseData) {
    if (error) {
        console.error(`Error fetching promise details for page (ID: ${promiseId}):`, error);
        if (error.code === 'NOT_FOUND') notFound();
    }
    notFound();
  }

  return (
    <PromiseDetailClient
      promiseProp={promiseData as UserPromise}
    />
  );
}
