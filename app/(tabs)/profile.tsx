import {
  User,
  Target,
  Dumbbell,
  Settings,
  ChevronRight,
  LogOut,
  TrendingUp,
  TrendingDown,
  Scale,
  Activity,
  Calendar,
  Dna,
  Edit3,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useFitness } from "@/providers/FitnessProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ProfileScreen() {
  const { t, setLanguage, language } = useLanguage();
  const { profile, getTargetCalories, calculateBMR, calculateTDEE, progress, workoutLogs, getCurrentStreak, addProgressEntry } = useFitness();
  const { signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showWeightModal, setShowWeightModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<string>("");

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSaveWeight = async () => {
    const weight = parseFloat(newWeight);
    if (!weight || weight <= 0) return;

    await addProgressEntry({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight,
    });
    setShowWeightModal(false);
    setNewWeight("");
  };

  const goalLabel = profile?.goal
    ?.replace("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const levelLabel = profile?.fitnessLevel?.replace(/\b\w/g, (l) => l.toUpperCase());
  
  const currentWeight = progress.length > 0 ? progress[progress.length - 1].weight : profile?.weight || 0;
  const startWeight = profile?.weight || 0;
  const weightChange = currentWeight - startWeight;
  const totalWorkouts = workoutLogs.length;
  const currentStreak = getCurrentStreak();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{t.profile.title}</Text>
          <Text style={styles.email}>{profile?.gender === "male" ? t.onboarding.male : t.onboarding.female} · {profile?.age} {t.profile.yearsOld}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <View style={styles.statIconBox}>
              <Activity size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>{t.profile.consecutiveDays}</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statIconBox}>
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>{t.profile.workouts}</Text>
          </View>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => {
              setNewWeight(currentWeight.toString());
              setShowWeightModal(true);
            }}
          >
            <View style={styles.statIconBox}>
              <Scale size={20} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{currentWeight.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t.profile.currentWeight}</Text>
            <View style={styles.editBadge}>
              <Edit3 size={12} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.advancedCustomization}</Text>
          <TouchableOpacity
            style={styles.bioinformaticsCard}
            onPress={() => router.push("/bioinformatics")}
          >
            <View style={styles.bioinformaticsIcon}>
              <Dna size={28} color={Colors.primary} />
            </View>
            <View style={styles.bioinformaticsContent}>
              <Text style={styles.bioinformaticsTitle}>
                {t.profile.geneticCustomization}
              </Text>
              <Text style={styles.bioinformaticsSubtitle}>
                {t.profile.geneticDesc}
              </Text>
            </View>
            <ChevronRight size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.weightProgress}</Text>
          <View style={styles.card}>
            <View style={styles.weightProgressRow}>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>{t.profile.startWeight}</Text>
                <Text style={styles.weightValue}>{startWeight.toFixed(1)} kg</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>{t.profile.current}</Text>
                <Text style={styles.weightValue}>{currentWeight.toFixed(1)} kg</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightLabel}>{t.profile.change}</Text>
                <View style={styles.weightChangeContainer}>
                  {weightChange !== 0 && (
                    weightChange > 0 ? (
                      <TrendingUp size={16} color={profile?.goal === "muscle_gain" ? Colors.success : Colors.danger} />
                    ) : (
                      <TrendingDown size={16} color={profile?.goal === "fat_loss" ? Colors.success : Colors.danger} />
                    )
                  )}
                  <Text style={[
                    styles.weightChangeValue,
                    {
                      color: weightChange === 0 ? Colors.textSecondary :
                        ((profile?.goal === "fat_loss" && weightChange < 0) || 
                        (profile?.goal === "muscle_gain" && weightChange > 0)) ? Colors.success : Colors.danger
                    }
                  ]}>
                    {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.fitnessProfile}</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.profileIcon}>
                <Target size={20} color={Colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t.profile.goalLabel}</Text>
                <Text style={styles.profileValue}>{goalLabel}</Text>
              </View>
            </View>
            <View style={styles.profileRow}>
              <View style={styles.profileIcon}>
                <Dumbbell size={20} color={Colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t.profile.levelLabel}</Text>
                <Text style={styles.profileValue}>{levelLabel}</Text>
              </View>
            </View>
            <View style={styles.profileRow}>
              <View style={styles.profileIcon}>
                <Settings size={20} color={Colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t.profile.workoutLabel}</Text>
                <Text style={styles.profileValue}>
                  {profile?.availableDays} {t.profile.daysWeek} · {profile?.sessionDuration} {t.common.minutes}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.bodyMetrics}</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t.profile.bmi}</Text>
              <Text style={styles.metricValue}>
                {profile ? (currentWeight / Math.pow(profile.height / 100, 2)).toFixed(1) : "-"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t.profile.bmr}</Text>
              <Text style={styles.metricValue}>{Math.round(calculateBMR())}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t.profile.tdee}</Text>
              <Text style={styles.metricValue}>{Math.round(calculateTDEE())}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>{t.profile.targetCalories}</Text>
              <Text style={styles.metricValue}>{Math.round(getTargetCalories())}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.recentActivity}</Text>
          {workoutLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>{t.profile.noWorkouts}</Text>
              <Text style={styles.emptySubtext}>
                {t.profile.completeFirst}
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {workoutLogs.slice(-5).reverse().map((log) => (
                <View key={log.id} style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <Activity size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{t.profile.completedWorkout}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(log.date).toLocaleDateString('ar')}
                    </Text>
                  </View>
                  <Text style={styles.activityDuration}>{log.duration} {t.common.minutes}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.account}</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowEditModal(true)}>
              <Text style={styles.menuText}>{t.profile.editProfile}</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>{t.profile.notifications}</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>{t.profile.privacySecurity}</Text>
              <ChevronRight size={20} color={Colors.textLight} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.menuText}>{t.profile.changeLanguage}</Text>
              <View style={styles.languageValue}>
                <Text style={styles.languageValueText}>{language === 'ar' ? t.welcome.arabic : t.welcome.english}</Text>
                <ChevronRight size={20} color={Colors.textLight} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>{t.profile.logout}</Text>
        </TouchableOpacity>

        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            {currentStreak > 0 
              ? t.profile.motivationStreak.replace('{count}', currentStreak.toString())
              : t.profile.motivationStart}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.weightModalOverlay}>
          <View style={styles.weightModalContent}>
            <Text style={styles.weightModalTitle}>{t.profile.changeLanguage}</Text>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'ar' && styles.languageOptionActive,
              ]}
              onPress={async () => {
                await setLanguage('ar');
                setShowLanguageModal(false);
              }}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  language === 'ar' && styles.languageOptionTextActive,
                ]}
              >
                {t.welcome.arabic}
              </Text>
              {language === 'ar' && (
                <View style={styles.checkIcon}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive,
              ]}
              onPress={async () => {
                await setLanguage('en');
                setShowLanguageModal(false);
              }}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  language === 'en' && styles.languageOptionTextActive,
                ]}
              >
                {t.welcome.english}
              </Text>
              {language === 'en' && (
                <View style={styles.checkIcon}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.weightModalButtonCancel}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.weightModalButtonTextCancel}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.weightModalOverlay}>
          <View style={styles.weightModalContent}>
            <Text style={styles.weightModalTitle}>{t.profile.updateWeight}</Text>
            <TextInput
              style={styles.weightModalInput}
              placeholder={t.profile.newWeight}
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
              autoFocus
            />
            <View style={styles.weightModalButtons}>
              <TouchableOpacity
                style={styles.weightModalButtonCancel}
                onPress={() => {
                  setShowWeightModal(false);
                  setNewWeight("");
                }}
              >
                <Text style={styles.weightModalButtonTextCancel}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.weightModalButtonSave}
                onPress={handleSaveWeight}
              >
                <Text style={styles.weightModalButtonTextSave}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface EditProfileModalProps {
  profile: any;
  onClose: () => void;
}

function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const { saveProfile, updateWeekPlan } = useFitness();
  const [formData, setFormData] = useState({
    age: profile?.age || 0,
    weight: profile?.weight || 0,
    height: profile?.height || 0,
    gender: profile?.gender || "male",
    goal: profile?.goal || "general_fitness",
    activityLevel: profile?.activityLevel || "none",
    fitnessLevel: profile?.fitnessLevel || "beginner",
    trainingLocation: profile?.trainingLocation || "gym",
    availableDays: profile?.availableDays || 3,
    sessionDuration: profile?.sessionDuration || 60,
    injuries: profile?.injuries || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile(formData as any);
      updateWeekPlan(null as any);
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.modalContainer} edges={["top"]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>تعديل الملف</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>إلغاء</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.modalScroll} contentContainerStyle={styles.editScrollContent}>
        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>المعلومات الأساسية</Text>
          
          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>العمر</Text>
            <TextInput
              style={styles.editInput}
              placeholder="العمر"
              placeholderTextColor={Colors.textLight}
              keyboardType="number-pad"
              value={formData.age.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, age: parseInt(text) || 0 })
              }
            />
          </View>

          <View style={styles.editRow}>
            <View style={[styles.editInputGroup, { flex: 1 }]}>
              <Text style={styles.editLabel}>الوزن (kg)</Text>
              <TextInput
                style={styles.editInput}
                placeholder="70"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={formData.weight.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, weight: parseFloat(text) || 0 })
                }
              />
            </View>
            <View style={[styles.editInputGroup, { flex: 1 }]}>
              <Text style={styles.editLabel}>الطول (cm)</Text>
              <TextInput
                style={styles.editInput}
                placeholder="175"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
                value={formData.height.toString()}
                onChangeText={(text) =>
                  setFormData({ ...formData, height: parseFloat(text) || 0 })
                }
              />
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>الجنس</Text>
            <View style={styles.editOptionsRow}>
              <TouchableOpacity
                style={[
                  styles.editOptionButton,
                  formData.gender === "male" && styles.editOptionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: "male" })}
              >
                <Text
                  style={[
                    styles.editOptionText,
                    formData.gender === "male" && styles.editOptionTextActive,
                  ]}
                >
                  ذكر
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editOptionButton,
                  formData.gender === "female" && styles.editOptionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: "female" })}
              >
                <Text
                  style={[
                    styles.editOptionText,
                    formData.gender === "female" && styles.editOptionTextActive,
                  ]}
                >
                  أنثى
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>الأهداف والمستوى</Text>
          
          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>الهدف</Text>
            <View style={styles.editOptionsColumn}>
              {[
                { value: "fat_loss", label: "نزول وزن" },
                { value: "muscle_gain", label: "بناء عضل" },
                { value: "general_fitness", label: "لياقة عامة وصحة" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.editOptionButtonFull,
                    formData.goal === option.value && styles.editOptionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, goal: option.value as any })}
                >
                  <Text
                    style={[
                      styles.editOptionText,
                      formData.goal === option.value && styles.editOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>النشاط الحالي</Text>
            <View style={styles.editOptionsColumn}>
              {[
                { value: "none", label: "ما اتمرن" },
                { value: "light", label: "خفيف 1-3 أيام" },
                { value: "moderate", label: "متوسط 3-5 أيام" },
                { value: "high", label: "عالي 6-7 أيام" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.editOptionButtonFull,
                    formData.activityLevel === option.value && styles.editOptionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, activityLevel: option.value as any })}
                >
                  <Text
                    style={[
                      styles.editOptionText,
                      formData.activityLevel === option.value && styles.editOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>مكان التمرين</Text>
            <View style={styles.editOptionsColumn}>
              {[
                { value: "gym", label: "صالة رياضية" },
                { value: "home", label: "المنزل" },
                { value: "minimal_equipment", label: "معدات بسيطة" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.editOptionButtonFull,
                    formData.trainingLocation === option.value && styles.editOptionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, trainingLocation: option.value as any })}
                >
                  <Text
                    style={[
                      styles.editOptionText,
                      formData.trainingLocation === option.value && styles.editOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.editSection}>
          <Text style={styles.editSectionTitle}>جدول التمرين</Text>
          
          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>أيام الأسبوع: {formData.availableDays}</Text>
            <View style={styles.editOptionsRow}>
              {[2, 3, 4, 5, 6, 7].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.editDayButton,
                    formData.availableDays === day && styles.editDayButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, availableDays: day })}
                >
                  <Text
                    style={[
                      styles.editDayText,
                      formData.availableDays === day && styles.editDayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>مدة التمرين: {formData.sessionDuration} دقيقة</Text>
            <View style={styles.editOptionsRow}>
              {[30, 45, 60, 75, 90].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.editDayButton,
                    formData.sessionDuration === duration && styles.editDayButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, sessionDuration: duration })}
                >
                  <Text
                    style={[
                      styles.editDayText,
                      formData.sessionDuration === duration && styles.editDayTextActive,
                    ]}
                  >
                    {duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>الإصابات أو القيود الصحية</Text>
            <TextInput
              style={[styles.editInput, styles.editTextArea]}
              placeholder="مثال: ألم في الركبة، مشاكل في الظهر"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              value={formData.injuries}
              onChangeText={(text) => setFormData({ ...formData, injuries: text })}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.editFooter}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  editBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  weightModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  weightModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    gap: 20,
  },
  weightModalTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
  },
  weightModalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.primary,
    textAlign: "center",
  },
  weightModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  weightModalButtonCancel: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weightModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  weightModalButtonSave: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  weightModalButtonTextSave: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.background,
  },
  section: {
    padding: 20,
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
    marginBottom: 16,
  },
  viewAllText: {
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
  },
  weightProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weightItem: {
    alignItems: "center",
    gap: 8,
  },
  weightLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  weightChangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weightChangeValue: {
    fontSize: 18,
    fontWeight: "bold" as const,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  activityDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  mealsList: {
    gap: 16,
  },
  mealItem: {
    flexDirection: "row",
    gap: 12,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  mealInfo: {
    flex: 1,
    gap: 2,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  mealNameAr: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "System",
  },
  mealCalories: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  logoutButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.danger,
  },
  motivationCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.background,
    textAlign: "center",
    lineHeight: 24,
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
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
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
  bioinformaticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  bioinformaticsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  bioinformaticsContent: {
    flex: 1,
    gap: 4,
  },
  bioinformaticsTitle: {
    fontSize: 17,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  bioinformaticsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  editScrollContent: {
    padding: 20,
  },
  editSection: {
    marginBottom: 32,
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  editInputGroup: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  editOptionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  editOptionsColumn: {
    gap: 8,
  },
  editOptionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  editOptionButtonFull: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  editOptionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  editOptionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  editOptionTextActive: {
    color: Colors.background,
  },
  editDayButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 50,
  },
  editDayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  editDayText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  editDayTextActive: {
    color: Colors.background,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  editFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  languageValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  languageValueText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  languageOption: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  languageOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  languageOptionTextActive: {
    color: Colors.primary,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "bold" as const,
  },
});
