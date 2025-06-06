// src/lib/data-fetcher.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { EntityType, Politician, Party, UserPromise, Bill, Tag } from '@/types'; // Added Tag
import { transformSupabasePoliticianToAppPolitician } from '@/lib/data/politician-data';
import { transformSupabasePartyToAppParty } from '@/app/api/parties/route'; 
import { transformSupabasePromiseToApp } from '@/app/api/promises/route'; 
import { transformSupabaseBillToApp } from '@/lib/data/bill-data';
import { AppError } from './error-handling';

type EntityMap = {
  politician: Politician;
  party: Party;
  promise: UserPromise;
  bill: Bill;
};

const typeEnumMap = {
    politician: 'Politician',
    party: 'Party',
    promise: 'Promise',
    bill: 'LegislativeBill' 
} as const;

function getTableName(entityType: EntityType): keyof Database['public']['Tables'] {
  switch (entityType) {
    case 'politician': return 'politicians';
    case 'party': return 'parties';
    case 'promise': return 'promises';
    case 'bill': return 'legislative_bills';
    default: throw new AppError(`Invalid entity type for table name: ${entityType}`, 500, 'INVALID_ENTITY_TYPE');
  }
}

function getSelectString(entityType: EntityType, includeRelations: boolean = true): string {
  if (!includeRelations) return '*';
  // Tags (entity_tags) are now fetched separately in fetchEntityData
  switch (entityType) {
    case 'politician':
      return `*, 
              party_memberships(is_active, party_id, party:parties!inner(id, name, logo_asset_id, logo_details:media_assets!parties_logo_asset_id_fkey(storage_path))),
              politician_career_entries (*), 
              promises:promises!politician_id(id, title, status, due_date, created_at) 
              `;
    case 'party':
      return `*, 
              chairperson_details:politicians!parties_chairperson_id_fkey (id, name, photo_details:media_assets!politicians_photo_asset_id_fkey(storage_path)), 
              logo_details:media_assets!parties_logo_asset_id_fkey(storage_path),
              election_symbol_details:media_assets!parties_election_symbol_asset_id_fkey(storage_path),
              party_election_results (*)
              `;
    case 'promise':
      return `*, 
              politician:politicians!promises_politician_id_fkey(
                  id, 
                  name, 
                  photo_details:media_assets!politicians_photo_asset_id_fkey(storage_path), 
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
              )
              `;
    case 'bill':
      return `*`; 
    default: throw new AppError(`Invalid entity type for select string: ${entityType}`, 500, 'INVALID_ENTITY_TYPE');
  }
}

function applyFilters(query: any, filters: Record<string, any>, entityType: EntityType): any {
  let newQuery = query;
  for (const key in filters) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      if (key === 'category' && entityType === 'promise') {
        console.warn("Attempted to filter promises by 'category', but this column does not exist. Skipping filter.");
        continue; 
      }
      if (key === 'tag' && (entityType === 'politician' || entityType === 'party' || entityType === 'promise' || entityType === 'bill')) {
        console.warn(`Filtering by tag for ${entityType} is not currently supported by this fetch method as tags are fetched separately. Filter ignored.`);
        continue;
      }

      if (key === 'searchTerm') {
         const searchField = filters.searchField || (entityType === 'politician' || entityType === 'party' ? 'name' : 'title');
         newQuery = newQuery.ilike(searchField, `%${filters[key]}%`);
      } else if (key === 'isFeatured') {
        console.warn(`Filtering by 'isFeatured' directly on entity tables is not supported in 'applyFilters'. Use the 'featured_content' table to determine featured items. Skipping 'isFeatured' filter for entityType '${entityType}'.`);
        // No query modification, effectively skipping the filter.
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

    // Removed entity_tags.entity_type filter from main query as tags are fetched separately.

    if (options.id) {
      query = query.eq('id', options.id);
    }

    if (options.filters) {
      query = applyFilters(query, options.filters, entityType);
    }

    if (options.sortBy) {
      let actualField = options.sortBy.field;
      if (entityType === 'promise' && options.sortBy.field === 'category') {
        console.warn("Attempted to sort promises by 'category', but this column does not exist. Skipping sort criteria.");
      } else {
        if (entityType === 'bill' && options.sortBy.field === 'proposalDate') actualField = 'introduced_date';
        if (entityType === 'promise' && options.sortBy.field === 'dateAdded') actualField = 'created_at';
        if (entityType === 'party' && options.sortBy.field === 'foundingDate') actualField = 'founding_date';
        // START OF REVISED RATING SORT LOGIC
        if (options.sortBy.field === 'rating') {
          if (entityType === 'party') {
            console.warn("Sorting parties by 'rating' is not currently supported at the database level as 'upvotes' column doesn't exist. Defaulting to sort by 'name'.");
            actualField = 'name'; 
          } else if (entityType === 'politician') {
            console.warn("Sorting politicians by 'rating' is not directly supported by this field in 'fetchEntityData'. Defaulting to sort by 'name'. Consider using 'politician_ratings' table for sorting.");
            actualField = 'name';
          } else {
            console.warn(`Sorting by 'rating' for entityType '${entityType}' using 'upvotes' field is not generically supported. Defaulting to sort by primary key or 'name' if available.`);
            actualField = 'id'; // Or 'name' if 'name' is guaranteed. 'id' is safest.
          }
        }
        // END OF REVISED RATING SORT LOGIC
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

    let { data: rawData, error: dbError, count } = options.id 
        ? await query.single() 
        : await query;

    if (dbError) {
      if (dbError.code === 'PGRST116' && options.id) { 
        throw AppError.notFound(`${entityType}`);
      }
      console.error(`Supabase error fetching ${entityType}:`, dbError);
      throw new AppError(dbError.message, 500, dbError.code, dbError.details);
    }

    // Fetch and attach tags separately
    if (rawData && options.includeRelations && (entityType === 'politician' || entityType === 'party' || entityType === 'promise' || entityType === 'bill')) {
        const entityIds = Array.isArray(rawData) ? rawData.map(e => (e as any).id) : [(rawData as any).id];
        
        if (entityIds.length > 0) {
            const { data: tagsData, error: tagsError } = await supabase
                .from('entity_tags')
                .select('entity_id, tag:tags!inner(id, name, created_at)')
                .eq('entity_type', typeEnumMap[entityType])
                .in('entity_id', entityIds);

            if (tagsError) {
                console.error(`Error fetching tags for ${entityType}:`, tagsError);
            } else if (tagsData) {
                const tagsMap = new Map<string | number, Tag[]>();
                for (const record of tagsData) {
                    if (record.tag) {
                        if (!tagsMap.has(record.entity_id)) {
                            tagsMap.set(record.entity_id, []);
                        }
                        const appTag: Tag = {
                            id: record.tag.id.toString(),
                            name: record.tag.name,
                            created_at: record.tag.created_at || undefined,
                        };
                        tagsMap.get(record.entity_id)!.push(appTag);
                    }
                }
                
                if (Array.isArray(rawData)) {
                    rawData.forEach(e => (e as any).fetched_tags = tagsMap.get((e as any).id) || []);
                } else {
                    (rawData as any).fetched_tags = tagsMap.get((rawData as any).id) || [];
                }
            }
        }
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
