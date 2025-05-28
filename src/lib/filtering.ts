
// src/lib/filtering.ts
import type { EntityType } from '@/types';
import type { FilterConfig, FilterOption } from '@/components/shared/filter-controls';
import { NEPAL_PROVINCES } from '@/lib/constants';

// Define specific filter configurations for each entity type
const politicianFilters: FilterConfig[] = [
  { id: 'searchTerm', label: 'Search by Name', placeholder: 'Enter name...', type: 'search' },
  {
    id: 'party', // Corresponds to URL param & currentFilters key (partyId for API)
    label: 'Filter by Party',
    placeholder: 'All Parties',
    type: 'select',
    optionsKey: 'partyOptions',
  },
  { id: 'ageRange', label: 'Filter by Age', type: 'custom_render', renderComponentKey: 'ageSlider' }, // Key for custom renderer
  {
    id: 'province', // Corresponds to URL param & currentFilters key
    label: 'Filter by Province',
    placeholder: 'All Provinces',
    type: 'select',
    optionsKey: 'provinceOptions', // Will look for allOptions.provinceOptions
  },
  {
    id: 'tag', // Corresponds to URL param & currentFilters key
    label: 'Filter by Tag',
    placeholder: 'All Tags',
    type: 'select',
    optionsKey: 'politicianTagOptions',
  },
];

const partyFilters: FilterConfig[] = [
  { id: 'searchTerm', label: 'Search by Name', placeholder: 'Enter party name...', type: 'search' },
  {
    id: 'ideology',
    label: 'Filter by Ideology',
    placeholder: 'All Ideologies',
    type: 'select',
    optionsKey: 'ideologyOptions',
  },
  {
    id: 'foundingYear',
    label: 'Filter by Founding Year',
    placeholder: 'All Years',
    type: 'select',
    optionsKey: 'foundingYearOptions',
  },
  {
    id: 'tag',
    label: 'Filter by Tag',
    placeholder: 'All Tags',
    type: 'select',
    optionsKey: 'partyTagOptions',
  },
];

const promiseFilters: FilterConfig[] = [
  { id: 'searchTerm', label: 'Search Promises', placeholder: 'Enter keywords...', type: 'search' },
  {
    id: 'party', // Corresponds to partyId for API - MOVED TO SECOND POSITION
    label: 'Filter by Party',
    placeholder: 'All Parties',
    type: 'select',
    optionsKey: 'partyOptions',
  },
  {
    id: 'status',
    label: 'Filter by Status',
    placeholder: 'All Statuses',
    type: 'select',
    optionsKey: 'promiseStatusOptions',
  },
  {
    id: 'category',
    label: 'Filter by Category',
    placeholder: 'All Categories',
    type: 'select',
    optionsKey: 'categoryOptions',
  },
  {
    id: 'politician', // Corresponds to politicianId for API
    label: 'Filter by Politician',
    placeholder: 'All Politicians',
    type: 'select',
    optionsKey: 'politicianOptions',
  },
  {
    id: 'tag',
    label: 'Filter by Tag',
    placeholder: 'All Tags',
    type: 'select',
    optionsKey: 'promiseTagOptions',
  },
];

const billFilters: FilterConfig[] = [
  { id: 'searchTerm', label: 'Search Bills by Title', placeholder: 'Enter keywords...', type: 'search' },
  {
    id: 'status', // Already second
    label: 'Filter by Status',
    placeholder: 'All Statuses',
    type: 'select',
    optionsKey: 'billStatusOptions',
  },
  {
    id: 'politician', // Corresponds to sponsorPoliticianId for API
    label: 'Filter by Sponsoring Politician',
    placeholder: 'All Politicians',
    type: 'select',
    optionsKey: 'politicianOptions',
  },
  {
    id: 'party', // Corresponds to sponsorPartyId for API
    label: 'Filter by Sponsoring Party',
    placeholder: 'All Parties',
    type: 'select',
    optionsKey: 'partyOptions',
  },
  {
    id: 'tag',
    label: 'Filter by Tag',
    placeholder: 'All Tags',
    type: 'select',
    optionsKey: 'billTagOptions',
  },
];


export function getFilterConfigForEntity(entityType: EntityType): FilterConfig[] {
  switch (entityType) {
    case 'politician':
      return politicianFilters;
    case 'party':
      return partyFilters;
    case 'promise':
      return promiseFilters;
    case 'bill':
      return billFilters;
    default:
      return [];
  }
}

// Helper to get Province options in the required format
export function getProvinceFilterOptions(): FilterOption[] {
    return NEPAL_PROVINCES.map(province => ({ value: province, label: province }));
}

