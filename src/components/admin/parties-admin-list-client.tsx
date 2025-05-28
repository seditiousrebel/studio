// src/components/admin/parties-admin-list-client.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Party } from '@/types';
import { Edit, Landmark, Star, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { FEATURED_LIMITS, ROUTES } from '@/lib/constants'; // Added ROUTES
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
import { useEntityCrud } from '@/hooks/use-entity-crud'; // Import the hook
import { apiClient } from '@/lib/api-client';


interface PartiesAdminListClientProps {
  initialParties: Party[];
  fetchError?: string | null;
}

export function PartiesAdminListClient({ 
  initialParties, 
  fetchError,
}: PartiesAdminListClientProps) {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>(initialParties || []);
  const { isLoading: isDeleting, deleteEntity } = useEntityCrud('party');
  const [isLoadingAction, setIsLoadingAction] = useState(false); // For toggle feature
  const { toast } = useToast();

  useEffect(() => {
    setParties(initialParties || []);
  }, [initialParties]);

  const handleToggleFeatured = async (partyId: string, currentParty: Party, newFeaturedStatus: boolean) => {
    const currentFeaturedCount = parties.filter(p => p.isFeatured).length;

    if (newFeaturedStatus && currentFeaturedCount >= FEATURED_LIMITS.parties && !currentParty.isFeatured) {
      toast({
        title: "Limit Reached",
        description: `You can only feature a maximum of ${FEATURED_LIMITS.parties} parties. Please unfeature another party first.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction(true);
    try {
      const updatedPartyFromServer = await apiClient.patch<Party>(ROUTES.API.PARTY_DETAIL(partyId), { is_featured: newFeaturedStatus });
      setParties(prev => prev.map(p => p.id === partyId ? updatedPartyFromServer : p));
      toast({
        title: "Party Updated",
        description: `${updatedPartyFromServer.name} is now ${newFeaturedStatus ? 'featured' : 'not featured'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update feature status.", variant: "destructive" });
       setParties(prev => prev.map(p => {
        if (p.id === partyId) {
          return { ...p, isFeatured: currentParty.isFeatured };
        }
        return p;
      }));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteConfirmed = async (partyId: string, partyName: string) => {
    const success = await deleteEntity(partyId);
    if (success) {
      setParties(prev => prev.filter(p => p.id !== partyId));
    }
  };

  if (fetchError) {
    return (
      <Card>
        <CardHeader><CardTitle>Error Loading Parties</CardTitle><CardDescription>{fetchError}</CardDescription></CardHeader>
      </Card>
    );
  }
  
  if (!initialParties && !fetchError) { 
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
      {parties.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] font-medium">Logo</TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Short Name</TableHead>
                  <TableHead className="font-medium">Ideology</TableHead>
                  <TableHead className="w-[100px] text-center font-medium">
                     <div className="flex items-center justify-center">
                       <Star className="h-4 w-4 mr-1 text-yellow-500"/> Featured
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[180px] font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell>
                       <Avatar className="h-10 w-10 rounded-md border">
                        <AvatarImage src={party.logoUrl || undefined} alt={party.name} data-ai-hint={party.dataAiHint || "party logo small"}/>
                        <AvatarFallback>
                            {party.shortName ? party.shortName.charAt(0) : party.name.charAt(0)}
                        </AvatarFallback>
                       </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={ROUTES.PARTIES.DETAIL(party.id)} prefetch={true} className="hover:underline text-primary">
                        {party.name}
                      </Link>
                    </TableCell>
                    <TableCell>{party.shortName || 'N/A'}</TableCell>
                    <TableCell>{party.ideology || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!party.isFeatured}
                        onCheckedChange={(checked) => handleToggleFeatured(party.id, party, checked)}
                        aria-label={`Feature ${party.name}`}
                        disabled={isLoadingAction || isDeleting}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm" className="mr-2">
                        <Link href={ROUTES.PARTIES.EDIT(party.id)} prefetch={true}>
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
                              This action cannot be undone. This will permanently delete the party "{party.name}" and all related data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteConfirmed(party.id, party.name || "this party")} className="bg-destructive hover:bg-destructive/90">
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
            <CardTitle>No Political Parties Found</CardTitle>
            <CardDescription>There are no parties in the system yet. Add one to get started.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
    