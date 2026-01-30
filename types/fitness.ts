export type Gender = "male" | "female";
export type Goal = "fat_loss" | "muscle_gain" | "general_fitness";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type TrainingLocation = "gym" | "home" | "minimal_equipment";
export type ActivityLevel = "none" | "light" | "moderate" | "high";

export interface FitnessProfile {
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  goal: Goal;
  fitnessLevel: FitnessLevel;
  trainingLocation: TrainingLocation;
  activityLevel: ActivityLevel;
  availableDays: number;
  sessionDuration: number;
  injuries: string;
  targetWeight?: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  muscleGroup: string;
  equipment: string[];
  videoUrl?: string;
  description?: string;
  completed?: boolean;
  recommendedWeight?: {
    male: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
    female: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
  };
  assignedWeight?: string;
}

export interface WorkoutSession {
  id: string;
  day: string;
  name: string;
  exercises: WorkoutExercise[];
  duration: number;
  completed?: boolean;
  completedAt?: string;
  completedExercises?: string[];
  restNote?: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: WorkoutSession[];
}

export interface WorkoutLog {
  id: string;
  sessionId: string;
  date: string;
  exercises: {
    exerciseId: string;
    sets: {
      reps: number;
      weight: number;
    }[];
  }[];
  duration: number;
  notes: string;
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface MealSuggestion {
  id: string;
  name: string;
  nameAr: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  ingredientsAr: string[];
}

export type MealStructure = "1_meal_snacks" | "2_meals" | "3_meals" | "3_meals_snacks";

export type DietPattern = "balanced" | "high_protein" | "high_protein_carbs" | "moderate_low_carb";

export type MacroDistribution = {
  protein: number;
  carbs: number;
  fats: number;
};

export interface NutritionAssessment {
  mealStructure?: MealStructure;
  dietHistory: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  ffq: {
    rice: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    bread: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    chicken: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    redMeat: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    fish: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    vegetables: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    fruits: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
    dairy: "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";
  };
  favoriteMeals?: MealSuggestion[];
  completed?: boolean;
}

export interface NutritionPlan {
  targetCalories: number;
  macros: MacroDistribution;
  dietPattern: DietPattern;
  recommendations: string[];
  proteinPriority: boolean;
  carbTiming: "around_workout" | "evenly_distributed";
  mealDistribution: {
    mealsCount: number;
    snacksCount: number;
    proteinPerMeal: number;
  };
}

export interface DailyMealPlan {
  id: string;
  day: string;
  date: string;
  breakfast?: MealSuggestion;
  lunch?: MealSuggestion;
  dinner?: MealSuggestion;
  snacks: MealSuggestion[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  completedMeals?: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    snacks?: boolean[];
  };
}

export interface WeeklyMealPlan {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DailyMealPlan[];
}

export interface GroceryItem {
  id: string;
  name: string;
  nameAr: string;
  quantity: string;
  category: "protein" | "carbs" | "vegetables_fruits" | "dairy" | "spices" | "other";
  checked?: boolean;
}

export interface GroceryList {
  id: string;
  weekId: string;
  items: GroceryItem[];
  createdAt: string;
}

export interface FavoriteExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  muscleGroup: string;
  equipment: string[];
  videoUrl?: string;
  description?: string;
  assignedWeight?: string;
  addedAt: string;
}

export interface FavoriteMeal {
  id: string;
  name: string;
  nameAr: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  ingredientsAr: string[];
  addedAt: string;
}
