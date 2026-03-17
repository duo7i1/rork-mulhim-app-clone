import { useMemo } from 'react';
import type {
  FitnessProfile,
  ProgressEntry,
  WorkoutLog,
  NutritionAssessment,
  NutritionPlan,
  DietPattern,
  MacroDistribution,
  MealSuggestion,
} from '@/types/fitness';

export function useCurrentWeight(progress: ProgressEntry[], profile: FitnessProfile | null): number {
  return useMemo(() => {
    if (progress.length > 0) {
      const sorted = [...progress].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return sorted[0].weight;
    }
    return profile?.weight || 0;
  }, [progress, profile?.weight]);
}

export function useCurrentStreak(workoutLogs: WorkoutLog[]): number {
  return useMemo(() => {
    if (workoutLogs.length === 0) return 0;
    const sortedLogs = [...workoutLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    const currentDate = new Date();
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
}

export function calculateBMR(profile: FitnessProfile | null, currentWeight: number): number {
  if (!profile) return 0;
  const weight = currentWeight || profile.weight;
  const { height, age, gender } = profile;
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

export function calculateTDEE(profile: FitnessProfile | null, currentWeight: number): number {
  const bmr = calculateBMR(profile, currentWeight);
  if (!profile) return bmr;

  const activityMultipliers: Record<string, number> = {
    none: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
  };
  const multiplier = activityMultipliers[profile.activityLevel] || 1.55;
  return bmr * multiplier;
}

export function getTargetCalories(profile: FitnessProfile | null, currentWeight: number): number {
  const tdee = calculateTDEE(profile, currentWeight);
  if (!profile) return tdee;
  switch (profile.goal) {
    case 'fat_loss': return tdee - 500;
    case 'muscle_gain': return tdee + 300;
    default: return tdee;
  }
}

export function calculateMacros(
  calories: number,
  _pattern: DietPattern,
  profile: FitnessProfile
): MacroDistribution {
  let proteinPerKg = 1.6;
  if (profile.goal === 'fat_loss') {
    proteinPerKg = 2.2;
  } else if (profile.goal === 'muscle_gain') {
    proteinPerKg = 2.0;
  }

  const protein = profile.weight * proteinPerKg;
  const proteinCalories = protein * 4;

  let carbs: number;
  let fats: number;

  if (profile.goal === 'fat_loss') {
    fats = (calories * 0.25) / 9;
    const fatCalories = fats * 9;
    carbs = (calories - proteinCalories - fatCalories) / 4;
  } else if (profile.goal === 'muscle_gain') {
    carbs = (calories * 0.45) / 4;
    const carbCalories = carbs * 4;
    fats = (calories - proteinCalories - carbCalories) / 9;
  } else {
    carbs = (calories * 0.40) / 4;
    const carbCalories = carbs * 4;
    fats = (calories - proteinCalories - carbCalories) / 9;
  }

  return {
    protein: Math.round(protein),
    carbs: Math.round(Math.max(carbs, 0)),
    fats: Math.round(Math.max(fats, 0)),
  };
}

export function calculateMealDistribution(
  structure: '1_meal_snacks' | '2_meals' | '3_meals' | '3_meals_snacks',
  totalProtein: number,
  _trainingDays: number
) {
  let mealsCount = 3;
  let snacksCount = 0;

  switch (structure) {
    case '1_meal_snacks': mealsCount = 1; snacksCount = 4; break;
    case '2_meals': mealsCount = 2; snacksCount = 3; break;
    case '3_meals': mealsCount = 3; snacksCount = 2; break;
    case '3_meals_snacks': mealsCount = 3; snacksCount = 3; break;
  }

  const proteinPerMeal = totalProtein / (mealsCount + snacksCount * 0.3);
  return { mealsCount, snacksCount, proteinPerMeal: Math.round(proteinPerMeal) };
}

export function estimateCurrentProtein(dietHistory: NutritionAssessment['dietHistory']): number {
  const allMeals = [...dietHistory.breakfast, ...dietHistory.lunch, ...dietHistory.dinner, ...dietHistory.snacks];
  let proteinEstimate = 0;
  const proteinKeywords = ['دجاج', 'لحم', 'سمك', 'بيض', 'بروتين', 'chicken', 'meat', 'fish', 'egg'];
  allMeals.forEach((meal) => {
    const lowerMeal = meal.toLowerCase();
    const hasProtein = proteinKeywords.some((keyword) => lowerMeal.includes(keyword));
    if (hasProtein) proteinEstimate += 25;
  });
  return proteinEstimate;
}

export function generateNutritionPlan(
  profile: FitnessProfile,
  assessment: NutritionAssessment,
  targetCaloriesValue: number
): NutritionPlan {
  const recommendations: string[] = [];
  let dietPattern: DietPattern = 'balanced';
  let proteinPriority = false;
  let carbTiming: 'around_workout' | 'evenly_distributed' = 'evenly_distributed';

  if (profile.goal === 'muscle_gain') {
    dietPattern = 'high_protein_carbs';
    proteinPriority = true;
    carbTiming = 'around_workout';
    recommendations.push('زيادة البروتين والكربوهيدرات لبناء العضلات');
    recommendations.push('تناول الكربوهيدرات قبل وبعد التمرين');
  } else if (profile.goal === 'fat_loss') {
    if (profile.availableDays >= 3) {
      dietPattern = 'high_protein';
      carbTiming = 'around_workout';
      recommendations.push('بروتين عالي للحفاظ على العضلات أثناء نزول الوزن');
    } else {
      dietPattern = 'moderate_low_carb';
      recommendations.push('تقليل الكربوهيدرات تدريجياً');
    }
    proteinPriority = true;
    recommendations.push('العجز في السعرات الحرارية لحرق الدهون');
  } else {
    dietPattern = 'balanced';
    recommendations.push('نظام متوازن للصحة العامة');
  }

  if (profile.injuries && profile.injuries.toLowerCase().includes('diabetes')) {
    dietPattern = 'moderate_low_carb';
    recommendations.push('تقليل الكربوهيدرات لمرضى السكري');
  }

  const macros = calculateMacros(targetCaloriesValue, dietPattern, profile);
  const mealDistribution = calculateMealDistribution(
    assessment.mealStructure || '3_meals',
    macros.protein,
    profile.availableDays
  );

  if (assessment.ffq.vegetables === 'rarely' || assessment.ffq.vegetables === 'never') {
    recommendations.push('زيادة تناول الخضروات تدريجياً');
  }
  if (assessment.ffq.fish === 'rarely' || assessment.ffq.fish === 'never') {
    recommendations.push('إضافة السمك للحصول على أوميغا 3');
  }

  const currentProtein = estimateCurrentProtein(assessment.dietHistory);
  if (currentProtein < macros.protein) {
    recommendations.push(`زيادة البروتين من ${Math.round(currentProtein)}g إلى ${Math.round(macros.protein)}g`);
  }

  return {
    targetCalories: targetCaloriesValue,
    macros,
    dietPattern,
    recommendations,
    proteinPriority,
    carbTiming,
    mealDistribution,
  };
}

export function extractFavoriteMealsFromHistory(dietHistory: NutritionAssessment['dietHistory']): MealSuggestion[] {
  const favorites: MealSuggestion[] = [];
  const mealMap: Record<string, { type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; names: string[] }> = {
    breakfast: { type: 'breakfast' as const, names: dietHistory.breakfast },
    lunch: { type: 'lunch' as const, names: dietHistory.lunch },
    dinner: { type: 'dinner' as const, names: dietHistory.dinner },
    snacks: { type: 'snack' as const, names: dietHistory.snacks },
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
}

function estimateMealCalories(type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): number {
  if (type === 'snack') return 150;
  if (type === 'breakfast') return 350;
  return 500;
}

function estimateMealProtein(mealName: string, type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): number {
  const lowerMeal = mealName.toLowerCase();
  const proteinKeywords = ['دجاج', 'لحم', 'سمك', 'بيض', 'chicken', 'meat', 'fish', 'egg', 'كبسة', 'مندي'];
  const hasProtein = proteinKeywords.some((keyword) => lowerMeal.includes(keyword));
  if (hasProtein) {
    if (type === 'snack') return 8;
    if (type === 'breakfast') return 18;
    return 35;
  }
  if (type === 'snack') return 3;
  if (type === 'breakfast') return 10;
  return 15;
}

function estimateMealCarbs(mealName: string, type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): number {
  const lowerMeal = mealName.toLowerCase();
  const carbKeywords = ['رز', 'أرز', 'خبز', 'rice', 'bread', 'كبسة', 'مندي'];
  const hasCarbs = carbKeywords.some((keyword) => lowerMeal.includes(keyword));
  if (hasCarbs) {
    if (type === 'snack') return 20;
    if (type === 'breakfast') return 35;
    return 60;
  }
  if (type === 'snack') return 15;
  if (type === 'breakfast') return 25;
  return 40;
}

function estimateMealFats(type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): number {
  if (type === 'snack') return 6;
  if (type === 'breakfast') return 12;
  return 18;
}
