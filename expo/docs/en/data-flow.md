# Mulhim App - Data Flow & Supabase Integration

## Overview

Mulhim uses a dual-layer data strategy combining local persistence (AsyncStorage) with cloud sync (Supabase). This ensures the app works offline while keeping data synchronized across devices for authenticated users.

---

## Data Layers

### Layer 1: Local Cache (AsyncStorage)

All data is first stored locally for instant access:

| Key | Data Type | Description |
|-----|-----------|-------------|
| `@mulhim_profile` | `FitnessProfile` | User fitness profile |
| `@mulhim_progress` | `ProgressEntry[]` | Weight tracking entries |
| `@mulhim_workout_logs` | `WorkoutLog[]` | Completed workout records |
| `@mulhim_week_plan` | `WeeklyPlan` | Current weekly workout plan |
| `@mulhim_nutrition` | `NutritionAssessment` | Nutrition questionnaire data |
| `@mulhim_nutrition_plan` | `NutritionPlan` | Generated nutrition targets |
| `@mulhim_meal_plan` | `WeeklyMealPlan` | Weekly meal schedule |
| `@mulhim_grocery_list` | `GroceryList` | Shopping list |
| `@mulhim_favorite_exercises` | `FavoriteExercise[]` | Saved exercises |
| `@mulhim_favorite_meals` | `FavoriteMeal[]` | Saved meals |
| `@mulhim_language` | `'ar' \| 'en'` | Language preference |

### Layer 2: Remote Sync (Supabase)

Authenticated users get cloud sync via the `remoteFitnessRepo` service:

```
services/remoteRepo.ts
├── Profile CRUD
│   ├── upsertProfile()
│   └── fetchProfile()
├── Progress
│   ├── insertProgressEntry()
│   └── fetchProgressEntries()
├── Workout Plans
│   ├── saveWorkoutPlan()
│   ├── fetchActiveWorkoutPlan()
│   └── updateSessionCompletion()
├── Workout Logs
│   ├── insertWorkoutLog()
│   └── fetchWorkoutLogs()
├── Nutrition Plans
│   ├── saveNutritionPlan()
│   └── fetchActiveNutritionPlan()
├── Favorite Exercises
│   ├── addFavoriteExercise()
│   ├── removeFavoriteExercise()
│   └── fetchFavoriteExercises()
└── Favorite Meals
    ├── addFavoriteMeal()
    ├── removeFavoriteMeal()
    └── fetchFavoriteMeals()
```

---

## Boot Sequence

When the app starts, `FitnessProvider.loadData()` executes:

```
Step 1: Hydrate from AsyncStorage
  ├── Load all 10 cache keys in parallel
  ├── Parse JSON safely (with fallbacks)
  └── Set React state immediately

Step 2: (If authenticated) Sync from Supabase
  ├── Fetch profile, progress, logs, favorites in parallel
  │   (each with individual error handling via safeFetch)
  ├── Update React state with remote data
  ├── Update AsyncStorage cache
  ├── Fetch workout plan (separate try/catch)
  ├── Fetch nutrition plan (separate try/catch)
  └── Push local-only data to Supabase if remote is empty
```

### Error Handling Strategy

- Network errors are caught and the app falls back to local cache
- Individual fetch failures don't block other data from loading
- `NETWORK_ERROR` sentinel value propagates through the system
- Supabase errors are logged with full context (message, details, hint, code)

---

## Write Operations

### Profile Save Flow

```
User saves profile
  ├── If authenticated:
  │   └── remoteFitnessRepo.upsertProfile() [try/catch]
  ├── AsyncStorage.setItem(PROFILE_KEY)
  └── setProfile(state)
```

### Workout Completion Flow

```
User toggles exercise completion
  ├── Calculate new completedExercises array
  ├── Check if all exercises completed
  ├── If authenticated:
  │   └── remoteFitnessRepo.updateSessionCompletion() [fire-and-forget]
  ├── Update React state
  └── AsyncStorage.setItem(WEEK_PLAN_KEY)
```

### Nutrition Plan Flow

```
User completes nutrition assessment
  ├── Extract favorite meals from diet history
  ├── Save assessment to AsyncStorage
  ├── Generate nutrition plan (calculations in hooks/)
  ├── Save plan to AsyncStorage
  └── If authenticated:
      └── remoteFitnessRepo.saveNutritionPlan() [fire-and-forget]
```

---

## Supabase Database Schema

### Entity Relationship

```
auth.users (Supabase Auth)
  └── user_profiles (1:1)
  └── progress_entries (1:many)
  └── workout_plans (1:many)
  │     └── workout_sessions (1:many)
  │           └── exercises (1:many)
  └── workout_logs (1:many)
  │     └── exercise_logs (1:many)
  └── nutrition_plans (1:many)
  │     └── meal_plans (1:many)
  │           └── meals (1:many)
  └── favorite_exercises (1:many)
  └── favorite_meals (1:many)
```

### Key Columns

**workout_plans:**
- `status`: `'active'` | `'archived'` - Only one active plan per user
- `generated_by`: `'ai'` - Plan generation source

**workout_sessions:**
- `is_completed`: boolean - Session completion status
- `completed_exercises`: text[] - Array of completed exercise IDs

**nutrition_plans:**
- `daily_calories_target`: integer - Rounded calorie target
- `protein_g`, `carbs_g`, `fats_g`: integer - Rounded macro targets
- `diet_pattern`: text - One of: balanced, high_protein, high_protein_carbs, moderate_low_carb

---

## Network Resilience

The `remoteRepo` implements several patterns for network resilience:

### Retry Logic

```typescript
retryFetch(fn, retries = 2, delay = 1000)
```

- Retries up to 2 times on network errors
- Exponential backoff: 1s, 2s delays
- Only retries on `TypeError` / `Failed to fetch` errors
- Non-network errors propagate immediately

### Error Classification

```
Network errors (retry + fallback to cache):
  - TypeError: Failed to fetch
  - Any TypeError

Supabase errors (log + throw):
  - PGRST116: Not found (handled gracefully)
  - PGRST204: Column not found
  - 22P02: Invalid input syntax

Application errors (throw):
  - All other errors
```

### Offline Support

- Guest users work entirely offline with AsyncStorage
- Authenticated users get cached data on network failure
- Local changes are not queued for later sync (write fails silently logged)
