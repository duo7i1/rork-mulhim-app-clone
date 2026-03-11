import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FitnessProfile,
  ProgressEntry,
  WeeklyPlan,
  WorkoutLog,
  NutritionAssessment,
  WeeklyMealPlan,
  GroceryList,
  NutritionPlan,
  MealSuggestion,
  FavoriteExercise,
  FavoriteMeal,
} from "@/types/fitness";
import { useAuth } from "@/providers/AuthProvider";
import { remoteFitnessRepo } from "@/services/remoteRepo";
import {
  calculateBMR,
  calculateTDEE,
  getTargetCalories,
  generateNutritionPlan as generateNutritionPlanLogic,
  extractFavoriteMealsFromHistory,
} from "@/hooks/useFitnessCalculations";

const PROFILE_KEY = "@mulhim_profile";
const PROGRESS_KEY = "@mulhim_progress";
const WORKOUT_LOGS_KEY = "@mulhim_workout_logs";
const NUTRITION_KEY = "@mulhim_nutrition";
const MEAL_PLAN_KEY = "@mulhim_meal_plan";
const GROCERY_LIST_KEY = "@mulhim_grocery_list";
const FAVORITE_EXERCISES_KEY = "@mulhim_favorite_exercises";
const FAVORITE_MEALS_KEY = "@mulhim_favorite_meals";
const WEEK_PLAN_KEY = "@mulhim_week_plan";
const NUTRITION_PLAN_KEY = "@mulhim_nutrition_plan";

function normalizeWeeklyPlan(plan: WeeklyPlan | null): WeeklyPlan | null {
  if (!plan) return null;

  const rawSessions = Array.isArray(plan.sessions) ? plan.sessions : [];
  const normalizedSessions = rawSessions.map((session) => ({
    ...session,
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    completedExercises: Array.isArray(session.completedExercises) ? session.completedExercises : [],
  }));

  return {
    ...plan,
    sessions: normalizedSessions,
  };
}

export const [FitnessProvider, useFitness] = createContextHook(() => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentWeekPlan, setCurrentWeekPlan] = useState<WeeklyPlan | null>(null);
  const [nutritionAssessment, setNutritionAssessment] = useState<NutritionAssessment | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [currentMealPlan, setCurrentMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [favoriteExercises, setFavoriteExercises] = useState<FavoriteExercise[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [remoteProfileChecked, setRemoteProfileChecked] = useState<boolean>(false);
  const [hasRemoteProfile, setHasRemoteProfile] = useState<boolean>(false);

  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const safeJsonParse = <T,>(data: string | null, fallback: T): T => {
    if (!data) return fallback;
    try {
      const trimmed = data.trim();
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.startsWith('[object')) {
        console.warn('Invalid JSON data detected, returning fallback');
        return fallback;
      }
      return JSON.parse(trimmed);
    } catch (e) {
      console.error('JSON parse error:', e, 'Data preview:', data.substring(0, 50));
      return fallback;
    }
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      console.log('[FitnessProvider] Boot sequence started');

      console.log('[FitnessProvider] Step 1: Hydrating from local cache');
      const [profileData, progressData, logsData, nutritionData, mealPlanData, groceryData, favoriteExercisesData, favoriteMealsData, weekPlanData, nutritionPlanData] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(WORKOUT_LOGS_KEY),
        AsyncStorage.getItem(NUTRITION_KEY),
        AsyncStorage.getItem(MEAL_PLAN_KEY),
        AsyncStorage.getItem(GROCERY_LIST_KEY),
        AsyncStorage.getItem(FAVORITE_EXERCISES_KEY),
        AsyncStorage.getItem(FAVORITE_MEALS_KEY),
        AsyncStorage.getItem(WEEK_PLAN_KEY),
        AsyncStorage.getItem(NUTRITION_PLAN_KEY),
      ]);

      if (profileData) {
        const parsed = safeJsonParse<FitnessProfile | null>(profileData, null);
        if (parsed) {
          setProfile(parsed);
          console.log('[FitnessProvider] Cache: Profile hydrated');
        } else {
          await AsyncStorage.removeItem(PROFILE_KEY);
        }
      }
      const localProgress = progressData ? safeJsonParse<ProgressEntry[]>(progressData, []) : [];
      const localWorkoutLogs = logsData ? safeJsonParse<WorkoutLog[]>(logsData, []) : [];
      const localFavoriteExercises = favoriteExercisesData ? safeJsonParse<FavoriteExercise[]>(favoriteExercisesData, []) : [];
      const localFavoriteMeals = favoriteMealsData ? safeJsonParse<FavoriteMeal[]>(favoriteMealsData, []) : [];
      const localWeekPlan = weekPlanData ? normalizeWeeklyPlan(safeJsonParse<WeeklyPlan | null>(weekPlanData, null)) : null;
      const localNutritionPlan = nutritionPlanData ? safeJsonParse<NutritionPlan | null>(nutritionPlanData, null) : null;
      const localMealPlan = mealPlanData ? safeJsonParse<WeeklyMealPlan | null>(mealPlanData, null) : null;

      if (progressData) {
        setProgress(localProgress);
        console.log('[FitnessProvider] Cache: Progress hydrated:', localProgress.length);
      }
      if (logsData) {
        setWorkoutLogs(localWorkoutLogs);
        console.log('[FitnessProvider] Cache: Workout logs hydrated:', localWorkoutLogs.length);
      }
      if (nutritionData) {
        const parsed = safeJsonParse<NutritionAssessment | null>(nutritionData, null);
        if (parsed) {
          setNutritionAssessment(parsed);
          console.log('[FitnessProvider] Cache: Nutrition assessment hydrated');
        }
      }
      if (mealPlanData && localMealPlan) {
        setCurrentMealPlan(localMealPlan);
        console.log('[FitnessProvider] Cache: Meal plan hydrated');
      }
      if (groceryData) {
        const parsed = safeJsonParse<GroceryList | null>(groceryData, null);
        if (parsed) {
          setGroceryList(parsed);
          console.log('[FitnessProvider] Cache: Grocery list hydrated');
        }
      }
      if (favoriteExercisesData) {
        setFavoriteExercises(localFavoriteExercises);
        console.log('[FitnessProvider] Cache: Favorite exercises hydrated:', localFavoriteExercises.length);
      }
      if (favoriteMealsData) {
        setFavoriteMeals(localFavoriteMeals);
        console.log('[FitnessProvider] Cache: Favorite meals hydrated:', localFavoriteMeals.length);
      }
      if (localWeekPlan) {
        setCurrentWeekPlan(localWeekPlan);
        console.log('[FitnessProvider] Cache: Week plan hydrated with', localWeekPlan.sessions.length, 'sessions');
      }
      if (localNutritionPlan) {
        setNutritionPlan(localNutritionPlan);
        console.log('[FitnessProvider] Cache: Nutrition plan hydrated');
      }

      if (!user) {
        setIsLoading(false);
        setRemoteProfileChecked(true);
        setHasRemoteProfile(false);
        console.log('[FitnessProvider] No user logged in, using local cache only');
        return;
      }

      setRemoteProfileChecked(false);
      setHasRemoteProfile(false);

      console.log('[FitnessProvider] Step 2: Refreshing from Supabase for user:', user.id);
      try {
        const safeFetch = async <T,>(fn: () => Promise<T>, label: string, fallback: T): Promise<T> => {
          try {
            return await fn();
          } catch (e: any) {
            console.warn(`[FitnessProvider] ${label} failed, using fallback:`, e?.message);
            return fallback;
          }
        };

        const [remoteProfile, remoteProgress, remoteLogs, remoteFavExercises, remoteFavMeals] = await Promise.all([
          safeFetch(() => remoteFitnessRepo.fetchProfile(user.id), 'fetchProfile', null),
          safeFetch(() => remoteFitnessRepo.fetchProgressEntries(user.id), 'fetchProgressEntries', []),
          safeFetch(() => remoteFitnessRepo.fetchWorkoutLogs(user.id), 'fetchWorkoutLogs', []),
          safeFetch(() => remoteFitnessRepo.fetchFavoriteExercises(user.id), 'fetchFavoriteExercises', []),
          safeFetch(() => remoteFitnessRepo.fetchFavoriteMeals(user.id), 'fetchFavoriteMeals', []),
        ]);

        setRemoteProfileChecked(true);
        setHasRemoteProfile(!!remoteProfile);
        setIsLoading(false);
        console.log('[FitnessProvider] Supabase check: hasRemoteProfile =', !!remoteProfile);

        if (remoteProfile) {
          setProfile(remoteProfile);
          await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(remoteProfile));
          console.log('[FitnessProvider] Remote: Profile refreshed and cached');

          const remoteAssessment = (remoteProfile as any).nutritionAssessment as NutritionAssessment | undefined;
          if (remoteAssessment) {
            setNutritionAssessment(remoteAssessment);
            await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(remoteAssessment));
            console.log('[FitnessProvider] Remote: Nutrition assessment restored from profile');
          }
        }
        setProgress(remoteProgress);
        await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(remoteProgress));
        console.log('[FitnessProvider] Remote: Progress refreshed:', remoteProgress.length);

        if (remoteProgress.length === 0 && localProgress.length > 0) {
          console.log('[FitnessProvider] Remote progress empty, keeping local cache and scheduling push later');
        }

        setWorkoutLogs(remoteLogs);
        await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(remoteLogs));
        console.log('[FitnessProvider] Remote: Workout logs refreshed:', remoteLogs.length);

        setFavoriteExercises(remoteFavExercises);
        await AsyncStorage.setItem(FAVORITE_EXERCISES_KEY, JSON.stringify(remoteFavExercises));
        console.log('[FitnessProvider] Remote: Favorite exercises refreshed:', remoteFavExercises.length);

        setFavoriteMeals(remoteFavMeals);
        await AsyncStorage.setItem(FAVORITE_MEALS_KEY, JSON.stringify(remoteFavMeals));
        console.log('[FitnessProvider] Remote: Favorite meals refreshed:', remoteFavMeals.length);

        let remoteWorkoutPlan: WeeklyPlan | null = null;
        try {
          remoteWorkoutPlan = normalizeWeeklyPlan(await remoteFitnessRepo.fetchActiveWorkoutPlan(user.id));
          if (remoteWorkoutPlan && remoteWorkoutPlan.sessions.length > 0) {
            setCurrentWeekPlan(remoteWorkoutPlan);
            await AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(remoteWorkoutPlan));
            console.log('[FitnessProvider] Remote: Workout plan refreshed with', remoteWorkoutPlan.sessions.length, 'sessions');
          }
        } catch (wpErr) {
          console.warn('[FitnessProvider] Could not fetch workout plan:', wpErr);
        }

        let remoteNutrition: { plan: NutritionPlan; mealPlan: WeeklyMealPlan } | null = null;
        try {
          remoteNutrition = await remoteFitnessRepo.fetchActiveNutritionPlan(user.id);
          if (remoteNutrition) {
            setNutritionPlan(remoteNutrition.plan);
            await AsyncStorage.setItem(NUTRITION_PLAN_KEY, JSON.stringify(remoteNutrition.plan));
            if (remoteNutrition.mealPlan.days.length > 0) {
              setCurrentMealPlan(remoteNutrition.mealPlan);
              await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(remoteNutrition.mealPlan));
            }
            console.log('[FitnessProvider] Remote: Nutrition plan refreshed');
          }
        } catch (npErr) {
          console.warn('[FitnessProvider] Could not fetch nutrition plan:', npErr);
        }

        if (!remoteProfile && profileData) {
          console.log('[FitnessProvider] No remote profile but local cache exists, pushing to Supabase');
          const localProfile = safeJsonParse<FitnessProfile | null>(profileData, null);
          if (localProfile) {
            remoteFitnessRepo.upsertProfile(user.id, localProfile).then(() => {
              setHasRemoteProfile(true);
              console.log('[FitnessProvider] Local profile pushed to Supabase');
            }).catch((err) => {
              console.warn('[FitnessProvider] Error pushing local profile to Supabase:', err);
            });
          }
        }

        if (!remoteWorkoutPlan && localWeekPlan?.sessions.length) {
          console.log('[FitnessProvider] No remote workout plan but local cache exists, pushing to Supabase');
          void remoteFitnessRepo.saveWorkoutPlan(user.id, localWeekPlan).then(() => {
            console.log('[FitnessProvider] Local workout plan pushed to Supabase');
          }).catch((err) => {
            console.warn('[FitnessProvider] Error pushing local workout plan:', err);
          });
        }

        if (!remoteNutrition && localNutritionPlan) {
          console.log('[FitnessProvider] No remote nutrition plan but local cache exists, pushing to Supabase');
          void remoteFitnessRepo.saveNutritionPlan(user.id, localNutritionPlan, localMealPlan || undefined).then(() => {
            console.log('[FitnessProvider] Local nutrition plan pushed to Supabase');
          }).catch((err) => {
            console.warn('[FitnessProvider] Error pushing local nutrition plan:', err);
          });
        }

        console.log('[FitnessProvider] Step 2 complete: Remote sync successful');
      } catch (fetchError: any) {
        setRemoteProfileChecked(true);
        setLoadError(true);
        const hasLocalProfile = !!profileData;
        setHasRemoteProfile(hasLocalProfile);
        setIsLoading(false);
        if (fetchError?.message === 'NETWORK_ERROR') {
          console.warn('[FitnessProvider] Network error: Supabase unreachable, using cached data. hasLocalProfile:', hasLocalProfile);
        } else {
          console.error('[FitnessProvider] Step 2 failed:', fetchError, 'falling back to local cache. hasLocalProfile:', hasLocalProfile);
        }
      }
    } catch (error) {
      console.error("[FitnessProvider] Boot sequence error:", error);
      setIsLoading(false);
    }
  }, [user]);

  const saveProfile = useCallback(async (newProfile: FitnessProfile) => {
    try {
      if (!newProfile.fitnessLevel) {
        if (newProfile.activityLevel === "none" || newProfile.activityLevel === "light") {
          newProfile.fitnessLevel = "beginner";
        } else if (newProfile.activityLevel === "moderate") {
          newProfile.fitnessLevel = "intermediate";
        } else {
          newProfile.fitnessLevel = "advanced";
        }
      }

      if (user) {
        console.log('[FitnessProvider] Saving profile to Supabase for user:', user.id);
        try {
          await remoteFitnessRepo.upsertProfile(user.id, newProfile);
        } catch (error: any) {
          if (error?.message === 'NETWORK_ERROR') {
            console.warn('[FitnessProvider] Network error saving profile, saved locally only');
          } else {
            throw error;
          }
        }
      }

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);

      if (user) {
        setHasRemoteProfile(true);
        console.log('[FitnessProvider] Profile saved, hasRemoteProfile = true');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
  }, [user]);

  const addProgressEntry = useCallback(async (entry: ProgressEntry) => {
    try {
      const updated = [...progress, entry];
      setProgress(updated);
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      console.log('[FitnessProvider] Progress entry saved locally, weight:', entry.weight);

      console.log('[FitnessProvider] Progress entry added. Start weight preserved:', profile?.weight, 'Current weight:', entry.weight);

      if (user) {
        try {
          await remoteFitnessRepo.insertProgressEntry(user.id, entry);
          console.log('[FitnessProvider] Progress entry synced to Supabase');
        } catch (error: any) {
          if (error?.message === 'NETWORK_ERROR') {
            console.warn('[FitnessProvider] Network error syncing progress entry');
          } else {
            console.error('[FitnessProvider] Error syncing progress entry:', error);
          }
        }
      }
    } catch (error) {
      console.error("Error adding progress entry:", error);
      throw error;
    }
  }, [profile?.weight, progress, user]);

  const addWorkoutLog = useCallback(async (log: WorkoutLog) => {
    try {
      const updated = [...workoutLogs, log];
      setWorkoutLogs(updated);
      await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updated));
      console.log('[FitnessProvider] Workout log saved locally');

      if (user) {
        try {
          await remoteFitnessRepo.insertWorkoutLog(user.id, log);
          console.log('[FitnessProvider] Workout log synced to Supabase');
        } catch (error: any) {
          if (error?.message === 'NETWORK_ERROR') {
            console.warn('[FitnessProvider] Network error syncing workout log');
          } else {
            console.error('[FitnessProvider] Error syncing workout log:', error);
          }
        }
      }
    } catch (error) {
      console.error("Error adding workout log:", error);
      throw error;
    }
  }, [user, workoutLogs]);

  const updateWeekPlan = useCallback(async (plan: WeeklyPlan) => {
    const normalizedPlan = normalizeWeeklyPlan(plan);
    if (!normalizedPlan) {
      return;
    }

    setCurrentWeekPlan(normalizedPlan);
    await AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(normalizedPlan));
    console.log('[FitnessProvider] Week plan saved locally with', normalizedPlan.sessions.length, 'sessions');

    if (user) {
      remoteFitnessRepo.saveWorkoutPlan(user.id, normalizedPlan).then(() => {
        console.log('[FitnessProvider] Workout plan synced to Supabase');
      }).catch((err) => {
        console.warn('[FitnessProvider] Error saving workout plan to Supabase:', err);
      });
    }
  }, [user]);

  const toggleExerciseCompletion = useCallback((sessionId: string, exerciseId: string) => {
    if (!currentWeekPlan) return;

    const updatedSessions = (currentWeekPlan.sessions ?? []).map((session) => {
      if (session.id === sessionId) {
        const completedExercises = session.completedExercises || [];
        const isCompleted = completedExercises.includes(exerciseId);

        const newCompletedExercises = isCompleted
          ? completedExercises.filter((id) => id !== exerciseId)
          : [...completedExercises, exerciseId];

        const allExercisesCompleted = newCompletedExercises.length === session.exercises.length;
        const newCompletedAt = allExercisesCompleted ? new Date().toISOString() : session.completedAt;

        if (user) {
          void remoteFitnessRepo.updateSessionCompletion(
            sessionId,
            allExercisesCompleted,
            newCompletedAt,
            newCompletedExercises
          );
        }

        return {
          ...session,
          completedExercises: newCompletedExercises,
          completed: allExercisesCompleted,
          completedAt: newCompletedAt,
        };
      }
      return session;
    });

    const updatedPlan = normalizeWeeklyPlan({ ...currentWeekPlan, sessions: updatedSessions });
    if (!updatedPlan) {
      return;
    }
    setCurrentWeekPlan(updatedPlan);
    AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(updatedPlan)).catch(console.error);
  }, [currentWeekPlan, user]);

  const toggleSessionCompletion = useCallback((sessionId: string) => {
    if (!currentWeekPlan) return;

    const updatedSessions = (currentWeekPlan.sessions ?? []).map((session) => {
      if (session.id === sessionId) {
        const newCompleted = !session.completed;
        const newCompletedAt = newCompleted ? new Date().toISOString() : undefined;
        const newCompletedExercises = newCompleted ? session.exercises.map((e) => e.id) : [];

        if (user) {
          void remoteFitnessRepo.updateSessionCompletion(
            sessionId,
            newCompleted,
            newCompletedAt,
            newCompletedExercises
          );
        }

        return {
          ...session,
          completed: newCompleted,
          completedAt: newCompletedAt,
          completedExercises: newCompletedExercises,
        };
      }
      return session;
    });

    const updatedPlan = normalizeWeeklyPlan({ ...currentWeekPlan, sessions: updatedSessions });
    if (!updatedPlan) {
      return;
    }
    setCurrentWeekPlan(updatedPlan);
    AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(updatedPlan)).catch(console.error);
  }, [currentWeekPlan, user]);

  const updateExercise = useCallback((sessionId: string, exerciseId: string, updates: Partial<{ sets: number; reps: string; rest: number; assignedWeight: string }>) => {
    if (!currentWeekPlan) return;

    const updatedSessions = (currentWeekPlan.sessions ?? []).map((session) => {
      if (session.id === sessionId) {
        const updatedExercises = session.exercises.map((exercise) => {
          if (exercise.id === exerciseId) {
            return { ...exercise, ...updates };
          }
          return exercise;
        });
        return { ...session, exercises: updatedExercises };
      }
      return session;
    });

    const updatedPlan = normalizeWeeklyPlan({ ...currentWeekPlan, sessions: updatedSessions });
    if (!updatedPlan) {
      return;
    }

    setCurrentWeekPlan(updatedPlan);
    AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(updatedPlan)).catch(console.error);

    if (user) {
      void remoteFitnessRepo.updateExerciseDetails(exerciseId, updates).catch((error: unknown) => {
        console.warn('[FitnessProvider] Silent exercise sync failure:', error);
      });
    }
  }, [currentWeekPlan, user]);

  const getCurrentWeight = useCallback((): number => {
    if (progress.length > 0) {
      const sorted = [...progress].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return sorted[0].weight;
    }
    return profile?.weight || 0;
  }, [profile?.weight, progress]);

  const calcBMR = useCallback((): number => {
    return calculateBMR(profile, getCurrentWeight());
  }, [getCurrentWeight, profile]);

  const calcTDEE = useCallback((): number => {
    return calculateTDEE(profile, getCurrentWeight());
  }, [getCurrentWeight, profile]);

  const calcTargetCalories = useCallback((): number => {
    return getTargetCalories(profile, getCurrentWeight());
  }, [getCurrentWeight, profile]);

  const getCurrentStreak = useCallback((): number => {
    if (workoutLogs.length === 0) return 0;
    const sortedLogs = [...workoutLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    return streak;
  }, [workoutLogs]);

  const saveNutritionAssessment = useCallback(async (assessment: NutritionAssessment) => {
    try {
      if (assessment.completed && !assessment.favoriteMeals) {
        const favMeals = extractFavoriteMealsFromHistory(assessment.dietHistory);
        assessment.favoriteMeals = favMeals;
      }
      await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(assessment));
      setNutritionAssessment(assessment);
      if (assessment.completed && profile) {
        const plan = generateNutritionPlanLogic(profile, assessment, calcTargetCalories());
        setNutritionPlan(plan);
        await AsyncStorage.setItem(NUTRITION_PLAN_KEY, JSON.stringify(plan));

        if (user) {
          const profileWithAssessment = { ...profile, nutritionAssessment: assessment } as any;
          void remoteFitnessRepo.upsertProfile(user.id, profileWithAssessment).catch((err: unknown) => {
            console.warn('[FitnessProvider] Error syncing nutrition assessment to profile:', err);
          });

          remoteFitnessRepo.saveNutritionPlan(user.id, plan).then(() => {
            console.log('[FitnessProvider] Nutrition plan synced to Supabase after assessment');
          }).catch((err) => {
            console.warn('[FitnessProvider] Error syncing nutrition plan:', err);
          });
        }
      }
    } catch (error) {
      console.error("Error saving nutrition assessment:", error);
    }
  }, [calcTargetCalories, profile, user]);

  const saveMealPlan = useCallback(async (plan: WeeklyMealPlan) => {
    try {
      await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plan));
      setCurrentMealPlan(plan);

      if (user && nutritionPlan) {
        remoteFitnessRepo.saveNutritionPlan(user.id, nutritionPlan, plan).catch((err) => {
          console.warn('[FitnessProvider] Error syncing meal plan to Supabase:', err);
        });
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
    }
  }, [nutritionPlan, user]);

  const saveGroceryList = useCallback(async (list: GroceryList) => {
    try {
      await AsyncStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(list));
      setGroceryList(list);
    } catch (error) {
      console.error("Error saving grocery list:", error);
    }
  }, []);

  const toggleGroceryItem = useCallback(async (itemId: string) => {
    if (!groceryList) return;
    const updatedItems = groceryList.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const updatedList = { ...groceryList, items: updatedItems };
    await saveGroceryList(updatedList);
  }, [groceryList, saveGroceryList]);

  const toggleMealCompletion = useCallback(async (
    dayId: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snack",
    snackIndex?: number,
  ) => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const completedMeals = day.completedMeals || {
          breakfast: false,
          lunch: false,
          dinner: false,
          snacks: day.snacks.map(() => false),
        };

        if (mealType === "snack" && snackIndex !== undefined) {
          const snacksCompletion = [...(completedMeals.snacks || day.snacks.map(() => false))];
          snacksCompletion[snackIndex] = !snacksCompletion[snackIndex];
          return { ...day, completedMeals: { ...completedMeals, snacks: snacksCompletion } };
        }

        if (mealType === "breakfast") {
          return { ...day, completedMeals: { ...completedMeals, breakfast: !completedMeals.breakfast } };
        }

        if (mealType === "lunch") {
          return { ...day, completedMeals: { ...completedMeals, lunch: !completedMeals.lunch } };
        }

        if (mealType === "dinner") {
          return { ...day, completedMeals: { ...completedMeals, dinner: !completedMeals.dinner } };
        }
      }

      return day;
    });

    const updatedPlan = { ...currentMealPlan, days: updatedDays };
    await saveMealPlan(updatedPlan);

    if (user) {
      const updatedDay = updatedDays.find((day) => day.id === dayId);
      if (updatedDay?.completedMeals) {
        void remoteFitnessRepo.updateMealCompletion(dayId, updatedDay.completedMeals).catch((error: unknown) => {
          console.warn('[FitnessProvider] Silent meal completion sync failure:', error);
        });
      }
    }
  }, [currentMealPlan, saveMealPlan, user]);

  const recalcDayTotals = useCallback((day: typeof currentMealPlan extends { days: (infer D)[] } | null ? D : never) => {
    const d = { ...day };
    d.totalCalories = (d.breakfast?.calories || 0) + (d.lunch?.calories || 0) + (d.dinner?.calories || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.calories, 0);
    d.totalProtein = (d.breakfast?.protein || 0) + (d.lunch?.protein || 0) + (d.dinner?.protein || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.protein, 0);
    d.totalCarbs = (d.breakfast?.carbs || 0) + (d.lunch?.carbs || 0) + (d.dinner?.carbs || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.carbs, 0);
    d.totalFats = (d.breakfast?.fats || 0) + (d.lunch?.fats || 0) + (d.dinner?.fats || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.fats, 0);
    return d;
  }, []);

  const addMealToDay = useCallback(async (dayId: string, meal: MealSuggestion, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const updatedDay = { ...day };
        if (mealType === "snack") {
          updatedDay.snacks = [...day.snacks, meal];
          const completedMeals = updatedDay.completedMeals || { breakfast: false, lunch: false, dinner: false, snacks: [] };
          updatedDay.completedMeals = { ...completedMeals, snacks: [...(completedMeals.snacks || []), false] };
        } else {
          updatedDay[mealType] = meal;
        }
        return recalcDayTotals(updatedDay);
      }
      return day;
    });
    await saveMealPlan({ ...currentMealPlan, days: updatedDays });
  }, [currentMealPlan, recalcDayTotals, saveMealPlan]);

  const removeMealFromDay = useCallback(async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", snackIndex?: number) => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const updatedDay = { ...day };
        if (mealType === "snack" && snackIndex !== undefined) {
          updatedDay.snacks = day.snacks.filter((_, index) => index !== snackIndex);
          const completedMeals = updatedDay.completedMeals || { breakfast: false, lunch: false, dinner: false, snacks: [] };
          updatedDay.completedMeals = { ...completedMeals, snacks: (completedMeals.snacks || []).filter((_, index) => index !== snackIndex) };
        } else if (mealType !== "snack") {
          updatedDay[mealType] = undefined;
          if (updatedDay.completedMeals) {
            updatedDay.completedMeals[mealType] = false;
          }
        }
        return recalcDayTotals(updatedDay);
      }
      return day;
    });
    await saveMealPlan({ ...currentMealPlan, days: updatedDays });
  }, [currentMealPlan, recalcDayTotals, saveMealPlan]);

  const addGroceryItem = useCallback(async (name: string, category: GroceryList["items"][0]["category"]) => {
    if (!groceryList) return;
    const newItem: GroceryList["items"][0] = {
      id: `item-${Date.now()}`,
      name: name,
      nameAr: name,
      quantity: "حسب الحاجة",
      category: category,
      checked: false,
    };
    const updatedList = { ...groceryList, items: [...groceryList.items, newItem] };
    await saveGroceryList(updatedList);
  }, [groceryList, saveGroceryList]);

  const addFavoriteExercise = useCallback(async (exercise: Omit<FavoriteExercise, "id" | "addedAt">) => {
    try {
      const newFavorite: FavoriteExercise = {
        ...exercise,
        id: `fav-exercise-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };

      if (user) {
        try {
          const remote = await remoteFitnessRepo.addFavoriteExercise(user.id, exercise);
          if (remote) {
            newFavorite.id = remote.id;
            newFavorite.addedAt = remote.addedAt;
          }
        } catch (err: any) {
          if (err?.message !== 'NETWORK_ERROR') console.error('[FitnessProvider] Error syncing fav exercise:', err);
        }
      }

      const updated = [...favoriteExercises, newFavorite];
      await AsyncStorage.setItem(FAVORITE_EXERCISES_KEY, JSON.stringify(updated));
      setFavoriteExercises(updated);
    } catch (error) {
      console.error("Error adding favorite exercise:", error);
    }
  }, [favoriteExercises, user]);

  const removeFavoriteExercise = useCallback(async (id: string) => {
    try {
      if (user) {
        try {
          await remoteFitnessRepo.removeFavoriteExercise(user.id, id);
        } catch (err: any) {
          if (err?.message !== 'NETWORK_ERROR') console.error('[FitnessProvider] Error removing fav exercise:', err);
        }
      }
      const updated = favoriteExercises.filter(ex => ex.id !== id);
      await AsyncStorage.setItem(FAVORITE_EXERCISES_KEY, JSON.stringify(updated));
      setFavoriteExercises(updated);
    } catch (error) {
      console.error("Error removing favorite exercise:", error);
    }
  }, [favoriteExercises, user]);

  const addFavoriteMeal = useCallback(async (meal: Omit<FavoriteMeal, "id" | "addedAt">) => {
    try {
      const newFavorite: FavoriteMeal = {
        ...meal,
        id: `fav-meal-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };

      if (user) {
        try {
          const remote = await remoteFitnessRepo.addFavoriteMeal(user.id, meal);
          if (remote) {
            newFavorite.id = remote.id;
            newFavorite.addedAt = remote.addedAt;
          }
        } catch (err: any) {
          if (err?.message !== 'NETWORK_ERROR') console.error('[FitnessProvider] Error syncing fav meal:', err);
        }
      }

      const updated = [...favoriteMeals, newFavorite];
      await AsyncStorage.setItem(FAVORITE_MEALS_KEY, JSON.stringify(updated));
      setFavoriteMeals(updated);
    } catch (error) {
      console.error("Error adding favorite meal:", error);
    }
  }, [favoriteMeals, user]);

  const removeFavoriteMeal = useCallback(async (id: string) => {
    try {
      if (user) {
        try {
          await remoteFitnessRepo.removeFavoriteMeal(user.id, id);
        } catch (err: any) {
          if (err?.message !== 'NETWORK_ERROR') console.error('[FitnessProvider] Error removing fav meal:', err);
        }
      }
      const updated = favoriteMeals.filter(meal => meal.id !== id);
      await AsyncStorage.setItem(FAVORITE_MEALS_KEY, JSON.stringify(updated));
      setFavoriteMeals(updated);
    } catch (error) {
      console.error("Error removing favorite meal:", error);
    }
  }, [favoriteMeals, user]);

  const updateMealInPlan = useCallback(async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", updatedMeal: MealSuggestion, snackIndex?: number) => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const updatedDay = { ...day };
        if (mealType === "snack" && snackIndex !== undefined) {
          updatedDay.snacks = day.snacks.map((snack, index) => index === snackIndex ? updatedMeal : snack);
        } else if (mealType !== "snack") {
          updatedDay[mealType] = updatedMeal;
        }
        return recalcDayTotals(updatedDay);
      }
      return day;
    });
    await saveMealPlan({ ...currentMealPlan, days: updatedDays });
  }, [currentMealPlan, recalcDayTotals, saveMealPlan]);

  const refreshData = useCallback(async () => {
    console.log('[FitnessProvider] Manual refresh triggered');
    await loadData();
  }, [loadData]);

  return useMemo(() => ({
    profile,
    progress,
    workoutLogs,
    currentWeekPlan,
    nutritionAssessment,
    nutritionPlan,
    currentMealPlan,
    groceryList,
    favoriteExercises,
    favoriteMeals,
    isLoading,
    saveProfile,
    addProgressEntry,
    addWorkoutLog,
    updateWeekPlan,
    toggleExerciseCompletion,
    toggleSessionCompletion,
    updateExercise,
    saveNutritionAssessment,
    saveMealPlan,
    saveGroceryList,
    toggleGroceryItem,
    toggleMealCompletion,
    addMealToDay,
    removeMealFromDay,
    addGroceryItem,
    addFavoriteExercise,
    removeFavoriteExercise,
    addFavoriteMeal,
    removeFavoriteMeal,
    updateMealInPlan,
    calculateBMR: calcBMR,
    calculateTDEE: calcTDEE,
    getTargetCalories: calcTargetCalories,
    getCurrentWeight,
    getCurrentStreak,
    refreshData,
    hasProfile: user
      ? (remoteProfileChecked ? (hasRemoteProfile || !!profile) : !!profile)
      : !!profile,
    loadError,
  }), [
    profile,
    progress,
    workoutLogs,
    currentWeekPlan,
    nutritionAssessment,
    nutritionPlan,
    currentMealPlan,
    groceryList,
    favoriteExercises,
    favoriteMeals,
    isLoading,
    saveProfile,
    addProgressEntry,
    addWorkoutLog,
    updateWeekPlan,
    toggleExerciseCompletion,
    toggleSessionCompletion,
    updateExercise,
    saveNutritionAssessment,
    saveMealPlan,
    saveGroceryList,
    toggleGroceryItem,
    toggleMealCompletion,
    addMealToDay,
    removeMealFromDay,
    addGroceryItem,
    addFavoriteExercise,
    removeFavoriteExercise,
    addFavoriteMeal,
    removeFavoriteMeal,
    updateMealInPlan,
    calcBMR,
    calcTDEE,
    calcTargetCalories,
    getCurrentWeight,
    getCurrentStreak,
    refreshData,
    user,
    remoteProfileChecked,
    hasRemoteProfile,
    loadError,
  ]);
});
