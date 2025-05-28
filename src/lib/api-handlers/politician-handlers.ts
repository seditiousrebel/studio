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
  const { tags, politicalCareer, assetDeclarations, criminalRecordEntries, contactSocialEntries, partyId: partyIdString, imageUrl, dateOfBirth, contactEmail, contactPhone, ...mainPoliticianData } = validationResult.data;

  // party_id is removed from here, will be handled via party_memberships
  const politicianToInsert: Omit<Database['public']['Tables']['politicians']['Insert'], 'party_id'> = {
    ...mainPoliticianData,
    image_url: imageUrl || null,
    date_of_birth: dateOfBirth || null, 
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    is_featured: false, // Default to false
  };
   Object.keys(politicianToInsert).forEach(key => politicianToInsert[key as keyof typeof politicianToInsert] === undefined && delete politicianToInsert[key as keyof typeof politicianToInsert]);

  const { data: newPoliticianDb, error: insertError } = await supabase
    .from('politicians')
    .insert(politicianToInsert as Database['public']['Tables']['politicians']['Insert']) // Cast after removing undefined keys
    .select('id') 
    .single();

  if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to create politician record.");
  if (!newPoliticianDb) throw AppError.serverError("Failed to create politician or retrieve ID after insert.", 'DB_INSERT_FAILED');
  
  const politicianId = newPoliticianDb.id;

  // Handle party membership
  if (partyIdString) {
    const numericPartyId = Number(partyIdString);
    if (isNaN(numericPartyId)) {
        throw AppError.validationError("Invalid partyId provided. Must be a numeric string.", { partyId: "Invalid format" });
    }
    const membershipToInsert: Database['public']['Tables']['party_memberships']['Insert'] = {
      politician_id: politicianId,
      party_id: numericPartyId,
      is_active: true,
      start_date: new Date().toISOString(),
      end_date: null,
      role_in_party: 'Member' // Default role, can be null or configurable if needed
    };
    const { error: membershipError } = await supabase.from('party_memberships').insert(membershipToInsert);
    if (membershipError) {
      // Clean up created politician if party membership fails? Or let it be and flag?
      // For now, just throw error.
      throw AppError.fromSupabaseError(membershipError, `Failed to create party membership for politician ${politicianId}.`);
    }
  }

  await manageTags(supabase, politicianId, tags, 'politician_tags', 'politician_id');
  await updatePoliticalCareer(politicianId, politicalCareer, supabase);
  await updateAssetDeclarations(politicianId, assetDeclarations, supabase);
  await updateCriminalRecordEntries(politicianId, criminalRecordEntries, supabase);
  await updateSocialMediaLinks(politicianId, contactSocialEntries, supabase);

  return handleGetPoliticianById(politicianId, supabase);
}

export async function handleUpdatePolitician(
  politicianId: string, // This is a string from the route, but politician.id is number in DB
  formData: PoliticianFormValues,
  supabase: SupabaseClient<Database>
): Promise<Politician> {
  const validationResult = politicianFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid politician data.", validationResult.error.format());
  }
  const { tags, politicalCareer, assetDeclarations, criminalRecordEntries, contactSocialEntries, partyId: newPartyIdString, imageUrl, dateOfBirth, contactEmail, contactPhone, ...mainPoliticianData } = validationResult.data;
  
  const numericPoliticianId = Number(politicianId);
   if (isNaN(numericPoliticianId)) {
    throw AppError.validationError("Invalid politicianId provided. Must be a numeric string.", { politicianId: "Invalid format" });
  }

  // party_id is removed from here
  const politicianToUpdate: Partial<Database['public']['Tables']['politicians']['Update']> = {
    ...mainPoliticianData,
    image_url: imageUrl || null,
    date_of_birth: dateOfBirth || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    is_featured: (formData as any).isFeatured || false, 
    updated_at: new Date().toISOString(),
  };
  Object.keys(politicianToUpdate).forEach(key => politicianToUpdate[key as keyof typeof politicianToUpdate] === undefined && delete politicianToUpdate[key as keyof typeof politicianToUpdate]);

  const { error: updateError } = await supabase
    .from("politicians")
    .update(politicianToUpdate)
    .eq("id", numericPoliticianId);
  
  if (updateError) throw AppError.fromSupabaseError(updateError, "Failed to update politician record.");

  // Handle party membership update
  const newNumericPartyId = newPartyIdString ? Number(newPartyIdString) : null;
  if (newPartyIdString && newNumericPartyId === null && isNaN(Number(newPartyIdString))) { // Check if conversion failed for non-null string
     throw AppError.validationError("Invalid new partyId provided. Must be a numeric string or null.", { partyId: "Invalid format" });
  }

  const { data: activeMemberships, error: fetchMembershipsError } = await supabase
    .from('party_memberships')
    .select('id, party_id')
    .eq('politician_id', numericPoliticianId)
    .eq('is_active', true);

  if (fetchMembershipsError) {
    throw AppError.fromSupabaseError(fetchMembershipsError, "Failed to fetch current party memberships.");
  }

  const currentActivePartyMembership = activeMemberships?.[0] || null;
  const currentActivePartyId = currentActivePartyMembership?.party_id || null;

  if (newNumericPartyId !== currentActivePartyId) {
    // Deactivate old memberships
    if (activeMemberships && activeMemberships.length > 0) {
      for (const membership of activeMemberships) {
        const { error: deactivateError } = await supabase
          .from('party_memberships')
          .update({ is_active: false, end_date: new Date().toISOString() })
          .eq('id', membership.id);
        if (deactivateError) {
          // Log or collect errors if multiple deactivations, but throw first one for now
          throw AppError.fromSupabaseError(deactivateError, `Failed to deactivate old party membership ${membership.id}.`);
        }
      }
    }

    // Activate new membership
    if (newNumericPartyId !== null) {
      const newMembershipToInsert: Database['public']['Tables']['party_memberships']['Insert'] = {
        politician_id: numericPoliticianId,
        party_id: newNumericPartyId,
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: null,
        role_in_party: 'Member' // Default role
      };
      const { error: insertNewMembershipError } = await supabase
        .from('party_memberships')
        .insert(newMembershipToInsert);
      if (insertNewMembershipError) {
        throw AppError.fromSupabaseError(insertNewMembershipError, "Failed to create new active party membership.");
      }
    }
  }

  await manageTags(supabase, numericPoliticianId, tags, 'politician_tags', 'politician_id');
  await updatePoliticalCareer(numericPoliticianId, politicalCareer, supabase);
  await updateAssetDeclarations(numericPoliticianId, assetDeclarations, supabase);
  await updateCriminalRecordEntries(numericPoliticianId, criminalRecordEntries, supabase);
  await updateSocialMediaLinks(numericPoliticianId, contactSocialEntries, supabase);
  
  return handleGetPoliticianById(politicianId, supabase); // politicianId is string here, handleGetPoliticianById expects string
}

export async function handleDeletePolitician(politicianIdString: string, supabase: SupabaseClient<Database>): Promise<{ message: string }> {
    const politicianId = Number(politicianIdString);
    if (isNaN(politicianId)) {
      throw AppError.validationError("Invalid politicianId for delete. Must be numeric string.", {politicianId: "Invalid format"});
    }

    // Delete related entries from join/dependent tables first
    await supabase.from('party_memberships').delete().eq('politician_id', politicianId); // New: delete party memberships
    await supabase.from('political_career_entries').delete().eq('politician_id', politicianId);
    
    const {data: existingAssetDecls} = await supabase.from('asset_declarations').select('id').eq('politician_id', politicianId);
    if (existingAssetDecls) for (const ad of existingAssetDecls) await supabase.from('asset_declaration_sources').delete().eq('asset_declaration_id', ad.id);
    await supabase.from('asset_declarations').delete().eq('politician_id', politicianId);
    
    const {data: existingCriminalRecs} = await supabase.from('criminal_record_entries').select('id').eq('politician_id', politicianId);
    if (existingCriminalRecs) for (const cr of existingCriminalRecs) await supabase.from('criminal_record_sources').delete().eq('criminal_record_entry_id', cr.id);
    await supabase.from('criminal_record_entries').delete().eq('politician_id', politicianId);
    
    await supabase.from('social_media_links').delete().eq('politician_id', politicianId);
    await supabase.from('politician_tags').delete().eq('politician_id', politicianId);
    // Assuming item_id in user_votes for politician is string, if it's number, politicianId should be passed.
    // For now, assuming it might be string due to UUIDs for other types. If it's politician.id (number), this is fine.
    await supabase.from('user_votes').delete().eq('item_id', politicianIdString).eq('item_type', 'politician'); 
    await supabase.from('promises').delete().eq('politician_id', politicianId); 
    await supabase.from('bills').delete().eq('sponsor_politician_id', politicianId); 
    
    const { error: deleteError } = await supabase.from('politicians').delete().eq('id', politicianId);
    if (deleteError) throw AppError.fromSupabaseError(deleteError, `Failed to delete politician ${politicianId}.`);
    return { message: `Politician ${politicianId} and related data deleted successfully.` };
}
