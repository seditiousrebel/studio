// src/components/admin/promises-admin-list-client.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserPromise } from '@/types';
import { Edit, ListChecks, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn, getPromiseStatusBadgeClass } from '@/lib/utils';
import { FEATURED_LIMITS, ROUTES } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEntityCrud } from '@/hooks/use-entity-crud';
import { apiClient } from '@/lib/api-client';

interface PromisesAdminListClientProps {
  initialPromises: UserPromise[];
  fetchError?: string | null;
}

export function PromisesAdminListClient({ 
  initialPromises, 
  fetchError,
}: PromisesAdminListClientProps) {
  const router = useRouter();
  const [promises, setPromises] = useState<UserPromise[]>(initialPromises || []);
  const { isLoading: isDeleting, deleteEntity } = useEntityCrud('promise');
  const [isLoadingAction, setIsLoadingAction] = useState(false); // For toggle feature
  const { toast } = useToast();

  useEffect(() => {
    setPromises(initialPromises || []);
  }, [initialPromises]);

  const handleToggleFeatured = async (promiseId: string, currentPromise: UserPromise, newFeaturedStatus: boolean) => {
    const currentFeaturedCount = promises.filter(p => p.isFeatured).length;

    if (newFeaturedStatus && currentFeaturedCount >= FEATURED_LIMITS.promises && !currentPromise.isFeatured) {
      toast({
        title: "Limit Reached",
        description: `You can only feature a maximum of ${FEATURED_LIMITS.promises} promises. Please unfeature another promise first.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction(true);
    try {
      const updatedPromiseFromServer = await apiClient.patch<UserPromise>(ROUTES.API.PROMISE_DETAIL(promiseId), { is_featured: newFeaturedStatus });
      setPromises(prev => prev.map(p => p.id === promiseId ? updatedPromiseFromServer : p));
      toast({
        title: "Promise Updated",
        description: `Promise "${updatedPromiseFromServer.title.substring(0, 30)}..." is now ${newFeaturedStatus ? 'featured' : 'not featured'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update feature status.", variant: "destructive" });
      setPromises(prev => prev.map(p => {
        if (p.id === promiseId) {
          return { ...p, isFeatured: currentPromise.isFeatured };
        }
        return p;
      }));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteConfirmed = async (promiseId: string, promiseTitle: string) => {
    const success = await deleteEntity(promiseId);
    if (success) {
      setPromises(prev => prev.filter(p => p.id !== promiseId));
    }
  };

  if (fetchError) {
     return (
      <Card>
        <CardHeader><CardTitle>Error Loading Promises</CardTitle><CardDescription>{fetchError}</CardDescription></CardHeader>
      </Card>
    );
  }

  if (!initialPromises && !fetchError) {
    return (
       <Card>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-40" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-32" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-28" /></TableHead>
                  <TableHead className="w-[100px] text-center font-medium"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>
                  <TableHead className="text-right font-medium w-[180px]"><Skeleton className="h-5 w-32 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    );
  }

  return (
    <>
      {promises.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Promised By</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Category</TableHead>
                  <TableHead className="font-medium">Deadline</TableHead>
                  <TableHead className="w-[100px] text-center font-medium">
                     <div className="flex items-center justify-center">
                       <Star className="h-4 w-4 mr-1 text-yellow-500"/> Featured
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[180px] font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promises.map((promise) => (
                  <TableRow key={promise.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      <Link href={ROUTES.PROMISES.DETAIL(promise.id)} prefetch={true} className="hover:underline text-primary" title={promise.title}>
                        {promise.title}
                      </Link>
                    </TableCell>
                    <TableCell>{promise.politicianName || promise.partyName || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getPromiseStatusBadgeClass(promise.status))}>
                            {promise.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{promise.category || 'N/A'}</TableCell>
                    <TableCell>{formatDate(promise.deadline)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!promise.isFeatured}
                        onCheckedChange={(checked) => handleToggleFeatured(promise.id, promise, checked)}
                        aria-label={`Feature ${promise.title}`}
                        disabled={isLoadingAction || isDeleting}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="mr-2">
                          <Link href={ROUTES.PROMISES.EDIT(promise.id)} prefetch={true}>
                             <Edit className="mr-1 h-4 w-4" /> Edit
                          </Link>
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isLoadingAction || isDeleting}>
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the promise "{promise.title}" and all related data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteConfirmed(promise.id, promise.title || "this promise")} className="bg-destructive hover:bg-destructive/90">
                                Yes, delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Promises Found</CardTitle>
            <CardDescription>There are no promises in the system yet. Add one to get started.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
    