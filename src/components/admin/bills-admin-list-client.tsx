// src/components/admin/bills-admin-list-client.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Bill } from '@/types';
import { Edit, FileText as BillIconLucide, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils'; // Import formatDate
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn, getBillStatusBadgeClass } from '@/lib/utils';
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

interface BillsAdminListClientProps {
  initialBills: Bill[];
  fetchError?: string | null;
}

export function BillsAdminListClient({ 
  initialBills, 
  fetchError,
}: BillsAdminListClientProps) {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>(initialBills || []);
  const { isLoading: isDeleting, deleteEntity } = useEntityCrud('bill');
  const [isLoadingAction, setIsLoadingAction] = useState(false); // For toggle feature
  const { toast } = useToast();

  useEffect(() => {
    setBills(initialBills || []);
  }, [initialBills]);

  const handleToggleFeatured = async (billId: string, currentBill: Bill, newFeaturedStatus: boolean) => {
    const currentFeaturedCount = bills.filter(b => b.isFeatured).length;

    if (newFeaturedStatus && currentFeaturedCount >= FEATURED_LIMITS.bills && !currentBill.isFeatured) {
      toast({
        title: "Limit Reached",
        description: "You can only feature a maximum of " + String(FEATURED_LIMITS.bills) + " bills. Please unfeature another bill first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction(true);
    try {
      const updatedBillFromServer = await apiClient.patch<Bill>(ROUTES.API.BILL_DETAIL(billId), { is_featured: newFeaturedStatus });
      setBills(prev => prev.map(b => b.id === billId ? updatedBillFromServer : b));
      toast({
        title: "Bill Updated",
        description: `Bill "${updatedBillFromServer.title.substring(0, 30)}..." is now ${newFeaturedStatus ? 'featured' : 'not featured'}.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update feature status.", variant: "destructive" });
      setBills(prev => prev.map(b => {
        if (b.id === billId) {
          return { ...b, isFeatured: currentBill.isFeatured };
        }
        return b;
      }));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteConfirmed = async (billId: string, billTitle: string) => {
    const success = await deleteEntity(billId);
    if (success) {
      setBills(prev => prev.filter(b => b.id !== billId));
    }
  };

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Bills</CardTitle>
          <CardDescription>{fetchError}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!initialBills && !fetchError) { 
    return (
       <Card>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-40" /></TableHead>
                  <TableHead className="font-medium"><Skeleton className="h-5 w-32" /></TableHead>
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
      {bills.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Sponsor</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="w-[100px] text-center font-medium">
                     <div className="flex items-center justify-center">
                       <Star className="h-4 w-4 mr-1 text-yellow-500"/> Featured
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[180px] font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      <Link href={ROUTES.BILLS.DETAIL(bill.id)} prefetch={true} className="hover:underline text-primary" title={bill.title}>
                        {bill.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getBillStatusBadgeClass(bill.status))}>
                            {bill.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{bill.sponsorPoliticianName || bill.sponsorPartyName || 'N/A'}</TableCell>
                    <TableCell>{formatDate(bill.registrationDate || bill.proposalDate, 'N/A')}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!bill.isFeatured}
                        onCheckedChange={(checked) => handleToggleFeatured(bill.id, bill, checked)}
                        aria-label={`Feature ${bill.title}`}
                        disabled={isLoadingAction || isDeleting}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="mr-2">
                          <Link href={ROUTES.BILLS.EDIT(bill.id)} prefetch={true}>
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
                                This action cannot be undone. This will permanently delete the bill "{bill.title}" and all related data from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteConfirmed(bill.id, bill.title || "this bill")} className="bg-destructive hover:bg-destructive/90">
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
            <CardTitle>No Bills Found</CardTitle>
            <CardDescription>There are no bills in the system yet. Add one to get started.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
    