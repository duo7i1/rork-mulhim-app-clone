# Mulhim App - Screens & Interactions Guide

## Navigation Flow

```
App Launch
  ├── No language selected → Welcome Screen
  ├── No user + no profile → Account Prompt Screen
  ├── User logged in + no profile → Onboarding Screen
  ├── User logged in + profile → Plan Tab
  └── Guest + local profile → Plan Tab
```

---

## 1. Welcome Screen (`/welcome`)

**Purpose:** First-time language selection.

**Interactions:**
- Tap "العربية" → Sets Arabic language, redirects to index
- Tap "English" → Sets English language, redirects to index

**Data Flow:**
- Saves language preference to AsyncStorage
- Configures RTL layout for Arabic

---

## 2. Account Prompt Screen (`/account-prompt`)

**Purpose:** Prompt user to login or skip to guest mode.

**Interactions:**
- Tap "Login" → Navigate to Login screen
- Tap "Skip" → Navigate to Onboarding screen (guest mode)

---

## 3. Login Screen (`/auth/login`)

**Purpose:** Email/password authentication.

**Interactions:**
- Enter email and password
- Tap "Sign In" → Authenticate with Supabase
- Tap "Sign Up" → Navigate to Signup screen
- On success → Redirect to index (which routes to Plan tab)

**Data Flow:**
- Calls `supabase.auth.signInWithPassword()`
- AuthProvider updates user state
- FitnessProvider fetches remote data for authenticated user

---

## 4. Signup Screen (`/auth/signup`)

**Purpose:** Create new account.

**Interactions:**
- Enter email, password, confirm password
- Tap "Sign Up" → Create account with Supabase
- Handles duplicate email detection
- On success → Shows confirmation, navigates back

**Data Flow:**
- Calls `supabase.auth.signUp()`
- Detects already-registered emails

---

## 5. Onboarding Screen (`/onboarding`)

**Purpose:** 7-step profile creation wizard.

**Steps:**
1. **Age** - Enter age (number input)
2. **Measurements** - Weight (kg) and height (cm)
3. **Gender** - Male or Female selection
4. **Goal** - Fat Loss, Muscle Gain, or General Fitness
5. **Activity Level** - None, Light, Moderate, High
6. **Training Location** - Gym, Home, Minimal Equipment
7. **Schedule** - Days per week (2-7), session duration (30-90 min), injuries

**Interactions:**
- Back/Next navigation between steps
- Step validation before proceeding
- Final step saves profile and redirects to Plan tab

**Data Flow:**
- Creates `FitnessProfile` object
- Saves to AsyncStorage + Supabase (if authenticated)
- Triggers workout plan generation

---

## 6. Plan Tab (`/(tabs)/plan`)

**Purpose:** Weekly workout plan display and management.

**Sections:**
- **Week Progress** - Progress bar showing completed/total sessions
- **Favorite Exercises** - Collapsible section with saved exercises
- **Session Cards** - Expandable workout sessions with exercises
- **Training Tips** - Static tips section

**Interactions:**
- Toggle session completion (checkbox)
- Toggle individual exercise completion
- Expand/collapse session cards
- Edit exercise (sets, reps, rest, weight via modal)
- Delete exercise from session
- Add exercise from favorites or database
- Regenerate session exercises
- Start workout → Navigate to Workout Details
- Calendar modal → Week overview

**Data Flow:**
- Auto-generates plan if none exists (using profile data)
- Filters exercises by training location and injuries
- Adjusts parameters by fitness goal
- Syncs completion state to Supabase

---

## 7. Nutrition Tab (`/(tabs)/nutrition`)

**Purpose:** Nutrition assessment, meal planning, and grocery lists.

**Sections:**
- **Calorie/Protein Summary** - Target values display
- **Assessment** - Multi-step nutrition questionnaire
- **Meal Plan** - 7-day meal plan with daily meals
- **Grocery List** - Auto-generated shopping list

**Interactions:**
- Start/complete nutrition assessment (3-step modal)
- Generate/regenerate weekly meal plan
- Toggle meal completion
- Add meals (from list, favorites, or AI-generated custom)
- Remove meals from days
- View meal details → Navigate to Meal Details
- Generate grocery list from meal plan
- Add custom grocery items
- Toggle grocery items as checked

**Data Flow:**
- Assessment determines diet pattern and macro distribution
- Meal plan scales meals to target calories
- Grocery list extracts ingredients from meal plan
- All data synced to Supabase

---

## 8. Coach Tab (`/(tabs)/coach`)

**Purpose:** AI-powered fitness coaching chat.

**Features:**
- Real-time AI chat with tool-calling capabilities
- Quick action buttons for common requests
- Save suggested workouts/meals to plan or favorites

**Interactions:**
- Type message and send to AI coach
- Quick actions: Today's Workout, Today's Meal, Progress Analysis, Tips
- Save workout → Modal with day selection + favorites option
- Save meal → Modal with meal type, day selection + favorites option

**AI Tools:**
- `suggestWorkout` - Generates exercise suggestions
- `suggestMeal` - Generates Saudi meal suggestions
- `trackProgress` - Analyzes progress trends
- `adjustPlan` - Recommends plan modifications

**Data Flow:**
- Uses `@rork-ai/toolkit-sdk` for AI agent
- Context includes user profile, current plan, streak
- Saves suggestions to FitnessProvider state

---

## 9. Profile Tab (`/(tabs)/profile`)

**Purpose:** User profile, stats, and settings.

**Sections:**
- **Header** - Avatar, gender, age
- **Stats** - Streak, total workouts, current weight
- **Advanced Customization** - Bioinformatics card link
- **Weight Progress** - Start vs current weight comparison
- **Fitness Profile** - Goal, level, workout schedule
- **Body Metrics** - BMI, BMR, TDEE, target calories
- **Recent Activity** - Last 5 workout logs
- **Account** - Edit profile, notifications, privacy, language
- **Logout** - Sign out button
- **Motivation** - Dynamic streak message

**Interactions:**
- Update weight (tap current weight stat → modal)
- Edit profile (full-screen modal with all settings)
- Change language (Arabic/English modal)
- Sign out
- Navigate to Bioinformatics page

**Data Flow:**
- Reads from FitnessProvider
- Weight update creates progress entry
- Profile edit saves to Supabase + triggers plan regeneration

---

## 10. Workout Details Screen (`/workout-details`)

**Purpose:** Detailed exercise-by-exercise workout view.

**Interactions:**
- Toggle exercise completion
- Watch video tutorial (opens YouTube)
- View exercise description, equipment, weight
- Back navigation

**Data Flow:**
- Reads session from current week plan by sessionId
- Updates completion state in FitnessProvider

---

## 11. Meal Details Screen (`/meal-details`)

**Purpose:** Detailed meal view with editing capabilities.

**Interactions:**
- Toggle measurement unit (weight vs volume)
- Edit mode: modify meal name, calories, macros, ingredients
- Add/remove ingredients
- Save changes back to meal plan

**Data Flow:**
- Receives meal data as JSON route parameter
- Updates meal in FitnessProvider when saved

---

## 12. Bioinformatics Screen (`/bioinformatics`)

**Purpose:** Concept page for future genetic customization feature.

**Interactions:**
- Scroll through informational sections
- Join waitlist with email
- Back navigation

**Data Flow:**
- Email waitlist is local-only (concept page)
