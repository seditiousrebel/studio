
import type { LucideIcon } from 'lucide-react';
import type { Database, Enums as SupabaseEnums } from './supabase'; // For utility types

// Constants for Enum values used in forms and logic
export const PROMISE_STATUSES = ['Pending', 'In Progress', 'Fulfilled', 'Broken', 'Overdue'] as const;
export type PromiseStatus = typeof PROMISE_STATUSES[number];

export const BILL_STATUSES = ['Proposed', 'In Committee', 'Passed House', 'Passed Senate', 'Enacted', 'Failed', 'Withdrawn'] as const;
export type BillStatus = typeof BILL_STATUSES[number];

export const CRIMINAL_RECORD_SEVERITIES = ['Minor', 'Moderate', 'Significant/Severe'] as const;
export type CriminalRecordSeverity = typeof CRIMINAL_RECORD_SEVERITIES[number];

export const CRIMINAL_RECORD_STATUSES = ['Allegation', 'Under Investigation', 'Charges Filed', 'Acquitted', 'Convicted', 'Sentence Served', 'Expunged'] as const;
export type CriminalRecordStatus = typeof CRIMINAL_RECORD_STATUSES[number];

export const CRIMINAL_RECORD_OFFENSE_TYPES = ['Financial', 'Ethical Violation', 'Corruption', 'Violence', 'Public Order', 'Other'] as const;
export type CriminalRecordOffenseType = typeof CRIMINAL_RECORD_OFFENSE_TYPES[number];

export const SUGGESTION_STATUSES = ['pending', 'approved', 'denied'] as const;
export type SuggestionStatus = typeof SUGGESTION_STATUSES[number];

export type EntityType = SupabaseEnums<'entity_enum_type'>;

export const ELECTION_EVENT_TYPES = [
  'Federal Parliament',
  'Provincial Assembly',
  'Local Level',
  'National Assembly',
  'By-election - Federal',
  'By-election - Provincial',
  'By-election - Local'
] as const;
export type ElectionEventType = typeof ELECTION_EVENT_TYPES[number];


// Base Tag interface
export interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

export interface SocialMediaLink {
  id?: string;
  platform: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetDeclarationSource {
  id?: string;
  value: string;
  description?: string | null;
  created_at?: string;
}
export interface AssetDeclarationEntry {
  id?: string;
  summary: string;
  declarationDate?: string | null;
  sourceUrls?: AssetDeclarationSource[];
  created_at?: string;
  updated_at?: string;
}

export interface CriminalRecordSource {
  id?: string;
  value: string;
  description?: string | null;
  created_at?: string;
}
export interface CriminalRecordEntry {
  id?: string;
  severity: CriminalRecordSeverity;
  status: CriminalRecordStatus;
  offenseType: CriminalRecordOffenseType;
  description: string;
  caseDate?: string | null;
  sourceUrls?: CriminalRecordSource[];
  created_at?: string;
  updated_at?: string;
}

export interface PoliticalCareerEntry {
  id?: string;
  year: number;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface ElectionHistoryEntry {
  id?: string; 
  party_id?: string; 
  electionYear: number;
  electionType: ElectionEventType; 
  seatsContested?: number | null;
  seatsWon?: number | null;
  votePercentage?: number | null; 
  created_at?: string;
  updated_at?: string;
}

export interface ControversySource {
  id?: string;
  value: string; // URL
  description?: string | null;
  created_at?: string;
}

export interface ControversyEntry {
  id?: string;
  description: string;
  eventDate?: string | null; // Optional date for the controversy event
  sourceUrls?: ControversySource[];
  created_at?: string;
  updated_at?: string;
}


export interface Politician {
  id: string;
  name: string;
  party_id?: string | null;
  partyName?: string | null;
  partyLogoUrl?: string | null;
  province?: string | null;
  constituency?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  age?: number;
  imageUrl?: string | null;
  data_ai_hint?: string | null; 
  position?: string | null;
  education?: string | null;
  isFeatured?: boolean;
  upvotes: number;
  downvotes: number;
  rating?: number;
  promiseFulfillmentRate?: number;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialMediaLinks?: SocialMediaLink[];
  politicalCareer?: PoliticalCareerEntry[];
  assetDeclarations?: AssetDeclarationEntry[];
  criminalRecordEntries?: CriminalRecordEntry[];
  highestConvictedSeverity?: CriminalRecordSeverity | null;
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
  promises?: UserPromise[];
  directlySponsoredBills?: Bill[];
  partySponsoredBills?: Bill[];
}

export interface Party {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
  dataAiHint?: string | null;
  ideology?: string | null;
  foundingDate?: string | null;
  chairpersonId?: string | null;
  chairpersonName?: string | null;
  chairpersonImageUrl?: string | null;
  headquarters?: string | null;
  description?: string | null;
  history?: string | null;
  electionSymbolUrl?: string | null;
  dataAiHintSymbol?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isFeatured?: boolean;
  upvotes: number;
  downvotes: number;
  tags?: Tag[];
  rating?: number;
  numberOfMembers?: number;
  memberPoliticians?: Politician[];
  platformPromises?: UserPromise[];
  memberPromises?: UserPromise[];
  billsSponsoredByParty?: Bill[];
  billsSponsoredByMembers?: Bill[];
  created_at?: string;
  updated_at?: string;
  keyPolicyPositions?: string | null;
  controversies?: ControversyEntry[]; // Changed from string | null
  electionHistory?: ElectionHistoryEntry[];
}

export interface UserPromise {
  id: string;
  title: string;
  description?: string | null;
  status: PromiseStatus;
  category?: string | null;
  deadline?: string | null;
  sourceUrl?: string | null;
  evidenceUrl?: string | null;
  dateAdded: string;
  politicianId?: string | null;
  politicianName?: string | null;
  politicianImageUrl?: string | null;
  partyId?: string | null;
  partyName?: string | null;
  partyLogoUrl?: string | null;
  isFeatured?: boolean;
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
}

export interface Bill {
  id: string;
  title: string;
  registrationNumber?: string | null;
  registrationDate?: string | null;
  ministry?: string | null;
  status: BillStatus;
  proposalDate?: string | null;
  summary?: string | null;
  dataAiHint?: string | null;
  sponsorPoliticianId?: string | null;
  sponsorPoliticianName?: string | null;
  sponsorPoliticianPartyName?: string | null;
  sponsorPoliticianPartyId?: string | null;
  sponsorPoliticianPartyLogoUrl?: string | null;
  sponsorPartyId?: string | null;
  sponsorPartyName?: string | null;
  sponsorPartyLogoUrl?: string | null;
  parliamentInfoUrl?: string | null;
  isFeatured?: boolean;
  upvotes: number;
  downvotes: number;
  rating?: number;
  tags?: Tag[];
  created_at?: string;
  updated_at?: string;
}

export interface NewsArticle {
  id: string;
  title: string | null;
  link: string | null;
  source: string | null;
  pubDate: string;
  summary: string | null;
  category?: string | null;
  tags?: string[];
}

export interface PlatformStatistic {
  id: string;
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
}

export interface EditSuggestion {
  id: string;
  entityType: EntityType;
  entityId?: string | null;
  suggestedData: Partial<Politician | Party | UserPromise | Bill> | null;
  userId: string;
  userName?: string | null;
  timestamp: string; 
  status: SupabaseEnums<'suggestion_status'>;
  isNewItemSuggestion: boolean;
  notes?: string | null;
  created_at?: string; 
}

export type UserVoteValue = 'up' | 'down' | null;
export type FilterOption = { value: string; label: string };

// Form value types should align with these main entity types or be Partial versions
export type { PoliticianFormValues } from '@/components/admin/politician-form';
export type { PartyFormValues } from '@/components/admin/party-form';
export type { PromiseFormValues } from '@/components/admin/promise-form';
export type { BillFormValues } from '@/components/admin/bill-form';

