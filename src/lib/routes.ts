
// src/lib/routes.ts
import type { EntityType } from '@/types';

const entityPaths = {
  politicians: 'politicians',
  parties: 'parties',
  promises: 'promises',
  bills: 'bills',
  news: 'news', // Added for consistency
  suggestions: 'suggestions', // Added for admin consistency
} as const;

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',

  NEWS: {
    LIST: `/${entityPaths.news}`,
    // DETAIL: (id: string) => `/${entityPaths.news}/${id}`, // If news detail pages exist
  },

  POLITICIANS: {
    LIST: `/${entityPaths.politicians}`,
    DETAIL: (id: string) => `/${entityPaths.politicians}/${id}`,
    EDIT: (id: string) => `/${entityPaths.politicians}/${id}/edit`,
    ADD: `/${entityPaths.politicians}/add`,
  },
  PARTIES: {
    LIST: `/${entityPaths.parties}`,
    DETAIL: (id: string) => `/${entityPaths.parties}/${id}`,
    EDIT: (id: string) => `/${entityPaths.parties}/${id}/edit`,
    ADD: `/${entityPaths.parties}/add`,
  },
  PROMISES: {
    LIST: `/${entityPaths.promises}`,
    DETAIL: (id: string) => `/${entityPaths.promises}/${id}`,
    EDIT: (id: string) => `/${entityPaths.promises}/${id}/edit`,
    ADD: `/${entityPaths.promises}/add`,
  },
  BILLS: {
    LIST: `/${entityPaths.bills}`,
    DETAIL: (id: string) => `/${entityPaths.bills}/${id}`,
    EDIT: (id: string) => `/${entityPaths.bills}/${id}/edit`,
    ADD: `/${entityPaths.bills}/add`,
  },

  ADMIN: {
    DASHBOARD: '/admin',
    POLITICIANS: `/admin/${entityPaths.politicians}`,
    PARTIES: `/admin/${entityPaths.parties}`,
    PROMISES: `/admin/${entityPaths.promises}`,
    BILLS: `/admin/${entityPaths.bills}`,
    SUGGESTIONS: `/admin/${entityPaths.suggestions}`,
    NEWS_ADD: `/admin/${entityPaths.news}/add`, // Added for admin adding news
    // Admin edit paths for suggestions might differ based on entity type
    SUGGESTION_EDIT: (id: string, type: EntityType) => {
      switch (type) {
        case 'politician': return `/admin/${entityPaths.suggestions}/${id}/edit`;
        case 'party': return `/admin/${entityPaths.suggestions}/${id}/edit-party`;
        case 'promise': return `/admin/${entityPaths.suggestions}/${id}/edit-promise`;
        case 'bill': return `/admin/${entityPaths.suggestions}/${id}/edit-bill`;
        default: return `/admin/${entityPaths.suggestions}`; // Fallback
      }
    },
    // Direct admin edit paths for entities could be here if they were different from public edit paths
    // e.g., ADMIN_POLITICIAN_EDIT: (id: string) => `/admin/politicians/${id}/edit-master`,
  },

  API: {
    POLITICIANS: `/api/${entityPaths.politicians}`,
    POLITICIAN_DETAIL: (id: string) => `/api/${entityPaths.politicians}/${id}`,
    PARTIES: `/api/${entityPaths.parties}`,
    PARTY_DETAIL: (id: string) => `/api/${entityPaths.parties}/${id}`,
    PROMISES: `/api/${entityPaths.promises}`,
    PROMISE_DETAIL: (id: string) => `/api/${entityPaths.promises}/${id}`,
    BILLS: `/api/${entityPaths.bills}`,
    BILL_DETAIL: (id: string) => `/api/${entityPaths.bills}/${id}`,
    SUGGESTIONS: `/api/${entityPaths.suggestions}`,
    NEWS: `/api/${entityPaths.news}`, // If there's a news API endpoint
  }
};
