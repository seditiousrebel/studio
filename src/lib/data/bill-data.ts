
// src/lib/data/bill-data.ts
import type { Bill, Tag } from '@/types';
import type { Database } from '@/types/supabase';

// This file now primarily holds the transformation logic.
// Data fetching is handled by src/lib/data-fetcher.ts

type RawSupabaseBill = Database['public']['Tables']['bills']['Row'] & {
  politicians: (Pick<Database['public']['Tables']['politicians']['Row'], 'id' | 'name' | 'image_url' | 'party_id'> & {
    party_details: Pick<Database['public']['Tables']['parties']['Row'], 'id' | 'name' | 'logo_url'> | null;
  }) | null;
  parties: Pick<Database['public']['Tables']['parties']['Row'], 'id' | 'name' | 'logo_url'> | null;
  bill_tags: Array<{
    tags: Pick<Database['public']['Tables']['tags']['Row'], 'id' | 'name' | 'created_at'> | null;
  }>;
};

export function transformSupabaseBillToApp(rawBill: RawSupabaseBill): Bill {
  let sponsorPoliticianPartyName: string | undefined = undefined;
  let sponsorPoliticianPartyId: string | undefined = undefined;
  let sponsorPoliticianPartyLogoUrl: string | undefined = undefined;

  if (rawBill.politicians && rawBill.politicians.party_details) {
    sponsorPoliticianPartyName = rawBill.politicians.party_details.name ?? undefined;
    sponsorPoliticianPartyId = rawBill.politicians.party_details.id ?? undefined;
    sponsorPoliticianPartyLogoUrl = rawBill.politicians.party_details.logo_url ?? undefined;
  }

  const totalVotes = (rawBill.upvotes ?? 0) + (rawBill.downvotes ?? 0);
  let ratingVal: number | undefined = 2.5;
  if (totalVotes > 0) {
    ratingVal = parseFloat(((((rawBill.upvotes ?? 0) / totalVotes) * 4.5 + 0.5).toFixed(1)));
    ratingVal = Math.max(0.5, Math.min(5, ratingVal || 0));
  }

  return {
    id: rawBill.id,
    title: rawBill.title,
    registrationNumber: rawBill.registration_number,
    registrationDate: rawBill.registration_date,
    ministry: rawBill.ministry,
    status: rawBill.status as Bill['status'],
    proposalDate: rawBill.proposal_date,
    summary: rawBill.summary,
    dataAiHint: rawBill.data_ai_hint,
    sponsorPoliticianId: rawBill.sponsor_politician_id || undefined,
    sponsorPoliticianName: rawBill.politicians?.name || undefined,
    sponsorPoliticianPartyName: sponsorPoliticianPartyName,
    sponsorPoliticianPartyId: sponsorPoliticianPartyId,
    sponsorPoliticianPartyLogoUrl: sponsorPoliticianPartyLogoUrl,
    sponsorPartyId: rawBill.sponsor_party_id || undefined,
    sponsorPartyName: rawBill.parties?.name || undefined,
    sponsorPartyLogoUrl: rawBill.parties?.logo_url || undefined,
    parliamentInfoUrl: rawBill.parliament_info_url,
    isFeatured: rawBill.is_featured ?? false,
    upvotes: rawBill.upvotes ?? 0,
    downvotes: rawBill.downvotes ?? 0,
    rating: ratingVal,
    tags: rawBill.bill_tags
      ?.map(bt => bt.tags ? { id: bt.tags.id, name: bt.tags.name, created_at: bt.tags.created_at } : null)
      .filter(Boolean) as Tag[] || [],
    created_at: rawBill.created_at,
    updated_at: rawBill.updated_at,
  };
}
