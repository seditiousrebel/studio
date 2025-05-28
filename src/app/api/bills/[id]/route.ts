// src/app/api/bills/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createErrorResponse } from '@/lib/api-utils'; 
import { AppError } from '@/lib/error-handling';
import { 
    handleGetBillById, 
    handleUpdateBill, 
    handleDeleteBill 
} from '@/lib/api-handlers/bill-handlers';
import type { Database, Enums as SupabaseEnums } from '@/types/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const bill = await handleGetBillById(params.id, supabase);
    return NextResponse.json(bill);
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error fetching bill ${params.id}:`, error);
    return createErrorResponse('Failed to fetch bill details', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string }}) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    try {
        const json = await request.json();
        const updatedBill = await handleUpdateBill(params.id, json, supabase);
        return NextResponse.json(updatedBill, { status: 200 });

    } catch (error: any) {
        if (error instanceof AppError) {
          return createErrorResponse(error.message, error.status, error.details, error.code);
        }
        console.error(`Error updating bill ${params.id}:`, error);
        return createErrorResponse("Failed to update bill", 500);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string }}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const result = await handleDeleteBill(params.id, supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error deleting bill ${params.id}:`, error);
    return createErrorResponse('Failed to delete bill', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string }}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const billId = params.id;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { is_featured, vote_type } = await request.json();

    if (is_featured !== undefined) { 
      if (!user) throw AppError.unauthorized("Unauthorized for featuring");
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile || !profile.is_admin) throw AppError.forbidden("Admin access required for featuring");
      
      const { error } = await supabase.from('bills').update({ is_featured: is_featured, updated_at: new Date().toISOString() }).eq('id', billId);
      if (error) throw new AppError(error.message, 500, error.code);
    } else if (vote_type) { 
      if (!user) throw AppError.unauthorized("Unauthorized for voting");

      const { data: existingVote, error: voteSelectError } = await supabase.from('user_votes')
        .select('*').eq('user_id', user.id).eq('item_id', billId).eq('item_type', 'bill' as SupabaseEnums<'entity_enum_type'>).single();
      if (voteSelectError && voteSelectError.code !== 'PGRST116') throw new AppError(voteSelectError.message, 500, voteSelectError.code);

      const { data: currentData, error: fetchError } = await supabase.from('bills').select('upvotes, downvotes').eq('id', billId).single();
      if (fetchError || !currentData) throw AppError.notFound('Bill for voting');
      
      let newUpvotes = currentData.upvotes ?? 0;
      let newDownvotes = currentData.downvotes ?? 0;
      let actualVoteType = vote_type === 'up' || vote_type === 'down' ? vote_type : null;

      if (existingVote) {
        if (existingVote.vote_type === actualVoteType) { 
          await supabase.from('user_votes').delete().eq('id', existingVote.id);
          if (actualVoteType === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
          if (actualVoteType === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
          actualVoteType = null; 
        } else { 
          await supabase.from('user_votes').update({ vote_type: actualVoteType as SupabaseEnums<'vote_type'> }).eq('id', existingVote.id);
          if (actualVoteType === 'up') {
            newUpvotes++;
            if (existingVote.vote_type === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
          } else if (actualVoteType === 'down'){
            newDownvotes++;
            if (existingVote.vote_type === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
          }
        }
      } else if (actualVoteType) {
        await supabase.from('user_votes').insert({ user_id: user.id, item_id: billId, item_type: 'bill' as SupabaseEnums<'entity_enum_type'>, vote_type: actualVoteType as SupabaseEnums<'vote_type'> });
        if (actualVoteType === 'up') newUpvotes++;
        if (actualVoteType === 'down') newDownvotes++;
      }

      const { error: updateError } = await supabase
        .from('bills')
        .update({ upvotes: newUpvotes, downvotes: newDownvotes, updated_at: new Date().toISOString() })
        .eq('id', billId);
      if (updateError) throw new AppError(updateError.message, 500, updateError.code);
    } else {
        throw AppError.badRequest("Invalid PATCH request: missing is_featured or vote_type");
    }

    const finalBill = await handleGetBillById(billId, supabase);
    return NextResponse.json(finalBill);

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error PATCHing bill ${billId}:`, error);
    return createErrorResponse('Failed to update bill', 500);
  }
}
