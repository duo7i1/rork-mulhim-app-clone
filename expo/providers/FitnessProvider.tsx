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

function isWeeklyPlanExpired(startDate: string, endDate: string): boolean {
  if (!startDate && !endDate) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (endDate) {
    try {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        if (now.getTime() > end.getTime()) {
          console.log('[isWeeklyPlanExpired] Plan expired: endDate', endDate, 'is in the past');
          return true;
        }
      }
    } catch { /* ignore parse errors */ }
  }

  if (startDate) {
    try {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceStart >= 7) {
          console.log('[isWeeklyPlanExpired] Plan expired: started', daysSinceStart, 'days ago');
          return true;
        }
      }
    } catch { /* ignore parse errors */ }
  }

  return false;
}

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
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number }>({ currentStreak: 0, longestStreak: 0 });
  const [weekPlanExpired, setWeekPlanExpired] = useState<boolean>(false);
  const [mealPlanExpired, setMealPlanExpired] = useState<boolean>(false);

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
      if (progressData) {
        const parsed = safeJsonParse<ProgressEntry[]>(progressData, []);
        setProgress(parsed);
        console.log('[FitnessProvider] Cache: Progress hydrated:', parsed.length);
      }
      if (logsData) {
        const parsed = safeJsonParse<WorkoutLog[]>(logsData, []);
        setWorkoutLogs(parsed);
        console.log('[FitnessProvider] Cache: Workout logs hydrated:', parsed.length);
      }
      if (nutritionData) {
        const parsed = safeJsonParse<NutritionAssessment | null>(nutritionData, null);
        if (parsed) {
          setNutritionAssessment(parsed);
          console.log('[FitnessProvider] Cache: Nutrition assessment hydrated');
        }
      }
      if (mealPlanData) {
        const parsed = safeJsonParse<WeeklyMealPlan | null>(mealPlanData, null);
        if (parsed) {
          if (isWeeklyPlanExpired(parsed.startDate, parsed.endDate)) {
            console.log('[FitnessProvider] Cache: Meal plan EXPIRED, clearing');
            setMealPlanExpired(true);
            setCurrentMealPlan(null);
            await AsyncStorage.removeItem(MEAL_PLAN_KEY);
          } else {
            setCurrentMealPlan(parsed);
            console.log('[FitnessProvider] Cache: Meal plan hydrated');
          }
        }
      }
      if (groceryData) {
        const parsed = safeJsonParse<GroceryList | null>(groceryData, null);
        if (parsed) {
          setGroceryList(parsed);
          console.log('[FitnessProvider] Cache: Grocery list hydrated');
        }
      }
      if (favoriteExercisesData) {
        const parsed = safeJsonParse<FavoriteExercise[]>(favoriteExercisesData, []);
        setFavoriteExercises(parsed);
        console.log('[FitnessProvider] Cache: Favorite exercises hydrated:', parsed.length);
      }
      if (favoriteMealsData) {
        const parsed = safeJsonParse<FavoriteMeal[]>(favoriteMealsData, []);
        setFavoriteMeals(parsed);
        console.log('[FitnessProvider] Cache: Favorite meals hydrated:', parsed.length);
      }
      if (weekPlanData) {
        const parsed = normalizeWeeklyPlan(safeJsonParse<WeeklyPlan | null>(weekPlanData, null));
        if (parsed) {
          if (isWeeklyPlanExpired(parsed.startDate, parsed.endDate)) {
            console.log('[FitnessProvider] Cache: Week plan EXPIRED, clearing');
            setWeekPlanExpired(true);
            setCurrentWeekPlan(null);
            await AsyncStorage.removeItem(WEEK_PLAN_KEY);
          } else {
            setCurrentWeekPlan(parsed);
            console.log('[FitnessProvider] Cache: Week plan hydrated with', parsed.sessions.length, 'sessions');
          }
        }
      }
      if (nutritionPlanData) {
        const parsed = safeJsonParse<NutritionPlan | null>(nutritionPlanData, null);
        if (parsed) {
          setNutritionPlan(parsed);
          console.log('[FitnessProvider] Cache: Nutrition plan hydrated');
        }
      }

      if (!user) {
        setIsLoading(false);
        setRemoteProfileChecked(true);
        setHasRemoteProfile(false);
        console.log('[FitnessProvider] No user logged in, using local cache only');
        return;
      }

      console.log('[FitnessProvider] Step 1.5: Updating daily streak');
      try {
        const streakResult = await remoteFitnessRepo.updateUserStreak(user.id);
        if (streakResult) {
          setStreakData(streakResult);
          console.log('[FitnessProvider] Streak updated:', streakResult.currentStreak, 'longest:', streakResult.longestStreak);
        }
      } catch (streakErr) {
        console.warn('[FitnessProvider] Error updating streak:', streakErr);
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
        }
        if (remoteProgress.length > 0) {
          setProgress(remoteProgress);
          await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(remoteProgress));
          console.log('[FitnessProvider] Remote: Progress refreshed:', remoteProgress.length);
        }
        if (remoteLogs.length > 0) {
          setWorkoutLogs(remoteLogs);
          await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(remoteLogs));
          console.log('[FitnessProvider] Remote: Workout logs refreshed:', remoteLogs.length);
        }
        if (remoteFavExercises.length > 0) {
          setFavoriteExercises(remoteFavExercises);
          await AsyncStorage.setItem(FAVORITE_EXERCISES_KEY, JSON.stringify(remoteFavExercises));
          console.log('[FitnessProvider] Remote: Favorite exercises refreshed:', remoteFavExercises.length);
        }
        if (remoteFavMeals.length > 0) {
          setFavoriteMeals(remoteFavMeals);
          await AsyncStorage.setItem(FAVORITE_MEALS_KEY, JSON.stringify(remoteFavMeals));
          console.log('[FitnessProvider] Remote: Favorite meals refreshed:', remoteFavMeals.length);
        }

        let remoteWorkoutPlan: WeeklyPlan | null = null;
        try {
          remoteWorkoutPlan = normalizeWeeklyPlan(await remoteFitnessRepo.fetchActiveWorkoutPlan(user.id));
          if (remoteWorkoutPlan && remoteWorkoutPlan.sessions.length > 0) {
            if (isWeeklyPlanExpired(remoteWorkoutPlan.startDate, remoteWorkoutPlan.endDate)) {
              console.log('[FitnessProvider] Remote: Workout plan EXPIRED, archiving and clearing');
              setWeekPlanExpired(true);
              setCurrentWeekPlan(null);
              await AsyncStorage.removeItem(WEEK_PLAN_KEY);
              remoteWorkoutPlan = null;
            } else {
              setWeekPlanExpired(false);
              setCurrentWeekPlan(remoteWorkoutPlan);
              await AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(remoteWorkoutPlan));
              console.log('[FitnessProvider] Remote: Workout plan refreshed with', remoteWorkoutPlan.sessions.length, 'sessions');
            }
          }
        } catch (wpErr) {
          console.warn('[FitnessProvider] Could not fetch workout plan:', wpErr);
        }

        let remoteNutrition: { plan: NutritionPlan; mealPlan: WeeklyMealPlan } | null = null;
        try {
          remoteNutrition = await remoteFitnessRepo.fetchActiveNutritionPlan(user.id);
          if (remoteNutrition) {
            if (isWeeklyPlanExpired(remoteNutrition.mealPlan.startDate, remoteNutrition.mealPlan.endDate)) {
              console.log('[FitnessProvider] Remote: Meal plan EXPIRED, clearing');
              setMealPlanExpired(true);
              setCurrentMealPlan(null);
              setNutritionPlan(null);
              await AsyncStorage.removeItem(MEAL_PLAN_KEY);
              await AsyncStorage.removeItem(NUTRITION_PLAN_KEY);
              remoteNutrition = null;
            } else {
            setMealPlanExpired(false);
            setNutritionPlan(remoteNutrition.plan);
            await AsyncStorage.setItem(NUTRITION_PLAN_KEY, JSON.stringify(remoteNutrition.plan));

            const remoteDays = remoteNutrition.mealPlan.days;
            const remoteDaysHaveMeals = remoteDays.length > 0 && remoteDays.some(d =>
              d.breakfast || d.lunch || d.dinner || d.snacks.length > 0
            );

            if (remoteDaysHaveMeals) {
              const localMealPlanStr = await AsyncStorage.getItem(MEAL_PLAN_KEY);
              const localMealPlan = safeJsonParse<WeeklyMealPlan | null>(localMealPlanStr, null);

              const remoteHasCompletedMeals = remoteDays.some(d => d.completedMeals && (
                d.completedMeals.breakfast || d.completedMeals.lunch || d.completedMeals.dinner ||
                (d.completedMeals.snacks && d.completedMeals.snacks.some(Boolean))
              ));

              if (!remoteHasCompletedMeals && localMealPlan) {
                const localHasCompletedMeals = localMealPlan.days.some(d => d.completedMeals && (
                  d.completedMeals.breakfast || d.completedMeals.lunch || d.completedMeals.dinner ||
                  (d.completedMeals.snacks && d.completedMeals.snacks.some(Boolean))
                ));

                if (localHasCompletedMeals) {
                  console.log('[FitnessProvider] Remote has no completedMeals, merging from local cache');
                  const mergedDays = remoteDays.map(remoteDay => {
                    const localDay = localMealPlan.days.find(ld => ld.day === remoteDay.day || ld.id === remoteDay.id);
                    if (localDay?.completedMeals) {
                      return { ...remoteDay, completedMeals: localDay.completedMeals };
                    }
                    return remoteDay;
                  });
                  const mergedMealPlan = { ...remoteNutrition.mealPlan, days: mergedDays };
                  setCurrentMealPlan(mergedMealPlan);
                  await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(mergedMealPlan));
                  console.log('[FitnessProvider] Remote: Meal plan refreshed with local completedMeals merged');

                  for (const day of mergedDays) {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (day.completedMeals && uuidRegex.test(day.id)) {
                      remoteFitnessRepo.updateMealCompletion(day.id, day.completedMeals).catch(err => {
                        console.warn('[FitnessProvider] Error pushing local completedMeals to remote:', err);
                      });
                    }
                  }
                } else {
                  setCurrentMealPlan(remoteNutrition.mealPlan);
                  await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(remoteNutrition.mealPlan));
                }
              } else {
                setCurrentMealPlan(remoteNutrition.mealPlan);
                await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(remoteNutrition.mealPlan));
              }
              console.log('[FitnessProvider] Remote: Meal plan refreshed with meals');
            } else if (remoteDays.length > 0) {
              console.log('[FitnessProvider] Remote: Meal plan days found but no meals, keeping local cache');
              const localMealPlanStr = await AsyncStorage.getItem(MEAL_PLAN_KEY);
              const localMealPlan = safeJsonParse<WeeklyMealPlan | null>(localMealPlanStr, null);
              if (localMealPlan && localMealPlan.days.some(d => d.breakfast || d.lunch || d.dinner || d.snacks.length > 0)) {
                console.log('[FitnessProvider] Pushing local meal plan to Supabase since remote has no meals');
                remoteFitnessRepo.saveNutritionPlan(user.id, remoteNutrition.plan, localMealPlan).catch((err) => {
                  console.warn('[FitnessProvider] Error re-pushing local meal plan:', err);
                });
              }
            }
            console.log('[FitnessProvider] Remote: Nutrition plan refreshed');
            }
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

        if (!remoteWorkoutPlan && weekPlanData) {
          console.log('[FitnessProvider] No remote workout plan but local cache exists, pushing to Supabase');
          const localWeekPlan = normalizeWeeklyPlan(safeJsonParse<WeeklyPlan | null>(weekPlanData, null));
          if (localWeekPlan && localWeekPlan.sessions.length > 0) {
            remoteFitnessRepo.saveWorkoutPlan(user.id, localWeekPlan).then(() => {
              console.log('[FitnessProvider] Local workout plan pushed to Supabase');
            }).catch((err) => {
              console.warn('[FitnessProvider] Error pushing local workout plan:', err);
            });
          }
        }

        if (!remoteNutrition && (nutritionPlanData || mealPlanData)) {
          console.log('[FitnessProvider] No remote nutrition plan but local cache exists, pushing to Supabase');
          const localNutritionPlan = safeJsonParse<NutritionPlan | null>(nutritionPlanData, null);
          const localMealPlan = safeJsonParse<WeeklyMealPlan | null>(mealPlanData, null);
          if (localNutritionPlan) {
            remoteFitnessRepo.saveNutritionPlan(user.id, localNutritionPlan, localMealPlan || undefined).then(() => {
              console.log('[FitnessProvider] Local nutrition plan + meal plan pushed to Supabase');
            }).catch((err) => {
              console.warn('[FitnessProvider] Error pushing local nutrition plan:', err);
            });
          }
        } else if (remoteNutrition && mealPlanData) {
          const localMealPlan = safeJsonParse<WeeklyMealPlan | null>(mealPlanData, null);
          const remoteDaysHaveMeals = remoteNutrition.mealPlan.days.some(d =>
            d.breakfast || d.lunch || d.dinner || d.snacks.length > 0
          );
          const localDaysHaveMeals = localMealPlan && localMealPlan.days.some(d =>
            d.breakfast || d.lunch || d.dinner || d.snacks.length > 0
          );
          if (!remoteDaysHaveMeals && localDaysHaveMeals && localMealPlan) {
            console.log('[FitnessProvider] Remote nutrition exists but no meals, re-pushing local meals');
            remoteFitnessRepo.saveNutritionPlan(user.id, remoteNutrition.plan, localMealPlan).then(() => {
              console.log('[FitnessProvider] Local meal plan re-pushed to Supabase');
            }).catch((err) => {
              console.warn('[FitnessProvider] Error re-pushing local meal plan:', err);
            });
          }
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

  const createWorkoutLogForSession = useCallback(async (session: { id: string; name: string; duration: number; completedAt?: string }) => {
    const logDate = session.completedAt || new Date().toISOString();
    const existingLog = workoutLogs.find(l => l.sessionId === session.id);
    if (existingLog) {
      console.log('[FitnessProvider] Workout log already exists for session:', session.id);
      return;
    }

    const newLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      sessionId: session.id,
      date: logDate,
      exercises: [],
      duration: session.duration || 0,
      notes: session.name,
    };

    const updated = [...workoutLogs, newLog];
    setWorkoutLogs(updated);
    await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updated));
    console.log('[FitnessProvider] Workout log created locally for session:', session.id);

    if (user) {
      remoteFitnessRepo.insertWorkoutLog(user.id, newLog).then((remote) => {
        if (remote?.id) {
          const withRemoteId = updated.map(l => l.sessionId === session.id ? { ...l, id: remote.id } : l);
          setWorkoutLogs(withRemoteId);
          AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(withRemoteId)).catch(console.error);
          console.log('[FitnessProvider] Workout log synced to Supabase, id:', remote.id);
        }
      }).catch(err => {
        console.warn('[FitnessProvider] Error syncing workout log:', err);
      });
    }
  }, [workoutLogs, user]);

  const toggleExerciseCompletion = useCallback((sessionId: string, exerciseId: string) => {
    if (!currentWeekPlan) return;

    let justCompleted = false;
    const updatedSessions = (currentWeekPlan.sessions ?? []).map((session) => {
      if (session.id === sessionId) {
        const completedExercises = session.completedExercises || [];
        const isCompleted = completedExercises.includes(exerciseId);

        const newCompletedExercises = isCompleted
          ? completedExercises.filter((id) => id !== exerciseId)
          : [...completedExercises, exerciseId];

        const allExercisesCompleted = newCompletedExercises.length === session.exercises.length;
        const wasAlreadyCompleted = session.completed;
        const newCompletedAt = allExercisesCompleted ? new Date().toISOString() : session.completedAt;

        if (allExercisesCompleted && !wasAlreadyCompleted) {
          justCompleted = true;
        }

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

    if (justCompleted) {
      const completedSession = updatedSessions.find(s => s.id === sessionId);
      if (completedSession) {
        void createWorkoutLogForSession(completedSession);
      }
    }
  }, [currentWeekPlan, user, createWorkoutLogForSession]);

  const toggleSessionCompletion = useCallback((sessionId: string) => {
    if (!currentWeekPlan) return;

    let justCompleted = false;
    const updatedSessions = (currentWeekPlan.sessions ?? []).map((session) => {
      if (session.id === sessionId) {
        const newCompleted = !session.completed;
        const newCompletedAt = newCompleted ? new Date().toISOString() : undefined;
        const newCompletedExercises = newCompleted ? session.exercises.map((e) => e.id) : [];

        if (newCompleted && !session.completed) {
          justCompleted = true;
        }

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

    if (justCompleted) {
      const completedSession = updatedSessions.find(s => s.id === sessionId);
      if (completedSession) {
        void createWorkoutLogForSession(completedSession);
      }
    }
  }, [currentWeekPlan, user, createWorkoutLogForSession]);

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
  void remoteFitnessRepo.updateExerciseDetails(exerciseId, updates);
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
    return streakData.currentStreak;
  }, [streakData.currentStreak]);

  const getLongestStreak = useCallback((): number => {
    return streakData.longestStreak;
  }, [streakData.longestStreak]);

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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const updatedDay = updatedDays.find((day) => day.id === dayId);
      if (updatedDay?.completedMeals && uuidRegex.test(dayId)) {
        void remoteFitnessRepo.updateMealCompletion(dayId, updatedDay.completedMeals);
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
    getLongestStreak,
    refreshData,
    hasProfile: user
      ? (remoteProfileChecked ? (hasRemoteProfile || !!profile) : !!profile)
      : !!profile,
    streakData,
    weekPlanExpired,
    mealPlanExpired,
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
    getLongestStreak,
    refreshData,
    user,
    remoteProfileChecked,
    hasRemoteProfile,
    streakData,
    weekPlanExpired,
    mealPlanExpired,
    loadError,
  ]);
});
