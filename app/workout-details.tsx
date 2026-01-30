import { ArrowLeft, CheckCircle2, Circle, Clock, ExternalLink, Play } from "lucide-react-native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useFitness } from "@/providers/FitnessProvider";
import { useTranslation } from "@/providers/LanguageProvider";

export default function WorkoutDetailsScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { currentWeekPlan, toggleExerciseCompletion } = useFitness();
  const { t } = useTranslation();

  const session = currentWeekPlan?.sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t.workoutDetails.sessionNotFound}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{t.workoutDetails.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const openVideo = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const completedCount = session.completedExercises?.length || 0;
  const totalCount = session.exercises.length;
  const progress = (completedCount / totalCount) * 100;



  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{session.name}</Text>
          <Text style={styles.headerSubtitle}>{session.day}</Text>
        </View>
        <View style={styles.headerRight}>
          <Clock size={20} color={Colors.textSecondary} />
          <Text style={styles.headerDuration}>{session.duration}min</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{t.workoutDetails.progress}</Text>
          <Text style={styles.progressValue}>
            {completedCount}/{totalCount}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.exercisesContainer}>
          {session.exercises.map((exercise, index) => {
            const isCompleted = session.completedExercises?.includes(exercise.id) || false;
            return (
              <View
                key={exercise.id}
                style={[styles.exerciseCard, isCompleted && styles.exerciseCardCompleted]}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseHeaderLeft}>
                    <Text style={styles.exerciseNumber}>{index + 1}</Text>
                    <View style={styles.exerciseTitleContainer}>
                      <Text style={[styles.exerciseName, isCompleted && styles.exerciseNameCompleted]}>
                        {exercise.name}
                      </Text>
                      <Text style={styles.exerciseMuscle}>{exercise.muscleGroup}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleExerciseCompletion(sessionId, exercise.id)}
                    style={styles.checkButton}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={28} color={Colors.success} />
                    ) : (
                      <Circle size={28} color={Colors.textLight} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.workoutDetails.sets}</Text>
                    <Text style={styles.detailValue}>{exercise.sets}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.workoutDetails.reps}</Text>
                    <Text style={styles.detailValue}>{exercise.reps}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.workoutDetails.rest}</Text>
                    <Text style={styles.detailValue}>{exercise.rest}s</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t.workoutDetails.weight}</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {exercise.assignedWeight && exercise.assignedWeight.toLowerCase().includes('body') 
                        ? '-' 
                        : exercise.assignedWeight 
                        ? exercise.assignedWeight.replace(/each/gi, '').replace(/KG/g, 'kg').trim()
                        : (exercise.equipment.length === 0 ? '-' : 'N/A')}
                    </Text>
                  </View>
                </View>

                {exercise.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>{t.workoutDetails.howToPerform}</Text>
                    <Text style={styles.descriptionText}>{exercise.description}</Text>
                  </View>
                )}

                {exercise.videoUrl && (
                  <TouchableOpacity
                    style={styles.videoButton}
                    onPress={() => openVideo(exercise.videoUrl!)}
                  >
                    <Play size={20} color={Colors.background} />
                    <Text style={styles.videoButtonText}>{t.workoutDetails.watchVideo}</Text>
                    <ExternalLink size={16} color={Colors.background} />
                  </TouchableOpacity>
                )}

                {exercise.equipment.length > 0 && (
                  <View style={styles.equipmentContainer}>
                    <Text style={styles.equipmentTitle}>{t.workoutDetails.equipmentNeeded}</Text>
                    <View style={styles.equipmentList}>
                      {exercise.equipment.map((item, idx) => (
                        <View key={`${exercise.id}-equipment-${idx}-${item}`} style={styles.equipmentBadge}>
                          <Text style={styles.equipmentText}>
                            {item.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t.workoutDetails.completeAll}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerDuration: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
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
  scrollView: {
    flex: 1,
  },
  exercisesContainer: {
    padding: 20,
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseCardCompleted: {
    borderColor: Colors.success,
    backgroundColor: "#f0fdf4",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    color: Colors.background,
    fontSize: 16,
    fontWeight: "bold" as const,
    textAlign: "center",
    lineHeight: 36,
  },
  exerciseTitleContainer: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  exerciseNameCompleted: {
    color: Colors.success,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  checkButton: {
    padding: 8,
  },
  exerciseDetails: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
  },
  detailDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  descriptionContainer: {
    gap: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  videoButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  videoButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  equipmentContainer: {
    gap: 8,
  },
  equipmentTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  equipmentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  equipmentBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },

});
