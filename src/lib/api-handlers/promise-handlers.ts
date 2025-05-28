// src/lib/api-handlers/promise-handlers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { PromiseFormValues, UserPromise } from '@/types';
import { AppError } from '@/lib/error-handling';
import { promiseFormSchema } from '@/components/admin/promise-form';
import { fetchEntityData } from '@/lib/data-fetcher';
import { manageTags } from './entity-update-utils';

export async function handleGetPromiseById(promiseId: string, supabase: SupabaseClient<Database>): Promise<UserPromise> {
  const { data, error } = await fetchEntityData(supabase, 'promise', { id: promiseId, includeRelations: true });
  if (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') throw AppError.notFound('Promise');
    throw error;
  }
  if (!data || Array.isArray(data)) throw AppError.notFound('Promise');
  return data as UserPromise;
}

export async function handleCreatePromise(
  formData: PromiseFormValues,
  supabase: SupabaseClient<Database>
): Promise<UserPromise> {
  const validationResult = promiseFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid promise data.", validationResult.error.format());
  }
  const { tags, politicianId, partyId, sourceUrl, evidenceUrl, dateAdded, ...mainPromiseData } = validationResult.data;

  const promiseToInsert: Database['public']['Tables']['promises']['Insert'] = {
    ...mainPromiseData,
    politician_id: politicianId || null,
    party_id: partyId || null,
    source_url: sourceUrl || null,
    evidence_url: evidenceUrl || null,
    date_added: dateAdded || new Date().toISOString(),
    is_featured: false, // Default to false
  };

  const { data: newPromiseDb, error: insertError } = await supabase
    .from('promises')
    .insert(promiseToInsert)
    .select('id')
    .single();

  if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to create promise record.");
  if (!newPromiseDb) throw AppError.serverError("Failed to create promise or retrieve ID after insert.", 'DB_INSERT_FAILED');

  const promiseId = newPromiseDb.id;
  await manageTags(supabase, promiseId, tags, 'promise_tags', 'promise_id');

  return handleGetPromiseById(promiseId, supabase);
}

export async function handleUpdatePromise(
  promiseId: string,
  formData: PromiseFormValues,
  supabase: SupabaseClient<Database>
): Promise<UserPromise> {
  const validationResult = promiseFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid promise data.", validationResult.error.format());
  }
  const { tags, politicianId, partyId, sourceUrl, evidenceUrl, dateAdded, ...mainPromiseData } = validationResult.data;

  const promiseToUpdate: Partial<Database['public']['Tables']['promises']['Update']> = {
    ...mainPromiseData,
    politician_id: politicianId || null,
    party_id: partyId || null,
    source_url: sourceUrl || null,
    evidence_url: evidenceUrl || null,
    date_added: dateAdded || undefined, 
    is_featured: (formData as any).isFeatured || false, // isFeatured is not in PromiseFormValues but might be passed
    updated_at: new Date().toISOString(),
  };
  Object.keys(promiseToUpdate).forEach(key => promiseToUpdate[key as keyof typeof promiseToUpdate] === undefined && delete promiseToUpdate[key as keyof typeof promiseToUpdate]);

  const { error: updateError } = await supabase
    .from("promises")
    .update(promiseToUpdate)
    .eq("id", promiseId);

  if (updateError) throw AppError.fromSupabaseError(updateError, "Failed to update promise record.");

  await manageTags(supabase, promiseId, tags, 'promise_tags', 'promise_id');

  return handleGetPromiseById(promiseId, supabase);
}

export async function handleDeletePromise(promiseId: string, supabase: SupabaseClient<Database>): Promise<{ message: string }> {
  await supabase.from('promise_tags').delete().eq('promise_id', promiseId);
  // Add deletion of user_votes for promises if voting is implemented for them
  // await supabase.from('user_votes').delete().eq('item_id', promiseId).eq('item_type', 'promise');
  const { error: deleteError } = await supabase.from('promises').delete().eq('id', promiseId);
  if (deleteError) throw AppError.fromSupabaseError(deleteError, `Failed to delete promise ${promiseId}.`);
  return { message: `Promise ${promiseId} deleted successfully.` };
}
