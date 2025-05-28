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
              party_memberships(is_active, party_id, party:parties!inner(id, name, logo_asset_id, logo_details:media_assets!parties_logo_asset_id_fkey(storage_path))),
              entity_tags(tag_id, entity_type, tag:tags!inner(id, name, created_at)),
              political_career_entries (*), 
              asset_declarations (*, asset_declaration_sources (*)), 
              criminal_record_entries (*, criminal_record_sources (*)), 
              social_media_links (*),
              promises:promises!politician_id(id, title, status, deadline, date_added) 
              `; // Removed 'category' from promises join
    case 'party':
      return `*, 
              chairperson_details:politicians!parties_chairperson_id_fkey (id, name, image_url), 
              entity_tags(tag_id, entity_type, tag:tags!inner(id, name, created_at)),
              election_history_entries (*), 
              party_controversies (*, party_controversy_sources (*))
              `;
    case 'promise':
      // `*` selects all columns from promises table. If 'category' doesn't exist, it won't be selected.
      // No explicit 'category' was listed here for the main promise entity.
      return `*, 
              politician:politicians!promises_politician_id_fkey(
                  id, 
                  name, 
                  image_url, 
                  party_memberships(
                      is_active, 
                      party:parties!inner(
                          id, 
                          name, 
                          logo_asset_id, 
                          logo_details:media_assets!parties_logo_asset_id_fkey(storage_path)
                      )
                  )
              ), 
              party:parties!promises_party_id_fkey(
                  id, 
                  name, 
                  logo_asset_id, 
                  logo_details:media_assets!parties_logo_asset_id_fkey(storage_path)
              ), 
              entity_tags(tag_id, entity_type, tag:tags!inner(id, name, created_at))
              `;
    case 'bill':
      return `*, 
              parties!sponsor_party_id (id, name, logo_url), 
              entity_tags(tag_id, entity_type, tag:tags!inner(id, name, created_at))
              `; 
    default: throw new AppError(`Invalid entity type for select string: ${entityType}`, 500, 'INVALID_ENTITY_TYPE');
  }
}

// A simplified filter applicator. More complex filtering might need specific logic per entity.
function applyFilters(query: any, filters: Record<string, any>, entityType: EntityType): any {
  let newQuery = query;
  for (const key in filters) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      // Prevent filtering by 'category' for promises if it's passed in filters, as the column does not exist.
      if (key === 'category' && entityType === 'promise') {
        console.warn("Attempted to filter promises by 'category', but this column does not exist. Skipping filter.");
        continue; 
      }

      if (key === 'searchTerm') {
         const searchField = filters.searchField || (entityType === 'politician' || entityType === 'party' ? 'name' : 'title');
         newQuery = newQuery.ilike(searchField, `%${filters[key]}%`);
      } else if (key === 'isFeatured') {
         newQuery = newQuery.eq('is_featured', filters[key]);
      } else if (key === 'tag' && (entityType === 'politician' || entityType === 'party' || entityType === 'promise' || entityType === 'bill')) {
         newQuery = newQuery.eq('entity_tags.tag.name', filters[key]);
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
          const boundaryBirthDateForMaxAgePlusOne = new Date();
          boundaryBirthDateForMaxAgePlusOne.setFullYear(boundaryBirthDateForMaxAgePlusOne.getFullYear() - (maxAge + 1));
          boundaryBirthDateForMaxAgePlusOne.setDate(boundaryBirthDateForMaxAgePlusOne.getDate() + 1); 
          newQuery = newQuery.gte('date_of_birth', boundaryBirthDateForMaxAgePlusOne.toISOString().split('T')[0]);
        }
      } else if (key.endsWith('Id')) { 
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
    return data.map(item => transformer(item as any)); 
  }
  return transformer(data as any); 
}


interface FetchEntityDataOptions {
  id?: string;
  includeRelations?: boolean;
  filters?: Record<string, any>; 
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

    if (entityType === 'politician' || entityType === 'party' || entityType === 'promise' || entityType === 'bill') {
        const typeEnumMap = {
            politician: 'Politician',
            party: 'Party',
            promise: 'Promise',
            bill: 'LegislativeBill' 
        } as const; 
        query = query.eq('entity_tags.entity_type', typeEnumMap[entityType]);
    }


    if (options.id) {
      query = query.eq('id', options.id);
    }

    if (options.filters) {
      query = applyFilters(query, options.filters, entityType);
    }

    if (options.sortBy) {
      let actualField = options.sortBy.field;
      // Prevent sorting by 'category' for promises as the column does not exist.
      if (entityType === 'promise' && options.sortBy.field === 'category') {
        console.warn("Attempted to sort promises by 'category', but this column does not exist. Skipping sort criteria.");
        // Optionally, sort by a default field or remove sorting for this case
        // For now, it will just not apply this specific sort. If no other sorts, order is default.
      } else {
        if (entityType === 'bill' && options.sortBy.field === 'proposalDate') actualField = 'proposal_date';
        if (entityType === 'promise' && options.sortBy.field === 'dateAdded') actualField = 'date_added';
        if (entityType === 'party' && options.sortBy.field === 'foundingDate') actualField = 'founding_date';
        if (options.sortBy.field === 'rating') actualField = 'upvotes'; 
        if (options.sortBy.field === 'age' && entityType === 'politician') actualField = 'date_of_birth'; 

        query = query.order(actualField, { 
          ascending: options.sortBy.order === 'asc',
          nullsFirst: options.sortBy.field === 'age' ? (options.sortBy.order === 'desc') : undefined 
        });
      }
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
      if (dbError.code === 'PGRST116' && options.id) { 
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
