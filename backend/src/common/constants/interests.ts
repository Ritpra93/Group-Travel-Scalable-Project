/**
 * Interest Categories
 * Predefined travel interest categories for user profiles
 */

export const INTEREST_CATEGORIES = [
  // Outdoor & Adventure
  'Adventure',
  'Hiking',
  'Beach',
  'Camping',
  'Water Sports',
  'Skiing',
  'Nature',
  'Wildlife',

  // Culture & Arts
  'Culture',
  'History',
  'Art',
  'Museums',
  'Architecture',
  'Photography',
  'Local Traditions',

  // Food & Drink
  'Food',
  'Wine',
  'Coffee',
  'Street Food',
  'Fine Dining',
  'Cooking Classes',

  // Entertainment
  'Music',
  'Nightlife',
  'Festivals',
  'Theater',
  'Live Shows',

  // Relaxation & Wellness
  'Wellness',
  'Spa',
  'Yoga',
  'Meditation',

  // Active & Sports
  'Sports',
  'Cycling',
  'Running',
  'Golf',
  'Diving',

  // Urban & Shopping
  'Shopping',
  'Markets',
  'Luxury',
  'Vintage',

  // Social
  'Family-Friendly',
  'Romantic',
  'Solo Travel',
  'Group Activities',
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

/**
 * Group interests by theme for UI display
 */
export const INTEREST_GROUPS = {
  'Outdoor & Adventure': [
    'Adventure',
    'Hiking',
    'Beach',
    'Camping',
    'Water Sports',
    'Skiing',
    'Nature',
    'Wildlife',
  ],
  'Culture & Arts': [
    'Culture',
    'History',
    'Art',
    'Museums',
    'Architecture',
    'Photography',
    'Local Traditions',
  ],
  'Food & Drink': [
    'Food',
    'Wine',
    'Coffee',
    'Street Food',
    'Fine Dining',
    'Cooking Classes',
  ],
  Entertainment: ['Music', 'Nightlife', 'Festivals', 'Theater', 'Live Shows'],
  'Relaxation & Wellness': ['Wellness', 'Spa', 'Yoga', 'Meditation'],
  'Active & Sports': ['Sports', 'Cycling', 'Running', 'Golf', 'Diving'],
  'Urban & Shopping': ['Shopping', 'Markets', 'Luxury', 'Vintage'],
  Social: ['Family-Friendly', 'Romantic', 'Solo Travel', 'Group Activities'],
} as const;

export type InterestGroup = keyof typeof INTEREST_GROUPS;
