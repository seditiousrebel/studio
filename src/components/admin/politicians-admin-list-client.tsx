// src/components/admin/politicians-admin-list-client.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Politician } from '@/types';
import { Edit, UserCircle, Star, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
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

interface PoliticiansAdminListClientProps {
  initialPoliticians: Politician[];
  fetchError?: string | null;
}

export function PoliticiansAdminListClient({ 
  initialPoliticians, 
  fetchError,
}: PoliticiansAdminListClientProps) {
  const router = useRouter();
  const [politicians, setPoliticians] = useState<Politician[]>(initialPoliticians || []);
  const { isLoading: isDeleting, deleteEntity } = useEntityCrud('politician');
  const [isLoadingAction, setIsLoadingAction] = useState(false); // For non-delete actions like toggle
  const { toast } = useToast();

  useEffect(() => {
    setPoliticians(initialPoliticians || []);
  }, [initialPoliticians]);

  const handleToggleFeatured = async (politicianId: string, currentPolitician: Politician, newFeaturedStatus: boolean) => {
    const currentFeaturedCount = politicians.filter(p => p.isFeatured).length;

    if (newFeaturedStatus && currentFeaturedCount >= FEATURED_LIMITS.politicians && !currentPolitician.isFeatured) {
      toast({
        title: "Limit Reached",
        description: `You can only feature a maximum of ${FEATURED_LIMITS.politicians} politicians. Please unfeature another politician first.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction(true);
    try {
      const updatedPoliticianFromServer = await apiClient.patch<Politician>(ROUTES.API.POLITICIAN_DETAIL(politicianId), { is_featured: newFeaturedStatus });
      setPoliticians(prev => prev.map(p => p.id === politicianId ? updatedPoliticianFromServer : p));
      toast({
        title: "Politician Updated",
        description: `${updatedPoliticianFromServer.name} is now ${newFeaturedStatus ? 'featured' : 'not featured'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update feature status.", variant: "destructive" });
      setPoliticians(prev => prev.map(p => {
        if (p.id === politicianId) {
          return { ...p, isFeatured: currentPolitician.isFeatured }; 
        }
        return p;
      }));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteConfirmed = async (politicianId: string, politicianName: string) => {
    const success = await deleteEntity(politicianId);
    if (success) {
      setPoliticians(prev => prev.filter(p => p.id !== politicianId));
    }
  };
  
  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Politicians</CardTitle>
          <CardDescription>{fetchError}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!initialPoliticians && !fetchError) { 
    return (
       <Card>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] font-medium"><Skeleton className="h-10 w-10 rounded-md" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-32" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead className="w-[100px] text-center font-medium"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>
                  <TableHead className="text-right font-medium w-[180px]"><Skeleton className="h-5 w-32 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
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
      {politicians.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] font-medium">Image</TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Party</TableHead>
                  <TableHead className="font-medium">Province</TableHead>
                  <TableHead className="w-[100px] text-center font-medium">
                    <div className="flex items-center justify-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500"/> Featured
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[180px] font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {politicians.map((politician) => (
                  <TableRow key={politician.id}>
                    <TableCell>
                       <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={politician.imageUrl || undefined} alt={politician.name} data-ai-hint={politician.data_ai_hint || "politician photo small"}/>
                        <AvatarFallback>
                            {politician.name ? politician.name.split(' ').map(n => n[0]).join('').toUpperCase() : <UserCircle />}
                        </AvatarFallback>
                       </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={ROUTES.POLITICIANS.DETAIL(politician.id)} prefetch={true} className="hover:underline text-primary">
                        {politician.name}
                      </Link>
                    </TableCell>
                    <TableCell>{politician.partyName || 'N/A'}</TableCell>
                    <TableCell>{politician.province || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!politician.isFeatured}
                        onCheckedChange={(checked) => handleToggleFeatured(politician.id, politician, checked)}
                        aria-label={`Feature ${politician.name}`}
                        disabled={isLoadingAction || isDeleting}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="mr-2">
                        <Link href={ROUTES.POLITICIANS.EDIT(politician.id)} prefetch={true}>
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
                              This action cannot be undone. This will permanently delete the politician "{politician.name}" and all related data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteConfirmed(politician.id, politician.name || "this politician")} className="bg-destructive hover:bg-destructive/90">
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
            <CardTitle>No Politicians Found</CardTitle>
            <CardDescription>There are no politicians in the system yet. Add one to get started.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
    