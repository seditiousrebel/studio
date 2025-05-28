// src/app/bills/[id]/page.tsx
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bills/bill-detail-client';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { fetchEntityData } from '@/lib/data-fetcher';

interface BillProfilePageProps {
  params: {
    id: string;
  };
}

export default async function BillProfilePage({ params }: BillProfilePageProps) {
  const billId = params.id;
  
  if (!billId) {
    console.error("BillProfilePage: No bill ID provided in params.");
    notFound();
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!supabase) {
    console.error("BillProfilePage: Supabase client could not be initialized.");
    notFound(); 
  }

  const { data: billData, error } = await fetchEntityData(supabase, 'bill', {
    id: billId,
    includeRelations: true
  });

  if (error || !billData) {
    if (error) {
      console.error(`Error fetching bill details for page (ID: ${billId}):`, error);
      if (error.code === 'NOT_FOUND') notFound();
    }
    notFound();
  }

  return (
    <BillDetailClient billProp={billData as Bill} />
  );
}
