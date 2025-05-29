
// src/lib/data/form-options-data.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';

export async function getPartyOptions(supabase: SupabaseClient<Database>): Promise<SearchableSelectOption[]> {
  const { data, error } = await supabase.from('parties').select('id, name').order('name');
  if (error) {
    console.error("Error fetching party options:", error);
    return [];
  }
  return (data || []).map(p => ({ value: p.id, label: p.name }));
}

export async function getPoliticianOptions(supabase: SupabaseClient<Database>): Promise<SearchableSelectOption[]> {
    const { data, error } = await supabase.from('politicians').select('id, name').order('name');
    if (error) {
        console.error("Error fetching politician options for forms:", error);
        return [];
    }
    return (data || []).map(p => ({ value: p.id, label: p.name }));
}


export async function getExistingTags(supabase: SupabaseClient<Database>, entityType: 'Politician' | 'Party' | 'Promise' | 'LegislativeBill'): Promise<string[]> {
  const { data, error } = await supabase
    .from('entity_tags')
    .select('tag:tags!inner(name)') // Fetches the name from the related tags table
    .eq('entity_type', entityType);
  if (error) {
    console.error(`Error fetching existing tags for ${entityType}:`, error);
    return [];
  }
  if (!data) return [];
  return Array.from(new Set(data.map((item: any) => item.tag?.name).filter(Boolean) as string[])).sort();
}

export async function getExistingPromiseCategories(supabase: SupabaseClient<Database>): Promise<string[]> {
    // TODO: Re-evaluate promise categorization. The 'category' column does not exist on the 'promises' table.
    console.warn("getExistingPromiseCategories: 'category' column does not exist on 'promises' table. Returning empty array.");
    return [];
}

export async function getExistingBillMinistries(supabase: SupabaseClient<Database>): Promise<string[]> {
    const { data, error } = await supabase.from('bills').select('ministry').neq('ministry', '').is('ministry', null);
    if (error) {
        console.error("Error fetching bill ministries:", error);
        return [];
    }
    if (!data) return [];
    return Array.from(new Set(data.map(b => b.ministry).filter(Boolean) as string[])).sort();
}
