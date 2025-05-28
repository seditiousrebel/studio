// src/app/api/bills/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createErrorResponse } from '@/lib/api-utils';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { fetchEntityData } from '@/lib/data-fetcher';
import { handleCreateBill } from '@/lib/api-handlers/bill-handlers';
import { AppError } from '@/lib/error-handling';

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
        sponsorPoliticianId: searchParams.get('politician'),
        sponsorPartyId: searchParams.get('party'),
        tag: searchParams.get('tag'),
    };
    Object.keys(filters).forEach(key => (filters[key] === null || filters[key] === undefined || filters[key] === '') && delete filters[key]);
    
    const sortByParam = searchParams.get('sortBy');
    let sortBy;
    if (sortByParam) {
        const [field, order] = sortByParam.split('_');
        sortBy = { field, order: order as 'asc' | 'desc' };
    }

    const { data, count, error } = await fetchEntityData(supabase, 'bill', {
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
    console.error('Error in GET /api/bills:', error);
    return createErrorResponse('Failed to fetch bills', 500);
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const json = await request.json();
    const newBill = await handleCreateBill(json, supabase);
    return NextResponse.json(newBill, { status: 201 });

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('Error creating bill:', error);
    return createErrorResponse("Failed to create bill", 500);
  }
}
