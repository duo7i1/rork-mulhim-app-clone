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

export const [FitnessProvider, useFitness] = createContextHook(() => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentWeekPlan, setCurrentWeekPlan] = useState<WeeklyPlan | null>(
    null
  );
  const [nutritionAssessment, setNutritionAssessment] = useState<NutritionAssessment | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [currentMealPlan, setCurrentMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [favoriteExercises, setFavoriteExercises] = useState<FavoriteExercise[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      console.log('[FitnessProvider] Boot sequence started');
      
      console.log('[FitnessProvider] Step 1: Hydrating from local cache');
      const [profileData, progressData, logsData, nutritionData, mealPlanData, groceryData, favoriteExercisesData, favoriteMealsData] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(WORKOUT_LOGS_KEY),
        AsyncStorage.getItem(NUTRITION_KEY),
        AsyncStorage.getItem(MEAL_PLAN_KEY),
        AsyncStorage.getItem(GROCERY_LIST_KEY),
        AsyncStorage.getItem(FAVORITE_EXERCISES_KEY),
        AsyncStorage.getItem(FAVORITE_MEALS_KEY),
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
        if (parsed.length === 0 && progressData) {
          await AsyncStorage.removeItem(PROGRESS_KEY);
        }
      }
      if (logsData) {
        const parsed = safeJsonParse<WorkoutLog[]>(logsData, []);
        setWorkoutLogs(parsed);
        console.log('[FitnessProvider] Cache: Workout logs hydrated:', parsed.length);
        if (parsed.length === 0 && logsData) {
          await AsyncStorage.removeItem(WORKOUT_LOGS_KEY);
        }
      }
      if (nutritionData) {
        const parsed = safeJsonParse<NutritionAssessment | null>(nutritionData, null);
        if (parsed) {
          setNutritionAssessment(parsed);
          console.log('[FitnessProvider] Cache: Nutrition assessment hydrated');
        } else {
          await AsyncStorage.removeItem(NUTRITION_KEY);
        }
      }
      if (mealPlanData) {
        const parsed = safeJsonParse<WeeklyMealPlan | null>(mealPlanData, null);
        if (parsed) {
          setCurrentMealPlan(parsed);
          console.log('[FitnessProvider] Cache: Meal plan hydrated');
        } else {
          await AsyncStorage.removeItem(MEAL_PLAN_KEY);
        }
      }
      if (groceryData) {
        const parsed = safeJsonParse<GroceryList | null>(groceryData, null);
        if (parsed) {
          setGroceryList(parsed);
          console.log('[FitnessProvider] Cache: Grocery list hydrated');
        } else {
          await AsyncStorage.removeItem(GROCERY_LIST_KEY);
        }
      }
      if (favoriteExercisesData) {
        const parsed = safeJsonParse<FavoriteExercise[]>(favoriteExercisesData, []);
        setFavoriteExercises(parsed);
        console.log('[FitnessProvider] Cache: Favorite exercises hydrated:', parsed.length);
        if (parsed.length === 0 && favoriteExercisesData) {
          await AsyncStorage.removeItem(FAVORITE_EXERCISES_KEY);
        }
      }
      if (favoriteMealsData) {
        const parsed = safeJsonParse<FavoriteMeal[]>(favoriteMealsData, []);
        setFavoriteMeals(parsed);
        console.log('[FitnessProvider] Cache: Favorite meals hydrated:', parsed.length);
        if (parsed.length === 0 && favoriteMealsData) {
          await AsyncStorage.removeItem(FAVORITE_MEALS_KEY);
        }
      }

      setIsLoading(false);
      console.log('[FitnessProvider] Step 1 complete: UI ready with cached data');

      if (user) {
        console.log('[FitnessProvider] Step 2: Refreshing from remote for user:', user.id);
        try {
          const [remoteProfile, remoteProgress, remoteLogs] = await Promise.all([
            remoteFitnessRepo.fetchProfile(user.id),
            remoteFitnessRepo.fetchProgressEntries(user.id),
            remoteFitnessRepo.fetchWorkoutLogs(user.id),
          ]);

          if (remoteProfile) {
            setProfile(remoteProfile);
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(remoteProfile));
            console.log('[FitnessProvider] Remote: Profile refreshed and cached');
          }
          if (remoteProgress.length > 0) {
            setProgress(remoteProgress);
            await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(remoteProgress));
            console.log('[FitnessProvider] Remote: Progress refreshed and cached:', remoteProgress.length);
          }
          if (remoteLogs.length > 0) {
            setWorkoutLogs(remoteLogs);
            await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(remoteLogs));
            console.log('[FitnessProvider] Remote: Workout logs refreshed and cached:', remoteLogs.length);
          }
          
          console.log('[FitnessProvider] Step 2 complete: Remote sync successful');
        } catch (remoteError) {
          console.error('[FitnessProvider] Step 2 failed: Error syncing with remote, using cached data');
          if (remoteError instanceof Error) {
            console.error('Error message:', remoteError.message);
            console.error('Error stack:', remoteError.stack);
          } else if (typeof remoteError === 'object' && remoteError !== null) {
            console.error('Error details:', remoteError);
          } else {
            console.error('Unknown error:', remoteError);
          }
        }
      } else {
        console.log('[FitnessProvider] Step 2 skipped: No user logged in');
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
        await remoteFitnessRepo.upsertProfile(user.id, newProfile);
      }

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
  };

  const addProgressEntry = async (entry: ProgressEntry) => {
    try {
      if (user) {
        console.log('[FitnessProvider] Saving progress entry to Supabase for user:', user.id);
        await remoteFitnessRepo.insertProgressEntry(user.id, entry);
      }

      const updated = [...progress, entry];
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      setProgress(updated);
    } catch (error) {
      console.error("Error adding progress entry:", error);
      throw error;
    }
  };

  const addWorkoutLog = async (log: WorkoutLog) => {
    try {
      if (user) {
        console.log('[FitnessProvider] Saving workout log to Supabase for user:', user.id);
        await remoteFitnessRepo.insertWorkoutLog(user.id, log);
      }

      const updated = [...workoutLogs, log];
      await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(updated));
      setWorkoutLogs(updated);
    } catch (error) {
      console.error("Error adding workout log:", error);
      throw error;
    }
  };

  const updateWeekPlan = (plan: WeeklyPlan) => {
    setCurrentWeekPlan(plan);
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

    setCurrentWeekPlan({
      ...currentWeekPlan,
      sessions: updatedSessions,
    });
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

    setCurrentWeekPlan({
      ...currentWeekPlan,
      sessions: updatedSessions,
    });
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

    setCurrentWeekPlan({
      ...currentWeekPlan,
      sessions: updatedSessions,
    });
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
      0: 1.2,
      1: 1.2,
      2: 1.375,
      3: 1.55,
      4: 1.55,
      5: 1.725,
      6: 1.725,
      7: 1.9,
    };

    const multiplier = activityMultipliers[profile.availableDays] || 1.55;
    return bmr * multiplier;
  };

  const getTargetCalories = (): number => {
    const tdee = calculateTDEE();
    if (!profile) return tdee;

    switch (profile.goal) {
      case "fat_loss":
        return tdee - 500;
      case "muscle_gain":
        return tdee + 300;
      default:
        return tdee;
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
        const favoriteMeals = extractFavoriteMealsFromHistory(assessment.dietHistory);
        assessment.favoriteMeals = favoriteMeals;
      }
      await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(assessment));
      setNutritionAssessment(assessment);
      if (assessment.completed && profile) {
        const plan = generateNutritionPlan(assessment);
        setNutritionPlan(plan);
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
    profile: FitnessProfile
  ): MacroDistribution => {
    const proteinPerKg = pattern === "high_protein_carbs" ? 2.0 : pattern === "high_protein" ? 1.8 : 1.6;
    const protein = profile.weight * proteinPerKg;
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
    trainingDays: number
  ) => {
    let mealsCount = 3;
    let snacksCount = 0;

    switch (structure) {
      case "1_meal_snacks":
        mealsCount = 1;
        snacksCount = 4;
        break;
      case "2_meals":
        mealsCount = 2;
        snacksCount = 3;
        break;
      case "3_meals":
        mealsCount = 3;
        snacksCount = 2;
        break;
      case "3_meals_snacks":
        mealsCount = 3;
        snacksCount = 3;
        break;
    }

    const proteinPerMeal = totalProtein / (mealsCount + snacksCount * 0.3);

    return {
      mealsCount,
      snacksCount,
      proteinPerMeal: Math.round(proteinPerMeal),
    };
  };

  const estimateCurrentProtein = (dietHistory: NutritionAssessment["dietHistory"]): number => {
    const allMeals = [
      ...dietHistory.breakfast,
      ...dietHistory.lunch,
      ...dietHistory.dinner,
      ...dietHistory.snacks,
    ];

    let proteinEstimate = 0;
    const proteinKeywords = ["دجاج", "لحم", "سمك", "بيض", "بروتين", "chicken", "meat", "fish", "egg"];

    allMeals.forEach((meal) => {
      const lowerMeal = meal.toLowerCase();
      const hasProtein = proteinKeywords.some((keyword) => lowerMeal.includes(keyword));
      if (hasProtein) {
        proteinEstimate += 25;
      }
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
          calories: estimateMealCalories(mealName, value.type),
          protein: estimateMealProtein(mealName, value.type),
          carbs: estimateMealCarbs(mealName, value.type),
          fats: estimateMealFats(mealName, value.type),
          ingredients: [mealName],
          ingredientsAr: [mealName],
        };
        favorites.push(meal);
      });
    });

    return favorites;
  };

  const estimateMealCalories = (mealName: string, type: "breakfast" | "lunch" | "dinner" | "snack"): number => {
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

  const estimateMealFats = (mealName: string, type: "breakfast" | "lunch" | "dinner" | "snack"): number => {
    if (type === "snack") return 6;
    if (type === "breakfast") return 12;
    return 18;
  };

  const saveMealPlan = async (plan: WeeklyMealPlan) => {
    try {
      await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plan));
      setCurrentMealPlan(plan);
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

    const updatedList = {
      ...groceryList,
      items: updatedItems,
    };

    await saveGroceryList(updatedList);
  };

  const toggleMealCompletion = async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", snackIndex?: number) => {
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
          const snacksCompletion = completedMeals.snacks || day.snacks.map(() => false);
          snacksCompletion[snackIndex] = !snacksCompletion[snackIndex];
          return {
            ...day,
            completedMeals: {
              ...completedMeals,
              snacks: snacksCompletion,
            },
          };
        } else if (mealType === "breakfast") {
          return {
            ...day,
            completedMeals: {
              ...completedMeals,
              breakfast: !completedMeals.breakfast,
            },
          };
        } else if (mealType === "lunch") {
          return {
            ...day,
            completedMeals: {
              ...completedMeals,
              lunch: !completedMeals.lunch,
            },
          };
        } else if (mealType === "dinner") {
          return {
            ...day,
            completedMeals: {
              ...completedMeals,
              dinner: !completedMeals.dinner,
            },
          };
        }
      }
      return day;
    });

    const updatedPlan = {
      ...currentMealPlan,
      days: updatedDays,
    };

    await saveMealPlan(updatedPlan);
  };

  const addMealToDay = async (dayId: string, meal: MealSuggestion, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const updatedDay = { ...day };
        
        if (mealType === "snack") {
          updatedDay.snacks = [...day.snacks, meal];
          const completedMeals = updatedDay.completedMeals || {
            breakfast: false,
            lunch: false,
            dinner: false,
            snacks: [],
          };
          updatedDay.completedMeals = {
            ...completedMeals,
            snacks: [...(completedMeals.snacks || []), false],
          };
        } else {
          updatedDay[mealType] = meal;
        }

        updatedDay.totalCalories = (updatedDay.breakfast?.calories || 0) + 
                                    (updatedDay.lunch?.calories || 0) + 
                                    (updatedDay.dinner?.calories || 0) + 
                                    updatedDay.snacks.reduce((sum, s) => sum + s.calories, 0);
        updatedDay.totalProtein = (updatedDay.breakfast?.protein || 0) + 
                                   (updatedDay.lunch?.protein || 0) + 
                                   (updatedDay.dinner?.protein || 0) + 
                                   updatedDay.snacks.reduce((sum, s) => sum + s.protein, 0);
        updatedDay.totalCarbs = (updatedDay.breakfast?.carbs || 0) + 
                                 (updatedDay.lunch?.carbs || 0) + 
                                 (updatedDay.dinner?.carbs || 0) + 
                                 updatedDay.snacks.reduce((sum, s) => sum + s.carbs, 0);
        updatedDay.totalFats = (updatedDay.breakfast?.fats || 0) + 
                                (updatedDay.lunch?.fats || 0) + 
                                (updatedDay.dinner?.fats || 0) + 
                                updatedDay.snacks.reduce((sum, s) => sum + s.fats, 0);

        return updatedDay;
      }
      return day;
    });

    const updatedPlan = {
      ...currentMealPlan,
      days: updatedDays,
    };

    await saveMealPlan(updatedPlan);
  };

  const removeMealFromDay = async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", snackIndex?: number) => {
    if (!currentMealPlan) return;

    const updatedDays = currentMealPlan.days.map((day) => {
      if (day.id === dayId) {
        const updatedDay = { ...day };
        
        if (mealType === "snack" && snackIndex !== undefined) {
          updatedDay.snacks = day.snacks.filter((_, index) => index !== snackIndex);
          const completedMeals = updatedDay.completedMeals || {
            breakfast: false,
            lunch: false,
            dinner: false,
            snacks: [],
          };
          updatedDay.completedMeals = {
            ...completedMeals,
            snacks: (completedMeals.snacks || []).filter((_, index) => index !== snackIndex),
          };
        } else if (mealType !== "snack") {
          updatedDay[mealType] = undefined;
          if (updatedDay.completedMeals) {
            updatedDay.completedMeals[mealType] = false;
          }
        }

        updatedDay.totalCalories = (updatedDay.breakfast?.calories || 0) + 
                                    (updatedDay.lunch?.calories || 0) + 
                                    (updatedDay.dinner?.calories || 0) + 
                                    updatedDay.snacks.reduce((sum, s) => sum + s.calories, 0);
        updatedDay.totalProtein = (updatedDay.breakfast?.protein || 0) + 
                                   (updatedDay.lunch?.protein || 0) + 
                                   (updatedDay.dinner?.protein || 0) + 
                                   updatedDay.snacks.reduce((sum, s) => sum + s.protein, 0);
        updatedDay.totalCarbs = (updatedDay.breakfast?.carbs || 0) + 
                                 (updatedDay.lunch?.carbs || 0) + 
                                 (updatedDay.dinner?.carbs || 0) + 
                                 updatedDay.snacks.reduce((sum, s) => sum + s.carbs, 0);
        updatedDay.totalFats = (updatedDay.breakfast?.fats || 0) + 
                                (updatedDay.lunch?.fats || 0) + 
                                (updatedDay.dinner?.fats || 0) + 
                                updatedDay.snacks.reduce((sum, s) => sum + s.fats, 0);

        return updatedDay;
      }
      return day;
    });

    const updatedPlan = {
      ...currentMealPlan,
      days: updatedDays,
    };

    await saveMealPlan(updatedPlan);
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

    const updatedList = {
      ...groceryList,
      items: [...groceryList.items, newItem],
    };

    await saveGroceryList(updatedList);
  };

  const addFavoriteExercise = async (exercise: Omit<FavoriteExercise, "id" | "addedAt">) => {
    try {
      const newFavorite: FavoriteExercise = {
        ...exercise,
        id: `fav-exercise-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };
      const updated = [...favoriteExercises, newFavorite];
      await AsyncStorage.setItem(FAVORITE_EXERCISES_KEY, JSON.stringify(updated));
      setFavoriteExercises(updated);
    } catch (error) {
      console.error("Error adding favorite exercise:", error);
    }
  };

  const removeFavoriteExercise = async (id: string) => {
    try {
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
      const updated = [...favoriteMeals, newFavorite];
      await AsyncStorage.setItem(FAVORITE_MEALS_KEY, JSON.stringify(updated));
      setFavoriteMeals(updated);
    } catch (error) {
      console.error("Error adding favorite meal:", error);
    }
  };

  const removeFavoriteMeal = async (id: string) => {
    try {
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
          updatedDay.snacks = day.snacks.map((snack, index) => 
            index === snackIndex ? updatedMeal : snack
          );
        } else if (mealType !== "snack") {
          updatedDay[mealType] = updatedMeal;
        }

        updatedDay.totalCalories = (updatedDay.breakfast?.calories || 0) + 
                                    (updatedDay.lunch?.calories || 0) + 
                                    (updatedDay.dinner?.calories || 0) + 
                                    updatedDay.snacks.reduce((sum, s) => sum + s.calories, 0);
        updatedDay.totalProtein = (updatedDay.breakfast?.protein || 0) + 
                                   (updatedDay.lunch?.protein || 0) + 
                                   (updatedDay.dinner?.protein || 0) + 
                                   updatedDay.snacks.reduce((sum, s) => sum + s.protein, 0);
        updatedDay.totalCarbs = (updatedDay.breakfast?.carbs || 0) + 
                                 (updatedDay.lunch?.carbs || 0) + 
                                 (updatedDay.dinner?.carbs || 0) + 
                                 updatedDay.snacks.reduce((sum, s) => sum + s.carbs, 0);
        updatedDay.totalFats = (updatedDay.breakfast?.fats || 0) + 
                                (updatedDay.lunch?.fats || 0) + 
                                (updatedDay.dinner?.fats || 0) + 
                                updatedDay.snacks.reduce((sum, s) => sum + s.fats, 0);

        return updatedDay;
      }
      return day;
    });

    const updatedPlan = {
      ...currentMealPlan,
      days: updatedDays,
    };

    await saveMealPlan(updatedPlan);
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
    hasProfile: !!profile,
  };
});
