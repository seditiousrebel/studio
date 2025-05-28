export interface EntityHistoryEvent {
  id: string;
  timestamp: string; // ISO date string
  editor: string; // User ID or name
  changes: string; // Description of changes
  approved: boolean;
}

export interface BaseEntity {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
  followersCount?: number;
  lastUpdatedAt?: string; // ISO date string
  history?: EntityHistoryEvent[];
}

export interface Politician extends BaseEntity {
  partyId?: string;
  partyName?: string;
  constituency?: string;
  dateOfBirth?: string; // ISO date string
  education?: string;
  politicalCareer?: Array<{
    position: string;
    period: string;
  }>;
}

export interface Party extends BaseEntity {
  ideology?: string;
  foundedDate?: string; // ISO date string
  chairperson?: string;
  memberCount?: number;
  headquarters?: string;
}

export interface Bill extends BaseEntity {
  status: 'Proposed' | 'Under Review' | 'Passed' | 'Rejected';
  proposedBy?: string; // Politician ID or name
  proposedDate?: string; // ISO date string
  passedDate?: string; // ISO date string
  summary?: string;
  fullTextUrl?: string; // Link to official document
  relatedPromises?: string[]; // Array of Promise IDs
}

export interface PromiseEntity extends BaseEntity {
  status: 'Pending' | 'In Progress' | 'Fulfilled' | 'Broken';
  politicianId?: string; // Politician who made the promise
  partyId?: string; // Party that made the promise
  deadline?: string; // ISO date string
  sourceUrl?: string; // Link to source of promise
  updates?: Array<{
    date: string; // ISO date string
    updateText: string;
  }>;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string; // e.g., "Kathmandu Post"
  url: string;
  publishedDate: string; // ISO date string
  imageUrl?: string;
  summary?: string;
  dataAiHint?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  followedPoliticians?: string[]; // Array of Politician IDs
  followedParties?: string[]; // Array of Party IDs
  followedBills?: string[]; // Array of Bill IDs
  followedPromises?: string[]; // Array of Promise IDs
}

export interface Contribution {
  id: string;
  userId: string;
  entityType: 'politician' | 'party' | 'bill' | 'promise';
  entityId: string;
  proposedChanges: Record<string, any>; // Field-value pairs
  submissionDate: string; // ISO date string
  status: 'Pending' | 'Approved' | 'Rejected';
  moderatorNotes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_bill_status' | 'promise_update' | 'followed_entity_news' | 'contribution_status';
  message: string;
  link?: string; // Link to the relevant entity or page
  isRead: boolean;
  createdAt: string; // ISO date string
}
