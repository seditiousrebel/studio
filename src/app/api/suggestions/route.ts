import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EntityType, PoliticianFormValues, PartyFormValues, PromiseFormValues, BillFormValues } from '@/types'; // Removed EditSuggestion as it's less relevant now
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
// Schemas from components might need review if they assume suggestion-specific fields not in pending_edits
// import { politicianFormSchema } from '@/components/admin/politician-form';
// import { partyFormSchema } from '@/components/admin/party-form';
// import { promiseFormSchema } from '@/components/admin/promise-form';
// import { billFormSchema } from '@/components/admin/bill-form';

// Zod schema for validating POST request body for pending_edits
const pendingEditPostBodySchema = z.object({
  entityType: z.enum(['politician', 'party', 'promise', 'bill']),
  // entityId is string from client, will be converted to number for DB.
  // It's optional for new items.
  entityId: z.string().optional().nullable(), 
  suggestedData: z.record(z.any()).refine(data => Object.keys(data).length > 0, { message: "Suggested data cannot be empty." }),
  // isNewItemSuggestion helps determine if entityId should be null, not stored directly.
  isNewItemSuggestion: z.boolean(), 
  notes: z.string().max(1000, "Notes (change_reason) cannot exceed 1000 characters.").optional().nullable(), // Max length from DB
}).refine(data => !(data.isNewItemSuggestion && data.entityId), {
  message: "entityId should not be provided for new item suggestions.",
  path: ["entityId"],
}).refine(data => !(!data.isNewItemSuggestion && !data.entityId), {
  message: "entityId is required for existing item suggestions.",
  path: ["entityId"],
});


// Zod schema for validating PUT request body for pending_edits
const pendingEditPutBodySchema = z.object({
  // pendingEditId (formerly suggestionId) is a number in DB, but client might send string.
  // For now, allow string and parse, though ideally client sends number or numeric string.
  pendingEditId: z.string(), // Keeping as string as per original schema, will parse to Number for DB.
  action: z.enum(['approve', 'deny', 'update_data']), // 'update_data' might need rethink for pending_edits
  updatedSuggestedData: z.record(z.any()).optional(), 
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
    const validationResult = pendingEditPostBodySchema.safeParse(rawJson);

    if (!validationResult.success) {
      console.error("Pending Edit POST validation error:", validationResult.error.format());
      throw AppError.validationError('Invalid pending edit data provided.', validationResult.error.format());
    }
    const pendingEditDataFromClient = validationResult.data;
    
    let processedSuggestedData = { ...pendingEditDataFromClient.suggestedData };
    
    if (processedSuggestedData && typeof (processedSuggestedData as any).tags !== 'undefined' && Array.isArray((processedSuggestedData as any).tags)) {
        (processedSuggestedData as any).tags = transformTagsArrayToString((processedSuggestedData as any).tags);
    }

    let entityIdAsNumber: number | null = null;
    if (pendingEditDataFromClient.entityId) {
      entityIdAsNumber = Number(pendingEditDataFromClient.entityId);
      if (isNaN(entityIdAsNumber)) {
        throw AppError.validationError('Invalid entityId format. Must be a number or a string coercible to a number.', { entityId: 'Must be numeric' });
      }
    }
    
    // If it's a new item suggestion, entityId must be null.
    // The refine checks in Zod already handle the logic that if isNewItemSuggestion is true, entityId should be null.
    // So, if isNewItemSuggestion is true, entityIdFromClient will be null/undefined.
    // If isNewItemSuggestion is false, entityIdFromClient must be provided.
    if (pendingEditDataFromClient.isNewItemSuggestion && entityIdAsNumber !== null) {
        // This case should ideally be caught by Zod, but as a safeguard:
        throw AppError.validationError('entityId must be null for new item suggestions.');
    }


    const newPendingEditForDb: Omit<Database['public']['Tables']['pending_edits']['Insert'], 'id' | 'created_at' | 'updated_at'> & { created_at?: string, updated_at?: string } = {
      entity_type: pendingEditDataFromClient.entityType as SupabaseEnums<'entity_enum_type'>,
      // Use entityIdAsNumber, which is null if original entityId was null/undefined or if isNewItemSuggestion was true
      entity_id: pendingEditDataFromClient.isNewItemSuggestion ? null : entityIdAsNumber, 
      proposed_data: processedSuggestedData as any, 
      change_reason: pendingEditDataFromClient.notes || null,
      proposer_id: user.id,
      status: 'Pending' as Database["public"]["Enums"]["edit_status"], // Match enum
      // created_at and updated_at will be set by default in DB or use DB functions if defined
      // Forcing them here as per requirements:
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedPendingEdit, error: insertError } = await supabase
      .from('pending_edits') // Changed from 'suggestions'
      .insert(newPendingEditForDb)
      .select('*') 
      .single();

    if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to insert pending edit.");
    if (!insertedPendingEdit) throw AppError.serverError("Pending edit created but not returned.", 'DB_INSERT_FAILED');
    
    return NextResponse.json(insertedPendingEdit, { status: 201 });

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('--- UNHANDLED ERROR IN /api/suggestions POST (now pending_edits) ---', error);
    return createErrorResponse('A critical server error occurred while submitting pending edit.', 500);
  }
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw AppError.unauthorized();
    
    // Changed from 'profiles' to 'users' and 'is_admin' to 'role'
    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userProfile || userProfile.role !== 'Admin') throw AppError.forbidden("Admin access required.");

    const { data, error } = await supabase
      .from('pending_edits') // Changed from 'suggestions'
      .select('*')
      .order('created_at', { ascending: false }); // Assuming 'created_at' is the preferred sort field

    if (error) throw AppError.fromSupabaseError(error, "Failed to fetch pending edits.");
    return NextResponse.json(data);

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error("Error fetching pending_edits for admin (GET /api/suggestions):", error);
    return createErrorResponse('Failed to fetch pending edits', 500);
  }
}

export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore); 

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw AppError.unauthorized();

    // Changed from 'profiles' to 'users' and 'is_admin' to 'role'
    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!userProfile || userProfile.role !== 'Admin') throw AppError.forbidden("Admin access required for processing pending edits.");

    const rawJson = await request.json();
    const validationResult = pendingEditPutBodySchema.safeParse(rawJson);
    if (!validationResult.success) {
      console.error("Pending Edit PUT validation error:", validationResult.error.format());
      throw AppError.validationError('Invalid request body for pending edit update.', validationResult.error.format());
    }
    const { pendingEditId: pendingEditIdString, action, updatedSuggestedData } = validationResult.data;

    const pendingEditId = Number(pendingEditIdString);
    if (isNaN(pendingEditId)) {
        throw AppError.validationError("Invalid pendingEditId format. Must be a string coercible to an integer.", { pendingEditId: "Must be numeric string"});
    }
    
    if (action === 'update_data') {
        if (!updatedSuggestedData) throw AppError.badRequest('Missing updatedSuggestedData for update_data action');
        
        let processedDataForUpdate = { ...updatedSuggestedData };
        if (processedDataForUpdate && typeof (processedDataForUpdate as any).tags !== 'undefined' && Array.isArray((processedDataForUpdate as any).tags)) {
            (processedDataForUpdate as any).tags = transformTagsArrayToString((processedDataForUpdate as any).tags);
        }

        const { data: updatedPendingEditRow, error: updateDataError } = await supabase
            .from('pending_edits') // Changed from 'suggestions'
            .update({ 
                proposed_data: processedDataForUpdate as any, 
                updated_at: new Date().toISOString() // Changed from 'timestamp'
            }) 
            .eq('id', pendingEditId) // Used Number(pendingEditIdString)
            .select('*') 
            .single();
        if (updateDataError) throw AppError.fromSupabaseError(updateDataError, "Failed to update pending edit data.");
        if (!updatedPendingEditRow) throw AppError.serverError("Pending edit updated but not returned.", 'DB_UPDATE_FAILED');
        return NextResponse.json(updatedPendingEditRow);
    }

    // Fetch the existing pending edit
    const { data: pendingEdit, error: fetchError } = await supabase
        .from('pending_edits') // Changed from 'suggestions'
        .select('*')
        .eq('id', pendingEditId) // Used Number(pendingEditIdString)
        .single();

    if (fetchError) throw AppError.fromSupabaseError(fetchError, `Failed to fetch pending edit ID: ${pendingEditId}.`);
    if (!pendingEdit) throw AppError.notFound('PendingEdit');
    
    if (action === 'approve') {
      if (!pendingEdit.proposed_data || (typeof pendingEdit.proposed_data !== 'object') || (Object.keys(pendingEdit.proposed_data).length === 0)) {
        throw AppError.badRequest('Cannot approve: proposed data is missing or invalid.');
      }

      const entityType = pendingEdit.entity_type as EntityType; // entity_type is already correct enum from DB
      const entityId = pendingEdit.entity_id; // This is a number | null from DB
      const isNewItem = !pendingEdit.entity_id; // Derived from entity_id
      
      let formValues = { ...(pendingEdit.proposed_data as any) };
      if (formValues.tags && Array.isArray(formValues.tags)) {
          formValues.tags = transformTagsArrayToString(formValues.tags);
      }
      
      let approvedEntity;
      let finalUpdatedEntityId = entityId; // This will be number | null

      // ID for entities is expected to be number by these handlers.
      // Ensure entityId is number if not null. It already is from DB.
      const currentEntityIdAsNumber = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;
      if (typeof entityId === 'string' && isNaN(currentEntityIdAsNumber as number)) {
        throw AppError.serverError(`Invalid entity_id format in pending_edit ${pendingEdit.id}. Expected number or null.`, 'DB_DATA_CORRUPTION');
      }


      switch (entityType) {
        case 'politician':
          approvedEntity = isNewItem
            ? await handleCreatePolitician(formValues as PoliticianFormValues, supabase)
            : await handleUpdatePolitician(currentEntityIdAsNumber!, formValues as PoliticianFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = Number(approvedEntity.id);
          break;
        case 'party':
          approvedEntity = isNewItem
            ? await handleCreateParty(formValues as PartyFormValues, supabase)
            : await handleUpdateParty(currentEntityIdAsNumber!, formValues as PartyFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = Number(approvedEntity.id);
          break;
        case 'promise':
          approvedEntity = isNewItem
            ? await handleCreatePromise(formValues as PromiseFormValues, supabase)
            : await handleUpdatePromise(currentEntityIdAsNumber!, formValues as PromiseFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = Number(approvedEntity.id);
          break;
        case 'bill':
          approvedEntity = isNewItem
            ? await handleCreateBill(formValues as BillFormValues, supabase)
            : await handleUpdateBill(currentEntityIdAsNumber!, formValues as BillFormValues, supabase);
          if (isNewItem && approvedEntity?.id) finalUpdatedEntityId = Number(approvedEntity.id);
          break;
        default:
            throw AppError.badRequest(`Approval for entity type '${entityType}' not implemented.`);
      }
      
      const updatePendingEditPayload: Partial<Database['public']['Tables']['pending_edits']['Row']> = {
        status: 'Approved' as Database["public"]["Enums"]["edit_status"], // Match enum
        updated_at: new Date().toISOString(), // Changed from 'timestamp'
      };
      if (isNewItem && finalUpdatedEntityId !== null) { // finalUpdatedEntityId is now number | null
        updatePendingEditPayload.entity_id = finalUpdatedEntityId;
      }
      
      const { data: finalEdit, error: editStatusError } = await supabase
        .from('pending_edits') // Changed from 'suggestions'
        .update(updatePendingEditPayload)
        .eq('id', pendingEditId) // Used Number(pendingEditIdString)
        .select()
        .single();

      if (editStatusError) throw AppError.fromSupabaseError(editStatusError, `Entity updated, but failed to update pending edit status for ${pendingEditId}.`);
      if (!finalEdit) throw AppError.serverError("Pending edit status updated but not returned.", 'DB_UPDATE_FAILED');
      return NextResponse.json({ message: "Pending edit approved and entity updated.", pendingEdit: finalEdit, entity: approvedEntity });

    } else if (action === 'deny') {
        const { data: deniedEdit, error: denyError } = await supabase
            .from('pending_edits') // Changed from 'suggestions'
            .update({ 
                status: 'Denied' as Database["public"]["Enums"]["edit_status"], // Match enum
                updated_at: new Date().toISOString() // Changed from 'timestamp'
            })
            .eq('id', pendingEditId) // Used Number(pendingEditIdString)
            .select()
            .single();
        if (denyError) throw AppError.fromSupabaseError(denyError, "Failed to deny pending edit.");
        if (!deniedEdit) throw AppError.serverError("Pending edit denied but not returned.", 'DB_UPDATE_FAILED');
        return NextResponse.json({ message: "Pending edit denied.", pendingEdit: deniedEdit});
    }
    
    throw AppError.badRequest('Invalid action specified.');

  } catch (error: any) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.details, error.code);
    }
    console.error('--- UNHANDLED ERROR IN /api/suggestions PUT (now pending_edits) ---', error);
    return createErrorResponse('A critical server error occurred while processing pending edit.', 500);
  }
}
