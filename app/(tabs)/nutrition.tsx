import { ChefHat, Clock, CheckCircle2, ArrowRight, Plus, Calendar, ShoppingCart, Check, Trash2, X, Sparkles, PackagePlus, ChevronDown, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { generateObject } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useFitness } from "@/providers/FitnessProvider";
import { useTranslation } from "@/providers/LanguageProvider";
import { saudiMeals } from "@/data/meals";
import { MealStructure, MealSuggestion, WeeklyMealPlan, DailyMealPlan, GroceryList, GroceryItem } from "@/types/fitness";

type FrequencyOption = "daily" | "3-5_weekly" | "1-2_weekly" | "rarely" | "never";

export default function NutritionScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { 
    profile, 
    getTargetCalories, 
    nutritionAssessment, 
    saveNutritionAssessment,
    currentMealPlan,
    saveMealPlan,
    groceryList,
    saveGroceryList,
    toggleGroceryItem,
    toggleMealCompletion,
    addMealToDay,
    removeMealFromDay,
    addGroceryItem,
  } = useFitness();
  
  const [showAssessmentModal, setShowAssessmentModal] = useState<boolean>(false);
  const [assessmentStep, setAssessmentStep] = useState<number>(0);
  const [showMealsModal, setShowMealsModal] = useState<boolean>(false);
  const [showAddMealModal, setShowAddMealModal] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [addMealStep, setAddMealStep] = useState<"select_type" | "select_method" | "select_days" | "list" | "favorites" | "custom">("select_type");
  const [selectedMethod, setSelectedMethod] = useState<"favorites" | "list" | "custom">("list");
  const [customMealInput, setCustomMealInput] = useState<string>("");
  const [isGeneratingMeal, setIsGeneratingMeal] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"plan" | "grocery" | null>(null);
  const [showAddGroceryModal, setShowAddGroceryModal] = useState<boolean>(false);
  const [newGroceryItem, setNewGroceryItem] = useState<{ name: string; category: GroceryItem["category"] }>({ name: "", category: "protein" });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  
  const [tempAssessment, setTempAssessment] = useState({
    mealStructure: nutritionAssessment?.mealStructure,
    dietHistory: nutritionAssessment?.dietHistory || {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    },
    ffq: nutritionAssessment?.ffq || {
      rice: "daily" as FrequencyOption,
      bread: "daily" as FrequencyOption,
      chicken: "3-5_weekly" as FrequencyOption,
      redMeat: "1-2_weekly" as FrequencyOption,
      fish: "1-2_weekly" as FrequencyOption,
      vegetables: "daily" as FrequencyOption,
      fruits: "daily" as FrequencyOption,
      dairy: "daily" as FrequencyOption,
    },
  });

  const [currentMealInput, setCurrentMealInput] = useState<string>("");
  const [currentMealType, setCurrentMealType] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("breakfast");

  const targetCalories = Math.round(getTargetCalories());
  const proteinTarget = profile?.weight ? Math.round(profile.weight * 1.8) : 120;

  const frequencyLabels: Record<FrequencyOption, string> = {
    daily: t.nutrition.daily,
    "3-5_weekly": t.nutrition.weeklyThreeToFive,
    "1-2_weekly": t.nutrition.weeklyOneToTwo,
    rarely: t.nutrition.rarely,
    never: t.nutrition.never,
  };

  const foodItems = [
    { key: "rice" as const, label: t.nutrition.rice, emoji: "🍚" },
    { key: "bread" as const, label: t.nutrition.bread, emoji: "🍞" },
    { key: "chicken" as const, label: t.nutrition.chicken, emoji: "🍗" },
    { key: "redMeat" as const, label: t.nutrition.redMeat, emoji: "🥩" },
    { key: "fish" as const, label: t.nutrition.fish, emoji: "🐟" },
    { key: "vegetables" as const, label: t.nutrition.vegetables, emoji: "🥗" },
    { key: "fruits" as const, label: t.nutrition.fruits, emoji: "🍎" },
    { key: "dairy" as const, label: t.nutrition.dairy, emoji: "🥛" },
  ];

  const DAYS = [
    t.days.Sunday,
    t.days.Monday,
    t.days.Tuesday,
    t.days.Wednesday,
    t.days.Thursday,
    t.days.Friday,
    t.days.Saturday,
  ];

  const mealStructures: { value: MealStructure; label: string; desc: string }[] = [
    { value: "1_meal_snacks", label: t.nutrition.oneMealSnacks, desc: t.nutrition.oneMealSnacksDesc },
    { value: "2_meals", label: t.nutrition.twoMeals, desc: t.nutrition.twoMealsDesc },
    { value: "3_meals", label: t.nutrition.threeMeals, desc: t.nutrition.threeMealsDesc },
    { value: "3_meals_snacks", label: t.nutrition.threeMealsSnacks, desc: t.nutrition.threeMealsSnacksDesc },
  ];

  const scaleNutrition = (meal: MealSuggestion, factor: number): MealSuggestion => {
    return {
      ...meal,
      calories: Math.round(meal.calories * factor),
      protein: Math.round(meal.protein * factor),
      carbs: Math.round(meal.carbs * factor),
      fats: Math.round(meal.fats * factor),
    };
  };

  const selectMealBasedOnFFQ = (meals: MealSuggestion[], ffq: NonNullable<typeof nutritionAssessment>['ffq']): MealSuggestion => {
    const preferredMeals = meals.filter(meal => {
      const ingredients = meal.ingredients.join(' ').toLowerCase();
      
      if ((ffq.chicken === 'daily' || ffq.chicken === '3-5_weekly') && ingredients.includes('chicken')) return true;
      if ((ffq.fish === 'daily' || ffq.fish === '3-5_weekly') && ingredients.includes('fish')) return true;
      if ((ffq.redMeat === 'daily' || ffq.redMeat === '3-5_weekly') && (ingredients.includes('lamb') || ingredients.includes('beef'))) return true;
      if ((ffq.rice === 'daily' || ffq.rice === '3-5_weekly') && ingredients.includes('rice')) return true;
      
      return false;
    });

    if (preferredMeals.length > 0) {
      return preferredMeals[Math.floor(Math.random() * preferredMeals.length)];
    }
    return meals[Math.floor(Math.random() * meals.length)];
  };

  const includeFavoriteMeals = (meals: MealSuggestion[], favorites: MealSuggestion[] | undefined, type: "breakfast" | "lunch" | "dinner" | "snack"): MealSuggestion[] => {
    if (!favorites || favorites.length === 0) return meals;
    
    const typedFavorites = favorites.filter(f => f.type === type);
    if (typedFavorites.length === 0) return meals;
    
    return [...meals, ...typedFavorites];
  };

  const generateWeeklyMealPlan = () => {
    if (!nutritionAssessment?.completed || !nutritionAssessment.mealStructure) {
      Alert.alert(t.common.error, t.nutrition.startAssessment);
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);

    const days: DailyMealPlan[] = [];

    const breakfastPool = includeFavoriteMeals(saudiMeals.breakfast, nutritionAssessment.favoriteMeals, "breakfast");
    const lunchPool = includeFavoriteMeals(saudiMeals.lunch, nutritionAssessment.favoriteMeals, "lunch");
    const dinnerPool = includeFavoriteMeals(saudiMeals.dinner, nutritionAssessment.favoriteMeals, "dinner");
    const snacksPool = includeFavoriteMeals(saudiMeals.snacks, nutritionAssessment.favoriteMeals, "snack");

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      const breakfast = selectMealBasedOnFFQ(breakfastPool, nutritionAssessment.ffq);
      const lunch = selectMealBasedOnFFQ(lunchPool, nutritionAssessment.ffq);
      const dinner = selectMealBasedOnFFQ(dinnerPool, nutritionAssessment.ffq);
      
      const snackCount = nutritionAssessment.mealStructure === "1_meal_snacks" ? 4 :
                         nutritionAssessment.mealStructure === "2_meals" ? 3 :
                         nutritionAssessment.mealStructure === "3_meals_snacks" ? 3 : 2;
      
      const snacks: MealSuggestion[] = [];
      for (let j = 0; j < snackCount; j++) {
        const snack = snacksPool[Math.floor(Math.random() * snacksPool.length)];
        snacks.push(snack);
      }

      const hasBreakfast = nutritionAssessment.mealStructure !== "1_meal_snacks";
      const hasDinner = nutritionAssessment.mealStructure === "3_meals" || 
                        nutritionAssessment.mealStructure === "3_meals_snacks";

      const totalMealCalories = (hasBreakfast ? breakfast.calories : 0) + 
                                lunch.calories + 
                                (hasDinner ? dinner.calories : 0) + 
                                snacks.reduce((sum, s) => sum + s.calories, 0);

      const scaleFactor = targetCalories / totalMealCalories;

      const scaledBreakfast = hasBreakfast ? scaleNutrition(breakfast, scaleFactor) : undefined;
      const scaledLunch = scaleNutrition(lunch, scaleFactor);
      const scaledDinner = hasDinner ? scaleNutrition(dinner, scaleFactor) : undefined;
      const scaledSnacks = snacks.map(s => scaleNutrition(s, scaleFactor));

      const dailyPlan: DailyMealPlan = {
        id: `day-${i}`,
        day: DAYS[currentDate.getDay()],
        date: currentDate.toISOString(),
        breakfast: scaledBreakfast,
        lunch: scaledLunch,
        dinner: scaledDinner,
        snacks: scaledSnacks,
        totalCalories: (scaledBreakfast?.calories || 0) + scaledLunch.calories + (scaledDinner?.calories || 0) + 
                       scaledSnacks.reduce((sum, s) => sum + s.calories, 0),
        totalProtein: (scaledBreakfast?.protein || 0) + scaledLunch.protein + (scaledDinner?.protein || 0) + 
                      scaledSnacks.reduce((sum, s) => sum + s.protein, 0),
        totalCarbs: (scaledBreakfast?.carbs || 0) + scaledLunch.carbs + (scaledDinner?.carbs || 0) + 
                    scaledSnacks.reduce((sum, s) => sum + s.carbs, 0),
        totalFats: (scaledBreakfast?.fats || 0) + scaledLunch.fats + (scaledDinner?.fats || 0) + 
                   scaledSnacks.reduce((sum, s) => sum + s.fats, 0),
      };

      days.push(dailyPlan);
    }

    const weekPlan: WeeklyMealPlan = {
      id: `week-${Date.now()}`,
      weekNumber: 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
    };

    saveMealPlan(weekPlan);
    
    if (groceryList) {
      setTimeout(() => {
        regenerateGroceryList(weekPlan);
      }, 100);
    }
    
    Alert.alert(t.common.success, t.nutrition.generatePlan);
  };

  const regenerateWeeklyMealPlan = () => {
    if (!nutritionAssessment?.completed || !nutritionAssessment.mealStructure) {
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);

    const days: DailyMealPlan[] = [];

    const breakfastPool = includeFavoriteMeals(saudiMeals.breakfast, nutritionAssessment.favoriteMeals, "breakfast");
    const lunchPool = includeFavoriteMeals(saudiMeals.lunch, nutritionAssessment.favoriteMeals, "lunch");
    const dinnerPool = includeFavoriteMeals(saudiMeals.dinner, nutritionAssessment.favoriteMeals, "dinner");
    const snacksPool = includeFavoriteMeals(saudiMeals.snacks, nutritionAssessment.favoriteMeals, "snack");

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);

      const breakfast = selectMealBasedOnFFQ(breakfastPool, nutritionAssessment.ffq);
      const lunch = selectMealBasedOnFFQ(lunchPool, nutritionAssessment.ffq);
      const dinner = selectMealBasedOnFFQ(dinnerPool, nutritionAssessment.ffq);
      
      const snackCount = nutritionAssessment.mealStructure === "1_meal_snacks" ? 4 :
                         nutritionAssessment.mealStructure === "2_meals" ? 3 :
                         nutritionAssessment.mealStructure === "3_meals_snacks" ? 3 : 2;
      
      const snacks: MealSuggestion[] = [];
      for (let j = 0; j < snackCount; j++) {
        const snack = snacksPool[Math.floor(Math.random() * snacksPool.length)];
        snacks.push(snack);
      }

      const hasBreakfast = nutritionAssessment.mealStructure !== "1_meal_snacks";
      const hasDinner = nutritionAssessment.mealStructure === "3_meals" || 
                        nutritionAssessment.mealStructure === "3_meals_snacks";

      const totalMealCalories = (hasBreakfast ? breakfast.calories : 0) + 
                                lunch.calories + 
                                (hasDinner ? dinner.calories : 0) + 
                                snacks.reduce((sum, s) => sum + s.calories, 0);

      const scaleFactor = targetCalories / totalMealCalories;

      const scaledBreakfast = hasBreakfast ? scaleNutrition(breakfast, scaleFactor) : undefined;
      const scaledLunch = scaleNutrition(lunch, scaleFactor);
      const scaledDinner = hasDinner ? scaleNutrition(dinner, scaleFactor) : undefined;
      const scaledSnacks = snacks.map(s => scaleNutrition(s, scaleFactor));

      const dailyPlan: DailyMealPlan = {
        id: `day-${i}`,
        day: DAYS[currentDate.getDay()],
        date: currentDate.toISOString(),
        breakfast: scaledBreakfast,
        lunch: scaledLunch,
        dinner: scaledDinner,
        snacks: scaledSnacks,
        totalCalories: (scaledBreakfast?.calories || 0) + scaledLunch.calories + (scaledDinner?.calories || 0) + 
                       scaledSnacks.reduce((sum, s) => sum + s.calories, 0),
        totalProtein: (scaledBreakfast?.protein || 0) + scaledLunch.protein + (scaledDinner?.protein || 0) + 
                      scaledSnacks.reduce((sum, s) => sum + s.protein, 0),
        totalCarbs: (scaledBreakfast?.carbs || 0) + scaledLunch.carbs + (scaledDinner?.carbs || 0) + 
                    scaledSnacks.reduce((sum, s) => sum + s.carbs, 0),
        totalFats: (scaledBreakfast?.fats || 0) + scaledLunch.fats + (scaledDinner?.fats || 0) + 
                   scaledSnacks.reduce((sum, s) => sum + s.fats, 0),
      };

      days.push(dailyPlan);
    }

    const weekPlan: WeeklyMealPlan = {
      id: `week-${Date.now()}`,
      weekNumber: 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
    };

    saveMealPlan(weekPlan);
    
    if (groceryList) {
      setTimeout(() => {
        regenerateGroceryList(weekPlan);
      }, 100);
    }
    
    Alert.alert(t.common.success, t.nutrition.updatePlan);
  };

  const handleOpenAddMealModal = () => {
    setSelectedDays([]);
    setAddMealStep("select_type");
    setSelectedMethod("list");
    setCustomMealInput("");
    setShowAddMealModal(true);
  };

  const handleAddMealToDay = async (meal: MealSuggestion) => {
    if (selectedDays.length > 0 && addMealToDay) {
      const targetCalories = getTargetCalories();
      const scaleFactor = targetCalories / (meal.calories * 7);
      const scaledMeal = scaleNutrition(meal, scaleFactor);
      
      for (const dayId of selectedDays) {
        await addMealToDay(dayId, scaledMeal, selectedMealType);
      }
      
      setShowAddMealModal(false);
      Alert.alert(t.common.success, t.nutrition.addMeal);
    }
  };

  const handleGenerateCustomMeal = async () => {
    if (!customMealInput.trim()) {
      Alert.alert(t.common.error, t.nutrition.enterMealName);
      return;
    }

    setIsGeneratingMeal(true);
    try {
      const mealSchema = z.object({
        nameAr: z.string().describe("Arabic name of the meal"),
        name: z.string().describe("English name of the meal"),
        calories: z.number().describe("Estimated calories"),
        protein: z.number().describe("Protein in grams"),
        carbs: z.number().describe("Carbohydrates in grams"),
        fats: z.number().describe("Fats in grams"),
        ingredients: z.array(z.string()).describe("List of ingredients in English"),
        ingredientsAr: z.array(z.string()).describe("List of ingredients in Arabic"),
      });

      const result = await generateObject({
        messages: [
          {
            role: "user",
            content: `قم بتحليل هذه الوجبة وإعطائي بياناتها الغذائية: "${customMealInput}"
            
يجب أن تكون البيانات دقيقة وواقعية. إذا كانت الوجبة سعودية، أضف التفاصيل المناسبة.`,
          },
        ],
        schema: mealSchema,
      });

      const newMeal: MealSuggestion = {
        id: `custom-${Date.now()}`,
        name: result.name,
        nameAr: result.nameAr,
        type: selectedMealType,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats,
        ingredients: result.ingredients,
        ingredientsAr: result.ingredientsAr,
      };

      await handleAddMealToDay(newMeal);
    } catch (error) {
      console.error("Error generating meal:", error);
      Alert.alert(t.common.error, t.coach.errorOccurred);
    } finally {
      setIsGeneratingMeal(false);
    }
  };

  const handleRemoveMealFromDay = async (dayId: string, mealType: "breakfast" | "lunch" | "dinner" | "snack", snackIndex?: number) => {
    Alert.alert(
      t.common.delete,
      t.common.confirm,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: async () => {
            if (removeMealFromDay) {
              await removeMealFromDay(dayId, mealType, snackIndex);
            }
          },
        },
      ]
    );
  };

  const generateGroceryList = () => {
    if (!currentMealPlan) {
      Alert.alert(t.common.error, t.nutrition.generatePlan);
      return;
    }

    const ingredientsMap = new Map<string, { nameAr: string; category: string }>();

    currentMealPlan.days.forEach((day) => {
      [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach((meal) => {
        if (meal) {
          meal.ingredientsAr.forEach((ing, index) => {
            if (!ingredientsMap.has(ing)) {
              const category = getCategoryFromIngredient(meal.ingredients[index]);
              ingredientsMap.set(ing, { nameAr: ing, category });
            }
          });
        }
      });
    });

    const items: GroceryItem[] = Array.from(ingredientsMap.entries()).map(([key, value], index) => ({
      id: `item-${index}`,
      name: key,
      nameAr: value.nameAr,
      quantity: "حسب الحاجة",
      category: value.category as GroceryItem["category"],
      checked: false,
    }));

    const newGroceryList: GroceryList = {
      id: `grocery-${Date.now()}`,
      weekId: currentMealPlan.id,
      items,
      createdAt: new Date().toISOString(),
    };

    saveGroceryList(newGroceryList);
    Alert.alert(t.common.success, t.nutrition.generateGroceryList);
  };

  const regenerateGroceryList = (mealPlan: WeeklyMealPlan) => {
    const ingredientsMap = new Map<string, { nameAr: string; category: string }>();

    mealPlan.days.forEach((day) => {
      [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach((meal) => {
        if (meal) {
          meal.ingredientsAr.forEach((ing, index) => {
            if (!ingredientsMap.has(ing)) {
              const category = getCategoryFromIngredient(meal.ingredients[index]);
              ingredientsMap.set(ing, { nameAr: ing, category });
            }
          });
        }
      });
    });

    const items: GroceryItem[] = Array.from(ingredientsMap.entries()).map(([key, value], index) => ({
      id: `item-${index}`,
      name: key,
      nameAr: value.nameAr,
      quantity: "حسب الحاجة",
      category: value.category as GroceryItem["category"],
      checked: false,
    }));

    const newGroceryList: GroceryList = {
      id: `grocery-${Date.now()}`,
      weekId: mealPlan.id,
      items,
      createdAt: new Date().toISOString(),
    };

    saveGroceryList(newGroceryList);
  };

  const getCategoryFromIngredient = (ingredient: string): string => {
    const lowerIng = ingredient.toLowerCase();
    if (lowerIng.includes("chicken") || lowerIng.includes("meat") || lowerIng.includes("fish") || 
        lowerIng.includes("lamb") || lowerIng.includes("beef") || lowerIng.includes("eggs")) {
      return "protein";
    }
    if (lowerIng.includes("rice") || lowerIng.includes("bread")) {
      return "carbs";
    }
    if (lowerIng.includes("tomato") || lowerIng.includes("onion") || lowerIng.includes("pepper") || 
        lowerIng.includes("cucumber") || lowerIng.includes("lettuce") || lowerIng.includes("spinach") ||
        lowerIng.includes("cauliflower") || lowerIng.includes("eggplant") || lowerIng.includes("carrot") ||
        lowerIng.includes("fruit") || lowerIng.includes("date") || lowerIng.includes("lemon")) {
      return "vegetables_fruits";
    }
    if (lowerIng.includes("yogurt") || lowerIng.includes("cheese") || lowerIng.includes("labneh") || 
        lowerIng.includes("milk") || lowerIng.includes("dairy")) {
      return "dairy";
    }
    if (lowerIng.includes("spice") || lowerIng.includes("cumin") || lowerIng.includes("baharat") || 
        lowerIng.includes("zaatar")) {
      return "spices";
    }
    return "other";
  };

  const handleStartAssessment = () => {
    setAssessmentStep(0);
    setShowAssessmentModal(true);
  };

  const handleAddMealToHistory = () => {
    if (currentMealInput.trim()) {
      setTempAssessment({
        ...tempAssessment,
        dietHistory: {
          ...tempAssessment.dietHistory,
          [currentMealType]: [...tempAssessment.dietHistory[currentMealType], currentMealInput.trim()],
        },
      });
      setCurrentMealInput("");
    }
  };

  const handleRemoveMealFromHistory = (type: keyof typeof tempAssessment.dietHistory, index: number) => {
    setTempAssessment({
      ...tempAssessment,
      dietHistory: {
        ...tempAssessment.dietHistory,
        [type]: tempAssessment.dietHistory[type].filter((_, i) => i !== index),
      },
    });
  };

  const handleCompleteAssessment = () => {
    saveNutritionAssessment({
      ...tempAssessment,
      completed: true,
    });
    setShowAssessmentModal(false);
    
    if (currentMealPlan) {
      setTimeout(() => {
        regenerateWeeklyMealPlan();
      }, 300);
    }
  };

  const renderAssessmentStep = () => {
    if (assessmentStep === 0) {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.nutrition.mealStructure}</Text>
          <Text style={styles.modalDescription}>
            {t.nutrition.selectMealType}
          </Text>
          <View style={styles.mealStructureContainer}>
            {mealStructures.map((structure) => (
              <TouchableOpacity
                key={structure.value}
                style={[
                  styles.structureCard,
                  tempAssessment.mealStructure === structure.value && styles.structureCardActive,
                ]}
                onPress={() =>
                  setTempAssessment({ ...tempAssessment, mealStructure: structure.value })
                }
              >
                <Text
                  style={[
                    styles.structureLabel,
                    tempAssessment.mealStructure === structure.value && styles.structureLabelActive,
                  ]}
                >
                  {structure.label}
                </Text>
                <Text
                  style={[
                    styles.structureDesc,
                    tempAssessment.mealStructure === structure.value && styles.structureDescActive,
                  ]}
                >
                  {structure.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.modalButton, !tempAssessment.mealStructure && styles.modalButtonDisabled]}
            onPress={() => setAssessmentStep(1)}
            disabled={!tempAssessment.mealStructure}
          >
            <Text style={styles.modalButtonText}>{t.common.next}</Text>
            <ArrowRight size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      );
    }

    if (assessmentStep === 1) {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.nutrition.dietHistory}</Text>
          <Text style={styles.modalDescription}>
            {t.nutrition.whatYouEat}
          </Text>
          
          <View style={styles.mealTypeSelector}>
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeButton,
                  currentMealType === type && styles.mealTypeButtonActive,
                ]}
                onPress={() => setCurrentMealType(type)}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    currentMealType === type && styles.mealTypeTextActive,
                  ]}
                >
                  {{
                    breakfast: t.nutrition.breakfast,
                    lunch: t.nutrition.lunch,
                    dinner: t.nutrition.dinner,
                    snacks: t.nutrition.snack,
                  }[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.mealInput}
              placeholder={t.nutrition.enterMealName}
              placeholderTextColor={Colors.textLight}
              value={currentMealInput}
              onChangeText={setCurrentMealInput}
              onSubmitEditing={handleAddMealToHistory}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddMealToHistory}>
              <Plus size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.mealsList} showsVerticalScrollIndicator={false}>
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((type) => (
              <View key={type} style={styles.mealSection}>
                <Text style={styles.mealSectionTitle}>
                  {{
                    breakfast: `🌅 ${t.nutrition.breakfast}`,
                    lunch: `☀️ ${t.nutrition.lunch}`,
                    dinner: `🌙 ${t.nutrition.dinner}`,
                    snacks: `🍎 ${t.nutrition.snack}`,
                  }[type]}
                </Text>
                {tempAssessment.dietHistory[type].map((meal, index) => (
                  <View key={`${type}-meal-${index}-${meal}`} style={styles.mealItem}>
                    <Text style={styles.mealItemText}>{meal}</Text>
                    <TouchableOpacity onPress={() => handleRemoveMealFromHistory(type, index)}>
                      <Text style={styles.removeButton}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {tempAssessment.dietHistory[type].length === 0 && (
                  <Text style={styles.emptyMealText}>{t.nutrition.addItem}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setAssessmentStep(0)}
            >
              <Text style={styles.modalButtonSecondaryText}>{t.common.back}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setAssessmentStep(2)}
            >
              <Text style={styles.modalButtonText}>{t.common.next}</Text>
              <ArrowRight size={20} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (assessmentStep === 2) {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.nutrition.foodFrequency}</Text>
          <Text style={styles.modalDescription}>
            {t.nutrition.whatYouEat}
          </Text>
          
          <ScrollView style={styles.ffqList} showsVerticalScrollIndicator={false}>
            {foodItems.map((item) => (
              <View key={item.key} style={styles.ffqItem}>
                <View style={styles.ffqHeader}>
                  <Text style={styles.ffqEmoji}>{item.emoji}</Text>
                  <Text style={styles.ffqLabel}>{item.label}</Text>
                </View>
                <View style={styles.frequencyOptions}>
                  {(Object.keys(frequencyLabels) as FrequencyOption[]).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        tempAssessment.ffq[item.key] === freq && styles.frequencyButtonActive,
                      ]}
                      onPress={() =>
                        setTempAssessment({
                          ...tempAssessment,
                          ffq: { ...tempAssessment.ffq, [item.key]: freq },
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          tempAssessment.ffq[item.key] === freq && styles.frequencyTextActive,
                        ]}
                      >
                        {frequencyLabels[freq]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setAssessmentStep(1)}
            >
              <Text style={styles.modalButtonSecondaryText}>{t.common.back}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCompleteAssessment}
            >
              <CheckCircle2 size={20} color={Colors.background} />
              <Text style={styles.modalButtonText}>{t.common.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  const renderWeeklyPlan = () => {
    if (!currentMealPlan) {
      return (
        <View style={styles.emptyState}>
          <Calendar size={64} color={Colors.textLight} />
          <Text style={styles.emptyStateTitle}>{t.nutrition.mealPlan}</Text>
          <Text style={styles.emptyStateDesc}>{t.nutrition.generatePlan}</Text>
        </View>
      );
    }

    return (
      <View style={styles.weeklyPlanContainer}>
        {currentMealPlan.days.map((day, index) => {
          const isDayExpanded = expandedDays[day.id] ?? true;
          return (
          <View key={day.id} style={styles.dayCard}>
            <TouchableOpacity 
              style={styles.dayHeader}
              onPress={() => toggleDay(day.id)}
              activeOpacity={0.7}
            >
              <View style={styles.dayHeaderLeft}>
                {isDayExpanded ? (
                  <ChevronDown size={20} color={Colors.primary} />
                ) : (
                  <ChevronRight size={20} color={Colors.textLight} />
                )}
                <Text style={styles.dayName}>{day.day}</Text>
              </View>
              <View style={styles.dayStats}>
                <Text style={styles.dayStat}>{Math.round(day.totalCalories)} {t.nutrition.calories}</Text>
                <Text style={styles.dayStat}>{t.nutrition.protein}: {Math.round(day.totalProtein)}g</Text>
              </View>
            </TouchableOpacity>

            {isDayExpanded && <View style={styles.dayMeals}>
              {day.breakfast && (
                <View style={styles.dayMealItemWrapper}>
                  <TouchableOpacity 
                    onPress={() => toggleMealCompletion && toggleMealCompletion(day.id, "breakfast")}
                  >
                    <View style={[styles.mealCheckbox, day.completedMeals?.breakfast && styles.mealCheckboxChecked]}>
                      {day.completedMeals?.breakfast && <Check size={14} color={Colors.background} />}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.dayMealContent}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.dayMealType}>🌅 {t.nutrition.breakfast}</Text>
                      <Text style={[styles.dayMealName, day.completedMeals?.breakfast && styles.dayMealNameCompleted]}>
                        {language === 'ar' ? day.breakfast.nameAr : day.breakfast.name}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButtonCompact}
                    onPress={() => {
                      try {
                        if (!day.breakfast || typeof day.breakfast !== 'object') {
                          Alert.alert(t.common.error, t.coach.errorOccurred);
                          return;
                        }
                        const mealData = JSON.stringify(day.breakfast);
                        if (!mealData || mealData === 'undefined' || mealData === 'null') {
                          Alert.alert(t.common.error, t.coach.errorOccurred);
                          return;
                        }
                        router.push({
                          pathname: "/meal-details",
                          params: { 
                            meal: mealData,
                            dayId: day.id,
                            mealType: "breakfast"
                          }
                        });
                      } catch (error) {
                        console.error('Error stringifying breakfast meal:', error);
                        Alert.alert(t.common.error, t.coach.errorOccurred);
                      }
                    }}
                  >
                    <ArrowRight size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteMealButton}
                    onPress={() => handleRemoveMealFromDay(day.id, "breakfast")}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
              {day.lunch && (
                <View style={styles.dayMealItemWrapper}>
                  <TouchableOpacity 
                    onPress={() => toggleMealCompletion && toggleMealCompletion(day.id, "lunch")}
                  >
                    <View style={[styles.mealCheckbox, day.completedMeals?.lunch && styles.mealCheckboxChecked]}>
                      {day.completedMeals?.lunch && <Check size={14} color={Colors.background} />}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.dayMealContent}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.dayMealType}>☀️ {t.nutrition.lunch}</Text>
                      <Text style={[styles.dayMealName, day.completedMeals?.lunch && styles.dayMealNameCompleted]}>
                        {language === 'ar' ? day.lunch.nameAr : day.lunch.name}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButtonCompact}
                    onPress={() => {
                      try {
                        if (!day.lunch || typeof day.lunch !== 'object') {
                          Alert.alert(t.common.error, t.coach.errorOccurred);
                          return;
                        }
                        const mealData = JSON.stringify(day.lunch);
                        if (!mealData || mealData === 'undefined' || mealData === 'null') {
                          Alert.alert(t.common.error, t.coach.errorOccurred);
                          return;
                        }
                        router.push({
                          pathname: "/meal-details",
                          params: { 
                            meal: mealData,
                            dayId: day.id,
                            mealType: "lunch"
                          }
                        });
                      } catch (error) {
                        console.error('Error stringifying lunch meal:', error);
                        Alert.alert(t.common.error, t.coach.errorOccurred);
                      }
                    }}
                  >
                    <ArrowRight size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteMealButton}
                    onPress={() => handleRemoveMealFromDay(day.id, "lunch")}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
              {day.dinner && (
                <View style={styles.dayMealItemWrapper}>
                  <TouchableOpacity 
                    onPress={() => toggleMealCompletion && toggleMealCompletion(day.id, "dinner")}
                  >
                    <View style={[styles.mealCheckbox, day.completedMeals?.dinner && styles.mealCheckboxChecked]}>
                      {day.completedMeals?.dinner && <Check size={14} color={Colors.background} />}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.dayMealContent}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.dayMealType}>🌙 {t.nutrition.dinner}</Text>
                      <Text style={[styles.dayMealName, day.completedMeals?.dinner && styles.dayMealNameCompleted]}>
                        {language === 'ar' ? day.dinner.nameAr : day.dinner.name}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButtonCompact}
                    onPress={() => {
                      try {
                        if (!day.dinner || typeof day.dinner !== 'object') {
                          Alert.alert(t.common.error, t.coach.errorOccurred);
                          return;
                        }
                        const mealData = JSON.stringify(day.dinner);
                        if (!mealData || mealData === 'undefined' || mealData === 'null') {
                          Alert.alert(t.common.error, t.coach.errorOccurred);
                          return;
                        }
                        router.push({
                          pathname: "/meal-details",
                          params: { 
                            meal: mealData,
                            dayId: day.id,
                            mealType: "dinner"
                          }
                        });
                      } catch (error) {
                        console.error('Error stringifying dinner meal:', error);
                        Alert.alert(t.common.error, t.coach.errorOccurred);
                      }
                    }}
                  >
                    <ArrowRight size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteMealButton}
                    onPress={() => handleRemoveMealFromDay(day.id, "dinner")}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}

              {day.snacks.length > 0 && (
                <View style={styles.snacksContainer}>
                  {day.snacks.map((snack, snackIndex) => (
                    <View 
                      key={`${day.id}-snack-${snackIndex}`}
                      style={styles.dayMealItemWrapper}
                    >
                      <TouchableOpacity 
                        onPress={() => toggleMealCompletion && toggleMealCompletion(day.id, "snack", snackIndex)}
                      >
                        <View style={[styles.mealCheckbox, day.completedMeals?.snacks?.[snackIndex] && styles.mealCheckboxChecked]}>
                          {day.completedMeals?.snacks?.[snackIndex] && <Check size={14} color={Colors.background} />}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.dayMealContent}>
                        <View style={styles.mealInfo}>
                          <Text style={styles.dayMealType}>🍎 {t.nutrition.snack}</Text>
                          <Text style={[styles.dayMealName, day.completedMeals?.snacks?.[snackIndex] && styles.dayMealNameCompleted]}>
                            {language === 'ar' ? snack.nameAr : snack.name}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.viewDetailsButtonCompact}
                        onPress={() => {
                          try {
                            if (!snack || typeof snack !== 'object') {
                              Alert.alert(t.common.error, t.coach.errorOccurred);
                              return;
                            }
                            const mealData = JSON.stringify(snack);
                            if (!mealData || mealData === 'undefined' || mealData === 'null') {
                              Alert.alert(t.common.error, t.coach.errorOccurred);
                              return;
                            }
                            router.push({
                              pathname: "/meal-details",
                              params: { 
                                meal: mealData,
                                dayId: day.id,
                                mealType: "snack",
                                snackIndex: String(snackIndex)
                              }
                            });
                          } catch (error) {
                            console.error('Error stringifying snack meal:', error);
                            Alert.alert(t.common.error, t.coach.errorOccurred);
                          }
                        }}
                      >
                        <ArrowRight size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteMealButton}
                        onPress={() => handleRemoveMealFromDay(day.id, "snack", snackIndex)}
                      >
                        <Trash2 size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>}
          </View>
        );
        })}
      </View>
    );
  };

  const handleAddGroceryItem = () => {
    if (!newGroceryItem.name.trim()) {
      Alert.alert(t.common.error, t.nutrition.itemName);
      return;
    }
    if (addGroceryItem) {
      addGroceryItem(newGroceryItem.name.trim(), newGroceryItem.category);
      setNewGroceryItem({ name: "", category: "protein" });
      setShowAddGroceryModal(false);
      Alert.alert(t.common.success, t.nutrition.addGroceryItem);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const renderGroceryList = () => {
    if (!groceryList) {
      return (
        <View style={styles.emptyState}>
          <ShoppingCart size={64} color={Colors.textLight} />
          <Text style={styles.emptyStateTitle}>{t.nutrition.groceryList}</Text>
          <Text style={styles.emptyStateDesc}>{t.nutrition.generateGroceryList}</Text>
        </View>
      );
    }

    const groupedItems = groceryList.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);

    const categoryLabels: Record<string, string> = {
      protein: `🍗 ${t.nutrition.proteinCategory}`,
      carbs: `🍚 ${t.nutrition.carbsCategory}`,
      vegetables_fruits: `🥗 ${t.nutrition.vegetablesCategory}`,
      dairy: `🥛 ${t.nutrition.dairyCategory}`,
      spices: `🌶️ ${t.nutrition.otherCategory}`,
      other: `📦 ${t.nutrition.otherCategory}`,
    };

    const categoryOrder = ["protein", "carbs", "vegetables_fruits", "dairy", "spices", "other"];
    const sortedCategories = categoryOrder.filter(cat => groupedItems[cat]);

    return (
      <ScrollView style={styles.groceryContainer} showsVerticalScrollIndicator={false}>
        {sortedCategories.map((category) => {
          const items = groupedItems[category];
          const isExpanded = expandedCategories[category] ?? false;
          return (
            <View key={category} style={styles.groceryCategory}>
              <TouchableOpacity 
                style={styles.groceryCategoryHeader}
                onPress={() => toggleCategory(category)}
              >
                <Text style={styles.groceryCategoryTitle}>{categoryLabels[category]}</Text>
                <View style={styles.categoryCounts}>
                  <Text style={styles.categoryCountText}>{items.length}</Text>
                  {isExpanded ? (
                    <ChevronDown size={20} color={Colors.primary} />
                  ) : (
                    <ChevronRight size={20} color={Colors.textLight} />
                  )}
                </View>
              </TouchableOpacity>
              {isExpanded && items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.groceryItem}
                  onPress={() => toggleGroceryItem(item.id)}
                >
                  <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                    {item.checked && <Check size={16} color={Colors.background} />}
                  </View>
                  <View style={styles.groceryItemContent}>
                    <Text style={[styles.groceryItemName, item.checked && styles.groceryItemNameChecked]}>
                      {item.nameAr}
                    </Text>
                    <Text style={styles.groceryItemQuantity}>{item.quantity}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
        
        <TouchableOpacity 
          style={styles.addGroceryButton}
          onPress={() => setShowAddGroceryModal(true)}
        >
          <PackagePlus size={20} color={Colors.primary} />
          <Text style={styles.addGroceryButtonText}>{t.nutrition.addGroceryItem}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <ChefHat size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{t.nutrition.title}</Text>
          <Text style={styles.subtitle}>{t.tabs.nutrition}</Text>
        </View>

        <View style={styles.caloriesCard}>
          <View style={styles.caloriesRow}>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieValue}>{targetCalories}</Text>
              <Text style={styles.calorieLabel}>{t.nutrition.targetCalories}</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieItem}>
              <Text style={styles.calorieValue}>{proteinTarget}g</Text>
              <Text style={styles.calorieLabel}>{t.nutrition.proteinTarget}</Text>
            </View>
          </View>
        </View>

        {!nutritionAssessment?.completed && (
          <TouchableOpacity style={styles.assessmentCard} onPress={handleStartAssessment}>
            <View style={styles.assessmentIcon}>
              <ChefHat size={24} color={Colors.primary} />
            </View>
            <View style={styles.assessmentContent}>
              <Text style={styles.assessmentTitle}>{t.nutrition.startAssessment}</Text>
              <Text style={styles.assessmentDescription}>
                {t.nutrition.assessmentComplete}
              </Text>
            </View>
            <ArrowRight size={24} color={Colors.textLight} />
          </TouchableOpacity>
        )}

        {nutritionAssessment?.completed && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.nutrition.mealStructure}</Text>
                <TouchableOpacity onPress={handleStartAssessment}>
                  <Text style={styles.editLink}>{t.common.edit}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Clock size={20} color={Colors.primary} />
                  <Text style={styles.infoText}>
                    {mealStructures.find(s => s.value === nutritionAssessment.mealStructure)?.label}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  if (!currentMealPlan) {
                    generateWeeklyMealPlan();
                  } else {
                    setActiveView("plan");
                  }
                }}
              >
                <Calendar size={20} color={Colors.background} />
                <Text style={styles.actionButtonText}>{t.nutrition.mealPlan}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  if (!currentMealPlan) {
                    Alert.alert(t.common.error, t.nutrition.generatePlan);
                  } else if (!groceryList) {
                    generateGroceryList();
                  } else {
                    setActiveView("grocery");
                  }
                }}
              >
                <ShoppingCart size={20} color={Colors.background} />
                <Text style={styles.actionButtonText}>{t.nutrition.groceryList}</Text>
              </TouchableOpacity>
            </View>

            {activeView === "plan" && currentMealPlan && (
              <View style={styles.planSection}>
                <View style={styles.planSectionHeaderRow}>
                  <Text style={styles.planSectionTitle}>📅 {t.nutrition.mealPlan}</Text>
                  <TouchableOpacity 
                    style={styles.addMealButtonGlobal}
                    onPress={handleOpenAddMealModal}
                  >
                    <Plus size={18} color={Colors.background} />
                    <Text style={styles.addMealButtonGlobalText}>{t.common.add}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.contentView}>
                  {renderWeeklyPlan()}
                </View>
              </View>
            )}

            {activeView === "grocery" && groceryList && (
              <View style={styles.planSection}>
                <Text style={styles.planSectionTitle}>🛒 {t.nutrition.groceryList}</Text>
                <View style={styles.contentView}>
                  {renderGroceryList()}
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 {t.coach.tips}</Text>
          <Text style={styles.tipsText}>
            • {t.common.loading}{"\n"}
            • {t.nutrition.protein}{"\n"}
            • {t.nutrition.vegetables} & {t.nutrition.fruits}{"\n"}
            • {t.common.success}
          </Text>
        </View>


      </ScrollView>

      <Modal
        visible={showAssessmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssessmentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>{t.nutrition.startAssessment}</Text>
            <TouchableOpacity onPress={() => setShowAssessmentModal(false)}>
              <Text style={styles.closeButton}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
          {renderAssessmentStep()}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showMealsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>{t.nutrition.mealPlan}</Text>
            <TouchableOpacity onPress={() => setShowMealsModal(false)}>
              <Text style={styles.closeButton}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {Object.entries(saudiMeals).map(([category, meals]) => (
              <View key={category} style={styles.mealCategory}>
                <Text style={styles.categoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                {meals.map((meal, index) => (
                  <View key={index} style={styles.modalMealCard}>
                    <Text style={styles.modalMealName}>{language === 'ar' ? meal.nameAr : meal.name}</Text>
                    <View style={styles.modalMealMacros}>
                      <Text style={styles.macroText}>{meal.calories} {t.nutrition.calories}</Text>
                      <Text style={styles.macroText}>{t.nutrition.protein}: {meal.protein}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.carbs}: {meal.carbs}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.fats}: {meal.fats}g</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showAddMealModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {addMealStep === "select_type" && t.nutrition.selectMealType}
              {addMealStep === "select_method" && t.nutrition.selectMethod}
              {addMealStep === "select_days" && t.nutrition.selectDays}
              {addMealStep === "list" && t.nutrition.fromList}
              {addMealStep === "favorites" && t.nutrition.fromFavorites}
              {addMealStep === "custom" && t.nutrition.createCustom}
            </Text>
            <TouchableOpacity onPress={() => {
              if (addMealStep === "select_type") {
                setShowAddMealModal(false);
              } else if (addMealStep === "select_method") {
                setAddMealStep("select_type");
              } else if (addMealStep === "select_days") {
                setAddMealStep("select_method");
              } else {
                setAddMealStep("select_days");
              }
            }}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          {addMealStep === "select_type" && (
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>{t.nutrition.selectMealType}</Text>
              <View style={styles.mealTypeGrid}>
                <TouchableOpacity
                  style={styles.mealTypeCard}
                  onPress={() => {
                    setSelectedMealType("breakfast");
                    setAddMealStep("select_method");
                  }}
                >
                  <Text style={styles.mealTypeEmoji}>🌅</Text>
                  <Text style={styles.mealTypeCardText}>{t.nutrition.breakfast}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mealTypeCard}
                  onPress={() => {
                    setSelectedMealType("lunch");
                    setAddMealStep("select_method");
                  }}
                >
                  <Text style={styles.mealTypeEmoji}>☀️</Text>
                  <Text style={styles.mealTypeCardText}>{t.nutrition.lunch}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mealTypeCard}
                  onPress={() => {
                    setSelectedMealType("dinner");
                    setAddMealStep("select_method");
                  }}
                >
                  <Text style={styles.mealTypeEmoji}>🌙</Text>
                  <Text style={styles.mealTypeCardText}>{t.nutrition.dinner}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mealTypeCard}
                  onPress={() => {
                    setSelectedMealType("snack");
                    setAddMealStep("select_method");
                  }}
                >
                  <Text style={styles.mealTypeEmoji}>🍎</Text>
                  <Text style={styles.mealTypeCardText}>{t.nutrition.snack}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {addMealStep === "select_method" && (
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>{t.nutrition.selectMethod}</Text>
              <View style={styles.methodCardsContainer}>
                {nutritionAssessment?.favoriteMeals && nutritionAssessment.favoriteMeals.length > 0 && (
                  <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => {
                      setSelectedMethod("favorites");
                      setAddMealStep("select_days");
                    }}
                  >
                    <ArrowRight size={32} color={Colors.primary} />
                    <Text style={styles.methodCardTitle}>{t.nutrition.fromFavorites}</Text>
                    <Text style={styles.methodCardDesc}>{t.plan.favoriteExercises}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => {
                    setSelectedMethod("list");
                    setAddMealStep("select_days");
                  }}
                >
                  <ChefHat size={32} color={Colors.primary} />
                  <Text style={styles.methodCardTitle}>{t.nutrition.fromList}</Text>
                  <Text style={styles.methodCardDesc}>{t.nutrition.mealPlan}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => {
                    setSelectedMethod("custom");
                    setAddMealStep("select_days");
                  }}
                >
                  <Sparkles size={32} color={Colors.primary} />
                  <Text style={styles.methodCardTitle}>{t.nutrition.createCustom}</Text>
                  <Text style={styles.methodCardDesc}>{t.nutrition.generating}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {addMealStep === "select_days" && currentMealPlan && (
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>{t.nutrition.selectDays}</Text>
              
              <View style={styles.daysSelectionHeader}>
                <Text style={styles.compactLabel}>{t.common.days}:</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedDays.length === currentMealPlan.days.length) {
                      setSelectedDays([]);
                    } else {
                      setSelectedDays(currentMealPlan.days.map(d => d.id));
                    }
                  }}
                >
                  <Text style={styles.selectAllButton}>
                    {selectedDays.length === currentMealPlan.days.length ? t.common.deselectAll : t.common.selectAll}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.compactRowWrap}>
                {currentMealPlan.days.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.daySelectionButton,
                      selectedDays.includes(day.id) && styles.daySelectionButtonSelected
                    ]}
                    onPress={() => {
                      if (selectedDays.includes(day.id)) {
                        setSelectedDays(selectedDays.filter(id => id !== day.id));
                      } else {
                        setSelectedDays([...selectedDays, day.id]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.daySelectionButtonText,
                      selectedDays.includes(day.id) && styles.daySelectionButtonTextSelected
                    ]}>{day.day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  selectedDays.length === 0 && styles.modalButtonDisabled
                ]}
                onPress={() => {
                  if (selectedMethod === "favorites") {
                    setAddMealStep("favorites");
                  } else if (selectedMethod === "list") {
                    setAddMealStep("list");
                  } else if (selectedMethod === "custom") {
                    setAddMealStep("custom");
                  }
                }}
                disabled={selectedDays.length === 0}
              >
                <Text style={styles.modalButtonText}>{t.common.next}</Text>
                <ArrowRight size={20} color={Colors.background} />
              </TouchableOpacity>
            </View>
          )}

          {addMealStep === "favorites" && nutritionAssessment?.favoriteMeals && (
            <ScrollView style={styles.modalScroll}>
              <View style={styles.mealCategory}>
                {nutritionAssessment.favoriteMeals
                  .filter(meal => meal.type === selectedMealType)
                  .map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectableMealCard}
                    onPress={() => handleAddMealToDay(meal)}
                  >
                    <Text style={styles.modalMealName}>{language === 'ar' ? meal.nameAr : meal.name}</Text>
                    <View style={styles.modalMealMacros}>
                      <Text style={styles.macroText}>{meal.calories} {t.nutrition.calories}</Text>
                      <Text style={styles.macroText}>{t.nutrition.protein}: {meal.protein}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.carbs}: {meal.carbs}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.fats}: {meal.fats}g</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {nutritionAssessment.favoriteMeals.filter(meal => meal.type === selectedMealType).length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateDesc}>{t.nutrition.fromFavorites}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {addMealStep === "list" && (
            <ScrollView style={styles.modalScroll}>
              <View style={styles.mealCategory}>
                {selectedMealType === "breakfast" && saudiMeals.breakfast.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectableMealCard}
                    onPress={() => handleAddMealToDay(meal)}
                  >
                    <Text style={styles.modalMealName}>{language === 'ar' ? meal.nameAr : meal.name}</Text>
                    <View style={styles.modalMealMacros}>
                      <Text style={styles.macroText}>{meal.calories} {t.nutrition.calories}</Text>
                      <Text style={styles.macroText}>{t.nutrition.protein}: {meal.protein}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.carbs}: {meal.carbs}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.fats}: {meal.fats}g</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {selectedMealType === "lunch" && saudiMeals.lunch.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectableMealCard}
                    onPress={() => handleAddMealToDay(meal)}
                  >
                    <Text style={styles.modalMealName}>{language === 'ar' ? meal.nameAr : meal.name}</Text>
                    <View style={styles.modalMealMacros}>
                      <Text style={styles.macroText}>{meal.calories} {t.nutrition.calories}</Text>
                      <Text style={styles.macroText}>{t.nutrition.protein}: {meal.protein}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.carbs}: {meal.carbs}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.fats}: {meal.fats}g</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {selectedMealType === "dinner" && saudiMeals.dinner.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectableMealCard}
                    onPress={() => handleAddMealToDay(meal)}
                  >
                    <Text style={styles.modalMealName}>{language === 'ar' ? meal.nameAr : meal.name}</Text>
                    <View style={styles.modalMealMacros}>
                      <Text style={styles.macroText}>{meal.calories} {t.nutrition.calories}</Text>
                      <Text style={styles.macroText}>{t.nutrition.protein}: {meal.protein}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.carbs}: {meal.carbs}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.fats}: {meal.fats}g</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {selectedMealType === "snack" && saudiMeals.snacks.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectableMealCard}
                    onPress={() => handleAddMealToDay(meal)}
                  >
                    <Text style={styles.modalMealName}>{language === 'ar' ? meal.nameAr : meal.name}</Text>
                    <View style={styles.modalMealMacros}>
                      <Text style={styles.macroText}>{meal.calories} {t.nutrition.calories}</Text>
                      <Text style={styles.macroText}>{t.nutrition.protein}: {meal.protein}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.carbs}: {meal.carbs}g</Text>
                      <Text style={styles.macroText}>{t.nutrition.fats}: {meal.fats}g</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {addMealStep === "custom" && (
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>{t.nutrition.enterMealName}</Text>
              <View style={styles.customMealInputContainer}>
                <TextInput
                  style={styles.customMealInput}
                  placeholder={t.nutrition.enterMealName}
                  placeholderTextColor={Colors.textLight}
                  value={customMealInput}
                  onChangeText={setCustomMealInput}
                  multiline
                  editable={!isGeneratingMeal}
                />
              </View>
              <TouchableOpacity
                style={[styles.generateButton, isGeneratingMeal && styles.generateButtonDisabled]}
                onPress={handleGenerateCustomMeal}
                disabled={isGeneratingMeal}
              >
                {isGeneratingMeal ? (
                  <>
                    <Text style={styles.generateButtonText}>{t.nutrition.generating}</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color={Colors.background} />
                    <Text style={styles.generateButtonText}>{t.nutrition.generate}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showAddGroceryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddGroceryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>{t.nutrition.addGroceryItem}</Text>
            <TouchableOpacity onPress={() => setShowAddGroceryModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>{t.nutrition.itemName}</Text>
            
            <Text style={styles.categorySelectionTitle}>{t.nutrition.category}</Text>
            <View style={styles.categorySelectionGrid}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newGroceryItem.category === "protein" && styles.categoryOptionActive,
                ]}
                onPress={() => setNewGroceryItem({ ...newGroceryItem, category: "protein" })}
              >
                <Text style={styles.categoryOptionEmoji}>🍗</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    newGroceryItem.category === "protein" && styles.categoryOptionTextActive,
                  ]}
                >
                  {t.nutrition.proteinCategory}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newGroceryItem.category === "carbs" && styles.categoryOptionActive,
                ]}
                onPress={() => setNewGroceryItem({ ...newGroceryItem, category: "carbs" })}
              >
                <Text style={styles.categoryOptionEmoji}>🍚</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    newGroceryItem.category === "carbs" && styles.categoryOptionTextActive,
                  ]}
                >
                  {t.nutrition.carbsCategory}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newGroceryItem.category === "vegetables_fruits" && styles.categoryOptionActive,
                ]}
                onPress={() => setNewGroceryItem({ ...newGroceryItem, category: "vegetables_fruits" })}
              >
                <Text style={styles.categoryOptionEmoji}>🥗</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    newGroceryItem.category === "vegetables_fruits" && styles.categoryOptionTextActive,
                  ]}
                >
                  {t.nutrition.vegetablesCategory}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newGroceryItem.category === "dairy" && styles.categoryOptionActive,
                ]}
                onPress={() => setNewGroceryItem({ ...newGroceryItem, category: "dairy" })}
              >
                <Text style={styles.categoryOptionEmoji}>🥛</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    newGroceryItem.category === "dairy" && styles.categoryOptionTextActive,
                  ]}
                >
                  {t.nutrition.dairyCategory}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newGroceryItem.category === "spices" && styles.categoryOptionActive,
                ]}
                onPress={() => setNewGroceryItem({ ...newGroceryItem, category: "spices" })}
              >
                <Text style={styles.categoryOptionEmoji}>🌶️</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    newGroceryItem.category === "spices" && styles.categoryOptionTextActive,
                  ]}
                >
                  {t.nutrition.otherCategory}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newGroceryItem.category === "other" && styles.categoryOptionActive,
                ]}
                onPress={() => setNewGroceryItem({ ...newGroceryItem, category: "other" })}
              >
                <Text style={styles.categoryOptionEmoji}>📦</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    newGroceryItem.category === "other" && styles.categoryOptionTextActive,
                  ]}
                >
                  {t.nutrition.otherCategory}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.itemNameLabel}>{t.nutrition.itemName}</Text>
            <TextInput
              style={styles.itemNameInput}
              placeholder={t.nutrition.itemName}
              placeholderTextColor={Colors.textLight}
              value={newGroceryItem.name}
              onChangeText={(text) => setNewGroceryItem({ ...newGroceryItem, name: text })}
            />
            
            <TouchableOpacity
              style={[styles.addItemButton, !newGroceryItem.name.trim() && styles.addItemButtonDisabled]}
              onPress={handleAddGroceryItem}
              disabled={!newGroceryItem.name.trim()}
            >
              <PackagePlus size={20} color={Colors.background} />
              <Text style={styles.addItemButtonText}>{t.common.add}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  caloriesCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calorieItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  calorieLabel: {
    fontSize: 13,
    color: Colors.background,
    opacity: 0.9,
  },
  calorieDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background,
    opacity: 0.3,
  },
  assessmentCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  assessmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  assessmentContent: {
    flex: 1,
    gap: 4,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  assessmentDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  editLink: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  planSection: {
    marginBottom: 20,
  },
  planSectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  contentView: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  weeklyPlanContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  dayStats: {
    flexDirection: "row",
    gap: 12,
  },
  dayStat: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayMeals: {
    gap: 12,
  },

  dayMealItemWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayMealContent: {
    flex: 1,
  },
  mealInfo: {
    flex: 1,
    gap: 4,
  },
  dayMealType: {
    fontSize: 13,
    color: Colors.textSecondary,
    minWidth: 60,
  },
  dayMealName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  dayMealNameCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textLight,
  },
  viewDetailsButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mealCheckboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  snacksContainer: {
    gap: 8,
  },
  groceryContainer: {
    flex: 1,
  },
  groceryCategory: {
    marginBottom: 16,
  },
  groceryCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groceryCategoryTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  categoryCounts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryCountText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 24,
    textAlign: "center",
  },
  groceryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  groceryItemContent: {
    flex: 1,
    gap: 4,
  },
  groceryItemName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  groceryItemNameChecked: {
    textDecorationLine: "line-through",
    color: Colors.textLight,
  },
  groceryItemQuantity: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tipsCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  mealStructureContainer: {
    gap: 12,
    marginBottom: 24,
  },
  structureCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  structureCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  structureLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  structureLabelActive: {
    color: Colors.background,
  },
  structureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  structureDescActive: {
    color: Colors.background,
    opacity: 0.9,
  },
  mealTypeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  mealTypeTextActive: {
    color: Colors.background,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  mealInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mealsList: {
    flex: 1,
    marginBottom: 16,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealSectionTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealItemText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  removeButton: {
    fontSize: 24,
    color: Colors.danger,
    fontWeight: "bold" as const,
    paddingHorizontal: 8,
  },
  emptyMealText: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: "italic" as const,
    textAlign: "center",
    padding: 12,
  },
  ffqList: {
    flex: 1,
    marginBottom: 16,
  },
  ffqItem: {
    marginBottom: 24,
  },
  ffqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  ffqEmoji: {
    fontSize: 24,
  },
  ffqLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  frequencyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  frequencyButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  frequencyTextActive: {
    color: Colors.background,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  mealSuggestionsTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  mealSuggestionsList: {
    gap: 16,
  },
  mealSuggestionItem: {
    flexDirection: "row",
    gap: 12,
  },
  mealSuggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  mealSuggestionInfo: {
    flex: 1,
    gap: 2,
  },
  mealSuggestionName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  mealSuggestionNameAr: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "System",
  },
  mealSuggestionCalories: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  modalScroll: {
    flex: 1,
  },
  mealCategory: {
    padding: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  modalMealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalMealName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  modalMealNameAr: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalMealMacros: {
    flexDirection: "row",
    gap: 16,
  },
  macroText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteMealButton: {
    padding: 4,
  },
  addMealButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  planSectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addMealButtonGlobal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMealButtonGlobalText: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  daySelectionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 80,
  },
  daySelectionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  daySelectionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  daySelectionButtonTextSelected: {
    color: Colors.background,
  },
  daysSelectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  selectAllButton: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  compactRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  selectableMealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mealTypeCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  mealTypeEmoji: {
    fontSize: 40,
  },
  mealTypeCardText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  methodCardsContainer: {
    gap: 16,
  },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  methodCardTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  methodCardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  customMealInputContainer: {
    marginBottom: 16,
  },
  customMealInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: "top",
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  addGroceryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed" as const,
  },
  addGroceryButtonText: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  categorySelectionTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  categorySelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  categoryOption: {
    width: "30%",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryOptionEmoji: {
    fontSize: 28,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  categoryOptionTextActive: {
    color: Colors.background,
  },
  itemNameLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  itemNameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  addItemButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addItemButtonDisabled: {
    opacity: 0.5,
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
});
