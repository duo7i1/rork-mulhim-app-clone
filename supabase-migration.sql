-- ============================================
-- Mulhim Fitness App - Full Supabase Migration
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Project URL: https://fkwlgzkglyrmzdbscqbj.supabase.co

-- ============================================
-- 1. USER PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  weight NUMERIC(6,2) NOT NULL,
  height NUMERIC(6,2) NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  target_weight NUMERIC(6,2),
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goal TEXT NOT NULL CHECK (goal IN ('fat_loss', 'muscle_gain', 'general_fitness')),
  training_location TEXT NOT NULL CHECK (training_location IN ('gym', 'home', 'minimal_equipment')),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('none', 'light', 'moderate', 'high')),
  available_days INTEGER NOT NULL DEFAULT 3,
  session_duration INTEGER NOT NULL DEFAULT 60,
  injuries TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- ============================================
-- 2. PROGRESS ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC(6,2) NOT NULL,
  notes TEXT,
  measured_at TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS progress_entries_user_id_idx ON progress_entries(user_id);
CREATE INDEX IF NOT EXISTS progress_entries_measured_at_idx ON progress_entries(measured_at);

-- ============================================
-- 3. WORKOUT PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER DEFAULT 1,
  generated_by TEXT DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  started_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_plans_user_id_idx ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS workout_plans_status_idx ON workout_plans(status);

-- ============================================
-- 4. WORKOUT SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  session_name TEXT NOT NULL,
  estimated_duration INTEGER DEFAULT 60,
  rest_note TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_sessions_plan_id_idx ON workout_sessions(plan_id);

-- ============================================
-- 5. EXERCISES (within workout sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  rest_seconds INTEGER DEFAULT 60,
  muscle_group TEXT,
  equipment JSONB DEFAULT '[]',
  assigned_weight TEXT,
  video_url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exercises_session_id_idx ON exercises(session_id);

-- ============================================
-- 6. WORKOUT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  completed_at TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_logs_user_id_idx ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_completed_at_idx ON workout_logs(completed_at);

-- ============================================
-- 7. EXERCISE LOGS (within workout logs)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  reps_completed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exercise_logs_workout_log_id_idx ON exercise_logs(workout_log_id);

-- ============================================
-- 8. NUTRITION PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  daily_calories_target INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fats_g INTEGER NOT NULL,
  meal_count_per_day INTEGER DEFAULT 3,
  diet_pattern TEXT DEFAULT 'balanced' CHECK (diet_pattern IN ('balanced', 'high_protein', 'high_protein_carbs', 'moderate_low_carb')),
  generated_by TEXT DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nutrition_plans_user_id_idx ON nutrition_plans(user_id);
CREATE INDEX IF NOT EXISTS nutrition_plans_status_idx ON nutrition_plans(status);

-- ============================================
-- 9. MEAL PLANS (daily plans within nutrition plan)
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  date TEXT,
  total_calories INTEGER DEFAULT 0,
  total_protein INTEGER DEFAULT 0,
  total_carbs INTEGER DEFAULT 0,
  total_fats INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_plans_nutrition_plan_id_idx ON meal_plans(nutrition_plan_id);

-- ============================================
-- 10. MEALS (individual meals within daily plan)
-- ============================================
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL,
  name_ar TEXT,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fats INTEGER DEFAULT 0,
  ingredients JSONB DEFAULT '[]',
  ingredients_ar JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meals_meal_plan_id_idx ON meals(meal_plan_id);

-- ============================================
-- 11. FAVORITE EXERCISES
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10',
  rest_seconds INTEGER DEFAULT 60,
  muscle_group TEXT,
  equipment JSONB DEFAULT '[]',
  assigned_weight TEXT,
  video_url TEXT,
  description TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS favorite_exercises_user_id_idx ON favorite_exercises(user_id);

-- ============================================
-- 12. FAVORITE MEALS
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fats INTEGER DEFAULT 0,
  ingredients JSONB DEFAULT '[]',
  ingredients_ar JSONB DEFAULT '[]',
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS favorite_meals_user_id_idx ON favorite_meals(user_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_entries_updated_at ON progress_entries;
CREATE TRIGGER update_progress_entries_updated_at
  BEFORE UPDATE ON progress_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_plans_updated_at ON workout_plans;
CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_logs_updated_at ON workout_logs;
CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nutrition_plans_updated_at ON nutrition_plans;
CREATE TRIGGER update_nutrition_plans_updated_at
  BEFORE UPDATE ON nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_meals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: user_profiles
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: progress_entries
-- ============================================
DROP POLICY IF EXISTS "Users can view own progress" ON progress_entries;
CREATE POLICY "Users can view own progress" ON progress_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON progress_entries;
CREATE POLICY "Users can insert own progress" ON progress_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON progress_entries;
CREATE POLICY "Users can update own progress" ON progress_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own progress" ON progress_entries;
CREATE POLICY "Users can delete own progress" ON progress_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: workout_plans
-- ============================================
DROP POLICY IF EXISTS "Users can view own plans" ON workout_plans;
CREATE POLICY "Users can view own plans" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON workout_plans;
CREATE POLICY "Users can insert own plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON workout_plans;
CREATE POLICY "Users can update own plans" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plans" ON workout_plans;
CREATE POLICY "Users can delete own plans" ON workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: workout_sessions (via plan ownership)
-- ============================================
DROP POLICY IF EXISTS "Users can view own sessions" ON workout_sessions;
CREATE POLICY "Users can view own sessions" ON workout_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = workout_sessions.plan_id AND workout_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own sessions" ON workout_sessions;
CREATE POLICY "Users can insert own sessions" ON workout_sessions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = plan_id AND workout_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own sessions" ON workout_sessions;
CREATE POLICY "Users can update own sessions" ON workout_sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = workout_sessions.plan_id AND workout_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own sessions" ON workout_sessions;
CREATE POLICY "Users can delete own sessions" ON workout_sessions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = workout_sessions.plan_id AND workout_plans.user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: exercises (via session -> plan ownership)
-- ============================================
DROP POLICY IF EXISTS "Users can view own exercises" ON exercises;
CREATE POLICY "Users can view own exercises" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = exercises.session_id AND wp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own exercises" ON exercises;
CREATE POLICY "Users can insert own exercises" ON exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = session_id AND wp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own exercises" ON exercises;
CREATE POLICY "Users can update own exercises" ON exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = exercises.session_id AND wp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own exercises" ON exercises;
CREATE POLICY "Users can delete own exercises" ON exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN workout_plans wp ON wp.id = ws.plan_id
      WHERE ws.id = exercises.session_id AND wp.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: workout_logs
-- ============================================
DROP POLICY IF EXISTS "Users can view own logs" ON workout_logs;
CREATE POLICY "Users can view own logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON workout_logs;
CREATE POLICY "Users can insert own logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own logs" ON workout_logs;
CREATE POLICY "Users can update own logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logs" ON workout_logs;
CREATE POLICY "Users can delete own logs" ON workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: exercise_logs (via workout_log ownership)
-- ============================================
DROP POLICY IF EXISTS "Users can view own exercise logs" ON exercise_logs;
CREATE POLICY "Users can view own exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workout_logs WHERE workout_logs.id = exercise_logs.workout_log_id AND workout_logs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own exercise logs" ON exercise_logs;
CREATE POLICY "Users can insert own exercise logs" ON exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workout_logs WHERE workout_logs.id = workout_log_id AND workout_logs.user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: nutrition_plans
-- ============================================
DROP POLICY IF EXISTS "Users can view own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can view own nutrition plans" ON nutrition_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can insert own nutrition plans" ON nutrition_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can update own nutrition plans" ON nutrition_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own nutrition plans" ON nutrition_plans;
CREATE POLICY "Users can delete own nutrition plans" ON nutrition_plans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: meal_plans (via nutrition_plan ownership)
-- ============================================
DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM nutrition_plans WHERE nutrition_plans.id = meal_plans.nutrition_plan_id AND nutrition_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own meal plans" ON meal_plans;
CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM nutrition_plans WHERE nutrition_plans.id = nutrition_plan_id AND nutrition_plans.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own meal plans" ON meal_plans;
CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM nutrition_plans WHERE nutrition_plans.id = meal_plans.nutrition_plan_id AND nutrition_plans.user_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: meals (via meal_plan -> nutrition_plan ownership)
-- ============================================
DROP POLICY IF EXISTS "Users can view own meals" ON meals;
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
      WHERE mp.id = meals.meal_plan_id AND np.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
      WHERE mp.id = meal_plan_id AND np.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own meals" ON meals;
CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM meal_plans mp
      JOIN nutrition_plans np ON np.id = mp.nutrition_plan_id
      WHERE mp.id = meals.meal_plan_id AND np.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: favorite_exercises
-- ============================================
DROP POLICY IF EXISTS "Users can view own fav exercises" ON favorite_exercises;
CREATE POLICY "Users can view own fav exercises" ON favorite_exercises
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fav exercises" ON favorite_exercises;
CREATE POLICY "Users can insert own fav exercises" ON favorite_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own fav exercises" ON favorite_exercises;
CREATE POLICY "Users can delete own fav exercises" ON favorite_exercises
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: favorite_meals
-- ============================================
DROP POLICY IF EXISTS "Users can view own fav meals" ON favorite_meals;
CREATE POLICY "Users can view own fav meals" ON favorite_meals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own fav meals" ON favorite_meals;
CREATE POLICY "Users can insert own fav meals" ON favorite_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own fav meals" ON favorite_meals;
CREATE POLICY "Users can delete own fav meals" ON favorite_meals
  FOR DELETE USING (auth.uid() = user_id);
