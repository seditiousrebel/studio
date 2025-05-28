
// src/app/api/politicians/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { createErrorResponse } from '@/lib/api-utils';
import { AppError } from '@/lib/error-handling';
import { handleCreatePolitician } from '@/lib/api-handlers/politician-handlers';
import { fetchEntityData } from '@/lib/data-fetcher';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { searchParams } = new URL(request.url);

  try {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
    
    const filters: Record<string, any> = {
        searchTerm: searchParams.get('search'),
        partyId: searchParams.get('party'),
        province: searchParams.get('province'),
        tag: searchParams.get('tag'),
        minAge: searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!, 10) : null,
        maxAge: searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!, 10) : null,
    };
    Object.keys(filters).forEach(key => (filters[key] === null || filters[key] === undefined || filters[key] === '') && delete filters[key]);
    
    const sortByParam = searchParams.get('sortBy');
    let sortBy;
    if (sortByParam) {
        const [field, order] = sortByParam.split('_');
        sortBy = { field, order: order as 'asc' | 'desc' };
    }

    const { data: politicians, count, error } = await fetchEntityData(supabase, 'politician', {
      filters,
      page,
      limit,
      sortBy,
      includeRelations: true // Ensure relations are included for list view cards
    });

    if (error) throw error;

    return NextResponse.json({ items: politicians, totalCount: count });

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('Error fetching politicians:', error);
    return createErrorResponse('Failed to fetch politicians', 500);
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw AppError.unauthorized();
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile || !profile.is_admin) throw AppError.forbidden();

    const json = await request.json();
    const newPolitician = await handleCreatePolitician(json, supabase);
    return NextResponse.json(newPolitician, { status: 201 });

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('Error creating politician:', error);
    return createErrorResponse('Failed to create politician', 500);
  }
}
