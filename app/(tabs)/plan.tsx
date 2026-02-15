import { Calendar, CheckCircle2, Circle, Clock, Dumbbell, X, Edit2, ChevronDown, ChevronUp, Star, Plus, Trash2, RefreshCw } from "lucide-react-native";
import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useFitness } from "@/providers/FitnessProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { WorkoutSession } from "@/types/fitness";
import { exerciseDatabase, workoutTemplates } from "@/data/exercises";

export default function PlanScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { profile, currentWeekPlan, updateWeekPlan, toggleExerciseCompletion, toggleSessionCompletion, updateExercise, favoriteExercises, removeFavoriteExercise } = useFitness();
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [editingExercise, setEditingExercise] = useState<{ sessionId: string; exercise: any } | null>(null);
  const [editForm, setEditForm] = useState<{ sets: string; reps: string; rest: string; weight: string }>({ sets: "", reps: "", rest: "", weight: "" });
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [selectedFavoriteSession, setSelectedFavoriteSession] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<string | null>(null);
  const [showEditOptions, setShowEditOptions] = useState<string | null>(null);
  const hasInitializedExpanded = useRef<boolean>(false);

  const generateWeeklyPlan = useCallback(() => {
    if (!profile) return;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay());

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const selectWorkoutTemplate = () => {
      if (profile.activityLevel === "none") {
        return workoutTemplates.fullBody;
      }

      if (profile.availableDays >= 2 && profile.availableDays <= 3) {
        return workoutTemplates.fullBody;
      }

      if (profile.availableDays === 4) {
        return workoutTemplates.upperLower;
      }

      if (profile.availableDays >= 5 && profile.availableDays <= 6) {
        if (profile.fitnessLevel === "advanced" && profile.activityLevel === "high") {
          return workoutTemplates.pushPullLegs;
        }
        return workoutTemplates.upperLower;
      }

      if (profile.availableDays === 7) {
        if (profile.fitnessLevel === "advanced" && profile.activityLevel === "high") {
          return workoutTemplates.pushPullLegs;
        }
        return workoutTemplates.upperLower;
      }

      return workoutTemplates.fullBody;
    };

    const template = selectWorkoutTemplate();

    const updateVideoUrl = (exercise: typeof exerciseDatabase[string][number]) => {
      const ex = { ...exercise };
      if (profile.trainingLocation === "home" || profile.trainingLocation === "minimal_equipment") {
        const videoMapping: Record<string, string> = {
          "pushups": "https://www.youtube.com/watch?v=IODxDxX7oi4",
          "wide-pushups": "https://www.youtube.com/watch?v=KYIPC75rSQg",
          "diamond-pushups": "https://www.youtube.com/watch?v=J0DnG1_S92I",
          "decline-pushups": "https://www.youtube.com/watch?v=SKPab2YC8BE",
          "bodyweight-squats": "https://www.youtube.com/watch?v=aclHkVaku9U",
          "bulgarian-split-squat": "https://www.youtube.com/watch?v=2C-uNgKwPLE",
          "jump-squats": "https://www.youtube.com/watch?v=A-cFYWvaHr0",
          "wall-sit": "https://www.youtube.com/watch?v=y-wV4Venusw",
          "glute-bridges": "https://www.youtube.com/watch?v=wPM8icPu6H8",
          "single-leg-deadlift": "https://www.youtube.com/watch?v=Zfr6wizR8rs",
          "pullups": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
          "chin-ups": "https://www.youtube.com/watch?v=brhWuCQ17FI",
          "inverted-rows": "https://www.youtube.com/watch?v=hXTc1mDnZCw",
          "superman": "https://www.youtube.com/watch?v=cc6UVRS7PW4",
          "reverse-snow-angels": "https://www.youtube.com/watch?v=4Z3BM3JnZuo",
          "pike-pushups": "https://www.youtube.com/watch?v=x4YNjHHyqn8",
          "handstand-pushups": "https://www.youtube.com/watch?v=tQhrk6WMcKw",
          "bench-dips": "https://www.youtube.com/watch?v=0326dy_-CzM",
          "close-grip-pushups": "https://www.youtube.com/watch?v=bTsCz0kCNJI",
          "dumbbell-rows": "https://www.youtube.com/watch?v=pYcpY20QaE8",
          "goblet-squats": "https://www.youtube.com/watch?v=MeIiIdhvXT4",
          "lunges": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
          "dumbbell-press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
          "lateral-raises": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
          "bicep-curls": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
          "tricep-dips": "https://www.youtube.com/watch?v=2z8JmcrW-As",
        };
        if (videoMapping[ex.id]) {
          ex.videoUrl = videoMapping[ex.id];
        }
      }
      return ex;
    };

    const filterExercisesByLocation = (exercises: typeof exerciseDatabase[string]) => {
      if (profile.trainingLocation === "home") {
        return exercises.filter((ex) => ex.equipment.length === 0);
      } else if (profile.trainingLocation === "minimal_equipment") {
        return exercises.filter((ex) => {
          const allowedEquipment = ["dumbbells", "resistance-bands", "pullup-bar"];
          return ex.equipment.length === 0 || ex.equipment.every(eq => allowedEquipment.includes(eq));
        });
      }
      return exercises;
    };

    const filterExercisesByInjuries = (exercises: typeof exerciseDatabase[string]) => {
      if (!profile.injuries) return exercises;
      
      const injuries = profile.injuries.toLowerCase();
      return exercises.filter((ex) => {
        if (injuries.includes("knee") && (ex.id.includes("squat") || ex.id.includes("lunge"))) {
          return false;
        }
        if (injuries.includes("back") && (ex.id.includes("deadlift") || ex.id.includes("row"))) {
          return false;
        }
        if (injuries.includes("shoulder") && (ex.id.includes("press") || ex.id.includes("raise"))) {
          return false;
        }
        return true;
      });
    };

    const adjustExerciseByGoal = (exercise: typeof exerciseDatabase[string][number]) => {
      const adjusted = { ...exercise };
      
      switch (profile.goal) {
        case "fat_loss":
          adjusted.sets = Math.min(exercise.sets + 1, 5);
          adjusted.reps = exercise.reps.includes("-") 
            ? `${parseInt(exercise.reps.split("-")[0]) + 2}-${parseInt(exercise.reps.split("-")[1]) + 5}`
            : exercise.reps;
          adjusted.rest = Math.max(exercise.rest - 15, 45);
          break;
        case "muscle_gain":
          adjusted.sets = exercise.sets;
          adjusted.reps = exercise.reps.includes("-")
            ? `${Math.max(parseInt(exercise.reps.split("-")[0]) - 2, 6)}-${Math.max(parseInt(exercise.reps.split("-")[1]) - 2, 8)}`
            : exercise.reps;
          adjusted.rest = exercise.rest + 15;
          break;
        case "general_fitness":
          adjusted.sets = exercise.sets;
          adjusted.reps = exercise.reps;
          adjusted.rest = exercise.rest;
          break;
      }
      
      if (adjusted.recommendedWeight) {
        const genderWeights = adjusted.recommendedWeight[profile.gender];
        adjusted.assignedWeight = genderWeights[profile.fitnessLevel];
      }
      
      return adjusted;
    };

    const daysOfWeek = [
      t.days.Monday,
      t.days.Tuesday,
      t.days.Wednesday,
      t.days.Thursday,
      t.days.Friday,
      t.days.Saturday,
      t.days.Sunday,
    ];
    const shouldAddRestNote = (dayIndex: number, totalDays: number, fitnessLevel: string, goal: string, activityLevel: string) => {
      if (activityLevel === "high") return null;
      
      if (fitnessLevel === "beginner" && totalDays >= 6) {
        if (dayIndex === 2 || dayIndex === 5) return "⚠️ يُنصح بأخذ استراحة اليوم - الجسم يحتاج للتعافي";
      }
      if (activityLevel === "none" && totalDays >= 5) {
        if (dayIndex % 2 === 0 && dayIndex > 0) return "💡 يمكنك أخذ استراحة اليوم وتركيز الأيام الأخرى";
      }
      if (goal === "fat_loss" && totalDays === 7 && fitnessLevel === "beginner") {
        if (dayIndex === 3) return "🔥 استراحة نشطة: مشي خفيف أو يوجا";
      }
      return null;
    };

    const generateWarmupExercises = () => [
      {
        id: "warmup-cardio",
        name: "General Warm-Up",
        sets: 1,
        reps: "5 min",
        rest: 0,
        muscleGroup: "Warm-up",
        equipment: [],
        description: "مشي خفيف أو قفز بالحبل أو تمارين هوائية خفيفة",
        assignedWeight: "Body weight",
        videoUrl: "https://youtu.be/-p0PA9Zt8zk?si=T8-h3y9EEMzK58a8"
      },
      {
        id: "warmup-mobility",
        name: "Dynamic Mobility",
        sets: 1,
        reps: "5 min",
        rest: 0,
        muscleGroup: "Warm-up",
        equipment: [],
        description: "Hip openers, Arm circles, Leg swings",
        assignedWeight: "Body weight",
        videoUrl: "https://www.youtube.com/watch?v=_kGESn8ArrU"
      }
    ];

    const generateCooldownExercises = () => [
      {
        id: "cooldown-stretch",
        name: "Static Stretching",
        sets: 1,
        reps: "5 min",
        rest: 0,
        muscleGroup: "Cool-down",
        equipment: [],
        description: "تمدد ثابت لجميع العضلات المستخدمة",
        assignedWeight: "Body weight",
        videoUrl: "https://www.youtube.com/watch?v=g_tea8ZNk5A"
      },
      {
        id: "cooldown-breathing",
        name: "Breathing & Recovery",
        sets: 1,
        reps: "3 min",
        rest: 0,
        muscleGroup: "Cool-down",
        equipment: [],
        description: "تنفس عميق وتمارين استرخاء",
        assignedWeight: "Body weight",
        videoUrl: "https://youtu.be/lEzaFx8k7Ew?si=VsFBnd5yvdB84mic"
      }
    ];

    const templateCycle = [];
    for (let i = 0; i < profile.availableDays; i++) {
      templateCycle.push(template[i % template.length]);
    }

    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const sessions: WorkoutSession[] = templateCycle.map((workout, index) => {
      const warmupExercises = generateWarmupExercises();
      const cooldownExercises = generateCooldownExercises();
      
      const mainExercises = workout.muscleGroups.flatMap((group: string) => {
        let groupExercises = exerciseDatabase[group] || [];
        
        groupExercises = filterExercisesByLocation(groupExercises);
        groupExercises = filterExercisesByInjuries(groupExercises);
        
        if (groupExercises.length === 0) {
          console.warn(`No exercises found for ${group} with current filters`);
          return [];
        }
        
        const exerciseCount = profile.fitnessLevel === "beginner" ? 2 : 
                             profile.fitnessLevel === "intermediate" ? 3 : 4;
        
        const shuffledExercises = shuffleArray(groupExercises);
        const selectedExercises = shuffledExercises.slice(0, Math.min(exerciseCount, shuffledExercises.length));
        
        return selectedExercises.map(ex => adjustExerciseByGoal(updateVideoUrl(ex)));
      });

      const allExercises = [...warmupExercises, ...mainExercises, ...cooldownExercises];
      const restNote = shouldAddRestNote(index, profile.availableDays, profile.fitnessLevel, profile.goal, profile.activityLevel);

      return {
        id: `session-${index}`,
        day: daysOfWeek[index],
        name: workout.name,
        exercises: allExercises,
        duration: profile.sessionDuration,
        completed: false,
        restNote: restNote || undefined,
      };
    });

    updateWeekPlan({
      weekNumber: 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessions,
    });
  }, [profile, updateWeekPlan, t.days]);

  useEffect(() => {
    if (profile && !currentWeekPlan) {
      generateWeeklyPlan();
    }
  }, [profile, currentWeekPlan, generateWeeklyPlan]);

  useEffect(() => {
    if (currentWeekPlan && !hasInitializedExpanded.current) {
      const allSessionIds = new Set(currentWeekPlan.sessions.map(s => s.id));
      setExpandedSessions(allSessionIds);
      hasInitializedExpanded.current = true;
    }
  }, [currentWeekPlan]);

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  if (!currentWeekPlan) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Dumbbell size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>{t.plan.generatingPlan}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedSessions = currentWeekPlan.sessions.filter((s) => s.completed).length;
  const totalSessions = currentWeekPlan.sessions.length;
  const progressPercentage = (completedSessions / totalSessions) * 100;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>{t.plan.title}</Text>
              <Text style={styles.subtitle}>{t.plan.weekNumber} {currentWeekPlan.weekNumber}</Text>
            </View>
            <TouchableOpacity style={styles.calendarButton} onPress={() => setShowCalendar(true)}>
              <Calendar size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{t.plan.weekProgress}</Text>
              <Text style={styles.progressValue}>
                {completedSessions}/{totalSessions}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {totalSessions - completedSessions} {t.plan.workoutsRemaining}
            </Text>
          </View>
        </View>

        {favoriteExercises.length > 0 && (
          <View style={styles.favoritesCard}>
            <View style={styles.favoritesHeader}>
              <View style={styles.favoritesHeaderLeft}>
                <Star size={20} color={Colors.primary} />
                <Text style={styles.favoritesTitle}>{t.plan.favoriteExercises}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFavorites(!showFavorites)}>
                {showFavorites ? (
                  <ChevronUp size={20} color={Colors.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            
            {showFavorites && (
              <View style={styles.favoritesContent}>
                {favoriteExercises.map((exercise) => (
                  <View key={exercise.id} style={styles.favoriteExerciseRow}>
                    <View style={styles.favoriteExerciseInfo}>
                      <Text style={styles.favoriteExerciseName}>{exercise.name}</Text>
                      <Text style={styles.favoriteExerciseDetails}>
                        {exercise.sets} sets × {exercise.reps} reps · {exercise.rest}s rest
                      </Text>
                    </View>
                    <View style={styles.favoriteExerciseActions}>
                      <TouchableOpacity
                        style={styles.addToSessionButton}
                        onPress={() => {
                          if (currentWeekPlan && currentWeekPlan.sessions.length > 0) {
                            setSelectedFavoriteSession(exercise.id);
                          }
                        }}
                      >
                        <Plus size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeFavoriteButton}
                        onPress={() => removeFavoriteExercise(exercise.id)}
                      >
                        <X size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.sessionsContainer}>
          {currentWeekPlan.sessions.map((session) => {
            const isExpanded = expandedSessions.has(session.id);
            return (
            <View key={session.id} style={styles.sessionCard}>
              <TouchableOpacity onPress={() => toggleSessionExpanded(session.id)}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionHeaderLeft}>
                    <TouchableOpacity onPress={(e) => {
                      e.stopPropagation();
                      toggleSessionCompletion(session.id);
                    }}>
                      {session.completed ? (
                        <CheckCircle2 size={24} color={Colors.success} />
                      ) : (
                        <Circle size={24} color={Colors.textLight} />
                      )}
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.sessionDay}>{session.day}</Text>
                      <Text style={styles.sessionName}>{session.name}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionHeaderRight}>
                    <View style={styles.durationBadge}>
                      <Clock size={14} color={Colors.textSecondary} />
                      <Text style={styles.durationText}>{session.duration}min</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={Colors.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.textSecondary} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  {session.restNote && (
                    <View style={styles.restNoteContainer}>
                      <Text style={styles.restNoteText}>{session.restNote}</Text>
                    </View>
                  )}

                  <View style={styles.exercisesContainer}>
                {session.exercises.map((exercise, index) => {
                  const isExerciseCompleted = session.completedExercises?.includes(exercise.id) || false;
                  const isWarmupOrCooldown = exercise.muscleGroup === "Warm-up" || exercise.muscleGroup === "Cool-down";
                  return (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <TouchableOpacity onPress={() => toggleExerciseCompletion(session.id, exercise.id)}>
                        {isExerciseCompleted ? (
                          <CheckCircle2 size={20} color={Colors.success} />
                        ) : (
                          <Circle size={20} color={Colors.textLight} />
                        )}
                      </TouchableOpacity>
                      <View style={styles.exerciseInfo}>
                        <View style={styles.exerciseNameRow}>
                          <Text style={[styles.exerciseName, isExerciseCompleted && styles.exerciseCompleted]}>{exercise.name}</Text>
                          {showEditOptions === session.id && (
                            <View style={styles.exerciseActions}>
                              <TouchableOpacity 
                                onPress={() => {
                                  setEditingExercise({ sessionId: session.id, exercise });
                                  const weight = exercise.assignedWeight && exercise.assignedWeight.toLowerCase().includes('body')
                                    ? "-"
                                    : exercise.assignedWeight 
                                    ? exercise.assignedWeight 
                                    : (exercise.equipment.length === 0 ? "-" : "");
                                  setEditForm({
                                    sets: exercise.sets.toString(),
                                    reps: exercise.reps,
                                    rest: exercise.rest.toString(),
                                    weight: weight
                                  });
                                }}
                                style={styles.editButton}
                              >
                                <Edit2 size={16} color={Colors.primary} />
                              </TouchableOpacity>
                              {!isWarmupOrCooldown && (
                                <TouchableOpacity 
                                  onPress={() => {
                                    if (currentWeekPlan) {
                                      const updatedSessions = currentWeekPlan.sessions.map((s) => {
                                        if (s.id === session.id) {
                                          return {
                                            ...s,
                                            exercises: s.exercises.filter((e) => e.id !== exercise.id),
                                          };
                                        }
                                        return s;
                                      });
                                      updateWeekPlan({
                                        ...currentWeekPlan,
                                        sessions: updatedSessions,
                                      });
                                    }
                                  }}
                                  style={styles.deleteButton}
                                >
                                  <Trash2 size={16} color={Colors.danger} />
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets} sets × {exercise.reps} reps · {exercise.rest}s rest · {exercise.assignedWeight && exercise.assignedWeight.toLowerCase().includes('body') ? "-" : exercise.assignedWeight ? exercise.assignedWeight : (exercise.equipment.length === 0 ? "-" : "N/A")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {showEditOptions === session.id && (
                <View style={styles.editOptionsContainer}>
                  <TouchableOpacity
                    style={styles.inlineEditOptionButton}
                    onPress={() => {
                      setShowAddExercise(session.id);
                    }}
                  >
                    <Plus size={20} color={Colors.primary} />
                    <View style={styles.inlineEditOptionTextContainer}>
                      <Text style={styles.inlineEditOptionTitle}>{t.plan.addExercise}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inlineEditOptionButton}
                    onPress={() => {
                      setShowRegenerateConfirm(session.id);
                    }}
                  >
                    <RefreshCw size={20} color={Colors.primary} />
                    <View style={styles.inlineEditOptionTextContainer}>
                      <Text style={styles.inlineEditOptionTitle}>{t.plan.regenerateSession}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={styles.editSessionButton}
                onPress={() => {
                  if (showEditOptions === session.id) {
                    setShowEditOptions(null);
                  } else {
                    setShowEditOptions(session.id);
                  }
                }}
              >
                <Edit2 size={18} color={Colors.primary} />
                <Text style={styles.editSessionButtonText}>
                  {showEditOptions === session.id ? t.plan.hideEdits : t.plan.editSession}
                </Text>
              </TouchableOpacity>

              {!session.completed && (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => {
                    if (!isAuthenticated) {
                      router.push("/auth/login" as any);
                    } else {
                      router.push(`/workout-details?sessionId=${session.id}` as any);
                    }
                  }}
                >
                  <Dumbbell size={18} color={Colors.background} />
                  <Text style={styles.startButtonText}>{isAuthenticated ? t.plan.startWorkout : t.plan.loginToStart}</Text>
                </TouchableOpacity>
              )}
                </>
              )}
            </View>
            );
          })}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>{t.plan.trainingTips}</Text>
          <Text style={styles.tipsText}>
            {t.plan.tip1}{"\n"}
            {t.plan.tip2}{"\n"}
            {t.plan.tip3}{"\n"}
            {t.plan.tip4}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.plan.weekCalendar}</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarGrid}>
              {currentWeekPlan.sessions.map((session) => {
                const completedCount = session.completedExercises?.length || 0;
                const totalCount = session.exercises.length;
                const progress = (completedCount / totalCount) * 100;
                
                return (
                  <View key={session.id} style={styles.calendarDay}>
                    <View style={styles.calendarDayHeader}>
                      <Text style={styles.calendarDayName}>{session.day.slice(0, 3)}</Text>
                      {session.completed && (
                        <CheckCircle2 size={16} color={Colors.success} />
                      )}
                    </View>
                    <Text style={styles.calendarWorkoutName}>{session.name}</Text>
                    <View style={styles.calendarProgressBar}>
                      <View style={[styles.calendarProgress, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.calendarProgressText}>
                      {completedCount}/{totalCount}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <View style={styles.calendarStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t.plan.weekNumber} {currentWeekPlan.weekNumber}</Text>
                <Text style={styles.statValue}>{completedSessions}/{totalSessions} {t.plan.completed}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editingExercise}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.plan.editExercise}</Text>
              <TouchableOpacity onPress={() => setEditingExercise(null)} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {editingExercise && (
              <View style={styles.editForm}>
                <Text style={styles.editExerciseName}>{editingExercise.exercise.name}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.plan.setsLabel}</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setEditForm(prev => ({ ...prev, sets: Math.max(1, parseInt(prev.sets || "0") - 1).toString() }))}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{editForm.sets}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setEditForm(prev => ({ ...prev, sets: (parseInt(prev.sets || "0") + 1).toString() }))}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.plan.repsLabel}</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => {
                        const current = parseInt(editForm.reps) || 1;
                        setEditForm(prev => ({ ...prev, reps: Math.max(1, current - 1).toString() }));
                      }}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{editForm.reps}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => {
                        const current = parseInt(editForm.reps) || 1;
                        setEditForm(prev => ({ ...prev, reps: (current + 1).toString() }));
                      }}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.plan.restLabel}</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setEditForm(prev => ({ ...prev, rest: Math.max(30, parseInt(prev.rest || "0") - 15).toString() }))}
                    >
                      <Text style={styles.counterButtonText}>-15</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{editForm.rest}s</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => setEditForm(prev => ({ ...prev, rest: (parseInt(prev.rest || "0") + 15).toString() }))}
                    >
                      <Text style={styles.counterButtonText}>+15</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.plan.weightLabel}</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => {
                        if (!editForm.weight || editForm.weight === "Body weight" || editForm.weight === "-") {
                          setEditForm(prev => ({ ...prev, weight: "-" }));
                          return;
                        }
                        const match = editForm.weight.match(/([0-9.]+)/);
                        if (match) {
                          const num = parseFloat(match[1]);
                          const newVal = Math.max(0, num - 2.5);
                          setEditForm(prev => ({ 
                            ...prev, 
                            weight: newVal === 0 ? "-" : `${newVal}kg` 
                          }));
                        }
                      }}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{editForm.weight === "Body weight" ? "-" : editForm.weight || "-"}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={() => {
                        if (!editForm.weight || editForm.weight === "Body weight" || editForm.weight === "-") {
                          setEditForm(prev => ({ ...prev, weight: "2.5kg" }));
                          return;
                        }
                        const match = editForm.weight.match(/([0-9.]+)/);
                        if (match) {
                          const num = parseFloat(match[1]);
                          setEditForm(prev => ({ ...prev, weight: `${num + 2.5}kg` }));
                        } else {
                          setEditForm(prev => ({ ...prev, weight: "2.5kg" }));
                        }
                      }}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => {
                    if (editingExercise) {
                      updateExercise(
                        editingExercise.sessionId,
                        editingExercise.exercise.id,
                        {
                          sets: parseInt(editForm.sets),
                          reps: editForm.reps,
                          rest: parseInt(editForm.rest),
                          assignedWeight: editForm.weight
                        }
                      );
                      setEditingExercise(null);
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>{t.plan.saveChanges}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedFavoriteSession}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedFavoriteSession(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.plan.addToSession}</Text>
              <TouchableOpacity onPress={() => setSelectedFavoriteSession(null)} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sessionSelectList}>
              {currentWeekPlan?.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionSelectButton}
                  onPress={() => {
                    const favoriteExercise = favoriteExercises.find(ex => ex.id === selectedFavoriteSession);
                    if (favoriteExercise && currentWeekPlan) {
                      const exerciseWithNewId = {
                        ...favoriteExercise,
                        id: `fav-${Date.now()}-${Math.random()}`,
                      };
                      
                      const updatedSessions = currentWeekPlan.sessions.map((s) => {
                        if (s.id === session.id) {
                          return {
                            ...s,
                            exercises: [...s.exercises, exerciseWithNewId],
                          };
                        }
                        return s;
                      });

                      updateWeekPlan({
                        ...currentWeekPlan,
                        sessions: updatedSessions,
                      });
                      
                      setSelectedFavoriteSession(null);
                    }
                  }}
                >
                  <Text style={styles.sessionSelectText}>{session.day} - {session.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>



      <Modal
        visible={!!showAddExercise}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.plan.addExercise}</Text>
              <TouchableOpacity onPress={() => setShowAddExercise(null)} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.addExerciseScroll}>
              {favoriteExercises.length > 0 && (
                <View style={styles.addExerciseSection}>
                  <Text style={styles.addExerciseSectionTitle}>{t.plan.fromFavorites}</Text>
                  {favoriteExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.addExerciseItem}
                      onPress={() => {
                        if (currentWeekPlan && showAddExercise) {
                          const exerciseWithNewId = {
                            ...exercise,
                            id: `fav-${Date.now()}-${Math.random()}`,
                          };
                          
                          const updatedSessions = currentWeekPlan.sessions.map((s) => {
                            if (s.id === showAddExercise) {
                              const mainExercises = s.exercises.filter(e => e.muscleGroup !== "Warm-up" && e.muscleGroup !== "Cool-down");
                              const warmupExercises = s.exercises.filter(e => e.muscleGroup === "Warm-up");
                              const cooldownExercises = s.exercises.filter(e => e.muscleGroup === "Cool-down");
                              
                              return {
                                ...s,
                                exercises: [...warmupExercises, ...mainExercises, exerciseWithNewId, ...cooldownExercises],
                              };
                            }
                            return s;
                          });

                          updateWeekPlan({
                            ...currentWeekPlan,
                            sessions: updatedSessions,
                          });
                          
                          setShowAddExercise(null);
                        }
                      }}
                    >
                      <View style={styles.addExerciseItemInfo}>
                        <Text style={styles.addExerciseItemName}>{exercise.name}</Text>
                        <Text style={styles.addExerciseItemDetails}>
                          {exercise.sets} sets × {exercise.reps} reps
                        </Text>
                      </View>
                      <Plus size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.addExerciseSection}>
                <Text style={styles.addExerciseSectionTitle}>{t.plan.fromDatabase}</Text>
                {Object.entries(exerciseDatabase).map(([muscleGroup, exercises]) => {
                  const session = currentWeekPlan?.sessions.find(s => s.id === showAddExercise);
                  if (!session) return null;
                  
                  let filteredExercises = exercises;
                  if (profile?.trainingLocation === "home") {
                    filteredExercises = exercises.filter((ex) => ex.equipment.length === 0);
                  } else if (profile?.trainingLocation === "minimal_equipment") {
                    filteredExercises = exercises.filter((ex) => {
                      const allowedEquipment = ["dumbbells", "resistance-bands", "pullup-bar"];
                      return ex.equipment.length === 0 || ex.equipment.every(eq => allowedEquipment.includes(eq));
                    });
                  }

                  if (filteredExercises.length === 0) return null;

                  return (
                    <View key={muscleGroup} style={styles.muscleGroupSection}>
                      <Text style={styles.muscleGroupTitle}>{muscleGroup}</Text>
                      {filteredExercises.slice(0, 5).map((exercise) => (
                        <TouchableOpacity
                          key={exercise.id}
                          style={styles.addExerciseItem}
                          onPress={() => {
                            if (currentWeekPlan && showAddExercise) {
                              const adjustedExercise = {
                                ...exercise,
                                id: `db-${Date.now()}-${Math.random()}`,
                              };
                              
                              const updatedSessions = currentWeekPlan.sessions.map((s) => {
                                if (s.id === showAddExercise) {
                                  const warmupExercises = s.exercises.filter(e => e.muscleGroup === "Warm-up");
                                  const cooldownExercises = s.exercises.filter(e => e.muscleGroup === "Cool-down");
                                  const mainExercises = s.exercises.filter(e => e.muscleGroup !== "Warm-up" && e.muscleGroup !== "Cool-down");
                                  
                                  return {
                                    ...s,
                                    exercises: [...warmupExercises, ...mainExercises, adjustedExercise, ...cooldownExercises],
                                  };
                                }
                                return s;
                              });

                              updateWeekPlan({
                                ...currentWeekPlan,
                                sessions: updatedSessions,
                              });
                              
                              setShowAddExercise(null);
                            }
                          }}
                        >
                          <View style={styles.addExerciseItemInfo}>
                            <Text style={styles.addExerciseItemName}>{exercise.name}</Text>
                            <Text style={styles.addExerciseItemDetails}>
                              {exercise.sets} sets × {exercise.reps} reps
                            </Text>
                          </View>
                          <Plus size={20} color={Colors.primary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!showRegenerateConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRegenerateConfirm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <RefreshCw size={48} color={Colors.primary} />
            <Text style={styles.confirmTitle}>{t.plan.regenerateConfirmTitle}</Text>
            <Text style={styles.confirmMessage}>
              {t.plan.regenerateConfirmMsg}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowRegenerateConfirm(null)}
              >
                <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  if (currentWeekPlan && showRegenerateConfirm) {
                    const session = currentWeekPlan.sessions.find(s => s.id === showRegenerateConfirm);
                    if (session) {
                      const warmupExercises = session.exercises.filter(e => e.muscleGroup === "Warm-up");
                      const cooldownExercises = session.exercises.filter(e => e.muscleGroup === "Cool-down");
                      
                      const mainMuscleGroups = Array.from(new Set(
                        session.exercises
                          .filter(e => e.muscleGroup !== "Warm-up" && e.muscleGroup !== "Cool-down")
                          .map(e => e.muscleGroup)
                      ));

                      const newMainExercises: typeof session.exercises = [];
                      mainMuscleGroups.forEach(muscleGroup => {
                        let groupExercises = exerciseDatabase[muscleGroup] || [];
                        
                        if (profile?.trainingLocation === "home") {
                          groupExercises = groupExercises.filter((ex) => ex.equipment.length === 0);
                        } else if (profile?.trainingLocation === "minimal_equipment") {
                          groupExercises = groupExercises.filter((ex) => {
                            const allowedEquipment = ["dumbbells", "resistance-bands", "pullup-bar"];
                            return ex.equipment.length === 0 || ex.equipment.every(eq => allowedEquipment.includes(eq));
                          });
                        }

                        const exerciseCount = profile?.fitnessLevel === "beginner" ? 2 : 
                                             profile?.fitnessLevel === "intermediate" ? 3 : 4;
                        
                        const shuffled = [...groupExercises].sort(() => Math.random() - 0.5);
                        const selected = shuffled.slice(0, Math.min(exerciseCount, shuffled.length));
                        
                        newMainExercises.push(...selected.map(ex => ({
                          ...ex,
                          id: `${ex.id}-${Date.now()}-${Math.random()}`
                        })));
                      });

                      const updatedSessions = currentWeekPlan.sessions.map((s) => {
                        if (s.id === showRegenerateConfirm) {
                          return {
                            ...s,
                            exercises: [...warmupExercises, ...newMainExercises, ...cooldownExercises],
                            completed: false,
                            completedExercises: [],
                          };
                        }
                        return s;
                      });

                      updateWeekPlan({
                        ...currentWeekPlan,
                        sessions: updatedSessions,
                      });
                    }
                    setShowRegenerateConfirm(null);
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>{t.plan.regenerate}</Text>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 20,
    gap: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sessionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionDay: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  exercisesContainer: {
    gap: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  exerciseDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  exerciseCompleted: {
    textDecorationLine: "line-through" as const,
    opacity: 0.6,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarGrid: {
    gap: 12,
    marginBottom: 24,
  },
  calendarDay: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calendarDayName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  calendarWorkoutName: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  calendarProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  calendarProgress: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  calendarProgressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  calendarStats: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  editModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  editForm: {
    gap: 20,
  },
  editExerciseName: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    minWidth: 60,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  restNoteContainer: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE69C",
    marginBottom: 12,
  },
  restNoteText: {
    fontSize: 13,
    color: "#856404",
    textAlign: "center",
  },
  favoritesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  favoritesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favoritesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoritesTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  favoritesContent: {
    marginTop: 12,
    gap: 12,
  },
  favoriteExerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  favoriteExerciseInfo: {
    flex: 1,
  },
  favoriteExerciseName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  favoriteExerciseDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  favoriteExerciseActions: {
    flexDirection: "row",
    gap: 8,
  },
  addToSessionButton: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  removeFavoriteButton: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  sessionSelectList: {
    gap: 8,
    marginTop: 16,
  },
  sessionSelectButton: {
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionSelectText: {
    fontSize: 14,
    color: Colors.text,
  },
  editSessionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 8,
  },
  editSessionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  editOptionsList: {
    gap: 12,
  },
  editOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editOptionTextContainer: {
    flex: 1,
    gap: 4,
  },
  editOptionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  editOptionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addExerciseScroll: {
    maxHeight: "80%",
  },
  addExerciseSection: {
    marginBottom: 24,
  },
  addExerciseSectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  addExerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addExerciseItemInfo: {
    flex: 1,
  },
  addExerciseItemName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  addExerciseItemDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  muscleGroupSection: {
    marginBottom: 16,
  },
  muscleGroupTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 8,
    marginTop: 8,
  },
  confirmModalContent: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    margin: 20,
    alignItems: "center",
    gap: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  editOptionsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  inlineEditOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineEditOptionTextContainer: {
    flex: 1,
  },
  inlineEditOptionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
});
