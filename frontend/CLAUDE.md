# Claude Code Guide - Frontend

This file provides context for AI assistants working on the frontend.

## Layout Coupling (CRITICAL)

The sidebar width is the most fragile coupling in the frontend. These values MUST stay synchronized:

### Sidebar Width Sync Locations

```
MOBILE:  70px sidebar → 70px margin offset → -70px negative margin → ~78px derived padding
DESKTOP: 256px (lg:w-64) → 256px offset → -256px negative → ~268px derived padding
```

| File | Line | Pattern | Purpose |
|------|------|---------|---------|
| `app/(app)/layout.tsx` | 85 | `w-[70px] lg:w-64` | Sidebar width (source of truth) |
| `app/(app)/layout.tsx` | 174 | `ml-[70px] lg:ml-64` | Main content margin |
| `components/patterns/featured-trip-hero.tsx` | 40 | `-ml-[70px] lg:-ml-64` | Hero extends under sidebar |
| `app/(app)/trips/[tripId]/page.tsx` | 55, 164 | `pl-[78px] lg:pl-[268px]` | Content padding |

### If Changing Sidebar Width

1. Update ALL locations in the table above
2. Recalculate derived values (add ~8px padding to width)
3. Run `npm run test` - layout tests will catch mismatches
4. Visually verify hero extends to left edge but sidebar overlays it

## Component Hierarchy

```
components/
├── ui/                 # Atomic, reusable, no business logic
│   ├── button.tsx      # Variants: primary|secondary|outline|ghost|destructive
│   ├── card.tsx        # Compound: Card, CardHeader, CardTitle, CardContent, CardFooter
│   ├── glass-panel.tsx # Glass morphism wrapper
│   ├── input.tsx       # Form input
│   ├── label.tsx       # Form label
│   ├── search-bar.tsx  # Input with clear
│   ├── status-badge.tsx
│   └── empty-state.tsx
│
├── patterns/           # Composed from ui/, may include business logic
│   ├── trip-card.tsx        # data-testid="content-card"
│   ├── group-card.tsx
│   ├── featured-trip-hero.tsx  # data-testid="hero"
│   ├── quick-action-card.tsx   # data-testid="action-card"
│   ├── stat-card.tsx
│   ├── poll-widget.tsx
│   ├── weather-widget.tsx
│   └── itinerary-timeline.tsx
│
├── sections/           # Full-page sections
│   └── Hero.tsx        # Landing page hero
│
└── layout/             # Layout containers
    ├── Navigation.tsx
    └── ConditionalNavigation.tsx
```

### Rules

- **ui/** components: No imports from patterns/ or sections/
- **patterns/** components: May import from ui/, not from sections/
- **sections/** components: May import from both ui/ and patterns/
- Use `cn()` utility from `lib/utils/cn.ts` for class merging

## Route Groups

| Group | Purpose | Auth Required |
|-------|---------|---------------|
| `(auth)/` | Login, register | No |
| `(app)/` | Dashboard, trips, groups | Yes (AuthGuard) |

**Never mix protected and public logic** in the same route group.

## Styling Approach

### Current State

- **Tailwind CSS 4** with `@tailwindcss/postcss` plugin
- **CSS Variables** defined in `app/globals.css` (zinc, emerald, orange, rose scales)
- **No CSS Modules** - pure Tailwind utilities
- **Glass morphism** via `.glass-panel` and `.glass-dark` classes

### CSS Variable Reference

```css
--color-zinc-50 through --color-zinc-900  /* Grayscale */
--color-emerald-400, --color-emerald-500   /* Success */
--color-orange-50 through --color-orange-600  /* Accent/Warning */
--color-rose-500, --color-rose-600         /* Error/Danger */
--glass-light, --glass-dark                /* Glass morphism */
--shadow-soft, --shadow-hover, --shadow-overlay
```

### If Changing Styling Approach

Consider: Tailwind utilities are used extensively. Introducing CSS-in-JS would require updating all components.

## Data-TestId Conventions

Layout tests rely on these markers:

| Selector | Location | Purpose |
|----------|----------|---------|
| `[data-testid="sidebar"]` | `app/(app)/layout.tsx` | Sidebar navigation |
| `[data-testid="hero"]` | `components/patterns/featured-trip-hero.tsx` | Hero section |
| `[data-testid="main-content"]` | `app/(app)/dashboard/page.tsx` | Main content area |
| `[data-testid="action-card"]` | `components/patterns/quick-action-card.tsx` | Quick action cards |
| `[data-testid="content-card"]` | `components/patterns/trip-card.tsx` | Content cards |

### When to Add data-testid

- Elements that Playwright tests reference for layout verification
- Interactive elements that behavior tests click/verify
- **Not needed**: Purely decorative elements, text content

## State Management

| Type | Technology | Location |
|------|-----------|----------|
| Server state | React Query | `lib/api/hooks/` |
| Auth state | Zustand (persisted) | `lib/stores/auth-store.ts` |
| Local UI state | React useState | Component-level |

### React Query Config

```typescript
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 10 * 60 * 1000,    // 10 minutes
retry: 1,
refetchOnWindowFocus: true
```

## API Client

Located at `lib/api/client.ts`:

- Base URL: `NEXT_PUBLIC_API_URL` or `http://localhost:4000/api/v1`
- Auto-injects `Authorization: Bearer {token}` header
- Auto-refreshes on 401 response
- 30-second timeout

### Service Layer

- `lib/api/services/auth.service.ts`
- `lib/api/services/trips.service.ts`
- `lib/api/services/groups.service.ts`

## Responsive Breakpoints

Tailwind defaults used:

| Prefix | Min Width |
|--------|-----------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

Sidebar switches at `lg:` breakpoint.

## Before Committing Frontend Changes

- [ ] Verified sidebar width sync if touching layout
- [ ] Added data-testid for new testable elements
- [ ] Used cn() for conditional classes
- [ ] Followed component hierarchy (ui → patterns → sections)
- [ ] Ran `npm run lint` in frontend/
