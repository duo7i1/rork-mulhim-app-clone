import { useRouter } from "expo-router";
import { ArrowRight, Target, Dumbbell, Home, AlertCircle, Calendar, Activity } from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useFitness } from "@/providers/FitnessProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  FitnessProfile,
  Goal,
  TrainingLocation,
  ActivityLevel,
} from "@/types/fitness";

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function OnboardingScreen() {
  const router = useRouter();
  const { saveProfile } = useFitness();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0);

  const [formData, setFormData] = useState<Partial<FitnessProfile>>({
    age: undefined,
    weight: undefined,
    height: undefined,
    gender: undefined,
    goal: undefined,
    fitnessLevel: undefined,
    trainingLocation: undefined,
    activityLevel: undefined,
    availableDays: 3,
    sessionDuration: 60,
    injuries: "",
  });

  const totalSteps = 7;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    if (
      formData.age &&
      formData.weight &&
      formData.height &&
      formData.gender &&
      formData.goal &&
      formData.trainingLocation &&
      formData.activityLevel
    ) {
      await saveProfile(formData as FitnessProfile);
      router.replace("/(tabs)/plan" as any);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.age && formData.age > 0 && formData.age < 120;
      case 1:
        return (
          formData.weight &&
          formData.height &&
          formData.weight > 0 &&
          formData.height > 0
        );
      case 2:
        return formData.gender !== undefined;
      case 3:
        return formData.goal !== undefined;
      case 4:
        return formData.activityLevel !== undefined;
      case 5:
        return formData.trainingLocation !== undefined;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Target size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{t.onboarding.welcomeTitle}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.welcomeDesc}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t.onboarding.enterAge}
              placeholderTextColor={Colors.textLight}
              keyboardType="number-pad"
              value={formData.age?.toString() || ""}
              onChangeText={(text) =>
                setFormData({ ...formData, age: parseInt(text) || undefined })
              }
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Dumbbell size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{t.onboarding.measurements}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.measurementsDesc}
            </Text>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.onboarding.weightKg}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="decimal-pad"
                  value={formData.weight?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      weight: parseFloat(text) || undefined,
                    })
                  }
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.onboarding.heightCm}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="175"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="decimal-pad"
                  value={formData.height?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      height: parseFloat(text) || undefined,
                    })
                  }
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t.onboarding.gender}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.genderDesc}
            </Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.gender === "male" && styles.optionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: "male" })}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.gender === "male" && styles.optionTextActive,
                  ]}
                >
                  {t.onboarding.male}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.gender === "female" && styles.optionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: "female" })}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.gender === "female" && styles.optionTextActive,
                  ]}
                >
                  {t.onboarding.female}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Target size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{t.onboarding.goal}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.goalDesc}
            </Text>
            <View style={styles.optionsContainer}>
              {[
                { value: "fat_loss" as Goal, label: t.onboarding.fatLoss },
                { value: "muscle_gain" as Goal, label: t.onboarding.muscleGain },
                { value: "general_fitness" as Goal, label: t.onboarding.generalFitness },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    formData.goal === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, goal: option.value })
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.goal === option.value &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Activity size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{t.onboarding.activityLevel}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.activityDesc}
            </Text>
            <View style={styles.optionsContainer}>
              {[
                { value: "none" as ActivityLevel, label: t.onboarding.none, desc: t.onboarding.noneDesc },
                { value: "light" as ActivityLevel, label: t.onboarding.light, desc: t.onboarding.lightDesc },
                { value: "moderate" as ActivityLevel, label: t.onboarding.moderate, desc: t.onboarding.moderateDesc },
                { value: "high" as ActivityLevel, label: t.onboarding.high, desc: t.onboarding.highDesc },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButtonLarge,
                    formData.activityLevel === option.value &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, activityLevel: option.value })
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.activityLevel === option.value &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDesc,
                      formData.activityLevel === option.value &&
                        styles.optionDescActive,
                    ]}
                  >
                    {option.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Home size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{t.onboarding.trainingLocation}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.locationDesc}
            </Text>
            <View style={styles.optionsContainer}>
              {[
                { value: "gym" as TrainingLocation, label: t.onboarding.gym, desc: t.onboarding.gymDesc },
                { value: "home" as TrainingLocation, label: t.onboarding.home, desc: t.onboarding.homeDesc },
                { value: "minimal_equipment" as TrainingLocation, label: t.onboarding.minimalEquipment, desc: t.onboarding.minimalDesc },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButtonLarge,
                    formData.trainingLocation === option.value &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, trainingLocation: option.value })
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.trainingLocation === option.value &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDesc,
                      formData.trainingLocation === option.value &&
                        styles.optionDescActive,
                    ]}
                  >
                    {option.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Calendar size={48} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{t.onboarding.schedule}</Text>
            <Text style={styles.stepDescription}>
              {t.onboarding.scheduleDesc}
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                {t.onboarding.daysPerWeek}: {formData.availableDays}
              </Text>
              <View style={styles.daysContainer}>
                {[2, 3, 4, 5, 6, 7].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      formData.availableDays === day && styles.dayButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, availableDays: day })
                    }
                  >
                    <Text
                      style={[
                        styles.dayText,
                        formData.availableDays === day && styles.dayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                {t.onboarding.sessionDuration}: {formData.sessionDuration} {t.common.minutes}
              </Text>
              <View style={styles.daysContainer}>
                {[30, 45, 60, 75, 90].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.dayButton,
                      formData.sessionDuration === duration &&
                        styles.dayButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, sessionDuration: duration })
                    }
                  >
                    <Text
                      style={[
                        styles.dayText,
                        formData.sessionDuration === duration &&
                          styles.dayTextActive,
                      ]}
                    >
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.injuriesContainer}>
              <View style={styles.injuriesHeader}>
                <AlertCircle size={20} color={Colors.textSecondary} />
                <Text style={styles.injuriesLabel}>
                  {t.onboarding.injuries}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.onboarding.injuriesPlaceholder}
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={3}
                value={formData.injuries}
                onChangeText={(text) =>
                  setFormData({ ...formData, injuries: text })
                }
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} {t.onboarding.stepOf} {totalSteps}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>{t.common.back}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isStepValid() && styles.nextButtonDisabled,
              currentStep === 0 && styles.nextButtonFull,
            ]}
            onPress={handleNext}
            disabled={!isStepValid()}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps - 1 ? t.onboarding.getStarted : t.common.continue}
            </Text>
            <ArrowRight size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    gap: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  optionTextActive: {
    color: Colors.background,
  },
  optionButtonLarge: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  optionDescActive: {
    color: Colors.background,
    opacity: 0.9,
  },
  sliderContainer: {
    gap: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  daysContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dayButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 50,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  dayTextActive: {
    color: Colors.background,
  },
  injuriesContainer: {
    gap: 12,
  },
  injuriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  injuriesLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
});
