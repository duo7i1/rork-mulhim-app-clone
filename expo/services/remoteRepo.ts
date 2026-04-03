import { supabase } from './supabase';
import type {
  FitnessProfile,
  ProgressEntry,
  WorkoutLog,
  WorkoutExercise,
  WeeklyPlan,
  FavoriteExercise,
  FavoriteMeal,
  WeeklyMealPlan,
  DailyMealPlan,
  MealSuggestion,
  NutritionPlan,
  DietPattern,
  WorkoutSession,
} from '@/types/fitness';

function withTimeout<T>(promise: Promise<T>, ms = 15000, label = 'operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`[RemoteRepo] Timeout after ${ms}ms for ${label}`);
      reject(new Error('NETWORK_ERROR'));
    }, ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

async function retryFetch<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await withTimeout(fn(), 15000, `retry ${i}`);
    } catch (e: any) {
      const isNetworkError = e?.message?.includes('Failed to fetch') || e?.message === 'NETWORK_ERROR' || e?.name === 'TypeError';
      if (isNetworkError && i < retries) {
        console.log(`[RemoteRepo] Retry ${i + 1}/${retries} after network error`);
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error('NETWORK_ERROR');
}

function wrapNetworkError(error: any): never {
  if (error?.message === 'NETWORK_ERROR') throw error;
  if (
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('fetch') ||
    error?.name === 'TypeError'
  ) {
    console.error('[RemoteRepo] Network error detected:', error);
    throw new Error('NETWORK_ERROR');
  }
  throw error;
}

function ensureStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(v => String(v));
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((v: unknown) => String(v));
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

function toPostgresArray(arr: string[]): string {
  const escaped = arr.map(item => {
    const s = String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${s}"`;
  });
  return `{${escaped.join(',')}}`;
}

function handleSupabaseError(error: any, context: string): never {
  console.error(`[RemoteRepo] ${context}:`, JSON.stringify({
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  }, null, 2));
  if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
    throw new Error('NETWORK_ERROR');
  }
  throw error;
}

export const remoteFitnessRepo = {

  async upsertProfile(userId: string, profile: FitnessProfile) {
    console.log('[RemoteRepo] Upserting profile for user:', userId, 'name:', profile.name);
    try {
      const payload = {
        user_id: userId,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        target_weight: profile.targetWeight ?? null,
        fitness_level: profile.fitnessLevel,
        goal: profile.goal,
        training_location: profile.trainingLocation,
        activity_level: profile.activityLevel,
        available_days: profile.availableDays,
        session_duration: profile.sessionDuration,
        injuries: profile.injuries || null,
        name: profile.name ?? null,
      };
      console.log('[RemoteRepo] Upsert payload name value:', JSON.stringify(payload.name));
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error upserting profile');
      console.log('[RemoteRepo] Profile upserted successfully, returned name:', (data as any)?.name);
      return data;
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchProfile(userId: string): Promise<FitnessProfile | null> {
    console.log('[RemoteRepo] Fetching profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[RemoteRepo] Profile not found');
          return null;
        }
        handleSupabaseError(error, 'Error fetching profile');
      }

      console.log('[RemoteRepo] Profile fetched successfully');
      const row = data as any;
      return {
        age: row.age,
        weight: Number(row.weight),
        height: Number(row.height),
        gender: row.gender,
        goal: row.goal,
        fitnessLevel: row.fitness_level,
        trainingLocation: row.training_location,
        activityLevel: row.activity_level,
        availableDays: row.available_days,
        sessionDuration: row.session_duration,
        injuries: row.injuries || '',
        targetWeight: row.target_weight ? Number(row.target_weight) : undefined,
        name: row.name || '',
      };
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async insertProgressEntry(userId: string, entry: ProgressEntry) {
    console.log('[RemoteRepo] Inserting progress entry for user:', userId);
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .insert({
          user_id: userId,
          weight: entry.weight,
          notes: entry.notes || null,
          measured_at: entry.date,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error inserting progress entry');
      console.log('[RemoteRepo] Progress entry inserted successfully');
      return data;
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchProgressEntries(userId: string): Promise<ProgressEntry[]> {
    console.log('[RemoteRepo] Fetching progress entries for user:', userId);
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Error fetching progress entries');
      console.log('[RemoteRepo] Progress entries fetched:', data?.length);
      return (data || []).map((row: any) => ({
        id: row.id,
        date: row.measured_at,
        weight: Number(row.weight),
        notes: row.notes || undefined,
      }));
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async insertWorkoutLog(userId: string, log: WorkoutLog) {
    console.log('[RemoteRepo] Inserting workout log for user:', userId, 'sessionId:', log.sessionId);
    try {
      const { data: existing } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('session_id', log.sessionId)
        .maybeSingle();

      if (existing) {
        console.log('[RemoteRepo] Workout log already exists for session:', log.sessionId);
        return existing;
      }

      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          session_id: log.sessionId || null,
          completed_at: log.date,
          duration_minutes: log.duration || 0,
          notes: log.notes || null,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error inserting workout log');
      console.log('[RemoteRepo] Workout log inserted successfully, id:', data?.id);
      return data;
    } catch (e: any) {
      if (e?.message === 'NETWORK_ERROR' || e?.message?.includes('Failed to fetch')) {
        console.warn('[RemoteRepo] Network error inserting workout log');
        return null;
      }
      console.error('[RemoteRepo] Error inserting workout log:', e?.message || e);
      return null;
    }
  },

  async fetchWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
    console.log('[RemoteRepo] Fetching workout logs for user:', userId);
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Error fetching workout logs');
      console.log('[RemoteRepo] Workout logs fetched:', data?.length);
      return (data || []).map((row: any) => ({
        id: row.id,
        sessionId: row.session_id || '',
        date: row.completed_at,
        duration: row.duration_minutes || 0,
        notes: row.notes || '',
        exercises: [],
      }));
    } catch (e: any) {
      if (e?.message === 'NETWORK_ERROR' || e?.message?.includes('Failed to fetch')) {
        console.warn('[RemoteRepo] Network error fetching workout logs');
        return [];
      }
      console.error('[RemoteRepo] Error fetching workout logs:', e?.message || e);
      return [];
    }
  },

  async saveWorkoutPlan(userId: string, plan: WeeklyPlan): Promise<string | null> {
    console.log('[RemoteRepo] Saving workout plan for user:', userId);
    try {
      return await retryFetch(async () => {
        const { data: existingPlans } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (existingPlans && existingPlans.length > 0) {
          await supabase
            .from('workout_plans')
            .update({ status: 'archived' })
            .eq('user_id', userId)
            .eq('status', 'active');
        }

        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .insert({
            user_id: userId,
            name: `Week ${plan.weekNumber}`,
            description: `${plan.startDate} - ${plan.endDate}`,
            duration_weeks: 1,
            generated_by: 'ai',
            status: 'active',
            started_at: plan.startDate,
          })
          .select()
          .single();

        if (planError) handleSupabaseError(planError, 'Error saving workout plan');
        const planId = planData.id;

        const usedDayNumbers = new Set<number>();
        const sessionRows = plan.sessions.map((session, si) => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          let dayIndex = dayNames.indexOf(session.day) + 1;
          if (dayIndex <= 0) dayIndex = si + 1;
          while (usedDayNumbers.has(dayIndex)) {
            dayIndex++;
          }
          usedDayNumbers.add(dayIndex);
          return {
            plan_id: planId,
            day_number: dayIndex,
            day_name: session.day,
            session_name: session.name,
            estimated_duration: session.duration,
            rest_note: session.restNote || null,
            is_completed: session.completed || false,
          };
        });

        const { data: sessionsData, error: sessionsError } = await supabase
          .from('workout_sessions')
          .insert(sessionRows)
          .select();

        if (sessionsError) {
          console.error('[RemoteRepo] Error saving sessions:', JSON.stringify(sessionsError));
        }

        if (sessionsData && sessionsData.length > 0) {
          const sortedSessions = [...sessionsData].sort((a, b) => a.day_number - b.day_number);
          const allExerciseRows: any[] = [];

          for (let si = 0; si < plan.sessions.length; si++) {
            const session = plan.sessions[si];
            const dbSession = sortedSessions[si];
            if (!dbSession || !session.exercises || session.exercises.length === 0) continue;

            for (let idx = 0; idx < session.exercises.length; idx++) {
              const ex = session.exercises[idx];
              allExerciseRows.push({
                session_id: dbSession.id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest_seconds: ex.rest,
                muscle_group: ex.muscleGroup || null,
                equipment: ex.equipment || [],
                assigned_weight: ex.assignedWeight || null,
                video_url: ex.videoUrl || null,
                description: ex.description || null,
                order_index: idx,
              });
            }
          }

          if (allExerciseRows.length > 0) {
            const BATCH_SIZE = 50;
            for (let i = 0; i < allExerciseRows.length; i += BATCH_SIZE) {
              const batch = allExerciseRows.slice(i, i + BATCH_SIZE);
              const { error: exError } = await supabase
                .from('exercises')
                .insert(batch);

              if (exError) {
                console.error('[RemoteRepo] Error saving exercises batch:', exError);
              }
            }
          }
        }

        console.log('[RemoteRepo] Workout plan saved successfully, id:', planId);
        return planId;
      });
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async updateSessionCompletion(sessionId: string, completed: boolean, completedAt: string | undefined, completedExercises: string[]) {
    console.log('[RemoteRepo] Updating session completion:', sessionId, 'completed:', completed, 'exercises:', completedExercises.length);
    try {
      const { data: existing } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle();

      if (!existing) {
        console.warn('[RemoteRepo] Session not found in Supabase, skipping update for id:', sessionId);
        return;
      }

      const baseUpdateData: Record<string, unknown> = {
        is_completed: completed,
      };

      if (completedAt) {
        baseUpdateData.completed_at = completedAt;
      }

      if (completedExercises.length > 0 || completed) {
        baseUpdateData.completed_exercises = completedExercises;
      }

      const attemptedColumns = new Set<string>();
      let updateData: Record<string, unknown> = { ...baseUpdateData };

      while (Object.keys(updateData).length > 0) {
        Object.keys(updateData).forEach((key) => attemptedColumns.add(key));

        const { error } = await supabase
          .from('workout_sessions')
          .update(updateData)
          .eq('id', sessionId);

        if (!error) {
          console.log('[RemoteRepo] Session completion updated successfully with columns:', Object.keys(updateData));
          return;
        }

        const missingColumn = typeof error.message === 'string'
          ? error.message.match(/Could not find the '([^']+)' column/i)?.[1]
          : undefined;

        if (error.code === 'PGRST204' && missingColumn && missingColumn in updateData) {
          console.warn('[RemoteRepo] Missing workout_sessions column detected, retrying without column:', missingColumn);
          delete updateData[missingColumn];
          continue;
        }

        console.error('[RemoteRepo] Error updating session completion:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          attemptedColumns: Array.from(attemptedColumns),
        }));
        return;
      }

      console.warn('[RemoteRepo] Session completion fallback exhausted because no supported columns were left to update');
    } catch (e: any) {
      if (e?.message === 'NETWORK_ERROR' || e?.message?.includes('Failed to fetch')) {
        console.warn('[RemoteRepo] Network error updating session completion');
      } else {
        console.error('[RemoteRepo] Error updating session completion:', JSON.stringify(e?.message || e));
      }
    }
  },

  async fetchActiveWorkoutPlan(userId: string): Promise<WeeklyPlan | null> {
    console.log('[RemoteRepo] Fetching active workout plan for user:', userId);
    try {
      const { data: planData, error: planError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) handleSupabaseError(planError, 'Error fetching workout plan');
      if (!planData) {
        console.log('[RemoteRepo] No active workout plan found');
        return null;
      }

      const { data: sessions, error: sessError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises (*)
        `)
        .eq('plan_id', planData.id)
        .order('day_number', { ascending: true });

      if (sessError) handleSupabaseError(sessError, 'Error fetching workout sessions');

      const weeklyPlan: WeeklyPlan = {
        weekNumber: 1,
        startDate: planData.started_at || planData.created_at,
        endDate: planData.description || '',
        sessions: (sessions || []).map((s: any) => {
          const exercises: WorkoutExercise[] = (s.exercises || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((ex: any) => ({
              id: ex.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest_seconds,
              muscleGroup: ex.muscle_group || '',
              equipment: ex.equipment || [],
              videoUrl: ex.video_url || undefined,
              description: ex.description || undefined,
              assignedWeight: ex.assigned_weight || undefined,
            }));

          const completedExercises: string[] = Array.isArray(s.completed_exercises) ? s.completed_exercises : [];

          return {
            id: s.id,
            day: s.day_name,
            name: s.session_name,
            exercises,
            duration: s.estimated_duration || 60,
            restNote: s.rest_note || undefined,
            completed: s.is_completed || false,
            completedAt: s.completed_at || undefined,
            completedExercises: completedExercises,
          } as WorkoutSession;
        }),
      };

      console.log('[RemoteRepo] Workout plan fetched with', weeklyPlan.sessions.length, 'sessions');
      return weeklyPlan;
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async saveNutritionPlan(userId: string, plan: NutritionPlan, mealPlan?: WeeklyMealPlan): Promise<string | null> {
    console.log('[RemoteRepo] Saving nutrition plan for user:', userId);
    try {
      return await retryFetch(async () => {
        const { data: existingPlans } = await supabase
          .from('nutrition_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (existingPlans && existingPlans.length > 0) {
          await supabase
            .from('nutrition_plans')
            .update({ status: 'archived' })
            .eq('user_id', userId)
            .eq('status', 'active');
        }

        const { data: npData, error: npError } = await supabase
          .from('nutrition_plans')
          .insert({
            user_id: userId,
            name: `Nutrition Plan`,
            description: plan.recommendations.join(', '),
            daily_calories_target: Math.round(plan.targetCalories),
            protein_g: Math.round(plan.macros.protein),
            carbs_g: Math.round(plan.macros.carbs),
            fats_g: Math.round(plan.macros.fats),
            meal_count_per_day: Math.round(plan.mealDistribution.mealsCount),
            diet_pattern: plan.dietPattern,
            generated_by: 'ai',
            status: 'active',
          })
          .select()
          .single();

        if (npError) handleSupabaseError(npError, 'Error saving nutrition plan');
        const nutritionPlanId = npData.id;

        if (mealPlan && mealPlan.days.length > 0) {
          for (const day of mealPlan.days) {
            const dayNumber = mealPlan.days.indexOf(day) + 1;

            const mpResult = await retryFetch(async () => {
              const { data, error } = await supabase
                .from('meal_plans')
                .insert({
                  nutrition_plan_id: nutritionPlanId,
                  day_number: dayNumber,
                  day_name: day.day,
                  date: day.date || null,
                  total_calories: Math.round(day.totalCalories || 0),
                  total_protein: Math.round(day.totalProtein || 0),
                  total_carbs: Math.round(day.totalCarbs || 0),
                  total_fats: Math.round(day.totalFats || 0),
                })
                .select()
                .single();
              if (error) throw error;
              return data;
            }, 3, 1500).catch((mpErr) => {
              console.error('[RemoteRepo] Error saving meal plan day:', JSON.stringify({
                message: mpErr.message,
                details: mpErr.details,
                hint: mpErr.hint,
                code: mpErr.code,
              }));
              return null;
            });

            if (!mpResult) continue;

            const allMeals: { meal: MealSuggestion; type: string; idx: number }[] = [];
            if (day.breakfast) allMeals.push({ meal: day.breakfast, type: 'breakfast', idx: 0 });
            if (day.lunch) allMeals.push({ meal: day.lunch, type: 'lunch', idx: 1 });
            if (day.dinner) allMeals.push({ meal: day.dinner, type: 'dinner', idx: 2 });
            day.snacks.forEach((s, i) => allMeals.push({ meal: s, type: 'snack', idx: 3 + i }));

            if (allMeals.length > 0) {
              const mealRows = allMeals.map((m) => ({
                meal_plan_id: mpResult.id,
                meal_type: m.type,
                name: m.meal.name || 'Unnamed',
                name_ar: m.meal.nameAr || null,
                calories: Math.round(m.meal.calories || 0),
                protein: Math.round(m.meal.protein || 0),
                carbs: Math.round(m.meal.carbs || 0),
                fats: Math.round(m.meal.fats || 0),
                ingredients: toPostgresArray(ensureStringArray(m.meal.ingredients)),
                ingredients_ar: toPostgresArray(ensureStringArray(m.meal.ingredientsAr)),
                order_index: m.idx,
              }));

              await retryFetch(async () => {
                const { error: mealError } = await supabase
                  .from('meals')
                  .insert(mealRows);
                if (mealError) throw mealError;
              }, 3, 1500).catch((mealErr) => {
                console.error('[RemoteRepo] Error saving meals:', JSON.stringify({
                  message: mealErr.message,
                  details: mealErr.details,
                  hint: mealErr.hint,
                  code: mealErr.code,
                }));
              });
            }
          }
        }

        console.log('[RemoteRepo] Nutrition plan saved successfully, id:', nutritionPlanId);
        return nutritionPlanId;
      }, 3, 2000);
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchActiveNutritionPlan(userId: string): Promise<{ plan: NutritionPlan; mealPlan: WeeklyMealPlan } | null> {
    console.log('[RemoteRepo] Fetching active nutrition plan for user:', userId);
    try {
      const { data: npData, error: npError } = await retryFetch(async () =>
        await supabase
          .from('nutrition_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      if (npError) handleSupabaseError(npError, 'Error fetching nutrition plan');
      if (!npData) {
        console.log('[RemoteRepo] No active nutrition plan found');
        return null;
      }

      const nutritionPlan: NutritionPlan = {
        targetCalories: npData.daily_calories_target,
        macros: {
          protein: npData.protein_g,
          carbs: npData.carbs_g,
          fats: npData.fats_g,
        },
        dietPattern: (npData.diet_pattern || 'balanced') as DietPattern,
        recommendations: npData.description ? npData.description.split(', ') : [],
        proteinPriority: npData.diet_pattern === 'high_protein' || npData.diet_pattern === 'high_protein_carbs',
        carbTiming: 'evenly_distributed',
        mealDistribution: {
          mealsCount: npData.meal_count_per_day || 3,
          snacksCount: 2,
          proteinPerMeal: Math.round(npData.protein_g / (npData.meal_count_per_day || 3)),
        },
      };

      const { data: mealPlanDays, error: mpError } = await retryFetch(async () =>
        await supabase
          .from('meal_plans')
          .select(`
            *,
            meals (*)
          `)
          .eq('nutrition_plan_id', npData.id)
          .order('day_number', { ascending: true })
      );

      if (mpError) handleSupabaseError(mpError, 'Error fetching meal plans');

      const days: DailyMealPlan[] = (mealPlanDays || []).map((mp: any) => {
        const sortedMeals = (mp.meals || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

        const toMealSuggestion = (m: any): MealSuggestion => ({
          id: m.id,
          name: m.name,
          nameAr: m.name_ar || m.name,
          type: m.meal_type,
          calories: m.calories || 0,
          protein: m.protein || 0,
          carbs: m.carbs || 0,
          fats: m.fats || 0,
          ingredients: ensureStringArray(m.ingredients),
          ingredientsAr: ensureStringArray(m.ingredients_ar),
        });

        const breakfast = sortedMeals.find((m: any) => m.meal_type === 'breakfast');
        const lunch = sortedMeals.find((m: any) => m.meal_type === 'lunch');
        const dinner = sortedMeals.find((m: any) => m.meal_type === 'dinner');
        const snacks = sortedMeals.filter((m: any) => m.meal_type === 'snack');

        let completedMeals: DailyMealPlan['completedMeals'] = undefined;
        if (mp.completed_meals && typeof mp.completed_meals === 'object') {
          completedMeals = {
            breakfast: !!mp.completed_meals.breakfast,
            lunch: !!mp.completed_meals.lunch,
            dinner: !!mp.completed_meals.dinner,
            snacks: Array.isArray(mp.completed_meals.snacks) ? mp.completed_meals.snacks : snacks.map(() => false),
          };
          console.log('[RemoteRepo] Day', mp.day_name, 'completedMeals from DB:', JSON.stringify(completedMeals));
        }

        return {
          id: mp.id,
          day: mp.day_name,
          date: mp.date || '',
          breakfast: breakfast ? toMealSuggestion(breakfast) : undefined,
          lunch: lunch ? toMealSuggestion(lunch) : undefined,
          dinner: dinner ? toMealSuggestion(dinner) : undefined,
          snacks: snacks.map(toMealSuggestion),
          totalCalories: mp.total_calories || 0,
          totalProtein: mp.total_protein || 0,
          totalCarbs: mp.total_carbs || 0,
          totalFats: mp.total_fats || 0,
          completedMeals,
        };
      });

      console.log('[RemoteRepo] Nutrition plan fetched with', days.length, 'days, meals per day:', days.map(d => {
        let count = 0;
        if (d.breakfast) count++;
        if (d.lunch) count++;
        if (d.dinner) count++;
        count += d.snacks.length;
        return count;
      }));

      const mealPlan: WeeklyMealPlan = {
        id: npData.id,
        weekNumber: 1,
        startDate: npData.created_at,
        endDate: '',
        days,
      };

      console.log('[RemoteRepo] Nutrition plan fetched with', days.length, 'days');
      return { plan: nutritionPlan, mealPlan };
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async addFavoriteExercise(userId: string, exercise: Omit<FavoriteExercise, 'id' | 'addedAt'>): Promise<FavoriteExercise | null> {
    console.log('[RemoteRepo] Adding favorite exercise for user:', userId);
    try {
      const { data, error } = await supabase
        .from('favorite_exercises')
        .insert({
          user_id: userId,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest,
          muscle_group: exercise.muscleGroup || null,
          equipment: exercise.equipment || [],
          assigned_weight: exercise.assignedWeight || null,
          video_url: exercise.videoUrl || null,
          description: exercise.description || null,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error adding favorite exercise');
      console.log('[RemoteRepo] Favorite exercise added');
      return {
        id: data.id,
        name: data.name,
        sets: data.sets,
        reps: data.reps,
        rest: data.rest_seconds,
        muscleGroup: data.muscle_group || '',
        equipment: data.equipment || [],
        videoUrl: data.video_url || undefined,
        description: data.description || undefined,
        assignedWeight: data.assigned_weight || undefined,
        addedAt: data.added_at,
      };
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async removeFavoriteExercise(userId: string, exerciseId: string) {
    console.log('[RemoteRepo] Removing favorite exercise:', exerciseId);
    try {
      const { error } = await supabase
        .from('favorite_exercises')
        .delete()
        .eq('id', exerciseId)
        .eq('user_id', userId);

      if (error) handleSupabaseError(error, 'Error removing favorite exercise');
      console.log('[RemoteRepo] Favorite exercise removed');
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchFavoriteExercises(userId: string): Promise<FavoriteExercise[]> {
    console.log('[RemoteRepo] Fetching favorite exercises for user:', userId);
    try {
      const { data, error } = await supabase
        .from('favorite_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Error fetching favorite exercises');
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        sets: row.sets,
        reps: row.reps,
        rest: row.rest_seconds,
        muscleGroup: row.muscle_group || '',
        equipment: row.equipment || [],
        videoUrl: row.video_url || undefined,
        description: row.description || undefined,
        assignedWeight: row.assigned_weight || undefined,
        addedAt: row.added_at,
      }));
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async addFavoriteMeal(userId: string, meal: Omit<FavoriteMeal, 'id' | 'addedAt'>): Promise<FavoriteMeal | null> {
    console.log('[RemoteRepo] Adding favorite meal for user:', userId);
    try {
      const { data, error } = await supabase
        .from('favorite_meals')
        .insert({
          user_id: userId,
          name: meal.name,
          name_ar: meal.nameAr || null,
          meal_type: meal.type,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          ingredients: meal.ingredients || [],
          ingredients_ar: meal.ingredientsAr || [],
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error adding favorite meal');
      console.log('[RemoteRepo] Favorite meal added');
      return {
        id: data.id,
        name: data.name,
        nameAr: data.name_ar || data.name,
        type: data.meal_type,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fats: data.fats,
        ingredients: data.ingredients || [],
        ingredientsAr: data.ingredients_ar || [],
        addedAt: data.added_at,
      };
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async removeFavoriteMeal(userId: string, mealId: string) {
    console.log('[RemoteRepo] Removing favorite meal:', mealId);
    try {
      const { error } = await supabase
        .from('favorite_meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', userId);

      if (error) handleSupabaseError(error, 'Error removing favorite meal');
      console.log('[RemoteRepo] Favorite meal removed');
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchFavoriteMeals(userId: string): Promise<FavoriteMeal[]> {
    console.log('[RemoteRepo] Fetching favorite meals for user:', userId);
    try {
      const { data, error } = await supabase
        .from('favorite_meals')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Error fetching favorite meals');
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        nameAr: row.name_ar || row.name,
        type: row.meal_type,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fats: row.fats,
        ingredients: row.ingredients || [],
        ingredientsAr: row.ingredients_ar || [],
        addedAt: row.added_at,
      }));
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async updateExerciseDetails(
    exerciseId: string,
    updates: Partial<{ sets: number; reps: string; rest: number; assignedWeight: string }>,
  ) {
    console.log('[RemoteRepo] Updating exercise details:', exerciseId, updates);
    try {
      const updateData: Record<string, unknown> = {};

      if (typeof updates.sets === 'number') {
        updateData.sets = updates.sets;
      }

      if (typeof updates.reps === 'string') {
        updateData.reps = updates.reps;
      }

      if (typeof updates.rest === 'number') {
        updateData.rest_seconds = updates.rest;
      }

      if (typeof updates.assignedWeight === 'string') {
        updateData.assigned_weight = updates.assignedWeight;
      }

      if (Object.keys(updateData).length === 0) {
        console.log('[RemoteRepo] No exercise fields to update');
        return;
      }

      const { error } = await supabase
        .from('exercises')
        .update(updateData)
        .eq('id', exerciseId);

      if (error) handleSupabaseError(error, 'Error updating exercise details');
      console.log('[RemoteRepo] Exercise details updated successfully');
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async saveChatMessage(userId: string, input: string, output: string, title?: string): Promise<string | null> {
    console.log('[RemoteRepo] Saving chat message for user:', userId, 'input:', input.substring(0, 50));
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          input,
          output,
          title: title || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[RemoteRepo] Error saving chat message:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }));
        return null;
      }
      console.log('[RemoteRepo] Chat message saved, id:', data?.id);
      return data?.id || null;
    } catch (e: any) {
      console.error('[RemoteRepo] Error saving chat message:', e?.message || e);
      return null;
    }
  },

  async fetchChatMessages(userId: string, limit = 50): Promise<{ id: string; user_id: string; input: string | null; output: string | null; title: string | null; created_at: string }[]> {
    console.log('[RemoteRepo] Fetching chat messages for user:', userId);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[RemoteRepo] Error fetching chat messages:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }));
        return [];
      }
      console.log('[RemoteRepo] Chat messages fetched:', data?.length);
      return (data || []).reverse();
    } catch (e: any) {
      console.error('[RemoteRepo] Error fetching chat messages:', e?.message || e);
      return [];
    }
  },

  async fetchUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; lastOpenDate: string } | null> {
    console.log('[RemoteRepo] Fetching user streak for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[RemoteRepo] Error fetching user streak:', error.message);
        return null;
      }
      if (!data) {
        console.log('[RemoteRepo] No streak record found');
        return null;
      }
      console.log('[RemoteRepo] Streak fetched:', data.current_streak, 'longest:', data.longest_streak);
      return {
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastOpenDate: data.last_open_date,
      };
    } catch (e: any) {
      console.error('[RemoteRepo] Error fetching user streak:', e?.message || e);
      return null;
    }
  },

  async updateUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number } | null> {
    console.log('[RemoteRepo] Updating user streak for user:', userId);
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const existing = await this.fetchUserStreak(userId);

      if (!existing) {
        const { error } = await supabase
          .from('user_streaks')
          .upsert({
            user_id: userId,
            last_open_date: todayStr,
            current_streak: 1,
            longest_streak: 1,
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('[RemoteRepo] Error inserting streak:', error.message);
          return null;
        }
        console.log('[RemoteRepo] New streak created');
        return { currentStreak: 1, longestStreak: 1 };
      }

      if (existing.lastOpenDate === todayStr) {
        console.log('[RemoteRepo] Streak already updated today');
        return { currentStreak: existing.currentStreak, longestStreak: existing.longestStreak };
      }

      const lastDate = new Date(existing.lastOpenDate + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let newStreak: number;
      if (diffDays === 1) {
        newStreak = existing.currentStreak + 1;
      } else {
        newStreak = 1;
      }
      const newLongest = Math.max(newStreak, existing.longestStreak);

      const { error } = await supabase
        .from('user_streaks')
        .update({
          last_open_date: todayStr,
          current_streak: newStreak,
          longest_streak: newLongest,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[RemoteRepo] Error updating streak:', error.message);
        return null;
      }
      console.log('[RemoteRepo] Streak updated:', newStreak, 'longest:', newLongest);
      return { currentStreak: newStreak, longestStreak: newLongest };
    } catch (e: any) {
      console.error('[RemoteRepo] Error updating user streak:', e?.message || e);
      return null;
    }
  },

  async updateMealCompletion(
    mealPlanDayId: string,
    completedMeals: Record<string, unknown>,
  ) {
    console.log('[RemoteRepo] Updating meal completion:', mealPlanDayId, completedMeals);
    try {
      const { error } = await supabase
        .from('meal_plans')
        .update({ completed_meals: completedMeals })
        .eq('id', mealPlanDayId);

      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('completed_meals')) {
          console.warn('[RemoteRepo] completed_meals column missing in meal_plans table. Run: ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS completed_meals JSONB DEFAULT NULL;');
          console.warn('[RemoteRepo] Also add UPDATE RLS policy for meal_plans.');
          return;
        }
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.warn('[RemoteRepo] UPDATE policy missing on meal_plans. Run: CREATE POLICY "Users can update own meal plans" ON meal_plans FOR UPDATE USING (EXISTS (SELECT 1 FROM nutrition_plans WHERE nutrition_plans.id = meal_plans.nutrition_plan_id AND nutrition_plans.user_id = auth.uid()));');
          return;
        }
        handleSupabaseError(error, 'Error updating meal completion');
      }
      console.log('[RemoteRepo] Meal completion updated successfully');
    } catch (e: any) {
      if (e?.message === 'NETWORK_ERROR' || e?.message?.includes('Failed to fetch')) {
        console.warn('[RemoteRepo] Network error updating meal completion, saved locally only');
        return;
      }
      console.error('[RemoteRepo] Error updating meal completion:', e?.message || e);
    }
  },
};
