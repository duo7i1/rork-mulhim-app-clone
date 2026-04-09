import { Sparkles, Send, Bot, User, Save, ExternalLink } from "lucide-react-native";
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useFitness } from "@/providers/FitnessProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { remoteFitnessRepo } from "@/services/remoteRepo";
import { streamAICoachMessage, AIToolCall } from "@/services/aiCoach";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: AIToolCall[];
  toolResults?: string[];
}

export default function CoachScreen() {
  console.log("[CoachScreen] Rendering");
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { 
    profile, 
    getCurrentStreak,
    currentWeekPlan,
    updateWeekPlan,
    currentMealPlan,
    nutritionPlan,
    addMealToDay,
    addFavoriteExercise,
    addFavoriteMeal,
  } = useFitness();
  
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [lastSuggestedWorkout, setLastSuggestedWorkout] = useState<any>(null);
  const [lastSuggestedMeal, setLastSuggestedMeal] = useState<any>(null);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveModalType, setSaveModalType] = useState<"workout" | "meal" | null>(null);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack" | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [saveToFavorites, setSaveToFavorites] = useState<boolean>(false);
  const [selectedWorkoutDays, setSelectedWorkoutDays] = useState<string[]>([]);
  const [saveWorkoutToFavorites, setSaveWorkoutToFavorites] = useState<boolean>(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const processToolCalls = useCallback((toolCalls: AIToolCall[]) => {
    const results: string[] = [];
    for (const tc of toolCalls) {
      console.log('[CoachScreen] Processing tool call:', tc.name, tc.arguments);
      if (tc.name === 'suggestWorkout') {
        setLastSuggestedWorkout(tc.arguments);
        const exercises = tc.arguments.exercises as any[];
        const muscleGroup = tc.arguments.muscleGroup as string;
        results.push(
          language === 'ar'
            ? `✓ تم اقتراح ${exercises?.length || 0} تمارين لـ ${muscleGroup}`
            : `✓ Suggested ${exercises?.length || 0} exercises for ${muscleGroup}`
        );
      } else if (tc.name === 'suggestMeal') {
        setLastSuggestedMeal(tc.arguments);
        const mealName = tc.arguments.mealName as string;
        results.push(
          language === 'ar'
            ? `✓ تم اقتراح وجبة ${mealName}`
            : `✓ Suggested meal ${mealName}`
        );
      } else if (tc.name === 'trackProgress') {
        const metric = tc.arguments.metric as string;
        const trend = tc.arguments.trend as string;
        results.push(
          language === 'ar'
            ? `✓ تم تحليل ${metric}: ${trend}`
            : `✓ Analyzed ${metric}: ${trend}`
        );
      } else if (tc.name === 'adjustPlan') {
        const planType = tc.arguments.planType as string;
        results.push(
          language === 'ar'
            ? `✓ تم تعديل خطة ${planType}`
            : `✓ Adjusted ${planType} plan`
        );
      }
    }
    return results;
  }, [language]);

  const buildRequestContext = useCallback(() => {
    const context: Record<string, unknown> = {};

    if (profile) {
      context.profile = {
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        goal: profile.goal,
        fitnessLevel: profile.fitnessLevel,
        trainingLocation: profile.trainingLocation,
        activityLevel: profile.activityLevel,
        availableDays: profile.availableDays,
        sessionDuration: profile.sessionDuration,
        injuries: profile.injuries,
        targetWeight: profile.targetWeight,
      };
    }

    if (nutritionPlan) {
      context.nutrition = {
        targetCalories: nutritionPlan.targetCalories,
        proteinTarget: nutritionPlan.macros.protein,
      };
    }

    if (currentWeekPlan && currentWeekPlan.sessions.length > 0) {
      context.currentWorkoutPlan = {
        sessions: currentWeekPlan.sessions.map(s => ({
          day: s.day,
          name: s.name,
          exerciseCount: s.exercises.length,
        })),
      };
    }

    if (currentMealPlan && currentMealPlan.days.length > 0) {
      context.currentMealPlan = {
        days: currentMealPlan.days.map(d => ({
          day: d.day,
          totalCalories: d.totalCalories,
          totalProtein: d.totalProtein,
          hasMeals: !!(d.breakfast || d.lunch || d.dinner || d.snacks.length > 0),
        })),
      };
    }

    const streak = getCurrentStreak();
    if (streak > 0) {
      context.streak = streak;
    }

    context.language = language || 'ar';

    return context;
  }, [profile, nutritionPlan, currentWeekPlan, currentMealPlan, getCurrentStreak, language]);

  const streamingMsgIdRef = useRef<string | null>(null);

  const formatToolCallContent = useCallback((toolCalls: AIToolCall[]): string => {
    const tc = toolCalls[0];
    if (!tc) return '';
    const toolArgs = tc.arguments;
    if (!toolArgs) return '';

    if (tc.name === 'suggestWorkout') {
      const reason = toolArgs.reason as string;
      const exercises = toolArgs.exercises as any[];
      const exercisesList = exercises?.map((ex: any) =>
        `• ${ex.name}: ${ex.sets} × ${ex.reps} (${language === 'ar' ? 'راحة' : 'rest'} ${ex.rest}${language === 'ar' ? 'ث' : 's'})`
      ).join('\n') || '';
      return `${reason || ''}\n\n${exercisesList}`;
    } else if (tc.name === 'suggestMeal') {
      const mealName = toolArgs.mealName as string;
      const calories = toolArgs.calories as number;
      const protein = toolArgs.protein as number;
      const ingredients = toolArgs.ingredients as string[];
      const cookingTips = toolArgs.cookingTips as string;
      const ingredientsList = ingredients?.map((ing: string) => `• ${ing}`).join('\n') || '';
      return `🍽 ${mealName}\n\n${language === 'ar' ? 'السعرات' : 'Calories'}: ${calories} | ${language === 'ar' ? 'البروتين' : 'Protein'}: ${protein}g\n\n${language === 'ar' ? 'المكونات' : 'Ingredients'}:\n${ingredientsList}\n\n${language === 'ar' ? 'نصائح' : 'Tips'}: ${cookingTips}`;
    } else if (tc.name === 'trackProgress') {
      const recommendation = toolArgs.recommendation as string;
      return recommendation || '';
    } else if (tc.name === 'adjustPlan') {
      const changes = toolArgs.changes as string[];
      const reason = toolArgs.reason as string;
      const changesList = changes?.map((c: string) => `• ${c}`).join('\n') || '';
      return `${reason || ''}\n\n${changesList}`;
    }
    return '';
  }, [language]);

  const sendMessageToAI = useCallback(async (userText: string) => {
    setError(null);
    setIsGenerating(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userText,
    };

    const assistantMsgId = `msg-${Date.now()}-assistant`;
    streamingMsgIdRef.current = assistantMsgId;

    const streamingMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMsg, streamingMsg]);
    scrollToBottom();

    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    conversationHistory.push({ role: 'user', content: userText });

    const context = buildRequestContext();

    let receivedToolCalls: AIToolCall[] = [];
    let fullContent = '';

    await streamAICoachMessage(
      {
        messages: conversationHistory,
        ...context,
      } as any,
      {
        onToken: (token: string) => {
          fullContent += token;
          const currentContent = fullContent;
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId ? { ...m, content: currentContent } : m
            )
          );
          scrollToBottom();
        },
        onToolCalls: (toolCalls: AIToolCall[]) => {
          console.log('[CoachScreen] Stream tool calls received:', toolCalls.length);
          receivedToolCalls = toolCalls;
          const toolResults = processToolCalls(toolCalls);

          let toolContent = formatToolCallContent(toolCalls);
          if (toolContent && !fullContent) {
            fullContent = toolContent;
          } else if (toolContent && fullContent) {
            fullContent = fullContent + '\n\n' + toolContent;
          }

          const finalContent = fullContent || (language === 'ar' ? 'تم!' : 'Done!');

          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: finalContent.trim(),
                    toolCalls: toolCalls,
                    toolResults: toolResults.length > 0 ? toolResults : undefined,
                  }
                : m
            )
          );
          scrollToBottom();
        },
        onDone: (finalFullContent: string, _finishReason: string) => {
          console.log('[CoachScreen] Stream done, content length:', finalFullContent.length);
          streamingMsgIdRef.current = null;

          let finalContent = fullContent || finalFullContent;

          if (receivedToolCalls.length > 0 && !finalContent) {
            finalContent = formatToolCallContent(receivedToolCalls);
          }

          if (!finalContent) {
            finalContent = language === 'ar' ? 'تم!' : 'Done!';
          }

          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, content: finalContent.trim(), toolCalls: m.toolCalls ?? (receivedToolCalls.length > 0 ? receivedToolCalls : undefined), toolResults: m.toolResults }
                : m
            )
          );

          setIsGenerating(false);

          if (user?.id) {
            void remoteFitnessRepo.saveChatMessage(
              user.id,
              userText,
              finalContent.trim(),
              userText.substring(0, 100)
            );
          }
        },
        onError: (err: Error) => {
          console.error('[CoachScreen] Stream error:', err);
          streamingMsgIdRef.current = null;
          setError(err?.message || 'Unknown error');
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.',
                  }
                : m
            )
          );
          setIsGenerating(false);
          scrollToBottom();
        },
      }
    );
  }, [messages, buildRequestContext, processToolCalls, formatToolCallContent, scrollToBottom, user?.id, language]);

  const handleSend = useCallback(() => {
    if (input.trim() && !isGenerating) {
      const text = input.trim();
      setInput("");
      void sendMessageToAI(text);
    }
  }, [input, isGenerating, sendMessageToAI]);

  const handleQuickAction = useCallback((message: string) => {
    if (!isGenerating) {
      void sendMessageToAI(message);
    }
  }, [isGenerating, sendMessageToAI]);

  const openSaveModal = (type: "workout" | "meal", data: any) => {
    setSaveModalType(type);
    setSelectedData(data);
    setShowSaveModal(true);
  };

  const handleSaveWorkout = () => {
    if (!selectedData) return;

    let savedToFavorites = false;
    let savedToPlan = false;

    const exercisesWithIds = selectedData.exercises.map((ex: any, index: number) => ({
      id: `ai-exercise-${Date.now()}-${index}-${Math.random()}`,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      muscleGroup: selectedData.muscleGroup,
      equipment: [],
      assignedWeight: t.coach.yourAbility,
    }));

    if (saveWorkoutToFavorites) {
      exercisesWithIds.forEach((ex: any) => {
        void addFavoriteExercise({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment,
          assignedWeight: ex.assignedWeight,
        });
      });
      savedToFavorites = true;
    }

    if (currentWeekPlan && selectedWorkoutDays.length > 0) {
      const updatedSessions = (currentWeekPlan.sessions ?? []).map((session) => {
        if (selectedWorkoutDays.includes(session.id)) {
          const newExercises = selectedData.exercises.map((ex: any, index: number) => ({
            id: `ai-exercise-${Date.now()}-${index}-${Math.random()}-${session.id}`,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
            muscleGroup: selectedData.muscleGroup,
            equipment: [],
            assignedWeight: t.coach.yourAbility,
          }));
          return {
            ...session,
            exercises: [...session.exercises, ...newExercises],
          };
        }
        return session;
      });

      void updateWeekPlan({
        ...currentWeekPlan,
        sessions: updatedSessions,
      });
      savedToPlan = true;
    }

    const getDaysText = (count: number) => {
      if (count === 1) return t.coach.oneDay;
      if (count === 7) return t.coach.allDays;
      return t.coach.nDays.replace('{count}', String(count));
    };

    if (savedToFavorites && savedToPlan) {
      const daysText = getDaysText(selectedWorkoutDays.length);
      Alert.alert(t.coach.saved, t.coach.exercisesAddedToBoth.replace('{count}', String(exercisesWithIds.length)).replace('{days}', daysText));
    } else if (savedToFavorites) {
      Alert.alert(t.coach.saved, t.coach.exercisesAddedToFavorites.replace('{count}', String(exercisesWithIds.length)));
    } else if (savedToPlan) {
      const daysText = getDaysText(selectedWorkoutDays.length);
      Alert.alert(t.coach.saved, t.coach.exercisesAddedToDays.replace('{count}', String(exercisesWithIds.length)).replace('{days}', daysText));
    }

    setShowSaveModal(false);
    setLastSuggestedWorkout(null);
    setSelectedWorkoutDays([]);
    setSaveWorkoutToFavorites(false);
  };

  const handleSaveMeal = () => {
    if (!selectedData) return;

    let savedToFavorites = false;
    let savedToPlan = false;

    const mealToAdd = {
      id: `ai-meal-${Date.now()}`,
      name: selectedData.mealName,
      nameAr: selectedData.mealName,
      type: selectedData.mealType,
      calories: selectedData.calories,
      protein: selectedData.protein,
      carbs: Math.round(selectedData.calories * 0.4 / 4),
      fats: Math.round(selectedData.calories * 0.3 / 9),
      ingredients: selectedData.ingredients,
      ingredientsAr: selectedData.ingredients,
    };

    if (saveToFavorites) {
      void addFavoriteMeal({
        name: selectedData.mealName,
        nameAr: selectedData.mealName,
        type: selectedData.mealType,
        calories: selectedData.calories,
        protein: selectedData.protein,
        carbs: Math.round(selectedData.calories * 0.4 / 4),
        fats: Math.round(selectedData.calories * 0.3 / 9),
        ingredients: selectedData.ingredients,
        ingredientsAr: selectedData.ingredients,
      });
      savedToFavorites = true;
    }

    if (currentMealPlan && selectedDays.length > 0 && selectedMealType) {
      selectedDays.forEach(dayId => {
        void addMealToDay(dayId, mealToAdd, selectedMealType);
      });
      savedToPlan = true;
    }

    const mealTypeNames: Record<string, string> = {
      breakfast: t.coach.breakfastType,
      lunch: t.coach.lunchType,
      dinner: t.coach.dinnerType,
      snack: t.coach.snackType,
    };
    const getMealDaysText = (count: number) => {
      if (count === 1) return t.coach.oneDay;
      if (count === 7) return t.coach.allDays;
      return t.coach.nDays.replace('{count}', String(count));
    };

    if (savedToFavorites && savedToPlan) {
      const daysText = getMealDaysText(selectedDays.length);
      Alert.alert(t.coach.saved, t.coach.mealAddedToBoth.replace('{name}', selectedData.mealName).replace('{type}', mealTypeNames[selectedMealType!]).replace('{days}', daysText));
    } else if (savedToFavorites) {
      Alert.alert(t.coach.saved, t.coach.mealAddedToFavorites.replace('{name}', selectedData.mealName));
    } else if (savedToPlan) {
      const daysText = getMealDaysText(selectedDays.length);
      Alert.alert(t.coach.saved, t.coach.mealAddedToDays.replace('{name}', selectedData.mealName).replace('{type}', mealTypeNames[selectedMealType!]).replace('{days}', daysText));
    }

    setShowSaveModal(false);
    setLastSuggestedMeal(null);
    setSelectedMealType(null);
    setSelectedDays([]);
    setSaveToFavorites(false);
  };

  const URL_REGEX = /(https?:\/\/[^\s)]+)/g;

  const renderMessageContent = useCallback((content: string) => {
    if (!content) return null;

    const parts = content.split(URL_REGEX);
    if (parts.length === 1) {
      return (
        <Text style={styles.assistantMessageText}>{content}</Text>
      );
    }

    return (
      <View style={styles.assistantMessageText}>
        {parts.map((part, index) => {
          if (URL_REGEX.test(part)) {
            URL_REGEX.lastIndex = 0;
            return (
              <TouchableOpacity
                key={`link-${index}`}
                onPress={() => Linking.openURL(part)}
                style={styles.linkContainer}
                activeOpacity={0.7}
              >
                <ExternalLink size={14} color={Colors.primary} />
                <Text style={styles.linkText} numberOfLines={1}>
                  {decodeURIComponent(part.replace(/https?:\/\/(?:www\.)?/, '').split('?')[0]).substring(0, 40)}
                </Text>
              </TouchableOpacity>
            );
          }
          URL_REGEX.lastIndex = 0;
          return <Text key={`text-${index}`} style={styles.assistantMessageTextInner}>{part}</Text>;
        })}
      </View>
    );
  }, []);

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
        <TouchableOpacity 
          style={[styles.quickActionButton, isGenerating && styles.quickActionButtonDisabled]}
          onPress={() => handleQuickAction(t.coach.quickWorkout)}
          disabled={isGenerating}
        >
          <Text style={styles.quickActionText}>{t.coach.todayWorkout}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickActionButton, isGenerating && styles.quickActionButtonDisabled]}
          onPress={() => handleQuickAction(t.coach.quickMeal)}
          disabled={isGenerating}
        >
          <Text style={styles.quickActionText}>{t.coach.todayMeal}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickActionButton, isGenerating && styles.quickActionButtonDisabled]}
          onPress={() => handleQuickAction(t.coach.quickProgress)}
          disabled={isGenerating}
        >
          <Text style={styles.quickActionText}>{t.coach.analyzeProgress}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickActionButton, isGenerating && styles.quickActionButtonDisabled]}
          onPress={() => handleQuickAction(t.coach.quickTips)}
          disabled={isGenerating}
        >
          <Text style={styles.quickActionText}>{t.coach.tips}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Sparkles size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.title}>{t.coach.title}</Text>
              <Text style={styles.subtitle}>{t.coach.subtitle}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{getCurrentStreak()}</Text>
              <Text style={styles.miniStatLabel}>{t.coach.dayUnit}</Text>
            </View>
          </View>
        </View>
        
        {messages.length === 0 && (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIcon}>
              <Bot size={48} color={Colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>{profile?.gender === 'male' ? t.coach.welcomeHero : t.coach.welcomeHeroine}</Text>
            <Text style={styles.welcomeText}>
              {t.coach.welcomeText}
            </Text>
            <View style={styles.welcomeFeatures}>
              <Text style={styles.welcomeFeature}>{t.coach.feature1}</Text>
              <Text style={styles.welcomeFeature}>{t.coach.feature2}</Text>
              <Text style={styles.welcomeFeature}>{t.coach.feature3}</Text>
              <Text style={styles.welcomeFeature}>{t.coach.feature4}</Text>
            </View>
            <Text style={styles.welcomePrompt}>{t.coach.tryButtons}</Text>
          </View>
          </TouchableWithoutFeedback>
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {messages.map((message, msgIndex) => (
            <View key={message.id || `msg-${msgIndex}`} style={styles.messageWrapper}>
              {message.role === "user" ? (
                <View style={styles.userMessage}>
                  <Text style={styles.userMessageText}>{message.content}</Text>
                  <View style={styles.userAvatar}>
                    <User size={16} color={Colors.background} />
                  </View>
                </View>
              ) : (
                <View style={styles.assistantMessage}>
                  <View style={styles.assistantAvatar}>
                    <Bot size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.assistantMessageContent}>
                    {message.toolResults && message.toolResults.length > 0 && (
                      <View style={styles.toolSuccess}>
                        {message.toolResults.map((result, i) => (
                          <Text key={`tool-${i}`} style={styles.toolSuccessText}>{result}</Text>
                        ))}
                      </View>
                    )}
                    <View>
                      {renderMessageContent(message.content)}
                    </View>
                    {message.toolCalls && message.toolCalls.length > 0 && (() => {
                      const workoutCall = message.toolCalls.find(tc => tc.name === 'suggestWorkout');
                      const mealCall = message.toolCalls.find(tc => tc.name === 'suggestMeal');
                      
                      if (workoutCall || mealCall) {
                        return (
                          <TouchableOpacity 
                            style={styles.inlineSaveButton}
                            onPress={() => {
                              if (workoutCall) {
                                openSaveModal('workout', workoutCall.arguments);
                              } else if (mealCall) {
                                openSaveModal('meal', mealCall.arguments);
                              }
                            }}
                          >
                            <Save size={16} color={Colors.primary} />
                            <Text style={styles.inlineSaveButtonText}>{t.coach.save}</Text>
                          </TouchableOpacity>
                        );
                      }
                      return null;
                    })()
                  </View>
                </View>
              )}
            </View>
          ))}
          
          {isGenerating && (
            <View style={styles.messageWrapper}>
              <View style={styles.assistantMessage}>
                <View style={styles.assistantAvatar}>
                  <Bot size={16} color={Colors.primary} />
                </View>
                <View style={styles.toolMessage}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.toolMessageText}>{t.coach.preparing}</Text>
                </View>
              </View>
            </View>
          )}
          
          {error && !isGenerating && (
            <View style={styles.errorMessage}>
              <Text style={styles.errorText}>{t.coach.errorOccurred}</Text>
            </View>
          )}
        </ScrollView>

        {renderQuickActions()}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isGenerating && styles.inputDisabled]}
            placeholder={t.coach.askCoach}
            placeholderTextColor={Colors.textLight}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!isGenerating}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!input.trim() || isGenerating) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Send size={20} color={Colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {saveModalType === "workout" ? t.coach.saveWorkout : t.coach.saveMeal}
            </Text>
            
            {saveModalType === "workout" ? (
              <ScrollView>
                <View style={styles.modalSection}>
                  <TouchableOpacity
                    style={[styles.checkboxOption, saveWorkoutToFavorites && styles.checkboxOptionSelected]}
                    onPress={() => setSaveWorkoutToFavorites(!saveWorkoutToFavorites)}
                  >
                    <View style={[styles.checkbox, saveWorkoutToFavorites && styles.checkboxChecked]}>
                      {saveWorkoutToFavorites && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{t.coach.saveToFavorites}</Text>
                  </TouchableOpacity>
                  
                  {currentWeekPlan && (
                    <View style={{ marginTop: 16 }}>
                      <View style={styles.daysSelectionHeader}>
                        <Text style={styles.modalSectionTitle}>{t.coach.addToPlan}:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (selectedWorkoutDays.length === (currentWeekPlan.sessions ?? []).length) {
                              setSelectedWorkoutDays([]);
                            } else {
                              setSelectedWorkoutDays((currentWeekPlan.sessions ?? []).map(s => s.id));
                            }
                          }}
                        >
                          <Text style={styles.selectAllButton}>
                            {selectedWorkoutDays.length === (currentWeekPlan.sessions ?? []).length ? t.common.deselectAll : t.common.selectAll}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.compactRowWrap}>
                        {(currentWeekPlan.sessions ?? []).map((session) => (
                          <TouchableOpacity
                            key={session.id}
                            style={[
                              styles.compactButton,
                              selectedWorkoutDays.includes(session.id) && styles.compactButtonSelected
                            ]}
                            onPress={() => {
                              if (selectedWorkoutDays.includes(session.id)) {
                                setSelectedWorkoutDays(selectedWorkoutDays.filter(id => id !== session.id));
                              } else {
                                setSelectedWorkoutDays([...selectedWorkoutDays, session.id]);
                              }
                            }}
                          >
                            <Text style={[
                              styles.compactButtonText,
                              selectedWorkoutDays.includes(session.id) && styles.compactButtonTextSelected
                            ]}>{session.day}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : (
              <ScrollView>
                <View style={styles.modalSection}>
                  <TouchableOpacity
                    style={[styles.checkboxOption, saveToFavorites && styles.checkboxOptionSelected]}
                    onPress={() => setSaveToFavorites(!saveToFavorites)}
                  >
                    <View style={[styles.checkbox, saveToFavorites && styles.checkboxChecked]}>
                      {saveToFavorites && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{t.coach.saveToFavorites}</Text>
                  </TouchableOpacity>
                  
                  {currentMealPlan && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={styles.modalSectionTitle}>{t.coach.addToPlanLabel}</Text>
                      
                      <Text style={styles.compactLabel}>{t.coach.typeLabel}</Text>
                      <View style={styles.compactRow}>
                        <TouchableOpacity
                          style={[
                            styles.compactButton,
                            selectedMealType === "breakfast" && styles.compactButtonSelected
                          ]}
                          onPress={() => setSelectedMealType("breakfast")}
                        >
                          <Text style={[
                            styles.compactButtonText,
                            selectedMealType === "breakfast" && styles.compactButtonTextSelected
                          ]}>{t.coach.breakfastType}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.compactButton,
                            selectedMealType === "lunch" && styles.compactButtonSelected
                          ]}
                          onPress={() => setSelectedMealType("lunch")}
                        >
                          <Text style={[
                            styles.compactButtonText,
                            selectedMealType === "lunch" && styles.compactButtonTextSelected
                          ]}>{t.coach.lunchType}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.compactButton,
                            selectedMealType === "dinner" && styles.compactButtonSelected
                          ]}
                          onPress={() => setSelectedMealType("dinner")}
                        >
                          <Text style={[
                            styles.compactButtonText,
                            selectedMealType === "dinner" && styles.compactButtonTextSelected
                          ]}>{t.coach.dinnerType}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.compactButton,
                            selectedMealType === "snack" && styles.compactButtonSelected
                          ]}
                          onPress={() => setSelectedMealType("snack")}
                        >
                          <Text style={[
                            styles.compactButtonText,
                            selectedMealType === "snack" && styles.compactButtonTextSelected
                          ]}>{t.coach.snackType}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.daysSelectionHeader}>
                        <Text style={styles.compactLabel}>{t.coach.daysLabel}</Text>
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
                              styles.compactButton,
                              selectedDays.includes(day.id) && styles.compactButtonSelected
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
                              styles.compactButtonText,
                              selectedDays.includes(day.id) && styles.compactButtonTextSelected
                            ]}>{day.day}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveToFavorites(false);
                  setSaveWorkoutToFavorites(false);
                  setSelectedMealType(null);
                  setSelectedDays([]);
                  setSelectedWorkoutDays([]);
                }}
              >
                <Text style={styles.modalCancelButtonText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  saveModalType === "workout" 
                    ? (!saveWorkoutToFavorites && selectedWorkoutDays.length === 0) && styles.modalConfirmButtonDisabled
                    : (!saveToFavorites && (!selectedMealType || selectedDays.length === 0)) && styles.modalConfirmButtonDisabled
                ]}
                onPress={saveModalType === "workout" ? handleSaveWorkout : handleSaveMeal}
                disabled={
                  saveModalType === "workout" 
                    ? (!saveWorkoutToFavorites && selectedWorkoutDays.length === 0)
                    : (!saveToFavorites && (!selectedMealType || selectedDays.length === 0))
                }
              >
                <Text style={styles.modalConfirmButtonText}>{t.coach.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  miniStat: {
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  miniStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  welcomeContainer: {
    padding: 24,
    alignItems: "center",
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  welcomeFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  welcomeFeature: {
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
  },
  welcomePrompt: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: "center",
    fontStyle: "italic" as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  userMessage: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: 8,
  },
  userMessageText: {
    backgroundColor: Colors.primary,
    color: Colors.background,
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    fontSize: 15,
    maxWidth: "80%",
    lineHeight: 20,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  assistantMessage: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assistantMessageContent: {
    flex: 1,
    gap: 8,
  },
  assistantMessageText: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    fontSize: 15,
    maxWidth: "90%",
    lineHeight: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assistantMessageTextInner: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  linkText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
    flex: 1,
  },
  toolMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolMessageText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toolSuccess: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  toolSuccessText: {
    fontSize: 13,
    color: Colors.success,
  },
  errorMessage: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: "center",
  },
  quickActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  quickActionsScroll: {
    padding: 12,
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  inlineSaveButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  inlineSaveButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  dayButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayButtonText: {
    fontSize: 13,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  mealTypeButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTypeButtonText: {
    fontSize: 13,
    color: Colors.text,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  compactRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  compactRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  compactButton: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compactButtonText: {
    fontSize: 12,
    color: Colors.text,
  },
  compactButtonTextSelected: {
    color: Colors.background,
    fontWeight: "600" as const,
  },
  addToPlanButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  addToPlanButtonDisabled: {
    opacity: 0.4,
  },
  addToPlanButtonText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  daysSelectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  selectAllButton: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "bold" as const,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.4,
  },
});
