import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState } from "react";
import {
  FitnessProfile,
  ProgressEntry,
  WeeklyPlan,
  WorkoutLog,
  NutritionAssessment,
  WeeklyMealPlan,
  GroceryList,
  NutritionPlan,
  DietPattern,
  MacroDistribution,
  MealSuggestion,
  FavoriteExercise,
  FavoriteMeal,
} from "@/types/fitness";
import { useAuth } from "@/providers/AuthProvider";
import { remoteFitnessRepo } from "@/lib/remoteFitnessRepo";

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
    loadData();
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

  const loadData = async () => {
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
          setCurrentMealPlan(parsed);
          console.log('[FitnessProvider] Cache: Meal plan hydrated');
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
        const parsed = safeJsonParse<WeeklyPlan | null>(weekPlanData, null);
        if (parsed) {
          setCurrentWeekPlan(parsed);
          console.log('[FitnessProvider] Cache: Week plan hydrated with', parsed.sessions?.length, 'sessions');
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

      setRemoteProfileChecked(false);
      setHasRemoteProfile(false);

      console.log('[FitnessProvider] Step 2: Refreshing from Supabase for user:', user.id);
      try {
        const [remoteProfile, remoteProgress, remoteLogs, remoteFavExercises, remoteFavMeals] = await Promise.all([
          remoteFitnessRepo.fetchProfile(user.id),
          remoteFitnessRepo.fetchProgressEntries(user.id),
          remoteFitnessRepo.fetchWorkoutLogs(user.id),
          remoteFitnessRepo.fetchFavoriteExercises(user.id),
          remoteFitnessRepo.fetchFavoriteMeals(user.id),
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
          remoteWorkoutPlan = await remoteFitnessRepo.fetchActiveWorkoutPlan(user.id);
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

        if (!remoteWorkoutPlan && weekPlanData) {
          console.log('[FitnessProvider] No remote workout plan but local cache exists, pushing to Supabase');
          const localWeekPlan = safeJsonParse<WeeklyPlan | null>(weekPlanData, null);
          if (localWeekPlan && localWeekPlan.sessions?.length > 0) {
            remoteFitnessRepo.saveWorkoutPlan(user.id, localWeekPlan).then(() => {
              console.log('[FitnessProvider] Local workout plan pushed to Supabase');
            }).catch((err) => {
              console.warn('[FitnessProvider] Error pushing local workout plan:', err);
            });
          }
        }

        if (!remoteNutrition && nutritionPlanData && mealPlanData) {
          console.log('[FitnessProvider] No remote nutrition plan but local cache exists, pushing to Supabase');
          const localNutritionPlan = safeJsonParse<NutritionPlan | null>(nutritionPlanData, null);
          const localMealPlan = safeJsonParse<WeeklyMealPlan | null>(mealPlanData, null);
          if (localNutritionPlan) {
            remoteFitnessRepo.saveNutritionPlan(user.id, localNutritionPlan, localMealPlan || undefined).then(() => {
              console.log('[FitnessProvider] Local nutrition plan pushed to Supabase');
            }).catch((err) => {
              console.warn('[FitnessProvider] Error pushing local nutrition plan:', err);
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
  };

  const saveProfile = async (newProfile: FitnessProfile) => {
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
  };

  const addProgressEntry = async (entry: ProgressEntry) => {
    try {
      const updated = [...progress, entry];
      setProgress(updated);
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      console.log('[FitnessProvider] Progress entry saved locally, weight:', entry.weight);

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
  };

  const addWorkoutLog = async (log: WorkoutLog) => {
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
  };

  const updateWeekPlan = async (plan: WeeklyPlan) => {
    setCurrentWeekPlan(plan);
    await AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(plan));
    console.log('[FitnessProvider] Week plan saved locally with', plan.sessions?.length, 'sessions');

    if (user) {
      remoteFitnessRepo.saveWorkoutPlan(user.id, plan).then(() => {
        console.log('[FitnessProvider] Workout plan synced to Supabase');
      }).catch((err) => {
        console.warn('[FitnessProvider] Error saving workout plan to Supabase:', err);
      });
    }
  };

  const toggleExerciseCompletion = (sessionId: string, exerciseId: string) => {
    if (!currentWeekPlan) return;

    const updatedSessions = currentWeekPlan.sessions.map((session) => {
      if (session.id === sessionId) {
        const completedExercises = session.completedExercises || [];
        const isCompleted = completedExercises.includes(exerciseId);

        const newCompletedExercises = isCompleted
          ? completedExercises.filter((id) => id !== exerciseId)
          : [...completedExercises, exerciseId];

        const allExercisesCompleted = newCompletedExercises.length === session.exercises.length;

        return {
          ...session,
          completedExercises: newCompletedExercises,
          completed: allExercisesCompleted,
          completedAt: allExercisesCompleted ? new Date().toISOString() : session.completedAt,
        };
      }
      return session;
    });

    const updatedPlan = { ...currentWeekPlan, sessions: updatedSessions };
    setCurrentWeekPlan(updatedPlan);
    AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(updatedPlan)).catch(console.error);
  };

  const toggleSessionCompletion = (sessionId: string) => {
    if (!currentWeekPlan) return;

    const updatedSessions = currentWeekPlan.sessions.map((session) => {
      if (session.id === sessionId) {
        const newCompleted = !session.completed;
        return {
          ...session,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : undefined,
          completedExercises: newCompleted ? session.exercises.map((e) => e.id) : [],
        };
      }
      return session;
    });

    const updatedPlan = { ...currentWeekPlan, sessions: updatedSessions };
    setCurrentWeekPlan(updatedPlan);
    AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(updatedPlan)).catch(console.error);
  };

  const updateExercise = (sessionId: string, exerciseId: string, updates: Partial<{ sets: number; reps: string; rest: number; assignedWeight: string }>) => {
    if (!currentWeekPlan) return;

    const updatedSessions = currentWeekPlan.sessions.map((session) => {
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

    const updatedPlan = { ...currentWeekPlan, sessions: updatedSessions };
    setCurrentWeekPlan(updatedPlan);
    AsyncStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(updatedPlan)).catch(console.error);
  };

  const calculateBMR = (): number => {
    if (!profile) return 0;
    const { weight, height, age, gender } = profile;
    if (gender === "male") {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const calculateTDEE = (): number => {
    const bmr = calculateBMR();
    if (!profile) return bmr;

    const activityMultipliers: Record<number, number> = {
      0: 1.2, 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.55, 5: 1.725, 6: 1.725, 7: 1.9,
    };
    const multiplier = activityMultipliers[profile.availableDays] || 1.55;
    return bmr * multiplier;
  };

  const getTargetCalories = (): number => {
    const tdee = calculateTDEE();
    if (!profile) return tdee;
    switch (profile.goal) {
      case "fat_loss": return tdee - 500;
      case "muscle_gain": return tdee + 300;
      default: return tdee;
    }
  };

  const getCurrentStreak = (): number => {
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
  };

  const saveNutritionAssessment = async (assessment: NutritionAssessment) => {
    try {
      if (assessment.completed && !assessment.favoriteMeals) {
        const favMeals = extractFavoriteMealsFromHistory(assessment.dietHistory);
        assessment.favoriteMeals = favMeals;
      }
      await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(assessment));
      setNutritionAssessment(assessment);
      if (assessment.completed && profile) {
        const plan = generateNutritionPlan(assessment);
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
  };

  const generateNutritionPlan = (assessment: NutritionAssessment): NutritionPlan => {
    if (!profile) {
      throw new Error("Profile is required to generate nutrition plan");
    }

    const targetCalories = getTargetCalories();
    const recommendations: string[] = [];
    let dietPattern: DietPattern = "balanced";
    let proteinPriority = false;
    let carbTiming: "around_workout" | "evenly_distributed" = "evenly_distributed";

    if (profile.goal === "muscle_gain") {
      dietPattern = "high_protein_carbs";
      proteinPriority = true;
      carbTiming = "around_workout";
      recommendations.push("زيادة البروتين والكربوهيدرات لبناء العضلات");
      recommendations.push("تناول الكربوهيدرات قبل وبعد التمرين");
    } else if (profile.goal === "fat_loss") {
      if (profile.availableDays >= 3) {
        dietPattern = "high_protein";
        carbTiming = "around_workout";
        recommendations.push("بروتين عالي للحفاظ على العضلات أثناء نزول الوزن");
      } else {
        dietPattern = "moderate_low_carb";
        recommendations.push("تقليل الكربوهيدرات تدريجياً");
      }
      proteinPriority = true;
      recommendations.push("العجز في السعرات الحرارية لحرق الدهون");
    } else {
      dietPattern = "balanced";
      recommendations.push("نظام متوازن للصحة العامة");
    }

    if (profile.injuries && profile.injuries.toLowerCase().includes("diabetes")) {
      dietPattern = "moderate_low_carb";
      recommendations.push("تقليل الكربوهيدرات لمرضى السكري");
    }

    const macros = calculateMacros(targetCalories, dietPattern, profile);
    const mealDistribution = calculateMealDistribution(
      assessment.mealStructure || "3_meals",
      macros.protein,
      profile.availableDays
    );

    if (assessment.ffq.vegetables === "rarely" || assessment.ffq.vegetables === "never") {
      recommendations.push("زيادة تناول الخضروات تدريجياً");
    }
    if (assessment.ffq.fish === "rarely" || assessment.ffq.fish === "never") {
      recommendations.push("إضافة السمك للحصول على أوميغا 3");
    }

    const currentProtein = estimateCurrentProtein(assessment.dietHistory);
    if (currentProtein < macros.protein) {
      recommendations.push(`زيادة البروتين من ${Math.round(currentProtein)}g إلى ${Math.round(macros.protein)}g`);
    }

    return {
      targetCalories,
      macros,
      dietPattern,
      recommendations,
      proteinPriority,
      carbTiming,
      mealDistribution,
    };
  };

  const calculateMacros = (
    calories: number,
    pattern: DietPattern,
    prof: FitnessProfile
  ): MacroDistribution => {
    const proteinPerKg = pattern === "high_protein_carbs" ? 2.0 : pattern === "high_protein" ? 1.8 : 1.6;
    const protein = prof.weight * proteinPerKg;
    const proteinCalories = protein * 4;

    let carbPercentage = 0.4;
    let fatPercentage = 0.3;

    if (pattern === "high_protein_carbs") {
      carbPercentage = 0.45;
      fatPercentage = 0.25;
    } else if (pattern === "high_protein") {
      carbPercentage = 0.35;
      fatPercentage = 0.3;
    } else if (pattern === "moderate_low_carb") {
      carbPercentage = 0.25;
      fatPercentage = 0.4;
    }

    const remainingCalories = calories - proteinCalories;
    const carbs = (remainingCalories * carbPercentage) / 4;
    const fats = (remainingCalories * fatPercentage) / 9;

    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    };
  };

  const calculateMealDistribution = (
    structure: "1_meal_snacks" | "2_meals" | "3_meals" | "3_meals_snacks",
    totalProtein: number,
    _trainingDays: number
  ) => {
    let mealsCount = 3;
    let snacksCount = 0;

    switch (structure) {
      case "1_meal_snacks": mealsCount = 1; snacksCount = 4; break;
      case "2_meals": mealsCount = 2; snacksCount = 3; break;
      case "3_meals": mealsCount = 3; snacksCount = 2; break;
      case "3_meals_snacks": mealsCount = 3; snacksCount = 3; break;
    }

    const proteinPerMeal = totalProtein / (mealsCount + snacksCount * 0.3);
    return { mealsCount, snacksCount, proteinPerMeal: Math.round(proteinPerMeal) };
  };

  const estimateCurrentProtein = (dietHistory: NutritionAssessment["dietHistory"]): number => {
    const allMeals = [...dietHistory.breakfast, ...dietHistory.lunch, ...dietHistory.dinner, ...dietHistory.snacks];
    let proteinEstimate = 0;
    const proteinKeywords = ["دجاج", "لحم", "سمك", "بيض", "بروتين", "chicken", "meat", "fish", "egg"];
    allMeals.forEach((meal) => {
      const lowerMeal = meal.toLowerCase();
      const hasProtein = proteinKeywords.some((keyword) => lowerMeal.includes(keyword));
      if (hasProtein) proteinEstimate += 25;
    });
    return proteinEstimate;
  };

  const extractFavoriteMealsFromHistory = (dietHistory: NutritionAssessment["dietHistory"]): MealSuggestion[] => {
    const favorites: MealSuggestion[] = [];
    const mealMap: Record<string, { type: "breakfast" | "lunch" | "dinner" | "snack"; names: string[] }> = {
      breakfast: { type: "breakfast" as const, names: dietHistory.breakfast },
      lunch: { type: "lunch" as const, names: dietHistory.lunch },
      dinner: { type: "dinner" as const, names: dietHistory.dinner },
      snacks: { type: "snack" as const, names: dietHistory.snacks },
    };

    Object.entries(mealMap).forEach(([, value]) => {
      value.names.forEach((mealName) => {
        const meal: MealSuggestion = {
          id: `fav-${Date.now()}-${Math.random()}`,
          name: mealName,
          nameAr: mealName,
          type: value.type,
          calories: estimateMealCalories(value.type),
          protein: estimateMealProtein(mealName, value.type),
          carbs: estimateMealCarbs(mealName, value.type),
          fats: estimateMealFats(value.type),
          ingredients: [mealName],
          ingredientsAr: [mealName],
        };
        favorites.push(meal);
      });
    });
    return favorites;
  };

  const estimateMealCalories = (type: "breakfast" | "lunch" | "dinner" | "snack"): number => {
    if (type === "snack") return 150;
    if (type === "breakfast") return 350;
    return 500;
  };

  const estimateMealProtein = (mealName: string, type: "breakfast" | "lunch" | "dinner" | "snack"): number => {
    const lowerMeal = mealName.toLowerCase();
    const proteinKeywords = ["دجاج", "لحم", "سمك", "بيض", "chicken", "meat", "fish", "egg", "كبسة", "مندي"];
    const hasProtein = proteinKeywords.some((keyword) => lowerMeal.includes(keyword));
    if (hasProtein) {
      if (type === "snack") return 8;
      if (type === "breakfast") return 18;
      return 35;
    }
    if (type === "snack") return 3;
    if (type === "breakfast") return 10;
    return 15;
  };

  const estimateMealCarbs = (mealName: string, type: "breakfast" | "lunch" | "dinner" | "snack"): number => {
    const lowerMeal = mealName.toLowerCase();
    const carbKeywords = ["رز", "أرز", "خبز", "rice", "bread", "كبسة", "مندي"];
    const hasCarbs = carbKeywords.some((keyword) => lowerMeal.includes(keyword));
    if (hasCarbs) {
      if (type === "snack") return 20;
      if (type === "breakfast") return 35;
      return 60;
    }
    if (type === "snack") return 15;
    if (type === "breakfast") return 25;
    return 40;
  };

  const estimateMealFats = (type: "breakfast" | "lunch" | "dinner" | "snack"): number => {
    if (type === "snack") return 6;
    if (type === "breakfast") return 12;
    return 18;
  };

  const saveMealPlan = async (plan: WeeklyMealPlan) => {
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
  };

  const saveGroceryList = async (list: GroceryList) => {
    try {
      await AsyncStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(list));
      setGroceryList(list);
    } catch (error) {
      console.error("Error saving grocery list:", error);
    }
  };

  const toggleGroceryItem = async (itemId: string) => {
    if (!groceryList) return;
    const updatedItems = groceryList.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const updatedList = { ...groceryList, items: updatedItems };
    await saveGroceryList(updatedList);
  };

  const toggleMealCompletion = async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", snackIndex?: number) => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const completedMeals = day.completedMeals || {
          breakfast: false, lunch: false, dinner: false,
          snacks: day.snacks.map(() => false),
        };

        if (mealType === "snack" && snackIndex !== undefined) {
          const snacksCompletion = completedMeals.snacks || day.snacks.map(() => false);
          snacksCompletion[snackIndex] = !snacksCompletion[snackIndex];
          return { ...day, completedMeals: { ...completedMeals, snacks: snacksCompletion } };
        } else if (mealType === "breakfast") {
          return { ...day, completedMeals: { ...completedMeals, breakfast: !completedMeals.breakfast } };
        } else if (mealType === "lunch") {
          return { ...day, completedMeals: { ...completedMeals, lunch: !completedMeals.lunch } };
        } else if (mealType === "dinner") {
          return { ...day, completedMeals: { ...completedMeals, dinner: !completedMeals.dinner } };
        }
      }
      return day;
    });

    const updatedPlan = { ...currentMealPlan, days: updatedDays };
    await saveMealPlan(updatedPlan);
  };

  const recalcDayTotals = (day: typeof currentMealPlan extends { days: (infer D)[] } | null ? D : never) => {
    const d = { ...day };
    d.totalCalories = (d.breakfast?.calories || 0) + (d.lunch?.calories || 0) + (d.dinner?.calories || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.calories, 0);
    d.totalProtein = (d.breakfast?.protein || 0) + (d.lunch?.protein || 0) + (d.dinner?.protein || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.protein, 0);
    d.totalCarbs = (d.breakfast?.carbs || 0) + (d.lunch?.carbs || 0) + (d.dinner?.carbs || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.carbs, 0);
    d.totalFats = (d.breakfast?.fats || 0) + (d.lunch?.fats || 0) + (d.dinner?.fats || 0) + d.snacks.reduce((sum: number, s: MealSuggestion) => sum + s.fats, 0);
    return d;
  };

  const addMealToDay = async (dayId: string, meal: MealSuggestion, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
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
  };

  const removeMealFromDay = async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", snackIndex?: number) => {
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
  };

  const addGroceryItem = async (name: string, category: GroceryList["items"][0]["category"]) => {
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
  };

  const addFavoriteExercise = async (exercise: Omit<FavoriteExercise, "id" | "addedAt">) => {
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
  };

  const removeFavoriteExercise = async (id: string) => {
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
  };

  const addFavoriteMeal = async (meal: Omit<FavoriteMeal, "id" | "addedAt">) => {
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
  };

  const removeFavoriteMeal = async (id: string) => {
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
  };

  const updateMealInPlan = async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", updatedMeal: MealSuggestion, snackIndex?: number) => {
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
  };

  return {
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
    calculateBMR,
    calculateTDEE,
    getTargetCalories,
    getCurrentStreak,
    hasProfile: user
      ? (remoteProfileChecked ? (hasRemoteProfile || !!profile) : !!profile)
      : !!profile,
    loadError,
  };
});
