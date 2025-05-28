// src/lib/api-handlers/party-handlers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { PartyFormValues, Party } from '@/types';
import { AppError } from '@/lib/error-handling';
import { partyFormSchema } from '@/components/admin/party-form';
import { fetchEntityData } from '@/lib/data-fetcher';
import { manageTags, updatePartyElectionHistory, updatePartyControversies } from './entity-update-utils';

export async function handleGetPartyById(partyId: string, supabase: SupabaseClient<Database>): Promise<Party> {
  const { data, error } = await fetchEntityData(supabase, 'party', { id: partyId, includeRelations: true });
  if (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') throw AppError.notFound('Party');
    throw error;
  }
  if (!data || Array.isArray(data)) throw AppError.notFound('Party');
  return data as Party;
}

export async function handleCreateParty(
  formData: PartyFormValues,
  supabase: SupabaseClient<Database>
): Promise<Party> {
  const validationResult = partyFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid party data.", validationResult.error.format());
  }
  const {
    tags,
    shortName,
    logoUrl,
    dataAiHint,
    foundingDate,
    chairpersonId,
    electionSymbolUrl,
    dataAiHintSymbol,
    contactEmail,
    contactPhone,
    keyPolicyPositions,
    controversies,
    electionHistory,
    ...mainPartyData
  } = validationResult.data;

  const partyToInsert: Database['public']['Tables']['parties']['Insert'] = {
    ...mainPartyData,
    short_name: shortName || null,
    logo_url: logoUrl || null,
    data_ai_hint: dataAiHint || null,
    founding_date: foundingDate || null,
    chairperson_id: chairpersonId || null,
    election_symbol_url: electionSymbolUrl || null,
    data_ai_hint_symbol: dataAiHintSymbol || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    key_policy_positions: keyPolicyPositions || null,
    is_featured: false, // Default to false
  };
  Object.keys(partyToInsert).forEach(key => partyToInsert[key as keyof typeof partyToInsert] === undefined && delete partyToInsert[key as keyof typeof partyToInsert]);

  const { data: newPartyDb, error: insertError } = await supabase
    .from('parties')
    .insert(partyToInsert)
    .select('id')
    .single();

  if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to create party record.");
  if (!newPartyDb) throw AppError.serverError("Failed to create party or retrieve ID after insert.", 'DB_INSERT_FAILED');

  const partyId = newPartyDb.id;

  await manageTags(supabase, partyId, tags, 'party_tags', 'party_id');
  await updatePartyElectionHistory(partyId, electionHistory, supabase);
  await updatePartyControversies(partyId, controversies, supabase);

  return handleGetPartyById(partyId, supabase);
}

export async function handleUpdateParty(
  partyId: string,
  formData: PartyFormValues,
  supabase: SupabaseClient<Database>
): Promise<Party> {
  const validationResult = partyFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid party data.", validationResult.error.format());
  }
  const {
    tags,
    shortName,
    logoUrl,
    dataAiHint,
    foundingDate,
    chairpersonId,
    electionSymbolUrl,
    dataAiHintSymbol,
    contactEmail,
    contactPhone,
    keyPolicyPositions,
    controversies,
    electionHistory,
    ...mainPartyData
  } = validationResult.data;

  const partyToUpdate: Partial<Database['public']['Tables']['parties']['Update']> = {
    ...mainPartyData,
    short_name: shortName || null,
    logo_url: logoUrl || null,
    data_ai_hint: dataAiHint || null,
    founding_date: foundingDate || null,
    chairperson_id: chairpersonId || null,
    election_symbol_url: electionSymbolUrl || null,
    data_ai_hint_symbol: dataAiHintSymbol || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    key_policy_positions: keyPolicyPositions || null,
    is_featured: (formData as any).isFeatured || false,
    updated_at: new Date().toISOString(),
  };
   Object.keys(partyToUpdate).forEach(key => partyToUpdate[key as keyof typeof partyToUpdate] === undefined && delete partyToUpdate[key as keyof typeof partyToUpdate]);

  const { error: updateError } = await supabase
    .from("parties")
    .update(partyToUpdate)
    .eq("id", partyId);

  if (updateError) throw AppError.fromSupabaseError(updateError, "Failed to update party record.");

  await manageTags(supabase, partyId, tags, 'party_tags', 'party_id');
  await updatePartyElectionHistory(partyId, electionHistory, supabase);
  await updatePartyControversies(partyId, controversies, supabase);

  return handleGetPartyById(partyId, supabase);
}

export async function handleDeleteParty(partyId: string, supabase: SupabaseClient<Database>): Promise<{ message: string }> {
  const {data: existingControversies} = await supabase.from('party_controversies').select('id').eq('party_id', partyId);
  if (existingControversies) for (const c of existingControversies) await supabase.from('party_controversy_sources').delete().eq('party_controversy_id', c.id);
  await supabase.from('party_controversies').delete().eq('party_id', partyId);
  await supabase.from('party_tags').delete().eq('party_id', partyId);
  await supabase.from('election_history_entries').delete().eq('party_id', partyId);
  await supabase.from('user_votes').delete().eq('item_id', partyId).eq('item_type', 'party');
  await supabase.from('politicians').update({ party_id: null }).eq('party_id', partyId);
  await supabase.from('promises').update({ party_id: null }).eq('party_id', partyId);
  await supabase.from('bills').update({ sponsor_party_id: null }).eq('sponsor_party_id', partyId);

  const { error: deleteError } = await supabase.from('parties').delete().eq('id', partyId);
  if (deleteError) throw AppError.fromSupabaseError(deleteError, `Failed to delete party ${partyId}.`);
  return { message: `Party ${partyId} and related data deleted successfully.` };
}
