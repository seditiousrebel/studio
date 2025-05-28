
// src/app/api/promises/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createErrorResponse } from '@/lib/api-utils'; 
import { AppError } from '@/lib/error-handling';
import { 
    handleGetPromiseById, 
    handleUpdatePromise, 
    handleDeletePromise 
} from '@/lib/api-handlers/promise-handlers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const promise = await handleGetPromiseById(params.id, supabase);
    return NextResponse.json(promise);
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error fetching promise ${params.id}:`, error);
    return createErrorResponse('Failed to fetch promise details', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string }}) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    try {
        const json = await request.json();
        const updatedPromise = await handleUpdatePromise(params.id, json, supabase);
        return NextResponse.json(updatedPromise, { status: 200 });

    } catch (error: any) {
        if (error instanceof AppError) {
          return createErrorResponse(error.message, error.status, error.details, error.code);
        }
        console.error(`Error updating promise ${params.id}:`, error);
        return createErrorResponse("Failed to update promise", 500);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string }}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const result = await handleDeletePromise(params.id, supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error deleting promise ${params.id}:`, error);
    return createErrorResponse('Failed to delete promise', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string }}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const promiseId = params.id;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw AppError.unauthorized("Unauthorized for this action");
    
    const { is_featured } = await request.json(); 

    if (is_featured !== undefined) { 
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile || !profile.is_admin) throw AppError.forbidden("Admin access required for featuring");
      
      const { error } = await supabase.from('promises').update({ is_featured: is_featured, updated_at: new Date().toISOString() }).eq('id', promiseId);
      if (error) throw new AppError(error.message, 500, error.code);
    } else {
        throw AppError.badRequest("Invalid PATCH request: missing is_featured");
    }

    const finalPromise = await handleGetPromiseById(promiseId, supabase);
    return NextResponse.json(finalPromise);

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error PATCHing promise ${promiseId}:`, error);
    return createErrorResponse('Failed to update promise', 500);
  }
}
