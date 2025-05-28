// src/lib/api-handlers/politician-handlers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { PoliticianFormValues, Politician } from '@/types';
import { AppError } from '@/lib/error-handling';
import { politicianFormSchema } from '@/components/admin/politician-form';
import { fetchEntityData } from '@/lib/data-fetcher';
import { 
    manageTags, 
    updatePoliticalCareer, 
    updateAssetDeclarations, 
    updateCriminalRecordEntries, 
    updateSocialMediaLinks 
} from './entity-update-utils';

export async function handleGetPoliticianById(politicianId: string, supabase: SupabaseClient<Database>): Promise<Politician> {
  const { data, error } = await fetchEntityData(supabase, 'politician', { id: politicianId, includeRelations: true });
  if (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') throw AppError.notFound('Politician');
    throw error; 
  }
  if (!data || Array.isArray(data)) throw AppError.notFound('Politician');
  return data as Politician;
}

export async function handleCreatePolitician(
  formData: PoliticianFormValues,
  supabase: SupabaseClient<Database>
): Promise<Politician> {
  const validationResult = politicianFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid politician data.", validationResult.error.format());
  }
  const { tags, politicalCareer, assetDeclarations, criminalRecordEntries, contactSocialEntries, partyId, imageUrl, dateOfBirth, contactEmail, contactPhone, ...mainPoliticianData } = validationResult.data;

  const politicianToInsert: Database['public']['Tables']['politicians']['Insert'] = {
    ...mainPoliticianData,
    party_id: partyId || null,
    image_url: imageUrl || null,
    date_of_birth: dateOfBirth || null, 
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    is_featured: false, // Default to false
  };
   Object.keys(politicianToInsert).forEach(key => politicianToInsert[key as keyof typeof politicianToInsert] === undefined && delete politicianToInsert[key as keyof typeof politicianToInsert]);

  const { data: newPoliticianDb, error: insertError } = await supabase
    .from('politicians')
    .insert(politicianToInsert)
    .select('id') 
    .single();

  if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to create politician record.");
  if (!newPoliticianDb) throw AppError.serverError("Failed to create politician or retrieve ID after insert.", 'DB_INSERT_FAILED');
  
  const politicianId = newPoliticianDb.id;

  await manageTags(supabase, politicianId, tags, 'politician_tags', 'politician_id');
  await updatePoliticalCareer(politicianId, politicalCareer, supabase);
  await updateAssetDeclarations(politicianId, assetDeclarations, supabase);
  await updateCriminalRecordEntries(politicianId, criminalRecordEntries, supabase);
  await updateSocialMediaLinks(politicianId, contactSocialEntries, supabase);

  return handleGetPoliticianById(politicianId, supabase);
}

export async function handleUpdatePolitician(
  politicianId: string,
  formData: PoliticianFormValues,
  supabase: SupabaseClient<Database>
): Promise<Politician> {
  const validationResult = politicianFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid politician data.", validationResult.error.format());
  }
  const { tags, politicalCareer, assetDeclarations, criminalRecordEntries, contactSocialEntries, partyId, imageUrl, dateOfBirth, contactEmail, contactPhone, ...mainPoliticianData } = validationResult.data;
  
  const politicianToUpdate: Partial<Database['public']['Tables']['politicians']['Update']> = {
    ...mainPoliticianData,
    party_id: partyId || null,
    image_url: imageUrl || null,
    date_of_birth: dateOfBirth || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    is_featured: (formData as any).isFeatured || false, // isFeatured is not in PoliticianFormValues but might be passed
    updated_at: new Date().toISOString(),
  };
  Object.keys(politicianToUpdate).forEach(key => politicianToUpdate[key as keyof typeof politicianToUpdate] === undefined && delete politicianToUpdate[key as keyof typeof politicianToUpdate]);

  const { error: updateError } = await supabase
    .from("politicians")
    .update(politicianToUpdate)
    .eq("id", politicianId);
  
  if (updateError) throw AppError.fromSupabaseError(updateError, "Failed to update politician record.");

  await manageTags(supabase, politicianId, tags, 'politician_tags', 'politician_id');
  await updatePoliticalCareer(politicianId, politicalCareer, supabase);
  await updateAssetDeclarations(politicianId, assetDeclarations, supabase);
  await updateCriminalRecordEntries(politicianId, criminalRecordEntries, supabase);
  await updateSocialMediaLinks(politicianId, contactSocialEntries, supabase);
  
  return handleGetPoliticianById(politicianId, supabase);
}

export async function handleDeletePolitician(politicianId: string, supabase: SupabaseClient<Database>): Promise<{ message: string }> {
    // Order of deletion matters to avoid foreign key constraints
    await supabase.from('political_career_entries').delete().eq('politician_id', politicianId);
    
    const {data: existingAssetDecls} = await supabase.from('asset_declarations').select('id').eq('politician_id', politicianId);
    if (existingAssetDecls) for (const ad of existingAssetDecls) await supabase.from('asset_declaration_sources').delete().eq('asset_declaration_id', ad.id);
    await supabase.from('asset_declarations').delete().eq('politician_id', politicianId);
    
    const {data: existingCriminalRecs} = await supabase.from('criminal_record_entries').select('id').eq('politician_id', politicianId);
    if (existingCriminalRecs) for (const cr of existingCriminalRecs) await supabase.from('criminal_record_sources').delete().eq('criminal_record_entry_id', cr.id);
    await supabase.from('criminal_record_entries').delete().eq('politician_id', politicianId);
    
    await supabase.from('social_media_links').delete().eq('politician_id', politicianId);
    await supabase.from('politician_tags').delete().eq('politician_id', politicianId);
    await supabase.from('user_votes').delete().eq('item_id', politicianId).eq('item_type', 'politician');
    await supabase.from('promises').delete().eq('politician_id', politicianId); // Promises made by this politician
    await supabase.from('bills').delete().eq('sponsor_politician_id', politicianId); // Bills sponsored by this politician
    
    const { error: deleteError } = await supabase.from('politicians').delete().eq('id', politicianId);
    if (deleteError) throw AppError.fromSupabaseError(deleteError, `Failed to delete politician ${politicianId}.`);
    return { message: `Politician ${politicianId} and related data deleted successfully.` };
}
