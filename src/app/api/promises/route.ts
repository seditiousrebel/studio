// src/app/api/promises/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { UserPromise, Tag } from '@/types';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createErrorResponse } from '@/lib/api-utils';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { fetchEntityData } from '@/lib/data-fetcher';
import { handleCreatePromise } from '@/lib/api-handlers/promise-handlers';
import { AppError } from '@/lib/error-handling';
import { promiseFormSchema } from '@/components/admin/promise-form';


type RawSupabasePromise = Database['public']['Tables']['promises']['Row'] & {
  politicians: (Pick<Database['public']['Tables']['politicians']['Row'], 'id' | 'name' | 'image_url' | 'party_id'> & {
    party_details: Pick<Database['public']['Tables']['parties']['Row'], 'id' | 'name' | 'logo_url'> | null;
  }) | null;
  parties: Pick<Database['public']['Tables']['parties']['Row'], 'id' | 'name' | 'logo_url'> | null;
  promise_tags: Array<{
    tags: Pick<Database['public']['Tables']['tags']['Row'], 'id' | 'name' | 'created_at'> | null;
  }>;
};

export function transformSupabasePromiseToApp(raw: RawSupabasePromise): UserPromise {
  let politicianPartyId: string | undefined | null = undefined;
  let politicianPartyName: string | undefined | null = undefined;
  let politicianPartyLogoUrl: string | undefined | null = undefined;

  if (raw.politicians) {
    politicianPartyId = raw.politicians.party_id || undefined;
    if (raw.politicians.party_details) {
      politicianPartyName = raw.politicians.party_details.name;
      politicianPartyLogoUrl = raw.politicians.party_details.logo_url;
    }
  }

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: raw.status as UserPromise['status'],
    category: raw.category,
    deadline: raw.deadline,
    sourceUrl: raw.source_url,
    evidenceUrl: raw.evidence_url,
    dateAdded: raw.date_added,
    politicianId: raw.politicians?.id || undefined,
    politicianName: raw.politicians?.name || undefined,
    politicianImageUrl: raw.politicians?.image_url || undefined,
    partyId: raw.politicians ? politicianPartyId : raw.parties?.id,
    partyName: raw.politicians ? politicianPartyName : raw.parties?.name,
    partyLogoUrl: raw.politicians ? politicianPartyLogoUrl : raw.parties?.logo_url,
    isFeatured: raw.is_featured ?? false,
    tags: raw.promise_tags
      ?.map(pt => pt.tags ? { id: pt.tags.id, name: pt.tags.name, created_at: pt.tags.created_at } : null)
      .filter(Boolean) as Tag[] || [],
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
        category: searchParams.get('category'),
        politicianId: searchParams.get('politician'),
        partyId: searchParams.get('party'),
        tag: searchParams.get('tag'),
    };
    Object.keys(filters).forEach(key => (filters[key] === null || filters[key] === undefined || filters[key] === '') && delete filters[key]);
    
    const sortByParam = searchParams.get('sortBy');
    let sortBy;
    if (sortByParam) {
        const [field, order] = sortByParam.split('_');
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
