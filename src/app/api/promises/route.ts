// src/app/api/promises/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { UserPromise, Tag } from '@/types';
import type { Database, Enums as SupabaseEnums } from '@/types/supabase'; // Added SupabaseEnums
import type { SupabaseClient } from '@supabase/supabase-js';
import { createErrorResponse } from '@/lib/api-utils';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { fetchEntityData } from '@/lib/data-fetcher';
import { handleCreatePromise } from '@/lib/api-handlers/promise-handlers';
import { AppError } from '@/lib/error-handling';
// import { promiseFormSchema } from '@/components/admin/promise-form'; // Not used in this file directly

type RawSupabasePromise = Database['public']['Tables']['promises']['Row'] & {
  politicians: (Omit<Database['public']['Tables']['politicians']['Row'], 'party_id'> & {
    party_memberships: {
      is_active: boolean;
      party: {
        id: number;
        name: string;
        logo_asset_id: number | null;
        logo_details: { storage_path: string | null } | null;
      } | null;
    }[] | null;
  }) | null;
  parties: (Pick<Database['public']['Tables']['parties']['Row'], 'id' | 'name' | 'logo_asset_id'> & {
    logo_details: { storage_path: string | null } | null;
  }) | null;
  // promise_tags is removed, replaced by entity_tags
  entity_tags: {
    tag_id: number;
    entity_type: SupabaseEnums<'entity_type'>; // Using the enum type for entity_type
    tag: { 
      id: number; 
      name: string; 
      created_at: string | null; 
    } | null; 
  }[] | null;
};

export function transformSupabasePromiseToApp(raw: RawSupabasePromise): UserPromise {
  let politicianPartyId: string | undefined = undefined;
  let politicianPartyName: string | undefined = undefined;
  let politicianPartyLogoUrl: string | undefined = undefined;

  if (raw.politicians && raw.politicians.party_memberships) {
    const activeMembership = raw.politicians.party_memberships.find(
      (mem) => mem.is_active && mem.party
    );
    if (activeMembership && activeMembership.party) {
      politicianPartyId = activeMembership.party.id.toString();
      politicianPartyName = activeMembership.party.name;
      politicianPartyLogoUrl = activeMembership.party.logo_details?.storage_path || undefined;
    }
  }

  return {
    id: raw.id.toString(), // Changed to string
    title: raw.title,
    description: raw.description,
    status: raw.status as UserPromise['status'],
    category: undefined, // Set to undefined as category column is removed
    deadline: raw.deadline,
    sourceUrl: raw.source_url,
    evidenceUrl: raw.evidence_url,
    dateAdded: raw.date_added,
    politicianId: raw.politicians?.id?.toString() || undefined, // Changed to string
    politicianName: raw.politicians?.name || undefined,
    politicianImageUrl: raw.politicians?.image_url || undefined,
    
    partyId: raw.politicians ? politicianPartyId : (raw.parties?.id?.toString() || undefined),
    partyName: raw.politicians ? politicianPartyName : (raw.parties?.name || undefined),
    partyLogoUrl: raw.politicians ? politicianPartyLogoUrl : (raw.parties?.logo_details?.storage_path || undefined),
    
    isFeatured: raw.is_featured ?? false,
    tags: raw.entity_tags?.map(et => et.tag ? { id: et.tag.id.toString(), name: et.tag.name, created_at: et.tag.created_at || undefined } : null).filter(Boolean) as Tag[] || [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}


export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { searchParams } = new URL(request.url);

  try {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
    
    const filters: Record<string, any> = {
        searchTerm: searchParams.get('search'),
        status: searchParams.get('status'),
        // category: searchParams.get('category'), // Category filter removed
        politicianId: searchParams.get('politician'),
        partyId: searchParams.get('party'),
        tag: searchParams.get('tag'),
    };
    Object.keys(filters).forEach(key => (filters[key] === null || filters[key] === undefined || filters[key] === '') && delete filters[key]);
    
    const sortByParam = searchParams.get('sortBy');
    let sortBy;
    if (sortByParam) {
        const [field, order] = sortByParam.split('_');
        // Category sorting removed in data-fetcher, no specific check needed here for that.
        sortBy = { field, order: order as 'asc' | 'desc' };
    }

    const { data, count, error } = await fetchEntityData(supabase, 'promise', {
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
    console.error('Error in GET /api/promises:', error);
    return createErrorResponse('Failed to fetch promises', 500);
  }
}

export async function POST(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    try {
        const json = await request.json();
        // Assuming promiseFormSchema is used within handleCreatePromise for validation
        const newPromise = await handleCreatePromise(json, supabase);
        return NextResponse.json(newPromise, { status: 201 });

    } catch (error: any) {
        if (error instanceof AppError) {
          return createErrorResponse(error.message, error.status, error.details, error.code);
        }
        console.error('Error creating promise:', error);
        return createErrorResponse("Failed to create promise", 500);
    }
}
