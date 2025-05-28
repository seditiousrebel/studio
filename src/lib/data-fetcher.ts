
// src/lib/data-fetcher.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { EntityType, Politician, Party, UserPromise, Bill } from '@/types';
import { transformSupabasePoliticianToAppPolitician } from '@/lib/data/politician-data';
import { transformSupabasePartyToAppParty } from '@/app/api/parties/route'; // Corrected: Assuming it's exported
import { transformSupabasePromiseToApp } from '@/app/api/promises/route'; // Assuming it's exported
import { transformSupabaseBillToApp } from '@/lib/data/bill-data';
import { AppError } from './error-handling';

type EntityMap = {
  politician: Politician;
  party: Party;
  promise: UserPromise;
  bill: Bill;
};

function getTableName(entityType: EntityType): keyof Database['public']['Tables'] {
  switch (entityType) {
    case 'politician': return 'politicians';
    case 'party': return 'parties';
    case 'promise': return 'promises';
    case 'bill': return 'bills';
    default: throw new AppError(`Invalid entity type for table name: ${entityType}`, 500, 'INVALID_ENTITY_TYPE');
  }
}

function getSelectString(entityType: EntityType, includeRelations: boolean = true): string {
  if (!includeRelations) return '*';
  switch (entityType) {
    case 'politician':
      return `*, 
              party_details:parties!politicians_party_id_fkey (id, name, logo_url), 
              politician_tags (tags (id, name, created_at)), 
              political_career_entries (*), 
              asset_declarations (*, asset_declaration_sources (*)), 
              criminal_record_entries (*, criminal_record_sources (*)), 
              social_media_links (*),
              promises:promises!politician_id(id, title, status, category, deadline, date_added),
              directly_sponsored_bills:bills!sponsor_politician_id(id, title, status, proposal_date, registration_number)
              `;
    case 'party':
      // For Party detail, we often need member politicians, platform promises, member promises, bills by party, bills by members.
      // These are complex and might be better fetched in separate queries or through dedicated views for performance.
      // The current select focuses on direct relations for list/card views.
      return `*, 
              chairperson_details:politicians!fk_parties_chairperson_id (id, name, image_url), 
              party_tags (tags (id, name, created_at)), 
              election_history_entries (*), 
              party_controversies (*, party_controversy_sources (*))
              `;
    case 'promise':
      return `*, 
              politicians!politician_id (id, name, image_url, party_id, party_details:parties!politicians_party_id_fkey (id, name, logo_url)), 
              parties!party_id (id, name, logo_url), 
              promise_tags (tags (id, name, created_at))`;
    case 'bill':
      return `*, 
              politicians!sponsor_politician_id (id, name, image_url, party_id, party_details:parties!politicians_party_id_fkey(id,name,logo_url)), 
              parties!sponsor_party_id (id, name, logo_url), 
              bill_tags (tags (id, name, created_at))`;
    default: throw new AppError(`Invalid entity type for select string: ${entityType}`, 500, 'INVALID_ENTITY_TYPE');
  }
}

// A simplified filter applicator. More complex filtering might need specific logic per entity.
function applyFilters(query: any, filters: Record<string, any>, entityType: EntityType): any {
  let newQuery = query;
  for (const key in filters) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      if (key === 'searchTerm') {
         const searchField = filters.searchField || (entityType === 'politician' || entityType === 'party' ? 'name' : 'title');
         newQuery = newQuery.ilike(searchField, `%${filters[key]}%`);
      } else if (key === 'isFeatured') {
         newQuery = newQuery.eq('is_featured', filters[key]);
      } else if (key === 'tag' && entityType === 'politician') {
         newQuery = newQuery.eq('politician_tags.tags.name', filters[key]);
      } else if (key === 'tag' && entityType === 'party') {
         newQuery = newQuery.eq('party_tags.tags.name', filters[key]);
      } else if (key === 'tag' && entityType === 'promise') {
         newQuery = newQuery.eq('promise_tags.tags.name', filters[key]);
      } else if (key === 'tag' && entityType === 'bill') {
         newQuery = newQuery.eq('bill_tags.tags.name', filters[key]);
      } else if (key === 'minAge' && entityType === 'politician') {
        const minAge = parseInt(filters[key], 10);
        if (!isNaN(minAge) && minAge > 0) {
          const latestBirthDate = new Date();
          latestBirthDate.setFullYear(latestBirthDate.getFullYear() - minAge);
          newQuery = newQuery.lte('date_of_birth', latestBirthDate.toISOString().split('T')[0]);
        }
      } else if (key === 'maxAge' && entityType === 'politician') {
        const maxAge = parseInt(filters[key], 10);
        if (!isNaN(maxAge) && maxAge > 0) {
          // To be AT MOST maxAge, their (maxAge+1)-th birthday must not have occurred yet.
          // So their birth date must be strictly after (Today - (maxAge+1) years).
          // Which means date_of_birth >= (Today - (maxAge+1) years + 1 day)
          const boundaryBirthDateForMaxAgePlusOne = new Date();
          boundaryBirthDateForMaxAgePlusOne.setFullYear(boundaryBirthDateForMaxAgePlusOne.getFullYear() - (maxAge + 1));
          boundaryBirthDateForMaxAgePlusOne.setDate(boundaryBirthDateForMaxAgePlusOne.getDate() + 1); // to make it inclusive for gte
          newQuery = newQuery.gte('date_of_birth', boundaryBirthDateForMaxAgePlusOne.toISOString().split('T')[0]);
        }
      } else if (key.endsWith('Id')) { // e.g. partyId -> party_id
         newQuery = newQuery.eq(key.replace(/Id$/, '_id'), filters[key]);
      } else {
         newQuery = newQuery.eq(key, filters[key]);
      }
    }
  }
  return newQuery;
}

function transformData(data: any, entityType: EntityType): any {
  if (!data) return null;
  const transformerMap = {
    politician: transformSupabasePoliticianToAppPolitician,
    party: transformSupabasePartyToAppParty,
    promise: transformSupabasePromiseToApp,
    bill: transformSupabaseBillToApp,
  };
  const transformer = transformerMap[entityType];
  if (!transformer) throw new AppError(`No transformer for entity type: ${entityType}`, 500, 'TRANSFORMATION_ERROR');
  
  if (Array.isArray(data)) {
    return data.map(item => transformer(item as any)); // Cast needed as raw types vary
  }
  return transformer(data as any); // Cast needed
}


interface FetchEntityDataOptions {
  id?: string;
  includeRelations?: boolean;
  filters?: Record<string, any>; // e.g., { searchTerm: '...', partyId: '...', isFeatured: true }
  page?: number;
  limit?: number;
  sortBy?: { field: string; order: 'asc' | 'desc' };
}

export async function fetchEntityData<T extends EntityType>(
  supabase: SupabaseClient<Database>,
  entityType: T,
  options: FetchEntityDataOptions = {}
): Promise<{ data: EntityMap[T] | EntityMap[T][] | null; count?: number | null; error: AppError | null }> {
  if (!supabase) {
    return { data: null, error: new AppError("Supabase client not provided to fetchEntityData", 500, "SUPABASE_CLIENT_MISSING") };
  }

  try {
    const tableName = getTableName(entityType);
    const selectString = getSelectString(entityType, options.includeRelations);
    
    let query = supabase.from(tableName).select(selectString, { count: options.id ? undefined : 'exact' });

    if (options.id) {
      query = query.eq('id', options.id);
    }

    if (options.filters) {
      query = applyFilters(query, options.filters, entityType);
    }

    if (options.sortBy) {
      let actualField = options.sortBy.field;
      // Handle specific field name mappings if necessary
      if (entityType === 'bill' && options.sortBy.field === 'proposalDate') actualField = 'proposal_date';
      if (entityType === 'promise' && options.sortBy.field === 'dateAdded') actualField = 'date_added';
      if (entityType === 'party' && options.sortBy.field === 'foundingDate') actualField = 'founding_date';
      if (options.sortBy.field === 'rating') actualField = 'upvotes'; // Example for sorting by rating via upvotes
      if (options.sortBy.field === 'age' && entityType === 'politician') actualField = 'date_of_birth'; // Sort by date_of_birth for age

      query = query.order(actualField, { 
        ascending: options.sortBy.order === 'asc',
        // For age, ascending age means descending birth date.
        nullsFirst: options.sortBy.field === 'age' ? (options.sortBy.order === 'desc') : undefined 
      });
    }

    if (options.page && options.limit && !options.id) {
      const from = (options.page - 1) * options.limit;
      const to = options.page * options.limit - 1;
      query = query.range(from, to);
    }

    const { data: rawData, error: dbError, count } = options.id 
        ? await query.single() 
        : await query;

    if (dbError) {
      if (dbError.code === 'PGRST116' && options.id) { // Single record not found
        throw AppError.notFound(`${entityType}`);
      }
      console.error(`Supabase error fetching ${entityType}:`, dbError);
      throw new AppError(dbError.message, 500, dbError.code, dbError.details);
    }

    return { data: transformData(rawData, entityType), count, error: null };

  } catch (error: any) {
    if (error instanceof AppError) {
      return { data: null, error };
    }
    console.error(`Unexpected error fetching ${entityType}:`, error);
    return { data: null, error: new AppError(error.message || `Failed to fetch ${entityType}`, 500, 'UNEXPECTED_FETCH_ERROR') };
  }
}

