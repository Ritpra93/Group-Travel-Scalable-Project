# Wanderlust Frontend Features

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Groups Management](#groups-management)
3. [Trips Management](#trips-management)
4. [Dashboard](#dashboard)
5. [Type System](#type-system)
6. [Known Issues & Solutions](#known-issues--solutions)

---

## Authentication System

### Overview
Complete authentication flow with registration, login, and session management using Zustand for state persistence.

### Features

#### 1. User Registration (`/register`)
- **Location**: `app/(auth)/register/page.tsx`
- **Validation**: `lib/schemas/auth.schema.ts`

**Required Fields**:
- Name (2-100 characters)
- Email (valid email format)
- Password (min 8 chars, must contain: uppercase, lowercase, number, special character)

**Password Requirements**:
```typescript
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&#)
```

**Example Valid Password**: `Password123!`

#### 2. User Login (`/login`)
- **Location**: `app/(auth)/login/page.tsx`
- **Features**:
  - Email and password authentication
  - Session persistence via Zustand
  - Automatic redirect to dashboard on success

#### 3. Session Management
- **Store**: `lib/stores/auth-store.ts`
- **Persistence**: localStorage (via Zustand persist middleware)
- **API Client**: Automatic token injection in headers

**Auth Store Methods**:
```typescript
const authStore = useAuthStore();

// Get current user
const user = authStore.user;
const token = authStore.token;

// Login
await authStore.login({ email, password });

// Logout
authStore.logout();

// Check auth status
const isAuthenticated = !!authStore.token;
```

### API Integration

**Login API**:
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: { user: User, token: string }
```

**Register API**:
```typescript
POST /api/auth/register
Body: { name: string, email: string, password: string }
Response: { user: User, token: string }
```

---

## Groups Management

### Overview
Create and manage travel groups with members and role-based permissions.

### Features

#### 1. Groups List (`/groups`)
- **Location**: `app/(app)/groups/page.tsx`
- **Features**:
  - View all groups
  - Search groups
  - Create new group button

#### 2. Create Group (`/groups/new`)
- **Location**: `app/(app)/groups/new/page.tsx`
- **Form Fields**:
  - Name (required, 2-100 chars)
  - Description (optional, max 500 chars)
  - Image URL (optional, must be valid URL)

**Schema**: `lib/schemas/groups.schema.ts`

#### 3. Group Detail (`/groups/[groupId]`)
- **Location**: `app/(app)/groups/[groupId]/page.tsx`
- **Features**:
  - View group details
  - Manage members
  - View group trips
  - Delete group (owner only)
  - Leave group (members)

### Group Roles

```typescript
export const GroupRole = {
  OWNER: 'OWNER',     // Full permissions
  ADMIN: 'ADMIN',     // Can manage members and content
  MEMBER: 'MEMBER',   // Can view and participate
  VIEWER: 'VIEWER',   // Read-only access
};
```

### API Hooks

**Available Hooks** (`lib/api/hooks/use-groups.ts`):
```typescript
// Queries
useGroups()                    // List all groups
useGroup(groupId)              // Get single group
useGroupMembers(groupId)       // Get group members

// Mutations
useCreateGroup()               // Create new group
useUpdateGroup(groupId)        // Update group
useDeleteGroup(groupId)        // Delete group
useLeaveGroup(groupId)         // Leave group
```

### API Endpoints

```typescript
GET    /api/groups                 // List groups
POST   /api/groups                 // Create group
GET    /api/groups/:id             // Get group
PUT    /api/groups/:id             // Update group
DELETE /api/groups/:id             // Delete group
POST   /api/groups/:id/leave       // Leave group
GET    /api/groups/:id/members     // Get members
```

---

## Trips Management

### Overview
Plan and organize trips with your groups including itineraries, budgets, and collaborative features.

### Features

#### 1. Trips List (`/trips`)
- **Location**: `app/(app)/trips/page.tsx`
- **Features**:
  - View all trips
  - Search trips
  - Filter by status
  - Create new trip button

**Trip Status Filters**:
```typescript
export const TripStatus = {
  PLANNING: 'PLANNING',           // Initial planning phase
  CONFIRMED: 'CONFIRMED',         // Dates and details confirmed
  UPCOMING: 'CONFIRMED',          // Alias for confirmed
  IN_PROGRESS: 'IN_PROGRESS',     // Trip is happening
  ONGOING: 'IN_PROGRESS',         // Alias for in-progress
  COMPLETED: 'COMPLETED',         // Trip finished
  CANCELLED: 'CANCELLED',         // Trip cancelled
};
```

#### 2. Create Trip (`/trips/new`)
- **Location**: `app/(app)/trips/new/page.tsx`
- **Form Fields**:
  - Group (required, select from your groups)
  - Trip Name (required, 2-100 chars)
  - Description (optional, max 1000 chars)
  - Destination (required, 2-200 chars)
  - Start Date (required)
  - End Date (required, must be after start date)
  - Budget (optional, positive number)
  - Image URL (optional, must be valid URL)

**Validation**: `lib/schemas/trips.schema.ts`

**Example**:
```typescript
{
  groupId: "uuid-here",
  name: "Paris Adventure",
  description: "A week exploring Paris!",
  destination: "Paris, France",
  startDate: "2024-06-01",
  endDate: "2024-06-07",
  budget: 2000,
  imageUrl: "https://example.com/paris.jpg"
}
```

#### 3. Trip Detail (`/trips/[tripId]`)
- **Location**: `app/(app)/trips/[tripId]/page.tsx`
- **Tabs**:
  - **Overview**: Basic trip information
  - **Itinerary**: Day-by-day schedule
  - **Expenses**: Shared expenses and settlements
  - **Polls**: Group voting on decisions

**Features**:
- View trip details
- Update trip status
- Edit trip information
- Delete trip
- View and manage itinerary items
- Track expenses
- Create and vote on polls

### Trip Card Component

**Location**: `components/patterns/trip-card.tsx`

**Props**:
```typescript
interface TripCardProps {
  trip: Trip;
}
```

**Features**:
- Trip image or placeholder
- Trip name and destination
- Date range
- Status badge with color coding
- Budget display
- Click to view details

**Status Badge Colors**:
```typescript
const statusColors = {
  PLANNING: 'bg-sky/10 text-sky',
  CONFIRMED: 'bg-golden/10 text-golden',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-stone-500/10 text-stone-700',
  CANCELLED: 'bg-red-500/10 text-red-700',
};
```

### API Hooks

**Available Hooks** (`lib/api/hooks/use-trips.ts`):
```typescript
// Queries
useTrips(filters)              // List trips with optional filters
useTrip(tripId)                // Get single trip

// Mutations
useCreateTrip()                // Create new trip
useUpdateTrip(tripId)          // Update trip
useDeleteTrip(tripId)          // Delete trip
useUpdateTripStatus(tripId)    // Change trip status
```

### API Endpoints

```typescript
GET    /api/trips                  // List trips
POST   /api/trips                  // Create trip
GET    /api/trips/:id              // Get trip
PUT    /api/trips/:id              // Update trip
DELETE /api/trips/:id              // Delete trip
PATCH  /api/trips/:id/status       // Update status
```

---

## Dashboard

### Overview
User dashboard showing overview of trips, groups, and recent activity.

**Location**: `app/(app)/dashboard/page.tsx`

### Features

1. **Quick Stats**:
   - Total Trips count
   - Groups count
   - Upcoming trips count

2. **Empty State**:
   - Displayed when user has no trips
   - Call-to-action button to create first trip
   - Links to `/trips/new`

3. **Navigation**:
   - Only shows on homepage (`/`)
   - Hidden on dashboard and app pages
   - Implemented via `ConditionalNavigation` component

### Components

**ConditionalNavigation** (`components/layout/ConditionalNavigation.tsx`):
```typescript
// Shows Navigation only on homepage
const pathname = usePathname();
if (pathname === '/') {
  return <Navigation />;
}
return null;
```

---

## Type System

### Overview
Centralized type definitions matching backend models.

**Location**: `types/models.types.ts`

### Important Types

#### User Types
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  timezone: string | null;
  bio: string | null;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Group Types
```typescript
interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  creatorId: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  invitedBy: string | null;
  user?: User;
}
```

#### Trip Types
```typescript
interface Trip {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  destination: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  totalBudget: string | null;  // Decimal as string
  currency: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  group?: Group;
}
```

### Type Imports

**Always use the centralized index**:
```typescript
// ✅ Correct
import { Trip, TripStatus, GroupRole } from '@/types';

// ❌ Incorrect (causes Turbopack issues)
import { Trip } from '@/types/models.types';
```

### Enum-like Constants

Both types AND constants are exported for use in code:

```typescript
// As type
const status: TripStatus = 'PLANNING';

// As enum-like constant
const status = TripStatus.PLANNING;  // 'PLANNING'
```

---

## Known Issues & Solutions

### 1. Turbopack Module Resolution

**Issue**: Turbopack cache issues cause "export doesn't exist" errors.

**Solution**:
```bash
# Clear all caches and restart
cd frontend
rm -rf .next node_modules/.cache .turbo
npm run dev
```

**Prevention**:
- Always import from `@/types` (not `@/types/models.types`)
- Use the centralized `types/index.ts` export

### 2. Password Validation Mismatch

**Issue**: Frontend validation doesn't match backend requirements.

**Current Requirements**:
```typescript
{
  minLength: 8,
  uppercase: required,
  lowercase: required,
  number: required,
  specialChar: required (@$!%*?&#)
}
```

**Schema Location**: `lib/schemas/auth.schema.ts`

### 3. Button asChild Prop Error

**Issue**: React warning about unrecognized `asChild` prop.

**Solution**: Wrap Link around Button instead:
```typescript
// ✅ Correct
<Link href="/path">
  <Button>Click me</Button>
</Link>

// ❌ Incorrect
<Button asChild>
  <Link href="/path">Click me</Link>
</Button>
```

### 4. Navigation Showing on All Pages

**Issue**: Marketing Navigation appears on dashboard pages.

**Solution**: Use `ConditionalNavigation` component in root layout.

**Implementation**: `components/layout/ConditionalNavigation.tsx`

---

## Development Workflow

### 1. Starting the App

```bash
# Backend (from backend directory)
docker-compose up -d
npm run dev

# Frontend (from frontend directory)
npm run dev
```

**URLs**:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

### 2. Creating New Features

1. Define types in `types/models.types.ts`
2. Create Zod schemas in `lib/schemas/`
3. Build API services in `lib/api/services/`
4. Create React Query hooks in `lib/api/hooks/`
5. Build UI components in `components/`
6. Create pages in `app/`

### 3. Testing Checklist

Before considering a feature complete:

- [ ] Types defined and exported correctly
- [ ] Validation schemas created
- [ ] API service functions implemented
- [ ] React Query hooks created
- [ ] UI components built
- [ ] Pages created and routed
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Forms validated on submit
- [ ] Success/error messages shown
- [ ] Unit tests written (future)
- [ ] E2E tests written (future)
- [ ] Manually tested in browser
- [ ] Backend integration verified

---

## Browser Testing Steps

### Test Registration Flow

1. Visit http://localhost:3000
2. Click "Get Started" or "Sign In"
3. Navigate to "Register"
4. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "Password123!"
5. Submit form
6. Verify redirect to `/dashboard`
7. Check localStorage for auth token

### Test Groups Flow

1. Login as user
2. Navigate to `/groups`
3. Click "Create Group"
4. Fill form and submit
5. Verify redirect to group detail page
6. Verify group appears in groups list

### Test Trips Flow

1. Login as user
2. Ensure you have at least one group
3. Navigate to `/trips`
4. Click "Create Trip"
5. Select group, fill details
6. Submit form
7. Verify redirect to trip detail page
8. Verify trip appears in trips list
9. Test status filter

---

## Common Errors & Fixes

### "Export doesn't exist in target module"

**Cause**: Turbopack cache issue

**Fix**:
```bash
rm -rf .next node_modules/.cache .turbo && npm run dev
```

### "Password does not meet requirements"

**Cause**: Missing special character or other requirement

**Fix**: Use password like `Password123!`

### "React does not recognize asChild prop"

**Cause**: Button component doesn't support asChild

**Fix**: Wrap Link around Button instead

### Page shows infinite loading

**Cause**: API error or no backend running

**Fix**:
1. Check browser console for errors
2. Verify backend is running on port 5001
3. Check network tab for failed requests
4. Verify auth token in localStorage

---

## Future Enhancements

- [ ] Add comprehensive test coverage
- [ ] Implement E2E tests with Playwright
- [ ] Add Storybook for component development
- [ ] Implement real-time updates with WebSockets
- [ ] Add offline support with PWA
- [ ] Implement image upload functionality
- [ ] Add accessibility (a11y) improvements
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Add internationalization (i18n)
- [ ] Implement analytics tracking
