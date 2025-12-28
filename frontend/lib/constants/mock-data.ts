/**
 * Mock Data Constants
 * Placeholder data for collaborative features not yet implemented in backend
 */

import { UNSPLASH_IMAGES } from './unsplash-images';

export const MOCK_POLL_OPTIONS = [
  {
    id: '1',
    label: 'Grillmarket',
    votes: 3,
    voters: [
      { name: 'Alex M.', avatar: UNSPLASH_IMAGES.users.user1 },
      { name: 'Sarah K.', avatar: UNSPLASH_IMAGES.users.user2 },
      { name: 'Mike R.', avatar: UNSPLASH_IMAGES.users.user3 },
    ],
  },
  {
    id: '2',
    label: 'Fish Company',
    votes: 1,
    voters: [
      { name: 'Emma L.', avatar: UNSPLASH_IMAGES.users.user4 },
    ],
  },
];

export const MOCK_PACKING_ITEMS = [
  { id: '1', label: 'Waterproof Jacket', checked: false },
  { id: '2', label: 'Hiking Boots', checked: true },
  { id: '3', label: 'Power Bank', checked: false },
  { id: '4', label: 'Camera', checked: true },
  { id: '5', label: 'Sunglasses', checked: true },
];

export const MOCK_WEATHER_FORECAST = [
  { day: 'Tue', temp: '4°' },
  { day: 'Wed', temp: '2°' },
  { day: 'Thu', temp: '5°' },
  { day: 'Fri', temp: '3°' },
];

export const MOCK_ITINERARY_EVENTS = [
  {
    day: 1,
    date: 'Oct 12',
    label: 'ARRIVAL',
    events: [
      {
        time: '09:30 AM',
        title: 'Land at Keflavík International',
        icon: 'Plane',
        addedBy: { name: 'Alex', avatar: UNSPLASH_IMAGES.users.user1 },
      },
      {
        time: '11:00 AM',
        title: 'Blue Lagoon Reservation',
        description: "Booking #99281. Don't forget swimwear. Towels included in package.",
        image: UNSPLASH_IMAGES.activities.blueLagoon,
      },
      {
        time: '02:00 PM',
        title: 'Drive to Vík',
        description: '2h 30m drive via Route 1.',
        icon: 'Navigation',
      },
    ],
  },
  {
    day: 2,
    date: 'Oct 13',
    label: 'EXPLORATION',
    events: [
      {
        time: '08:00 AM',
        title: 'Breakfast at Hotel',
        icon: 'Coffee',
      },
      {
        time: '10:00 AM',
        title: 'Skógafoss Waterfall',
        description: 'One of Iceland\'s biggest waterfalls. Bring waterproof gear!',
        image: UNSPLASH_IMAGES.activities.hiking,
      },
      {
        time: '02:00 PM',
        title: 'Black Sand Beach',
        description: 'Reynisfjara Beach - watch for sneaker waves.',
        icon: 'Waves',
      },
    ],
  },
];

export const MOCK_ONLINE_MEMBERS = [
  { name: 'Alex M.', avatar: UNSPLASH_IMAGES.users.user1 },
  { name: 'Sarah K.', avatar: UNSPLASH_IMAGES.users.user2 },
  { name: 'Mike R.', avatar: UNSPLASH_IMAGES.users.user3 },
  { name: 'Emma L.', avatar: UNSPLASH_IMAGES.users.user4 },
];
