# Mulhim App - Architecture Documentation

## Overview

Mulhim is a bilingual (Arabic/English) fitness and nutrition mobile application built with React Native (Expo). It provides personalized workout plans, nutrition tracking, an AI coach, and progress monitoring, all integrated with Supabase for cloud data persistence.

---

## Project Structure

```
mulhim-app/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry point / router
│   ├── welcome.tsx               # Language selection screen
│   ├── account-prompt.tsx        # Login/skip prompt
│   ├── onboarding.tsx            # User profile setup wizard
│   ├── workout-details.tsx       # Workout session detail view
│   ├── meal-details.tsx          # Meal detail & edit view
│   ├── bioinformatics.tsx        # Future feature concept page
│   ├── auth/
│   │   ├── login.tsx             # Email/password login
│   │   └── signup.tsx            # Account registration
│   └── (tabs)/
│       ├── _layout.tsx           # Tab navigation config
│       ├── plan.tsx              # Workout plan tab
│       ├── nutrition.tsx         # Nutrition & meal plan tab
│       ├── coach.tsx             # AI coach chat tab
│       └── profile.tsx           # User profile & settings tab
│
├── services/                     # External service integrations
│   ├── supabase.ts               # Supabase client initialization
│   └── remoteRepo.ts             # Supabase CRUD operations (remote data layer)
│
├── hooks/                        # Custom React hooks (business logic)
│   └── useFitnessCalculations.ts # BMR, TDEE, macros, nutrition plan generation
│
├── providers/                    # React context providers
│   ├── AuthProvider.tsx          # Authentication state (Supabase Auth)
│   ├── FitnessProvider.tsx       # Fitness data state (profiles, plans, logs)
│   └── LanguageProvider.tsx      # i18n / language state
│
├── types/                        # TypeScript type definitions
│   └── fitness.ts                # All fitness-related interfaces and types
│
├── constants/                    # App constants
│   ├── colors.ts                 # Color palette
│   └── translations.ts          # Arabic & English translation strings
│
├── data/                         # Static data / mock data
│   ├── exercises.ts              # Exercise database with video links
│   └── meals.ts                  # Saudi meal suggestions database
│
├── lib/                          # Library utilities
│   └── trpc.ts                   # tRPC client setup (infrastructure)
│
├── backend/                      # Backend API (Hono + tRPC)
│   ├── hono.ts                   # Hono server entry point
│   └── trpc/                     # tRPC router definitions
│       ├── app-router.ts
│       ├── create-context.ts
│       └── routes/
│           └── example.ts
│
└── docs/                         # Documentation
    ├── en/                       # English documentation
    └── ar/                       # Arabic documentation
```

---

## Architecture Layers

### 1. Services Layer (`services/`)

The services layer handles all external communication:

- **`supabase.ts`** - Initializes the Supabase client with AsyncStorage for session persistence and platform-specific configuration.
- **`remoteRepo.ts`** - Repository pattern implementation for all Supabase CRUD operations. Includes retry logic for network resilience and proper error handling.

**Key features:**
- Automatic retry on network failures (up to 2 retries with exponential backoff)
- Network error detection and wrapping
- Batch insert support for large exercise datasets
- Conflict resolution for upsert operations

### 2. Hooks Layer (`hooks/`)

Pure business logic extracted from providers:

- **`useFitnessCalculations.ts`** - Contains all fitness calculation functions:
  - `calculateBMR()` - Basal Metabolic Rate (Mifflin-St Jeor equation)
  - `calculateTDEE()` - Total Daily Energy Expenditure
  - `getTargetCalories()` - Goal-adjusted calorie targets
  - `calculateMacros()` - Macro distribution based on diet pattern
  - `generateNutritionPlan()` - Full nutrition plan generation
  - `extractFavoriteMealsFromHistory()` - Diet history analysis
  - `useCurrentWeight()` - React hook for latest weight
  - `useCurrentStreak()` - React hook for workout streak

### 3. Providers Layer (`providers/`)

React context providers for shared state:

- **`AuthProvider`** - Manages Supabase authentication state, exposes `signIn`, `signUp`, `signOut`, `resetPassword`.
- **`FitnessProvider`** - Central state management for all fitness data. Implements a dual-layer caching strategy:
  1. **Local cache** (AsyncStorage) - Immediate hydration on app start
  2. **Remote sync** (Supabase) - Background refresh when user is authenticated
- **`LanguageProvider`** - Manages language selection (Arabic/English) with RTL support.

### 4. Screen Layer (`app/`)

Thin screen components that compose providers, hooks, and UI:

- Screens handle routing, user interactions, and UI rendering
- Business logic is delegated to hooks and providers
- Styles are co-located with screen components using `StyleSheet.create()`

---

## Data Flow

### Authentication Flow

```
Welcome Screen → Language Selection → Account Prompt
                                         ├── Login → Index (redirect)
                                         ├── Signup → Login → Index
                                         └── Skip → Onboarding → Plan Tab
```

### Data Sync Strategy

```
App Boot:
1. Load from AsyncStorage (instant)
2. If user authenticated:
   a. Fetch from Supabase (background)
   b. Merge remote data with local cache
   c. Push local-only data to Supabase
3. If no user:
   a. Use local cache only
```

### Workout Plan Generation

```
Profile → PlanScreen.generateWeeklyPlan():
1. Select workout template based on available days
2. Filter exercises by training location
3. Filter exercises by injuries
4. Adjust sets/reps/rest by goal
5. Add warmup + cooldown
6. Save to AsyncStorage + Supabase
```

### Nutrition Plan Generation

```
Assessment → FitnessProvider.saveNutritionAssessment():
1. Analyze diet history
2. Calculate target calories (BMR × activity × goal)
3. Determine diet pattern
4. Calculate macro distribution
5. Generate meal plan from Saudi meals database
6. Save to AsyncStorage + Supabase
```

---

## Supabase Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User fitness profiles (age, weight, goals) |
| `progress_entries` | Weight tracking over time |
| `workout_plans` | Generated workout plans (active/archived) |
| `workout_sessions` | Individual workout sessions within a plan |
| `exercises` | Exercises within a session |
| `workout_logs` | Completed workout records |
| `exercise_logs` | Individual exercise completion data |
| `nutrition_plans` | Generated nutrition plans |
| `meal_plans` | Daily meal plans within a nutrition plan |
| `meals` | Individual meals within a meal plan |
| `favorite_exercises` | User's saved favorite exercises |
| `favorite_meals` | User's saved favorite meals |

### Row Level Security

All tables use RLS policies that restrict access to the authenticated user's own data via `auth.uid() = user_id`.

---

## Key Technologies

| Technology | Usage |
|-----------|-------|
| Expo SDK 54 | React Native framework |
| Expo Router | File-based routing |
| Supabase | Auth + PostgreSQL database |
| React Query | Server state management |
| AsyncStorage | Local data persistence |
| @nkzw/create-context-hook | Typed context providers |
| @rork-ai/toolkit-sdk | AI coach (chat agent) |
| lucide-react-native | Icon library |
| zod | Schema validation |

---

## Screens Reference

| Screen | Route | Description |
|--------|-------|-------------|
| Index | `/` | Entry point, redirects based on auth/profile state |
| Welcome | `/welcome` | Language selection (AR/EN) |
| Account Prompt | `/account-prompt` | Login or skip prompt |
| Login | `/auth/login` | Email/password authentication |
| Signup | `/auth/signup` | Account registration |
| Onboarding | `/onboarding` | 7-step profile setup wizard |
| Plan | `/(tabs)/plan` | Weekly workout plan with exercises |
| Nutrition | `/(tabs)/nutrition` | Nutrition assessment, meal plans, grocery lists |
| Coach | `/(tabs)/coach` | AI-powered fitness coach chat |
| Profile | `/(tabs)/profile` | User profile, stats, settings |
| Workout Details | `/workout-details` | Exercise-by-exercise workout view |
| Meal Details | `/meal-details` | Meal nutrition info and ingredient editing |
| Bioinformatics | `/bioinformatics` | Future genetic customization concept |
