// src/lib/data/politician-data.ts
import type { Politician, Tag } from '@/types';
import { calculateAge } from '@/lib/utils';
import type { Database } from '@/types/supabase';

// This file now primarily holds the transformation logic.
// Data fetching is handled by src/lib/data-fetcher.ts

type RawPoliticianFromSupabase = Database['public']['Tables']['politicians']['Row'] & {
  // party_details is removed as party info now comes via party_memberships
  party_memberships: {
    is_active: boolean;
    party_id: number; // This is the FK from party_memberships to parties table (parties.id)
    party: { // This is the expanded party record from the parties table
      id: number;
      name: string;
      logo_asset_id: number | null;
      logo_details: { // This comes from the media_assets table
        storage_path: string | null; 
      } | null; 
    } | null; // The nested party object could be null if the join failed or party_id was invalid (though unlikely with good DB integrity)
  }[] | null; // The party_memberships array itself can be null or empty
  politician_tags: {
    tags: Pick<Database['public']['Tables']['tags']['Row'], 'id' | 'name' | 'created_at'> | null;
  }[];
  promises?: Array<Database['public']['Tables']['promises']['Row']>;
  directly_sponsored_bills?: Array<Database['public']['Tables']['bills']['Row']>;
  // party_sponsored_bills seems to have been removed from the select string, if it was there.
  // If it needs to be added back, the select string in data-fetcher.ts for politician would need adjustment.
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
      activePartyId = activeMembership.party.id.toString(); // Politician.party_id is string | null
      activePartyName = activeMembership.party.name;
      if (activeMembership.party.logo_details && activeMembership.party.logo_details.storage_path) {
        activePartyLogoStoragePath = activeMembership.party.logo_details.storage_path;
        // IMPORTANT: activePartyLogoStoragePath is just the path, not a full URL.
        // It needs to be prefixed with the Supabase storage public URL.
        // e.g., `https://<PROJECT_URL>/storage/v1/object/public/<BUCKET_NAME>/${activePartyLogoStoragePath}`
        // This prefixing should ideally happen where the URL is consumed (e.g., in a component or a utility function).
      }
    }
  }

  return {
    id: rawPol.id,
    name: rawPol.name,
    party_id: activePartyId, // Use the ID from the active membership's party object
    partyName: activePartyName,
    partyLogoUrl: activePartyLogoStoragePath, // This is now a storage path, see comment above
    province: rawPol.province,
    constituency: rawPol.constituency,
    bio: rawPol.bio,
    dateOfBirth: rawPol.date_of_birth,
    age: rawPol.date_of_birth ? calculateAge(rawPol.date_of_birth) : undefined,
    imageUrl: rawPol.image_url, // This should also be a storage path if served from Supabase storage
    data_ai_hint: rawPol.data_ai_hint,
    position: rawPol.position,
    education: rawPol.education,
    isFeatured: rawPol.is_featured || false,
    upvotes: rawPol.upvotes || 0,
    downvotes: rawPol.downvotes || 0,
    contactEmail: rawPol.contact_email,
    contactPhone: rawPol.contact_phone,
    tags: rawPol.politician_tags?.map(pt => pt.tags ? { id: pt.tags.id, name: pt.tags.name, created_at: pt.tags.created_at } : null).filter(Boolean) as Tag[] || [],
    rating: ratingVal,
    promiseFulfillmentRate: promiseFulfillmentRate,
    highestConvictedSeverity: getHighestConvictedSeverity(rawPol.criminal_record_entries),
    created_at: rawPol.created_at,
    updated_at: rawPol.updated_at,
    politicalCareer: rawPol.political_career_entries?.map(pc => ({
      id: pc.id,
      year: pc.year,
      role: pc.role,
      created_at: pc.created_at,
      updated_at: pc.updated_at,
    })) || [],
    assetDeclarations: rawPol.asset_declarations?.map(ad => ({
      id: ad.id,
      summary: ad.summary,
      declarationDate: ad.declaration_date,
      sourceUrls: ad.asset_declaration_sources?.map(src => ({
        id: src.id,
        value: src.url,
        description: src.description,
        created_at: src.created_at,
      })) || [],
      created_at: ad.created_at,
      updated_at: ad.updated_at,
    })) || [],
    criminalRecordEntries: rawPol.criminal_record_entries?.map(cr => ({
      id: cr.id,
      severity: cr.severity,
      status: cr.status,
      offenseType: cr.offense_type,
      description: cr.description,
      caseDate: cr.case_date,
      sourceUrls: cr.criminal_record_sources?.map(src => ({
        id: src.id,
        value: src.url,
        description: src.description,
        created_at: src.created_at,
      })) || [],
      created_at: cr.created_at,
      updated_at: cr.updated_at,
    })) || [],
    socialMediaLinks: rawPol.social_media_links?.map(sml => ({
      id: sml.id,
      platform: sml.platform,
      url: sml.url,
      created_at: sml.created_at,
      updated_at: sml.updated_at,
    })) || [],
    // These are typically fetched separately or as part of more detailed views, ensure select string matches if needed here.
    promises: [], 
    directlySponsoredBills: [], 
    partySponsoredBills: [], 
  };
}
