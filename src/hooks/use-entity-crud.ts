
// src/hooks/use-entity-crud.ts
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { useToast } from '@/hooks/use-toast';
import type { EntityType, Politician, Party, UserPromise, Bill, EditSuggestion } from '@/types';
import type { PoliticianFormValues, PartyFormValues, PromiseFormValues, BillFormValues } from '@/types';
import { apiClient } from '@/lib/api-client';
import { AppError } from '@/lib/error-handling';
import { ROUTES } from '@/lib/routes';

type EntityDataTypeMap = {
  politician: Politician;
  party: Party;
  promise: UserPromise;
  bill: Bill;
};

type EntityFormValuesMap = {
  politician: PoliticianFormValues;
  party: PartyFormValues;
  promise: PromiseFormValues;
  bill: BillFormValues;
};

// Helper to get the correct API path from ROUTES.API
function getApiEntityPath(entityType: EntityType): keyof typeof ROUTES.API {
  switch (entityType) {
    case 'politician': return 'POLITICIANS';
    case 'party': return 'PARTIES';
    case 'promise': return 'PROMISES';
    case 'bill': return 'BILLS';
    default: throw new AppError(`Unsupported entity type for API path: ${entityType}`, 500);
  }
}
function getApiEntityDetailPath(entityType: EntityType): (id: string) => string {
     switch (entityType) {
    case 'politician': return ROUTES.API.POLITICIAN_DETAIL;
    case 'party': return ROUTES.API.PARTY_DETAIL;
    case 'promise': return ROUTES.API.PROMISE_DETAIL;
    case 'bill': return ROUTES.API.BILL_DETAIL;
    default: throw new AppError(`Unsupported entity type for API detail path: ${entityType}`, 500);
  }
}


export function useEntityCrud<T extends EntityType>(entityType: T) {
  const { isAdmin, user, session, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntity = useCallback(async (id: string): Promise<EntityDataTypeMap[T] | null> => {
    setIsLoading(true);
    try {
      const pathResolver = getApiEntityDetailPath(entityType);
      const entity = await apiClient.get<EntityDataTypeMap[T]>(pathResolver(id));
      return entity;
    } catch (error: any) {
      console.error(`Error fetching ${entityType} with ID ${id}:`, error);
      toast({
        title: `Error Fetching ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
        description: error instanceof AppError ? error.message : 'An unexpected error occurred.',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, toast]);

  const createOrSuggestEntity = useCallback(async (data: EntityFormValuesMap[T], currentPathname: string): Promise<EntityDataTypeMap[T] | null> => {
    if (!isAuthenticated) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      router.push(ROUTES.LOGIN + `?redirectTo=${currentPathname}`);
      return null;
    }
    setIsLoading(true);

    try {
      if (isAdmin && session) {
        const pathKey = getApiEntityPath(entityType);
        const newEntity = await apiClient.post<EntityDataTypeMap[T]>(ROUTES.API[pathKey], data);
        toast({ title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Created`, description: `"${(newEntity as any).name || (newEntity as any).title}" added successfully.` });
        return newEntity;
      } else {
        const suggestionPayload: Omit<EditSuggestion, 'id' | 'timestamp' | 'status' | 'created_at'> = {
          entityType,
          suggestedData: data as any, // Cast as data type might not align perfectly with EditSuggestion's union
          userId: user!.id,
          userName: user!.user_metadata?.full_name || user!.email,
          isNewItemSuggestion: true,
          notes: `User suggested new ${entityType}: ${(data as any).name || (data as any).title}`,
        };
        await apiClient.post(ROUTES.API.SUGGESTIONS, suggestionPayload);
        toast({ title: "Suggestion Submitted", description: `Your new ${entityType} suggestion has been submitted for review.` });
        return null;
      }
    } catch (error: any) {
      console.error(`Error creating/suggesting ${entityType}:`, error);
      toast({
        title: `Error Creating ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
        description: error instanceof AppError ? error.message : `Failed to create/suggest ${entityType}.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, isAdmin, user, session, toast, router, isAuthenticated]);

  const updateOrSuggestUpdate = useCallback(async (id: string, data: EntityFormValuesMap[T], originalNameOrTitle: string, currentPathname: string): Promise<EntityDataTypeMap[T] | null> => {
    if (!isAuthenticated) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      router.push(ROUTES.LOGIN + `?redirectTo=${currentPathname}`);
      return null;
    }
    setIsLoading(true);
    try {
      if (isAdmin && session) {
        const pathResolver = getApiEntityDetailPath(entityType);
        const updatedEntity = await apiClient.put<EntityDataTypeMap[T]>(pathResolver(id), data);
        toast({ title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Updated`, description: `"${(updatedEntity as any).name || (updatedEntity as any).title}" updated successfully.` });
        return updatedEntity;
      } else {
        const suggestionPayload: Omit<EditSuggestion, 'id' | 'timestamp' | 'status' | 'created_at'> = {
          entityType,
          entityId: id,
          suggestedData: data as any,
          userId: user!.id,
          userName: user!.user_metadata?.full_name || user!.email,
          isNewItemSuggestion: false,
          notes: `User suggested edits for ${entityType}: ${originalNameOrTitle || id}`,
        };
        await apiClient.post(ROUTES.API.SUGGESTIONS, suggestionPayload);
        toast({ title: "Suggestion Submitted", description: `Your edits for "${originalNameOrTitle}" have been submitted.` });
        return null;
      }
    } catch (error: any) {
      console.error(`Error updating/suggesting ${entityType} ${id}:`, error);
      toast({
        title: `Error Updating ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
        description: error instanceof AppError ? error.message : `Failed to update/suggest ${entityType}.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, isAdmin, user, session, toast, router, isAuthenticated]);
  
  const deleteEntity = useCallback(async (id: string): Promise<boolean> => {
    if (!isAdmin || !session) {
      toast({ title: "Forbidden", description: "Only admins can delete entities.", variant: "destructive" });
      return false;
    }
    setIsLoading(true);
    try {
      const pathResolver = getApiEntityDetailPath(entityType);
      await apiClient.delete(pathResolver(id));
      toast({ title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Deleted`, description: `Entity with ID ${id} has been deleted.` });
      return true;
    } catch (error: any) {
      console.error(`Error deleting ${entityType} ${id}:`, error);
      toast({
        title: `Error Deleting ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
        description: error instanceof AppError ? error.message : 'An unexpected error occurred.',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, isAdmin, session, toast]);

  return { isLoading, fetchEntity, createOrSuggestEntity, updateOrSuggestUpdate, deleteEntity };
}

    