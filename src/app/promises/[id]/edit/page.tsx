
// src/app/promises/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { PromiseEditFormClient } from '@/components/promises/promise-edit-form-client';
import { getPromiseDetailsFromDb } from '@/app/api/promises/[id]/route';
import type { UserPromise } from '@/types';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/shared/page-header';
import { Container } from '@/components/shared/container';
import { getPoliticianOptions, getPartyOptions, getExistingPromiseCategories, getExistingTags } from '@/lib/data/form-options-data';

interface PromiseEditPageProps {
  params: { id: string };
}

export default async function UnifiedEditPromisePage({ params }: PromiseEditPageProps) {
  const promiseId = params.id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  let initialPromise: UserPromise | null = null;
  let politicianOptionsForForm: SearchableSelectOption[] = [];
  let partyOptionsForForm: SearchableSelectOption[] = [];
  let existingCategoriesForForm: string[] = [];
  let existingPromiseTagsForForm: string[] = [];
  let fetchError: string | null = null;

  try {
    const { promise, error: promiseError } = await getPromiseDetailsFromDb(promiseId, supabase);
    if (promiseError) throw promiseError;
    if (!promise) notFound();
    initialPromise = promise;

    politicianOptionsForForm = await getPoliticianOptions(supabase);
    partyOptionsForForm = await getPartyOptions(supabase);
    existingCategoriesForForm = await getExistingPromiseCategories(supabase);
    existingPromiseTagsForForm = await getExistingTags(supabase, 'promise_tags');

  } catch (error: any) {
    console.error(`Error fetching data for edit promise page (ID: ${promiseId}):`, error);
    fetchError = `Could not load promise data or form options. ${error.message || "Unknown error"}`;
    if (!initialPromise) notFound();
  }

  return (
    <Container className="py-8 md:py-12">
      <PromiseEditFormClient
        initialPromise={initialPromise}
        promiseId={promiseId}
        politicianOptions={politicianOptionsForForm}
        partyOptions={partyOptionsForForm}
        existingCategories={existingCategoriesForForm}
        existingPromiseTags={existingPromiseTagsForForm}
        serverFetchError={fetchError}
      />
    </Container>
  );
}
