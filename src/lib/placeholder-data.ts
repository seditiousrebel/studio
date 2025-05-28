import type { Politician, Party, Bill, PromiseEntity, NewsArticle, UserProfile, Contribution, Notification } from './types';

export const placeholderPoliticians: Politician[] = [
  {
    id: 'pol1',
    name: 'Bidya Devi Bhandari',
    description: 'Former President of Nepal.',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'politician portrait',
    partyName: 'CPN (UML)',
    constituency: 'N/A (Former President)',
    followersCount: 15000,
    history: [{ id: 'hist1', timestamp: '2023-01-01T10:00:00Z', editor: 'Admin', changes: 'Profile created.', approved: true }],
  },
  {
    id: 'pol2',
    name: 'Sher Bahadur Deuba',
    description: 'Former Prime Minister of Nepal.',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'politician official',
    partyName: 'Nepali Congress',
    constituency: 'Dadeldhura 1',
    followersCount: 22000,
  },
];

export const placeholderParties: Party[] = [
  {
    id: 'party1',
    name: 'Nepali Congress',
    description: 'A major political party in Nepal.',
    imageUrl: 'https://placehold.co/300x200.png',
    dataAiHint: 'party logo',
    ideology: 'Social Democracy',
    chairperson: 'Sher Bahadur Deuba',
    followersCount: 50000,
  },
  {
    id: 'party2',
    name: 'CPN (UML)',
    description: 'A major communist political party in Nepal.',
    imageUrl: 'https://placehold.co/300x200.png',
    dataAiHint: 'political flag',
    ideology: 'Communism, Marxism-Leninism',
    chairperson: 'KP Sharma Oli',
    followersCount: 65000,
  },
];

export const placeholderBills: Bill[] = [
  {
    id: 'bill1',
    name: 'Right to Information Act Amendment',
    description: 'Proposed amendment to enhance transparency.',
    status: 'Under Review',
    proposedBy: 'Ministry of Law',
    proposedDate: '2023-05-10T00:00:00Z',
    followersCount: 2500,
  },
  {
    id: 'bill2',
    name: 'Cyber Security Bill',
    description: 'A bill to address growing cyber threats.',
    status: 'Proposed',
    proposedBy: 'Ministry of Communication and IT',
    proposedDate: '2023-08-15T00:00:00Z',
    followersCount: 1800,
  },
];

export const placeholderPromises: PromiseEntity[] = [
  {
    id: 'prom1',
    name: 'Build 1000km of new roads',
    description: 'Promise to expand national road infrastructure within 5 years.',
    status: 'In Progress',
    politicianId: 'pol2',
    deadline: '2027-01-01T00:00:00Z',
    followersCount: 5000,
    updates: [{ date: '2023-06-01T00:00:00Z', updateText: '200km completed.' }],
  },
  {
    id: 'prom2',
    name: 'Ensure clean drinking water for all',
    description: 'A commitment to provide access to safe drinking water nationwide.',
    status: 'Pending',
    partyId: 'party1',
    followersCount: 7500,
  },
];

export const placeholderNewsArticles: NewsArticle[] = [
  {
    id: 'news1',
    title: 'Parliament discusses new budget plan',
    source: 'The Kathmandu Post',
    url: '#',
    publishedDate: '2024-07-28T00:00:00Z',
    imageUrl: 'https://placehold.co/400x250.png',
    dataAiHint: 'parliament building',
    summary: 'Lawmakers convened today to deliberate on the proposed national budget for the upcoming fiscal year...',
  },
  {
    id: 'news2',
    title: 'Local elections see high turnout',
    source: 'Republica',
    url: '#',
    publishedDate: '2024-07-27T00:00:00Z',
    imageUrl: 'https://placehold.co/400x250.png',
    dataAiHint: 'election voting',
    summary: 'Citizens across the country participated actively in the recent local level elections, with preliminary reports indicating a high voter turnout.',
  },
];

export const placeholderUserProfile: UserProfile = {
  id: 'user1',
  name: 'Asha Sharma',
  email: 'asha.sharma@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  dataAiHint: 'profile avatar',
  followedPoliticians: ['pol1'],
  followedParties: ['party2'],
  followedBills: [],
  followedPromises: ['prom1'],
};

export const placeholderContributions: Contribution[] = [
  {
    id: 'contrib1',
    userId: 'user1',
    entityType: 'politician',
    entityId: 'pol2',
    proposedChanges: { constituency: 'Kathmandu 10' },
    submissionDate: '2024-07-20T00:00:00Z',
    status: 'Pending',
  },
];

export const placeholderNotifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'user1',
    type: 'promise_update',
    message: 'Promise "Build 1000km of new roads" has been updated.',
    link: '/promises/prom1',
    isRead: false,
    createdAt: '2024-07-28T10:00:00Z',
  },
  {
    id: 'notif2',
    userId: 'user1',
    type: 'contribution_status',
    message: 'Your contribution for Sher Bahadur Deuba has been approved.',
    link: '/contribute',
    isRead: true,
    createdAt: '2024-07-25T15:30:00Z',
  },
];
