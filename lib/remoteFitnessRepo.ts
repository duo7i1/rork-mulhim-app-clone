import { supabase } from './supabase';
import type {
  FitnessProfile,
  ProgressEntry,
  WorkoutLog,
  WorkoutSession,
  WorkoutExercise,
  WeeklyPlan,
  FavoriteExercise,
  FavoriteMeal,
  WeeklyMealPlan,
  DailyMealPlan,
  MealSuggestion,
  NutritionPlan,
  DietPattern,
} from '@/types/fitness';

async function retryFetch<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const isNetworkError = e?.message?.includes('Failed to fetch') || e?.name === 'TypeError';
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
    console.log('[RemoteRepo] Upserting profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
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
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error upserting profile');
      console.log('[RemoteRepo] Profile upserted successfully');
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
    console.log('[RemoteRepo] Inserting workout log for user:', userId);
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          session_id: null,
          completed_at: log.date,
          duration_minutes: log.duration,
          notes: log.notes || null,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Error inserting workout log');

      if (log.exercises && log.exercises.length > 0 && data) {
        const exerciseLogs = log.exercises.map((ex) => ({
          workout_log_id: data.id,
          exercise_name: ex.exerciseId,
          sets_completed: ex.sets?.length || 0,
          reps_completed: ex.sets || [],
        }));

        const { error: exError } = await supabase
          .from('exercise_logs')
          .insert(exerciseLogs);

        if (exError) {
          console.error('[RemoteRepo] Error inserting exercise logs:', exError);
        }
      }

      console.log('[RemoteRepo] Workout log inserted successfully');
      return data;
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
    console.log('[RemoteRepo] Fetching workout logs for user:', userId);
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          *,
          exercise_logs (*)
        `)
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
        exercises: (row.exercise_logs || []).map((el: any) => ({
          exerciseId: el.exercise_name || '',
          sets: el.reps_completed || [],
        })),
      }));
    } catch (e) {
      return wrapNetworkError(e);
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

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          is_completed: completed,
        })
        .eq('id', sessionId);

      if (error) {
        console.error('[RemoteRepo] Error updating session completion:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }));
        return;
      }
      console.log('[RemoteRepo] Session completion updated successfully');
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

          const completedExercises: string[] = [];

          return {
            id: s.id,
            day: s.day_name,
            name: s.session_name,
            exercises,
            duration: s.estimated_duration || 60,
            restNote: s.rest_note || undefined,
            completed: s.is_completed || false,
            completedAt: undefined,
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
          daily_calories_target: plan.targetCalories,
          protein_g: plan.macros.protein,
          carbs_g: plan.macros.carbs,
          fats_g: plan.macros.fats,
          meal_count_per_day: plan.mealDistribution.mealsCount,
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
          const { data: mpData, error: mpError } = await supabase
            .from('meal_plans')
            .insert({
              nutrition_plan_id: nutritionPlanId,
              day_number: dayNumber,
              day_name: day.day,
              date: day.date || null,
              total_calories: day.totalCalories,
              total_protein: day.totalProtein,
              total_carbs: day.totalCarbs,
              total_fats: day.totalFats,
            })
            .select()
            .single();

          if (mpError) {
            console.error('[RemoteRepo] Error saving meal plan day:', mpError);
            continue;
          }

          const allMeals: { meal: MealSuggestion; type: string; idx: number }[] = [];
          if (day.breakfast) allMeals.push({ meal: day.breakfast, type: 'breakfast', idx: 0 });
          if (day.lunch) allMeals.push({ meal: day.lunch, type: 'lunch', idx: 1 });
          if (day.dinner) allMeals.push({ meal: day.dinner, type: 'dinner', idx: 2 });
          day.snacks.forEach((s, i) => allMeals.push({ meal: s, type: 'snack', idx: 3 + i }));

          if (allMeals.length > 0) {
            const mealRows = allMeals.map((m) => ({
              meal_plan_id: mpData.id,
              meal_type: m.type,
              name: m.meal.name,
              name_ar: m.meal.nameAr || null,
              calories: m.meal.calories,
              protein: m.meal.protein,
              carbs: m.meal.carbs,
              fats: m.meal.fats,
              ingredients: m.meal.ingredients || [],
              ingredients_ar: m.meal.ingredientsAr || [],
              order_index: m.idx,
            }));

            const { error: mealError } = await supabase
              .from('meals')
              .insert(mealRows);

            if (mealError) {
              console.error('[RemoteRepo] Error saving meals:', mealError);
            }
          }
        }
      }

      console.log('[RemoteRepo] Nutrition plan saved successfully, id:', nutritionPlanId);
      return nutritionPlanId;
    } catch (e) {
      return wrapNetworkError(e);
    }
  },

  async fetchActiveNutritionPlan(userId: string): Promise<{ plan: NutritionPlan; mealPlan: WeeklyMealPlan } | null> {
    console.log('[RemoteRepo] Fetching active nutrition plan for user:', userId);
    try {
      const { data: npData, error: npError } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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

      const { data: mealPlanDays, error: mpError } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meals (*)
        `)
        .eq('nutrition_plan_id', npData.id)
        .order('day_number', { ascending: true });

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
          ingredients: m.ingredients || [],
          ingredientsAr: m.ingredients_ar || [],
        });

        const breakfast = sortedMeals.find((m: any) => m.meal_type === 'breakfast');
        const lunch = sortedMeals.find((m: any) => m.meal_type === 'lunch');
        const dinner = sortedMeals.find((m: any) => m.meal_type === 'dinner');
        const snacks = sortedMeals.filter((m: any) => m.meal_type === 'snack');

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
        };
      });

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
};
