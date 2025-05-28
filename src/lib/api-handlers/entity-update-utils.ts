// src/lib/api-handlers/entity-update-utils.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Enums as SupabaseEnums } from '@/types/supabase';
import type { PoliticalCareerEntry, AssetDeclarationEntry, CriminalRecordEntry, SocialMediaLink, ControversyEntry, ElectionHistoryEntry, ControversySource } from '@/types';
import { AppError } from '@/lib/error-handling';
import { transformTagsStringToArray } from '@/lib/transformers/entity-transformers';

export async function manageTags(
    supabase: SupabaseClient<Database>,
    entityId: string,
    tagsAsString: string | undefined | null,
    joinTable: Database['public']['Tables']['politician_tags']['Insert']['politician_id'] extends string ? 'politician_tags' : Database['public']['Tables']['party_tags']['Insert']['party_id'] extends string ? 'party_tags' : Database['public']['Tables']['promise_tags']['Insert']['promise_id'] extends string ? 'promise_tags' : 'bill_tags',
    entityColumn: 'politician_id' | 'party_id' | 'promise_id' | 'bill_id'
) {
    await supabase.from(joinTable).delete().eq(entityColumn, entityId);
    const newTagNames = transformTagsStringToArray(tagsAsString);

    if (newTagNames.length > 0) {
        const tagObjectsToInsert = [];
        for (const tagName of newTagNames) {
        let { data: existingTag, error: tagError } = await supabase.from('tags').select('id').eq('name', tagName.trim()).single();
        if (tagError && tagError.code !== 'PGRST116') throw new AppError(tagError.message, 500, tagError.code);
        if (!existingTag) {
            const { data: newTag, error: newTagError } = await supabase.from('tags').insert({ name: tagName.trim() }).select('id').single();
            if (newTagError) throw new AppError(newTagError.message, 500, newTagError.code);
            if (!newTag) throw new AppError(`Failed to create or retrieve tag: ${tagName}`, 500, 'TAG_CREATION_FAILED');
            existingTag = newTag;
        }
        if (existingTag?.id) tagObjectsToInsert.push({ [entityColumn]: entityId, tag_id: existingTag.id });
        }
        if (tagObjectsToInsert.length > 0) {
        const { error: joinTableError } = await supabase.from(joinTable).insert(tagObjectsToInsert as any); // Cast as any due to dynamic table/column
        if (joinTableError) throw new AppError(joinTableError.message, 500, joinTableError.code);
        }
    }
}

export async function updatePoliticalCareer(politicianId: string, careerEntries: PoliticalCareerEntry[] | undefined, supabase: SupabaseClient<Database>) {
    await supabase.from('political_career_entries').delete().eq('politician_id', politicianId);
    if (careerEntries && careerEntries.length > 0) {
        const entriesToInsert = careerEntries
            .filter(entry => entry.year && entry.role)
            .map(entry => ({ politician_id: politicianId, year: Number(entry.year), role: entry.role }));
        if (entriesToInsert.length > 0) {
             const { error } = await supabase.from('political_career_entries').insert(entriesToInsert);
             if (error) throw new AppError(`Failed to update political career: ${error.message}`, 500, error.code);
        }
    }
}

export async function updateAssetDeclarations(politicianId: string, assetDeclarations: AssetDeclarationEntry[] | undefined, supabase: SupabaseClient<Database>) {
    const {data: existingDecls, error: fetchExistingError} = await supabase.from('asset_declarations').select('id').eq('politician_id', politicianId);
    if (fetchExistingError) throw new AppError(`Failed to fetch existing asset declarations: ${fetchExistingError.message}`, 500, fetchExistingError.code);
    
    if (existingDecls) {
      for (const ad of existingDecls) {
        const { error: deleteSourcesError } = await supabase.from('asset_declaration_sources').delete().eq('asset_declaration_id', ad.id);
        if (deleteSourcesError) throw new AppError(`Failed to delete old asset sources for declaration ${ad.id}: ${deleteSourcesError.message}`, 500, deleteSourcesError.code);
      }
    }
    const { error: deleteDeclarationsError } = await supabase.from('asset_declarations').delete().eq('politician_id', politicianId);
    if (deleteDeclarationsError) throw new AppError(`Failed to delete old asset declarations for politician ${politicianId}: ${deleteDeclarationsError.message}`, 500, deleteDeclarationsError.code);


    if (assetDeclarations && assetDeclarations.length > 0) {
        for (const ad of assetDeclarations.filter(a => a.summary)) {
            const { data: newAD, error: adErr } = await supabase.from('asset_declarations')
                .insert({ politician_id: politicianId, summary: ad.summary, declaration_date: ad.declarationDate || null })
                .select('id').single();
            if (adErr) throw new AppError(`Failed to insert asset declaration: ${adErr.message}`, 500, adErr.code);
            if (newAD && ad.sourceUrls) {
                const sourcesToInsert = ad.sourceUrls.filter(s => s.value).map(s => ({ asset_declaration_id: newAD.id, url: s.value, description: s.description || null }));
                if (sourcesToInsert.length > 0) {
                    const { error: sourceErr } = await supabase.from('asset_declaration_sources').insert(sourcesToInsert);
                    if (sourceErr) throw new AppError(`Failed to insert asset declaration sources: ${sourceErr.message}`, 500, sourceErr.code);
                }
            }
        }
    }
}

export async function updateCriminalRecordEntries(politicianId: string, criminalRecords: CriminalRecordEntry[] | undefined, supabase: SupabaseClient<Database>) {
    const {data: existingRecs, error: fetchExistingCrError} = await supabase.from('criminal_record_entries').select('id').eq('politician_id', politicianId);
    if (fetchExistingCrError) throw new AppError(`Failed to fetch existing criminal records: ${fetchExistingCrError.message}`, 500, fetchExistingCrError.code);

    if (existingRecs) {
      for (const cr of existingRecs) {
        const { error: deleteCrSourcesError } = await supabase.from('criminal_record_sources').delete().eq('criminal_record_entry_id', cr.id);
        if (deleteCrSourcesError) throw new AppError(`Failed to delete old criminal record sources for entry ${cr.id}: ${deleteCrSourcesError.message}`, 500, deleteCrSourcesError.code);
      }
    }
    const { error: deleteCrEntriesError } = await supabase.from('criminal_record_entries').delete().eq('politician_id', politicianId);
    if (deleteCrEntriesError) throw new AppError(`Failed to delete old criminal record entries for politician ${politicianId}: ${deleteCrEntriesError.message}`, 500, deleteCrEntriesError.code);


    if (criminalRecords && criminalRecords.length > 0) {
        for (const cr of criminalRecords.filter(c => c.description)) {
            const { data: newCR, error: crErr } = await supabase.from('criminal_record_entries')
                .insert({ 
                    politician_id: politicianId, 
                    severity: cr.severity, 
                    status: cr.status, 
                    offense_type: cr.offenseType as SupabaseEnums<'criminal_record_offense_type'>, 
                    description: cr.description, 
                    case_date: cr.caseDate || null 
                })
                .select('id').single();
            if (crErr) throw new AppError(`Failed to insert criminal record entry: ${crErr.message}`, 500, crErr.code);
            if (newCR && cr.sourceUrls) {
                 const sourcesToInsert = cr.sourceUrls.filter(s => s.value).map(s => ({ criminal_record_entry_id: newCR.id, url: s.value, description: s.description || null }));
                 if (sourcesToInsert.length > 0) {
                    const { error: sourceErr } = await supabase.from('criminal_record_sources').insert(sourcesToInsert);
                    if (sourceErr) throw new AppError(`Failed to insert criminal record sources: ${sourceErr.message}`, 500, sourceErr.code);
                }
            }
        }
    }
}

export async function updateSocialMediaLinks(politicianId: string, socialLinks: SocialMediaLink[] | undefined, supabase: SupabaseClient<Database>) {
    await supabase.from('social_media_links').delete().eq('politician_id', politicianId);
    if (socialLinks && socialLinks.length > 0) {
        const linksToInsert = socialLinks
            .filter(link => link.platform && link.url)
            .map(link => ({ politician_id: politicianId, platform: link.platform, url: link.url }));
        if (linksToInsert.length > 0) {
            const { error } = await supabase.from('social_media_links').insert(linksToInsert);
            if (error) throw new AppError(`Failed to update social media links: ${error.message}`, 500, error.code);
        }
    }
}


export async function updatePartyElectionHistory(partyId: string, electionHistory: ElectionHistoryEntry[] | undefined, supabase: SupabaseClient<Database>) {
  await supabase.from('election_history_entries').delete().eq('party_id', partyId);
  if (electionHistory && electionHistory.length > 0) {
    const historyToInsert = electionHistory.map(entry => ({
      party_id: partyId,
      election_year: entry.electionYear,
      election_type: entry.electionType as SupabaseEnums<'election_event_type'>,
      seats_contested: entry.seatsContested,
      seats_won: entry.seatsWon,
      vote_percentage: entry.votePercentage,
    }));
    const { error } = await supabase.from('election_history_entries').insert(historyToInsert);
    if (error) throw new AppError(`Failed to update election history: ${error.message}`, 500, error.code);
  }
}

export async function updatePartyControversies(partyId: string, controversies: ControversyEntry[] | undefined, supabase: SupabaseClient<Database>) {
  const {data: existingControversiesForDeletion, error: fetchExistingContErr} = await supabase.from('party_controversies').select('id').eq('party_id', partyId);
  if (fetchExistingContErr) throw new AppError(`Failed to fetch existing party controversies: ${fetchExistingContErr.message}`, 500, fetchExistingContErr.code);

  if (existingControversiesForDeletion) {
    for (const c of existingControversiesForDeletion) {
      const { error: deleteContSourcesErr } = await supabase.from('party_controversy_sources').delete().eq('party_controversy_id', c.id);
      if (deleteContSourcesErr) throw new AppError(`Failed to delete old controversy sources for party ${partyId}, controversy ${c.id}: ${deleteContSourcesErr.message}`, 500, deleteContSourcesErr.code);
    }
  }
  const { error: deleteContErr } = await supabase.from('party_controversies').delete().eq('party_id', partyId);
  if (deleteContErr) throw new AppError(`Failed to delete old controversies for party ${partyId}: ${deleteContErr.message}`, 500, deleteContErr.code);

  if (controversies && controversies.length > 0) {
    for (const controversy of controversies) {
      const { sourceUrls, ...controversyData } = controversy;
      const { data: newControversy, error: controversyError } = await supabase
        .from('party_controversies')
        .insert({ party_id: partyId, description: controversyData.description, controversy_date: controversyData.eventDate || null })
        .select('id').single();
      if (controversyError) throw new AppError(`Failed to insert party controversy: ${controversyError.message}`, 500, controversyError.code);
      if (newControversy && sourceUrls && sourceUrls.length > 0) {
        const sourcesToInsert = sourceUrls.filter(s => s.value).map(s => ({ party_controversy_id: newControversy.id, url: s.value, description: s.description || null }));
        if (sourcesToInsert.length > 0) {
          const { error: sourceError } = await supabase.from('party_controversy_sources').insert(sourcesToInsert);
          if (sourceError) throw new AppError(`Failed to insert party controversy sources: ${sourceError.message}`, 500, sourceError.code);
        }
      }
    }
  }
}
