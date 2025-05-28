
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EditSuggestion, EntityType, PoliticianFormValues, PartyFormValues, PromiseFormValues, BillFormValues } from '@/types';
import type { Database, Enums as SupabaseEnums } from '@/types/supabase';
import { cookies } from 'next/headers';
import { createErrorResponse } from '@/lib/api-utils'; 
import { AppError } from '@/lib/error-handling';
import { transformTagsArrayToString } from '@/lib/transformers/entity-transformers';
import * as z from 'zod';
import { 
    handleCreatePolitician, handleUpdatePolitician,
    handleCreateParty, handleUpdateParty,
    handleCreatePromise, handleUpdatePromise,
    handleCreateBill, handleUpdateBill
} from '@/lib/api-handlers';
import { politicianFormSchema } from '@/components/admin/politician-form';
import { partyFormSchema } from '@/components/admin/party-form';
import { promiseFormSchema } from '@/components/admin/promise-form';
import { billFormSchema } from '@/components/admin/bill-form';

// Zod schema for validating POST request body
const suggestionPostBodySchema = z.object({
  entityType: z.enum(['politician', 'party', 'promise', 'bill']),
  entityId: z.string().uuid().optional().nullable(),
  suggestedData: z.record(z.any()).refine(data => Object.keys(data).length > 0, { message: "Suggested data cannot be empty." }),
  isNewItemSuggestion: z.boolean(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional().nullable(),
}).refine(data => !(data.isNewItemSuggestion && data.entityId), {
  message: "entityId should not be provided for new item suggestions.",
  path: ["entityId"],
}).refine(data => !(!data.isNewItemSuggestion && !data.entityId), {
  message: "entityId is required for existing item suggestions.",
  path: ["entityId"],
});


// Zod schema for validating PUT request body
const suggestionPutBodySchema = z.object({
  suggestionId: z.string().uuid(),
  action: z.enum(['approve', 'deny', 'update_data']),
  updatedSuggestedData: z.record(z.any()).optional(), // Only required for 'update_data' action
}).refine(data => !(data.action === 'update_data' && !data.updatedSuggestedData), {
  message: "updatedSuggestedData is required when action is 'update_data'.",
  path: ["updatedSuggestedData"],
});


export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try { 
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw AppError.unauthorized();
    
    const rawJson = await request.json();
    const validationResult = suggestionPostBodySchema.safeParse(rawJson);

    if (!validationResult.success) {
      console.error("Suggestion POST validation error:", validationResult.error.format());
      throw AppError.validationError('Invalid suggestion data provided.', validationResult.error.format());
    }
    const suggestionDataFromClient = validationResult.data;
    
    let processedSuggestedData = { ...suggestionDataFromClient.suggestedData };
    
    // Ensure tags are stringified if present as array (forms might send array)
    if (processedSuggestedData && typeof (processedSuggestedData as any).tags !== 'undefined' && Array.isArray((processedSuggestedData as any).tags)) {
        (processedSuggestedData as any).tags = transformTagsArrayToString((processedSuggestedData as any).tags);
    }

    const newSuggestionForDb: Database['public']['Tables']['suggestions']['Insert'] = {
      entity_type: suggestionDataFromClient.entityType as SupabaseEnums<'entity_enum_type'>,
      entity_id: suggestionDataFromClient.entityId || null,
      suggested_data: processedSuggestedData as any, 
      is_new_item_suggestion: suggestionDataFromClient.isNewItemSuggestion,
      notes: suggestionDataFromClient.notes || null,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email || 'Anonymous User',
      status: 'pending', 
      timestamp: new Date().toISOString(), 
    };

    const { data: insertedSuggestion, error: insertError } = await supabase
      .from('suggestions')
      .insert(newSuggestionForDb)
      .select('*') 
      .single();

    if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to insert suggestion.");
    if (!insertedSuggestion) throw AppError.serverError("Suggestion created but not returned.", 'DB_INSERT_FAILED');
    
    return NextResponse.json(insertedSuggestion, { status: 201 });

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('--- UNHANDLED ERROR IN /api/suggestions POST ---', error);
    return createErrorResponse('A critical server error occurred while submitting suggestion.', 500);
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw AppError.unauthorized();
    
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile || !profile.is_admin) throw AppError.forbidden();

    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw AppError.fromSupabaseError(error, "Failed to fetch suggestions.");
    return NextResponse.json(data);

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error("Error fetching suggestions for admin (GET /api/suggestions):", error);
    return createErrorResponse('Failed to fetch suggestions', 500);
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore); 

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw AppError.unauthorized();
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile || !profile.is_admin) throw AppError.forbidden("Admin access required for processing suggestions");

    const rawJson = await request.json();
    const validationResult = suggestionPutBodySchema.safeParse(rawJson);
    if (!validationResult.success) {
      console.error("Suggestion PUT validation error:", validationResult.error.format());
      throw AppError.validationError('Invalid request body for suggestion update.', validationResult.error.format());
    }
    const { suggestionId, action, updatedSuggestedData } = validationResult.data;
    
    if (action === 'update_data') {
        if (!updatedSuggestedData) throw AppError.badRequest('Missing updatedSuggestedData for update_data action');
        
        let processedDataForUpdate = { ...updatedSuggestedData };
        if (processedDataForUpdate && typeof (processedDataForUpdate as any).tags !== 'undefined' && Array.isArray((processedDataForUpdate as any).tags)) {
            (processedDataForUpdate as any).tags = transformTagsArrayToString((processedDataForUpdate as any).tags);
        }

        const { data: updatedSuggestionRow, error: updateDataError } = await supabase
            .from('suggestions')
            .update({ suggested_data: processedDataForUpdate as any, timestamp: new Date().toISOString() }) 
            .eq('id', suggestionId)
            .select('*') 
            .single();
        if (updateDataError) throw AppError.fromSupabaseError(updateDataError, "Failed to update suggestion data.");
        if (!updatedSuggestionRow) throw AppError.serverError("Suggestion updated but not returned.", 'DB_UPDATE_FAILED');
        return NextResponse.json(updatedSuggestionRow);
    }

    const { data: suggestion, error: fetchError } = await supabase.from('suggestions').select('*').eq('id', suggestionId).single();
    if (fetchError) throw AppError.fromSupabaseError(fetchError, `Failed to fetch suggestion ID: ${suggestionId}.`);
    if (!suggestion) throw AppError.notFound('Suggestion');
    
    if (action === 'approve') {
      if (!suggestion.suggested_data || (typeof suggestion.suggested_data !== 'object') || (Object.keys(suggestion.suggested_data).length === 0)) {
        throw AppError.badRequest('Cannot approve: suggested data is missing or invalid.');
      }

      const entityType = suggestion.entity_type as EntityType;
      const entityId = suggestion.entity_id;
      const isNewItem = suggestion.is_new_item_suggestion;
      
      // Ensure tags in suggested_data are strings if the handlers expect strings
      let formValues = { ...(suggestion.suggested_data as any) };
      if (formValues.tags && Array.isArray(formValues.tags)) {
          formValues.tags = transformTagsArrayToString(formValues.tags);
      }
      
      let approvedEntity;
      let finalUpdatedEntityId = entityId;

      switch (entityType) {
        case 'politician':
          approvedEntity = isNewItem
            ? await handleCreatePolitician(formValues as PoliticianFormValues, supabase)
            : await handleUpdatePolitician(entityId!, formValues as PoliticianFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = approvedEntity.id;
          break;
        case 'party':
          approvedEntity = isNewItem
            ? await handleCreateParty(formValues as PartyFormValues, supabase)
            : await handleUpdateParty(entityId!, formValues as PartyFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = approvedEntity.id;
          break;
        case 'promise':
          approvedEntity = isNewItem
            ? await handleCreatePromise(formValues as PromiseFormValues, supabase)
            : await handleUpdatePromise(entityId!, formValues as PromiseFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = approvedEntity.id;
          break;
        case 'bill':
          approvedEntity = isNewItem
            ? await handleCreateBill(formValues as BillFormValues, supabase)
            : await handleUpdateBill(entityId!, formValues as BillFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = approvedEntity.id;
          break;
        default:
            throw AppError.badRequest(`Approval for entity type '${entityType}' not implemented.`);
      }
      
      const updateSuggestionPayload: Partial<Database['public']['Tables']['suggestions']['Row']> = {
        status: 'approved', timestamp: new Date().toISOString(),
      };
      if (isNewItem && finalUpdatedEntityId) {
        updateSuggestionPayload.entity_id = finalUpdatedEntityId;
      }
      
      const { data: finalSugg, error: suggStatusError } = await supabase.from('suggestions').update(updateSuggestionPayload).eq('id', suggestionId).select().single();
      if (suggStatusError) throw AppError.fromSupabaseError(suggStatusError, `Entity updated, but failed to update suggestion status for ${suggestionId}.`);
      if (!finalSugg) throw AppError.serverError("Suggestion status updated but not returned.", 'DB_UPDATE_FAILED');
      return NextResponse.json({ message: "Suggestion approved and entity updated.", suggestion: finalSugg, entity: approvedEntity });

    } else if (action === 'deny') {
        const { data: deniedSugg, error: denyError } = await supabase.from('suggestions').update({ status: 'denied', timestamp: new Date().toISOString() }).eq('id', suggestionId).select().single();
        if (denyError) throw AppError.fromSupabaseError(denyError, "Failed to deny suggestion.");
        if (!deniedSugg) throw AppError.serverError("Suggestion denied but not returned.", 'DB_UPDATE_FAILED');
        return NextResponse.json({ message: "Suggestion denied.", suggestion: deniedSugg});
    }
    
    throw AppError.badRequest('Invalid action specified.');

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('--- UNHANDLED ERROR IN /api/suggestions PUT ---', error);
    return createErrorResponse('A critical server error occurred while processing suggestion.', 500);
  }
}
