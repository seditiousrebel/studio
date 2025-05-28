
// src/app/api/parties/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 
import { cookies } from 'next/headers'; 
import { createErrorResponse } from '@/lib/api-utils'; 
import { AppError } from '@/lib/error-handling';
import { 
    handleGetPartyById, 
    handleUpdateParty, 
    handleDeleteParty 
} from '@/lib/api-handlers/party-handlers';
import type { Database, Enums as SupabaseEnums } from '@/types/supabase';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const party = await handleGetPartyById(params.id, supabase);
    return NextResponse.json(party);
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error fetching party ${params.id}:`, error);
    return createErrorResponse('Failed to fetch party details', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string }}) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    try {
        const json = await request.json();
        const updatedParty = await handleUpdateParty(params.id, json, supabase);
        return NextResponse.json(updatedParty, { status: 200 });

    } catch (error: any) {
        if (error instanceof AppError) {
          return createErrorResponse(error.message, error.status, error.details, error.code);
        }
        console.error(`Error updating party ${params.id}:`, error);
        return createErrorResponse("Failed to update party", 500);
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string }}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const result = await handleDeleteParty(params.id, supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error deleting party ${params.id}:`, error);
    return createErrorResponse('Failed to delete party', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string }}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const partyId = params.id;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { is_featured, vote_type } = await request.json();

    if (is_featured !== undefined) { 
      if (!user) throw AppError.unauthorized("Unauthorized for featuring");
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile || !profile.is_admin) throw AppError.forbidden("Admin access required for featuring");
      
      const { error } = await supabase.from('parties').update({ is_featured: is_featured, updated_at: new Date().toISOString() }).eq('id', partyId);
      if (error) throw new AppError(error.message, 500, error.code);
    } else if (vote_type) { 
      if (!user) throw AppError.unauthorized("Unauthorized for voting");

      const { data: existingVote, error: voteSelectError } = await supabase.from('user_votes')
        .select('*').eq('user_id', user.id).eq('item_id', partyId).eq('item_type', 'party' as SupabaseEnums<'entity_enum_type'>).single();
      if (voteSelectError && voteSelectError.code !== 'PGRST116') throw new AppError(voteSelectError.message, 500, voteSelectError.code);

      const { data: currentData, error: fetchError } = await supabase.from('parties').select('upvotes, downvotes').eq('id', partyId).single();
      if (fetchError || !currentData) throw AppError.notFound('Party for voting');
      
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
        await supabase.from('user_votes').insert({ user_id: user.id, item_id: partyId, item_type: 'party' as SupabaseEnums<'entity_enum_type'>, vote_type: actualVoteType as SupabaseEnums<'vote_type'> });
        if (actualVoteType === 'up') newUpvotes++;
        if (actualVoteType === 'down') newDownvotes++;
      }

      const { error: updateError } = await supabase
        .from('parties')
        .update({ upvotes: newUpvotes, downvotes: newDownvotes, updated_at: new Date().toISOString() })
        .eq('id', partyId);
      if (updateError) throw new AppError(updateError.message, 500, updateError.code);
    } else {
        throw AppError.badRequest("Invalid PATCH request: missing is_featured or vote_type");
    }

    const finalParty = await handleGetPartyById(partyId, supabase);
    return NextResponse.json(finalParty);

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error(`Error PATCHing party ${partyId}:`, error);
    return createErrorResponse('Failed to update party', 500);
  }
}
