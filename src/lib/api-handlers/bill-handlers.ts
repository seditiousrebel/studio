// src/lib/api-handlers/bill-handlers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { BillFormValues, Bill } from '@/types';
import { AppError } from '@/lib/error-handling';
import { billFormSchema } from '@/components/admin/bill-form';
import { fetchEntityData } from '@/lib/data-fetcher';
import { manageTags } from './entity-update-utils';

export async function handleGetBillById(billId: string, supabase: SupabaseClient<Database>): Promise<Bill> {
  const { data, error } = await fetchEntityData(supabase, 'bill', { id: billId, includeRelations: true });
  if (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') throw AppError.notFound('Bill');
    throw error;
  }
  if (!data || Array.isArray(data)) throw AppError.notFound('Bill');
  return data as Bill;
}

export async function handleCreateBill(
  formData: BillFormValues,
  supabase: SupabaseClient<Database>
): Promise<Bill> {
  const validationResult = billFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid bill data.", validationResult.error.format());
  }
  const {
    tags,
    registrationNumber,
    registrationDate,
    proposalDate,
    parliamentInfoUrl,
    sponsorPoliticianId,
    sponsorPartyId,
    dataAiHint,
    ...mainBillData
  } = validationResult.data;

  const billToInsert: Database['public']['Tables']['bills']['Insert'] = {
    ...mainBillData,
    registration_number: registrationNumber || null,
    registration_date: registrationDate || null,
    proposal_date: proposalDate || null,
    parliament_info_url: parliamentInfoUrl || null,
    sponsor_politician_id: sponsorPoliticianId || null,
    sponsor_party_id: sponsorPartyId || null,
    data_ai_hint: dataAiHint || null,
    is_featured: false, // Default to false
  };

  const { data: newBillDb, error: insertError } = await supabase
    .from('bills')
    .insert(billToInsert)
    .select('id')
    .single();

  if (insertError) throw AppError.fromSupabaseError(insertError, "Failed to create bill record.");
  if (!newBillDb) throw AppError.serverError("Failed to create bill or retrieve ID after insert.", 'DB_INSERT_FAILED');

  const billId = newBillDb.id;
  await manageTags(supabase, billId, tags, 'bill_tags', 'bill_id');

  return handleGetBillById(billId, supabase);
}

export async function handleUpdateBill(
  billId: string,
  formData: BillFormValues,
  supabase: SupabaseClient<Database>
): Promise<Bill> {
  const validationResult = billFormSchema.safeParse(formData);
  if (!validationResult.success) {
    throw AppError.validationError("Invalid bill data.", validationResult.error.format());
  }
  const {
    tags,
    registrationNumber,
    registrationDate,
    proposalDate,
    parliamentInfoUrl,
    sponsorPoliticianId,
    sponsorPartyId,
    dataAiHint,
    ...mainBillData
  } = validationResult.data;

  const billToUpdate: Partial<Database['public']['Tables']['bills']['Update']> = {
    ...mainBillData,
    registration_number: registrationNumber || null,
    registration_date: registrationDate || null,
    proposal_date: proposalDate || null,
    parliament_info_url: parliamentInfoUrl || null,
    sponsor_politician_id: sponsorPoliticianId || null,
    sponsor_party_id: sponsorPartyId || null,
    data_ai_hint: dataAiHint || null,
    is_featured: (formData as any).isFeatured || false, // isFeatured is not in BillFormValues but might be passed
    updated_at: new Date().toISOString(),
  };
  Object.keys(billToUpdate).forEach(key => billToUpdate[key as keyof typeof billToUpdate] === undefined && delete billToUpdate[key as keyof typeof billToUpdate]);


  const { error: updateError } = await supabase
    .from("bills")
    .update(billToUpdate)
    .eq("id", billId);

  if (updateError) throw AppError.fromSupabaseError(updateError, "Failed to update bill record.");

  await manageTags(supabase, billId, tags, 'bill_tags', 'bill_id');

  return handleGetBillById(billId, supabase);
}

export async function handleDeleteBill(billId: string, supabase: SupabaseClient<Database>): Promise<{ message: string }> {
  await supabase.from('bill_tags').delete().eq('bill_id', billId);
  await supabase.from('user_votes').delete().eq('item_id', billId).eq('item_type', 'bill');
  const { error: deleteError } = await supabase.from('bills').delete().eq('id', billId);
  if (deleteError) throw AppError.fromSupabaseError(deleteError, `Failed to delete bill ${billId}.`);
  return { message: `Bill ${billId} deleted successfully.` };
}
