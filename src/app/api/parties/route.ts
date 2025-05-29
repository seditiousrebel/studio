// src/app/api/parties/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Party, Tag, ElectionHistoryEntry, ControversyEntry, Politician, UserPromise, Bill, ElectionEventType, ControversySource } from '@/types'; // Added ControversySource
import type { Database, Enums as SupabaseEnums } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createErrorResponse } from '@/lib/api-utils';
import { fetchEntityData } from '@/lib/data-fetcher';
import { handleCreateParty } from '@/lib/api-handlers/party-handlers';
import { AppError } from '@/lib/error-handling';
import { ITEMS_PER_PAGE } from '@/lib/constants';

type RawSupabaseParty = Database['public']['Tables']['parties']['Row'] & {
  chairperson_details: (Pick<Database['public']['Tables']['politicians']['Row'], 'id' | 'name'> & { photo_details: { storage_path: string | null } | null; }) | null;
  // entity_tags is removed, replaced by fetched_tags
  fetched_tags?: Tag[];
  logo_details?: { storage_path: string | null } | null;
  election_symbol_details?: { storage_path: string | null } | null;
  election_history_entries: Array<Database['public']['Tables']['election_history_entries']['Row']>;
  party_controversies: Array<
    Database['public']['Tables']['party_controversies']['Row'] & {
      party_controversy_sources: Array<Database['public']['Tables']['party_controversy_sources']['Row']> | null;
    }
  >;
  member_politicians?: Politician[]; 
  platform_promises?: UserPromise[];
  member_promises?: UserPromise[];
  bills_sponsored_by_party?: Bill[];
  bills_sponsored_by_members?: Bill[];
};

export function transformSupabasePartyToAppParty(rawParty: RawSupabaseParty): Party {
  const totalVotes = (rawParty.upvotes || 0) + (rawParty.downvotes || 0);
  let ratingVal: number | undefined = 2.5; 
  if (totalVotes > 0) {
    ratingVal = parseFloat(((((rawParty.upvotes || 0) / totalVotes) * 4.5 + 0.5).toFixed(1)));
    ratingVal = Math.max(0.5, Math.min(5, ratingVal || 0)); 
  }

  return {
    id: rawParty.id.toString(), 
    name: rawParty.name,
    shortName: rawParty.short_name,
    logoUrl: rawParty.logo_details?.storage_path || undefined, // Use storage_path
    dataAiHint: rawParty.data_ai_hint,
    ideology: rawParty.ideology,
    foundingDate: rawParty.founding_date,
    chairpersonId: rawParty.chairperson_details?.id?.toString() || rawParty.chairperson_id?.toString() || undefined, 
    chairpersonName: rawParty.chairperson_details?.name,
    chairpersonImageUrl: rawParty.chairperson_details?.photo_details?.storage_path || undefined,
    headquarters: rawParty.headquarters,
    description: rawParty.description,
    history: rawParty.history,
    electionSymbolUrl: rawParty.election_symbol_details?.storage_path || undefined, // Use storage_path
    dataAiHintSymbol: rawParty.data_ai_hint_symbol,
    website: rawParty.website,
    contactEmail: rawParty.contact_email,
    contactPhone: rawParty.contact_phone,
    isFeatured: rawParty.is_featured || false,
    upvotes: rawParty.upvotes || 0,
    downvotes: rawParty.downvotes || 0,
    rating: ratingVal,
    tags: rawParty.fetched_tags || [], // Use fetched_tags
    electionHistory: (rawParty.election_history_entries || []).map((eh): ElectionHistoryEntry => ({
      id: eh.id.toString(), 
      party_id: eh.party_id?.toString(), 
      electionYear: eh.election_year,
      electionType: eh.election_type as ElectionEventType,
      seatsContested: eh.seats_contested,
      seatsWon: eh.seats_won,
      votePercentage: eh.vote_percentage,
      created_at: eh.created_at,
      updated_at: eh.updated_at,
    })),
    controversies: (rawParty.party_controversies || []).map((c): ControversyEntry => ({ 
      id: c.id.toString(), 
      description: c.description,
      eventDate: c.controversy_date, 
      sourceUrls: (c.party_controversy_sources || []).map((s): ControversySource => ({ 
        id: s.id.toString(), 
        value: s.url,
        description: s.description,
        created_at: s.created_at,
      })),
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    keyPolicyPositions: rawParty.key_policy_positions,
    created_at: rawParty.created_at,
    updated_at: rawParty.updated_at,
    memberPoliticians: rawParty.member_politicians || [], 
    platformPromises: rawParty.platform_promises || [],
    memberPromises: rawParty.member_promises || [],
    billsSponsoredByParty: rawParty.bills_sponsored_by_party || [],
    billsSponsoredByMembers: rawParty.bills_sponsored_by_members || [],
    numberOfMembers: rawParty.member_politicians?.length || 0, 
  };
}

export async function GET(request: NextRequest) { 
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
  
  const filters: Record<string, any> = {
      searchTerm: searchParams.get('search'),
      ideology: searchParams.get('ideology'),
      foundingYear: searchParams.get('foundingYear'), 
      tag: searchParams.get('tag'),
  };
  Object.keys(filters).forEach(key => (filters[key] === null || filters[key] === undefined || filters[key] === '') && delete filters[key]);

  let sortBy;
  const sortByParam = searchParams.get('sortBy');
  if (sortByParam) {
      const [field, order] = sortByParam.split('_');
      sortBy = { field, order: order as 'asc' | 'desc' };
  }

  try {
    const { data, count, error } = await fetchEntityData(supabase, 'party', {
        filters,
        page,
        limit,
        sortBy,
        includeRelations: true 
    });
    if (error) throw error; 
    return NextResponse.json({ items: data, totalCount: count });
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('Error in GET /api/parties:', error);
    return createErrorResponse('Failed to fetch parties', 500);
  }
}

export async function POST(request: NextRequest) { 
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    try {
        const json = await request.json();
        const newParty = await handleCreateParty(json, supabase);
        return NextResponse.json(newParty, { status: 201 });

    } catch (error: any) {
        if (error instanceof AppError) {
          return createErrorResponse(error.message, error.status, error.details, error.code);
        }
        console.error('Error creating party:', error);
        return createErrorResponse("Failed to create party", 500);
    }
}
