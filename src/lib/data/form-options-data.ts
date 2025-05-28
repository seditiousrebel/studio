
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


export async function getExistingTags(supabase: SupabaseClient<Database>, joinTable: 'politician_tags' | 'party_tags' | 'promise_tags' | 'bill_tags'): Promise<string[]> {
  const { data, error } = await supabase.from(joinTable).select('tags(name)');
  if (error) {
    console.error(`Error fetching existing tags from ${joinTable}:`, error);
    return [];
  }
  if (!data) return [];
  return Array.from(new Set(data.map((item: any) => item.tags?.name).filter(Boolean) as string[])).sort();
}

export async function getExistingPromiseCategories(supabase: SupabaseClient<Database>): Promise<string[]> {
    const { data, error } = await supabase.from('promises').select('category').neq('category', '').is('category', null);
    if (error) {
        console.error("Error fetching promise categories:", error);
        return [];
    }
    if (!data) return [];
    return Array.from(new Set(data.map(p => p.category).filter(Boolean) as string[])).sort();
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
