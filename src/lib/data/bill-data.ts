// src/lib/data/bill-data.ts
import type { Bill, Tag } from '@/types';
import type { Database } from '@/types/supabase';

// This file now primarily holds the transformation logic.
// Data fetching is handled by src/lib/data-fetcher.ts

type RawSupabaseBill = Database['public']['Tables']['bills']['Row'] & {
  // politicians and parties (direct sponsor joins) are removed.
  // bill_tags is removed, replaced by fetched_tags.
  fetched_tags?: Tag[]; // Tags are now fetched separately and attached.
  // Note: The `sponsorship_details` JSON column is part of `Database['public']['Tables']['bills']['Row']`
  // and can be used here if more complex sponsor parsing is needed in the future.
};

export function transformSupabaseBillToApp(rawBill: RawSupabaseBill): Bill {
  // Logic for deriving party details from rawBill.politicians is removed
  // as rawBill.politicians is no longer directly joined.

  const totalVotes = (rawBill.upvotes ?? 0) + (rawBill.downvotes ?? 0);
  let ratingVal: number | undefined = 2.5;
  if (totalVotes > 0) {
    ratingVal = parseFloat(((((rawBill.upvotes ?? 0) / totalVotes) * 4.5 + 0.5).toFixed(1)));
    ratingVal = Math.max(0.5, Math.min(5, ratingVal || 0));
  }

  return {
    id: rawBill.id.toString(), // Changed to string
    title: rawBill.title,
    registrationNumber: rawBill.registration_number,
    registrationDate: rawBill.registration_date,
    ministry: rawBill.ministry,
    status: rawBill.status as Bill['status'],
    proposalDate: rawBill.proposal_date,
    summary: rawBill.summary,
    dataAiHint: rawBill.data_ai_hint,
    
    // Sponsor fields that were derived from direct joins are now undefined.
    // The IDs are still available directly from rawBill if needed.
    sponsorPoliticianId: rawBill.sponsor_politician_id?.toString() || undefined, // Convert to string
    sponsorPoliticianName: undefined, // Removed rawBill.politicians?.name
    sponsorPoliticianPartyName: undefined, // Removed derived logic
    sponsorPoliticianPartyId: undefined, // Removed derived logic
    sponsorPoliticianPartyLogoUrl: undefined, // Removed derived logic
    
    sponsorPartyId: rawBill.sponsor_party_id?.toString() || undefined, // Convert to string
    sponsorPartyName: undefined, // Removed rawBill.parties?.name
    sponsorPartyLogoUrl: undefined, // Removed rawBill.parties?.logo_url
    
    parliamentInfoUrl: rawBill.parliament_info_url,
    isFeatured: rawBill.is_featured ?? false,
    upvotes: rawBill.upvotes ?? 0,
    downvotes: rawBill.downvotes ?? 0,
    rating: ratingVal,
    tags: rawBill.fetched_tags || [], // Use the pre-fetched and pre-transformed tags
    created_at: rawBill.created_at,
    updated_at: rawBill.updated_at,
  };
}
