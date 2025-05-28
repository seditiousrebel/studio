
export const APP_NAME = 'NetaTrack';

// Added 'key' for programmatic access via ROUTES object
export const NAV_LINKS_PUBLIC = [
  { href: '/politicians', label: 'Politicians', key: 'POLITICIANS.LIST' },
  { href: '/parties', label: 'Parties', key: 'PARTIES.LIST' },
  { href: '/promises', label: 'Promises', key: 'PROMISES.LIST' },
  { href: '/bills', label: 'Bills', key: 'BILLS.LIST' },
  { href: '/news', label: 'News', key: 'NEWS.LIST' },
  { href: '/about', label: 'About', key: 'ABOUT' },
  { href: '/contact', label: 'Contact', key: 'CONTACT' },
];

export const NAV_LINKS_ADMIN = [
  { href: '/politicians', label: 'Politicians', key: 'POLITICIANS.LIST' },
  { href: '/parties', label: 'Parties', key: 'PARTIES.LIST' },
  { href: '/promises', label: 'Promises', key: 'PROMISES.LIST' },
  { href: '/bills', label: 'Bills', key: 'BILLS.LIST' },
  { href: '/news', label: 'News', key: 'NEWS.LIST' },
  { href: '/about', label: 'About', key: 'ABOUT' },
  { href: '/contact', label: 'Contact', key: 'CONTACT' },
  { href: '/admin', label: 'Admin Dashboard', key: 'ADMIN.DASHBOARD' },
];

export const AUTH_LINKS_GUEST = [
  { href: '/login', label: 'Login', key: 'LOGIN' },
  { href: '/signup', label: 'Sign Up', key: 'SIGNUP' },
];

export const AUTH_LINKS_AUTHENTICATED_USER = [
    { href: '/profile', label: 'Profile', key: 'PROFILE' },
];

export const AUTH_LINKS_ADMIN_USER = [
    { href: '/profile', label: 'Admin Profile', key: 'PROFILE' }, // Same route, label changes
];

export const ADMIN_DASHBOARD_LINKS = [
  { key: 'POLITICIANS', href: '/admin/politicians', label: 'Manage Politicians', description: 'View, add, or edit politicians.' },
  { key: 'PARTIES', href: '/admin/parties', label: 'Manage Parties', description: 'View, add, or edit political parties.' },
  { key: 'PROMISES', href: '/admin/promises', label: 'Manage Promises', description: 'View, add, or edit promises.' },
  { key: 'BILLS', href: '/admin/bills', label: 'Manage Bills', description: 'View, add, or edit legislative bills.' },
  { key: 'SUGGESTIONS', href: '/admin/suggestions', label: 'Review Suggestions', description: 'Approve or deny user-submitted content changes.' },
];


export const ADMIN_EMAIL = 'bhupas@gmail.com'; 
export const ADMIN_PASSWORD = 'sachinn1'; 

export const FEATURED_LIMITS = {
  politicians: 6,
  parties: 4,
  promises: 4,
  bills: 4,
};

export const NEPAL_PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
] as const;

export type NepalProvince = typeof NEPAL_PROVINCES[number];

export const NEPAL_CONSTITUENCIES: Record<string, string[]> = {
  "Koshi Province": ["Morang-1", "Morang-2", "Morang-3", "Jhapa-1", "Jhapa-2", "Sunsari-1", "Sunsari-2"],
  "Madhesh Province": ["Dhanusha-1", "Dhanusha-2", "Sarlahi-1", "Sarlahi-2", "Parsa-1", "Bara-1", "Siraha-1"],
  "Bagmati Province": ["Kathmandu-1", "Kathmandu-2", "Kathmandu-3", "Lalitpur-1", "Lalitpur-2", "Bhaktapur-1", "Chitwan-1"],
  "Gandaki Province": ["Kaski-1", "Kaski-2", "Tanahun-1", "Syangja-1", "Gorkha-1"],
  "Lumbini Province": ["Rupandehi-1", "Rupandehi-2", "Dang-1", "Banke-1", "Palpa-1"],
  "Karnali Province": ["Surkhet-1", "Jumla-1", "Dailekh-1", "Kalikot-1"],
  "Sudurpashchim Province": ["Kailali-1", "Kailali-2", "Kanchanpur-1", "Dadeldhura-1", "Bajhang-1"],
};

export const NONE_CONSTITUENCY_VALUE = "__NONE_CONSTITUENCY__";

export const ITEMS_PER_PAGE = 9; // For pagination
    
