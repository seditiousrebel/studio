// src/lib/data/bill-data.ts
import type { Bill, Tag } from '@/types';
import type { Database } from '@/types/supabase';

// This file now primarily holds the transformation logic.
// Data fetching is handled by src/lib/data-fetcher.ts

type RawSupabaseBill = Database['public']['Tables']['legislative_bills']['Row'] & {
  // politicians and parties (direct sponsor joins) are removed.
  // bill_tags is removed, replaced by fetched_tags.
  fetched_tags?: Tag[]; // Tags are now fetched separately and attached.
  // Note: The `sponsorship_details` JSON column is part of `Database['public']['Tables']['bills']['Row']`
  // and can be used here if more complex sponsor parsing is needed in the future.
};

export function transformSupabaseBillToApp(rawBill: RawSupabaseBill): Bill {
  // Logic for deriving party details from rawBill.politicians is removed
  // as rawBill.politicians is no longer directly joined.

  // const totalVotes = (rawBill.upvotes ?? 0) + (rawBill.downvotes ?? 0); // Comment out or remove
  let ratingVal: number | undefined = undefined; // Placeholder
  // if (totalVotes > 0) { ... } // Comment out or remove
  // TODO: Calculate real rating from entity_votes table if needed for bills.

  return {
    id: rawBill.id.toString(), 
    title: rawBill.title,
    registrationNumber: rawBill.bill_number, // Assuming bill_number is the equivalent
    registrationDate: undefined, // registration_date not in legislative_bills
    ministry: undefined, // ministry not in legislative_bills // TODO: Determine if ministry info can be parsed from 'sponsorship_details' or other fields.
    status: rawBill.status as Bill['status'],
    proposalDate: rawBill.introduced_date,
    summary: rawBill.summary, // Keep if summary exists, otherwise undefined
    dataAiHint: undefined, // data_ai_hint not in legislative_bills
    
    // Sponsor fields need to be parsed from sponsorship_details JSON or other means
    sponsorPoliticianId: undefined, // sponsor_politician_id not in legislative_bills; TODO: parse from sponsorship_details JSON if needed
    sponsorPoliticianName: undefined, 
    sponsorPoliticianPartyName: undefined, 
    sponsorPoliticianPartyId: undefined, 
    sponsorPoliticianPartyLogoUrl: undefined, 
    
    sponsorPartyId: undefined, // sponsor_party_id not in legislative_bills; TODO: parse from sponsorship_details JSON if needed
    sponsorPartyName: undefined, 
    sponsorPartyLogoUrl: undefined, 
    
    parliamentInfoUrl: undefined, // parliament_info_url not in legislative_bills // TODO: Check if 'source_url' or other field can be used.
    isFeatured: false, // is_featured not in legislative_bills; TODO: determine via featured_content table
    upvotes: 0, // upvotes not in legislative_bills; TODO: determine via entity_votes table
    downvotes: 0, // downvotes not in legislative_bills; TODO: determine via entity_votes table
    rating: ratingVal, // Uses the placeholder defined above
    tags: rawBill.fetched_tags || [], // Use the pre-fetched and pre-transformed tags
    created_at: rawBill.created_at,
    updated_at: rawBill.updated_at,
    // Fields from legislative_bills to consider adding if they map to Bill type:
    // rawBill.parliament_session_id, rawBill.fiscal_year_id, rawBill.gazette_number, 
    // rawBill.gazette_date, rawBill.passed_date, rawBill.authenticated_date, 
    // rawBill.source_url, rawBill.pdf_url, rawBill.category, rawBill.sponsorship_details (JSON)
    // rawBill.current_stage, rawBill.house_of_origin, rawBill.act_id (if it becomes an Act)
  };
}
