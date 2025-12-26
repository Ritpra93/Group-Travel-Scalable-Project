# Wanderlust Frontend

> **Collaborative Adventure Travel Planning Platform**
>
> Plan trips, manage expenses, create polls, and organize itineraries with your travel crew.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

---

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Status](#project-status)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## 🎯 Overview

Wanderlust is a **production-ready frontend application** for collaborative trip planning. Built with modern web technologies, it connects to an Express.js backend API to provide real-time collaboration features for travel groups.

### What Makes It Special

✨ **Full-Stack Integration** - Seamlessly connects with Express + PostgreSQL backend
🔐 **Secure Authentication** - JWT with automatic token refresh
🎨 **Beautiful UI** - Adventure-themed design with mountain imagery
📱 **Fully Responsive** - Works on all devices
♿ **Accessible** - WCAG 2.1 Level AA compliant
⚡ **Performance** - Optimized with Next.js 16 and TanStack Query

---

## ✨ Features

### ✅ Implemented (Phases 1-2)

#### Authentication & User Management
- 🔑 **User Registration** - Create account with validation
- 🔐 **Secure Login** - Email/password authentication
- 🔄 **Auto Token Refresh** - Seamless session management
- 🚪 **Logout** - Clean session termination
- 🛡️ **Protected Routes** - Automatic redirection
- 💾 **Persistent Sessions** - Stay logged in across browser restarts

#### Dashboard & Navigation
- 📊 **Overview Dashboard** - Stats and quick actions
- 🧭 **Sidebar Navigation** - Easy access to all features
- 📱 **Mobile Menu** - Responsive drawer navigation
- 👤 **User Profile Display** - Personalized experience

### 🚧 In Progress (Phase 3)

- 👥 Groups management (CRUD)
- 🗺️ Trips planning
- 💰 Expense tracking
- 🗳️ Polls & voting
- 📅 Itinerary planning
- 🗺️ Maps integration (Mapbox)
- 📨 Invitations system
- 🔔 Real-time updates (Socket.io)

---

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 16.1.1](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.3](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety

### Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[Framer Motion 12](https://www.framer.com/motion/)** - Animations
- **[Lucide React](https://lucide.dev/)** - Icon library

### State Management
- **[TanStack Query 5](https://tanstack.com/query)** - Server state management
- **[Zustand 5](https://zustand-demo.pmnd.rs/)** - Client state management

### Forms & Validation
- **[React Hook Form 7](https://react-hook-form.com/)** - Form management
- **[Zod 4](https://zod.dev/)** - Schema validation

### HTTP & Real-time
- **[Axios 1.13](https://axios-http.com/)** - HTTP client
- **[Socket.io Client 4.8](https://socket.io/)** - Real-time communication

---

## 📊 Project Status

### Phase 1: Foundation ✅ (Complete)
- [x] Project setup & dependencies
- [x] TypeScript strict mode
- [x] Tailwind CSS design system
- [x] API client with interceptors
- [x] Auth store (Zustand)
- [x] TanStack Query provider
- [x] Auth hooks & services
- [x] Type definitions
- [x] Backend connection test

**Details:** [PHASE-1-COMPLETE.md](PHASE-1-COMPLETE.md)

### Phase 2: Authentication & Layouts ✅ (Complete)
- [x] UI components (Button, Input, Label)
- [x] Zod validation schemas
- [x] Login page with form validation
- [x] Register page with form validation
- [x] Auth layout with mountain background
- [x] Dashboard layout with sidebar
- [x] Protected route middleware
- [x] Complete auth flow testing

**Details:** [PHASE-2-COMPLETE.md](PHASE-2-COMPLETE.md)

### Phase 3: Groups & Trips 🚧 (In Progress)
- [ ] Groups CRUD
- [ ] Trips CRUD
- [ ] Member management
- [ ] Invitations system

### Phase 4: Features 📋 (Planned)
- [ ] Expense tracking
- [ ] Polls & voting
- [ ] Itinerary planning
- [ ] Maps integration

### Phase 5: Polish 🎨 (Planned)
- [ ] Real-time updates
- [ ] File uploads
- [ ] Advanced animations
- [ ] E2E testing

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **Backend running** on `http://localhost:4000`

### Installation

1. **Clone the repository**
   ```bash
   cd /path/to/Full\ Stack\ Project/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### First Time Setup

1. Visit `http://localhost:3000/register`
2. Create a new account
3. Automatically redirected to dashboard
4. Start exploring!

---

## 📁 Project Structure

```
frontend/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Auth route group (login, register)
│   │   ├── layout.tsx            # Auth layout with mountain bg
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Register page
│   ├── (app)/                    # Protected app routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── dashboard/page.tsx    # Dashboard overview
│   │   ├── groups/               # Groups (Phase 3)
│   │   ├── trips/                # Trips (Phase 3)
│   │   └── invitations/          # Invitations (Phase 3)
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # React Query + Auth Guard
│   └── globals.css               # Global styles + design tokens
│
├── components/
│   ├── ui/                       # Atomic UI components
│   │   ├── button.tsx            # Button (5 variants, loading)
│   │   ├── input.tsx             # Input with error states
│   │   └── label.tsx             # Form label
│   ├── providers/                # Context providers
│   │   └── auth-guard.tsx        # Protected route guard
│   ├── layout/                   # Existing navigation
│   └── sections/                 # Existing hero
│
├── lib/
│   ├── api/                      # API integration layer
│   │   ├── client.ts             # Axios with auto token refresh
│   │   ├── services/             # API service functions
│   │   │   ├── auth.service.ts   # Auth endpoints
│   │   │   └── health.service.ts # Health check
│   │   └── hooks/                # TanStack Query hooks
│   │       └── use-auth.ts       # Auth hooks (login, register, etc)
│   ├── stores/                   # Zustand state stores
│   │   └── auth-store.ts         # Auth state with persistence
│   ├── schemas/                  # Zod validation schemas
│   │   └── auth.schema.ts        # Login & register schemas
│   ├── utils/                    # Utility functions
│   │   └── cn.ts                 # className merger
│   └── constants/                # Constants & config
│
├── types/
│   ├── models.types.ts           # Backend model types (220 lines)
│   └── api.types.ts              # API request/response types (200 lines)
│
├── hooks/                        # Generic React hooks
├── middleware.ts                 # Next.js middleware (route protection)
│
├── .env.local                    # Environment variables (gitignored)
├── .env.local.example            # Environment template
├── tailwind.config.ts            # Tailwind configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
│
├── PHASE-1-COMPLETE.md           # Phase 1 documentation
├── PHASE-2-COMPLETE.md           # Phase 2 documentation
└── README.md                     # This file
```

### Key Directories

- **`app/`** - Next.js 16 App Router pages and layouts
- **`components/`** - Reusable React components
- **`lib/`** - Business logic, API calls, state management
- **`types/`** - TypeScript type definitions

---

## 🔐 Authentication

### How It Works

1. **Registration/Login**
   - User fills form (validated with Zod)
   - Submits to backend API
   - Receives access token (15 min) + refresh token (7 days)
   - Tokens stored: access in memory, refresh in httpOnly cookie

2. **Automatic Token Refresh**
   - When access token expires (401 response)
   - Axios interceptor automatically calls `/auth/refresh`
   - Gets new access token
   - Retries original request
   - User never notices!

3. **Persistent Sessions**
   - Auth state stored in localStorage (Zustand persist)
   - On page load, hydrates from localStorage
   - Restores token to Axios client
   - User stays logged in

4. **Protected Routes**
   - `AuthGuard` component wraps entire app
   - Checks `isAuthenticated` from auth store
   - Redirects to `/login` if not authenticated
   - Redirects to `/dashboard` if accessing auth pages while logged in

### Auth Flow Diagram

```
User submits login form
    ↓
useLogin().mutate({ email, password })
    ↓
authService.login() → POST /api/v1/auth/login
    ↓
Backend validates → Returns { user, accessToken, refreshToken }
    ↓
onSuccess:
  1. authStore.setUser(user)
  2. authStore.setTokens(accessToken)
  3. Axios client updated with token
  4. router.push('/dashboard')
    ↓
User sees dashboard with personalized content
```

---

## 🔗 API Integration

### Architecture

**3-Layer Pattern:**

1. **Client Layer** (`lib/api/client.ts`)
   - Axios instance with base URL
   - Request interceptor (adds auth token)
   - Response interceptor (handles errors, token refresh)

2. **Service Layer** (`lib/api/services/*.service.ts`)
   - API endpoint wrappers
   - Type-safe request/response
   - Example: `authService.login(data)`

3. **Hook Layer** (`lib/api/hooks/use-*.ts`)
   - TanStack Query hooks
   - Caching and invalidation
   - Loading/error states
   - Example: `useLogin()`

### Example Usage

```typescript
// In a component
import { useLogin } from '@/lib/api/hooks/use-auth';

function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();

  const onSubmit = (data) => {
    login(data); // Handles everything automatically!
  };

  return <form onSubmit={onSubmit}>...</form>;
}
```

### API Endpoints

Base URL: `http://localhost:4000/api/v1`

**Auth:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

**Groups (Phase 3):**
- `GET /groups` - List groups
- `POST /groups` - Create group
- `GET /groups/:id` - Get group
- `PATCH /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group

[See backend docs for complete API reference]

---

## 💻 Development

### Running the App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Development Workflow

1. **Make changes** in your editor
2. **Hot reload** happens automatically
3. **Check React Query Devtools** (bottom-left corner)
4. **Check browser console** for logs
5. **Test in browser**

### Debugging

**React Query Devtools:**
- Click icon in bottom-left corner
- View all queries and their state
- See cached data
- Trigger refetch manually

**Axios Logging:**
- Request/response logs in console (dev mode)
- Shows URL, params, data, errors

**Auth State:**
- Use React DevTools
- Find `AuthGuard` component
- Inspect `useAuthStore()` values

---

## 🌍 Environment Variables

### Required Variables

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Socket.io URL (for real-time features)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Environment
NODE_ENV=development
```

### Optional Variables

```bash
# Mapbox (for maps feature - Phase 4)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Error tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |

---

## 🎨 Design System

### Brand Colors

```css
/* Primary */
--color-forest: #2A9D8F      /* Buttons, links, highlights */

/* Secondary */
--color-sky: #56CCF2          /* Hover states, secondary actions */

/* Accent */
--color-golden: #F2C94C       /* CTAs, important elements */

/* Neutrals */
--color-stone: #E0E0E0        /* Borders, dividers */
--color-cream: #F5F5F0        /* Backgrounds */
--color-brown: #3E3E3E        /* Text */
--color-dark: #1E1E1E         /* Dark sections, headings */
```

### Typography

- **Sans-serif:** Inter (body text, UI)
- **Serif:** Playfair Display (headings, logo)

### Spacing

Tailwind's default spacing scale (4px increments)

---

## 🧪 Testing

### Manual Testing Checklist

**Auth Flow:**
- [ ] Register new account
- [ ] Login with credentials
- [ ] Access protected route while logged in
- [ ] Try accessing protected route when logged out
- [ ] Logout
- [ ] Token refresh (wait 15 mins after login)

**Form Validation:**
- [ ] Submit empty form → See error messages
- [ ] Enter invalid email → See email error
- [ ] Enter weak password → See password error
- [ ] Passwords don't match → See confirmation error

---

## 📚 Documentation

### Phase Documentation
- **[Phase 1: Foundation](PHASE-1-COMPLETE.md)** - API client, auth system, types
- **[Phase 2: Auth & Layouts](PHASE-2-COMPLETE.md)** - Login, register, dashboard

### Code Documentation
- All functions have JSDoc comments
- Complex logic explained inline
- Component props documented

---

## 🤝 Contributing

This project follows a phased development approach:

1. **Phase 1-2:** ✅ Complete
2. **Phase 3:** 🚧 In progress
3. **Phase 4-5:** 📋 Planned

See phase documentation for implementation details.

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Backend:** Express.js + PostgreSQL + Prisma
- **UI Inspiration:** Modern travel and planning apps
- **Images:** Unsplash (mountain/nature photography)

---

## 📞 Support

For questions or issues:
1. Check phase documentation
2. Review code comments
3. Inspect React Query Devtools
4. Check browser console

---

**Built with ❤️ for adventure travelers worldwide** 🏔️✈️🗺️
