// src/lib/data/politician-data.ts
import type { Politician, Tag } from '@/types';
import { calculateAge } from '@/lib/utils';
import type { Database, Enums as SupabaseEnums } from '@/types/supabase';

// This file now primarily holds the transformation logic.
// Data fetching is handled by src/lib/data-fetcher.ts

type RawPoliticianFromSupabase = Database['public']['Tables']['politicians']['Row'] & {
  party_memberships: {
    is_active: boolean;
    party_id: number; 
    party: { 
      id: number;
      name: string;
      logo_asset_id: number | null;
      logo_details: { 
        storage_path: string | null; 
      } | null; 
    } | null; 
  }[] | null; 
  // entity_tags is removed, replaced by fetched_tags
  fetched_tags?: Tag[]; // Tags are now fetched separately and attached
  promises?: Array<Database['public']['Tables']['promises']['Row']>;
  political_career_entries?: Array<Database['public']['Tables']['political_career_entries']['Row']>;
  asset_declarations?: Array<Database['public']['Tables']['asset_declarations']['Row'] & { asset_declaration_sources: Array<Database['public']['Tables']['asset_declaration_sources']['Row']> }>;
  criminal_record_entries?: Array<Database['public']['Tables']['criminal_record_entries']['Row'] & { criminal_record_sources: Array<Database['public']['Tables']['criminal_record_sources']['Row']> }>;
  social_media_links?: Array<Database['public']['Tables']['social_media_links']['Row']>;
};


export function transformSupabasePoliticianToAppPolitician(
  rawPol: RawPoliticianFromSupabase,
): Politician {
  const totalVotes = (rawPol.upvotes || 0) + (rawPol.downvotes || 0);
  let ratingVal: number | undefined = 2.5;
  if (totalVotes > 0) {
    ratingVal = parseFloat(((((rawPol.upvotes || 0) / totalVotes) * 4.5 + 0.5).toFixed(1)));
    ratingVal = Math.max(0.5, Math.min(5, ratingVal || 0));
  }

  const getHighestConvictedSeverity = (entries?: RawPoliticianFromSupabase['criminal_record_entries']): Politician['highestConvictedSeverity'] => {
    if (!entries || entries.length === 0) return null;
    const convictedEntries = entries.filter(e => e.status === 'Convicted');
    if (convictedEntries.length === 0) return null;
    if (convictedEntries.some(e => e.severity === 'Significant/Severe')) return 'Significant/Severe';
    if (convictedEntries.some(e => e.severity === 'Moderate')) return 'Moderate';
    if (convictedEntries.some(e => e.severity === 'Minor')) return 'Minor';
    return null;
  };
  
  const promiseFulfillmentRate = 0; // Placeholder

  let activePartyId: string | null = null;
  let activePartyName: string | undefined = undefined;
  let activePartyLogoStoragePath: string | undefined = undefined;

  if (rawPol.party_memberships && Array.isArray(rawPol.party_memberships)) {
    const activeMembership = rawPol.party_memberships.find(
      (mem) => mem.is_active && mem.party
    );

    if (activeMembership && activeMembership.party) {
      activePartyId = activeMembership.party.id.toString(); 
      activePartyName = activeMembership.party.name;
      if (activeMembership.party.logo_details && activeMembership.party.logo_details.storage_path) {
        activePartyLogoStoragePath = activeMembership.party.logo_details.storage_path;
      }
    }
  }

  return {
    id: rawPol.id.toString(), 
    name: rawPol.name,
    party_id: activePartyId, 
    partyName: activePartyName,
    partyLogoUrl: activePartyLogoStoragePath, 
    province: rawPol.province,
    constituency: rawPol.constituency,
    bio: rawPol.bio,
    dateOfBirth: rawPol.date_of_birth,
    age: rawPol.date_of_birth ? calculateAge(rawPol.date_of_birth) : undefined,
    imageUrl: rawPol.image_url, 
    data_ai_hint: rawPol.data_ai_hint,
    position: rawPol.position,
    education: rawPol.education,
    isFeatured: rawPol.is_featured || false,
    upvotes: rawPol.upvotes || 0,
    downvotes: rawPol.downvotes || 0,
    contactEmail: rawPol.contact_email,
    contactPhone: rawPol.contact_phone,
    tags: rawPol.fetched_tags || [], // Use the pre-fetched and pre-transformed tags
    rating: ratingVal,
    promiseFulfillmentRate: promiseFulfillmentRate,
    highestConvictedSeverity: getHighestConvictedSeverity(rawPol.criminal_record_entries),
    created_at: rawPol.created_at,
    updated_at: rawPol.updated_at,
    politicalCareer: rawPol.political_career_entries?.map(pc => ({
      id: pc.id.toString(), 
      year: pc.year,
      role: pc.role,
      created_at: pc.created_at,
      updated_at: pc.updated_at,
    })) || [],
    assetDeclarations: rawPol.asset_declarations?.map(ad => ({
      id: ad.id.toString(), 
      summary: ad.summary,
      declarationDate: ad.declaration_date,
      sourceUrls: ad.asset_declaration_sources?.map(src => ({
        id: src.id.toString(), 
        value: src.url,
        description: src.description,
        created_at: src.created_at,
      })) || [],
      created_at: ad.created_at,
      updated_at: ad.updated_at,
    })) || [],
    criminalRecordEntries: rawPol.criminal_record_entries?.map(cr => ({
      id: cr.id.toString(), 
      severity: cr.severity as CriminalRecordSeverity, 
      status: cr.status as CriminalRecordStatus, 
      offenseType: cr.offense_type as CriminalRecordOffenseType, 
      description: cr.description,
      caseDate: cr.case_date,
      sourceUrls: cr.criminal_record_sources?.map(src => ({
        id: src.id.toString(), 
        value: src.url,
        description: src.description,
        created_at: src.created_at,
      })) || [],
      created_at: cr.created_at,
      updated_at: cr.updated_at,
    })) || [],
    socialMediaLinks: rawPol.social_media_links?.map(sml => ({
      id: sml.id.toString(), 
      platform: sml.platform,
      url: sml.url,
      created_at: sml.created_at,
      updated_at: sml.updated_at,
    })) || [],
    promises: [], 
    directlySponsoredBills: [], 
    partySponsoredBills: [], 
  };
}

// Helper types from src/types/index.ts for casting if not already imported/available
type CriminalRecordSeverity = typeof import('@/types').CRIMINAL_RECORD_SEVERITIES[number];
type CriminalRecordStatus = typeof import('@/types').CRIMINAL_RECORD_STATUSES[number];
type CriminalRecordOffenseType = typeof import('@/types').CRIMINAL_RECORD_OFFENSE_TYPES[number];
