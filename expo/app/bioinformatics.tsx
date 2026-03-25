import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import {
  Dna,
  Activity,
  Brain,
  Shield,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowLeft,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTranslation } from "@/providers/LanguageProvider";

export default function BioinformaticsScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [isWaitlisted, setIsWaitlisted] = useState<boolean>(false);

  const handleJoinWaitlist = () => {
    if (!email || !email.includes("@")) {
      Alert.alert(t.common.error, t.bioinformatics.invalidEmail);
      return;
    }

    setIsWaitlisted(true);
    Alert.alert(
      t.bioinformatics.registeredTitle,
      t.bioinformatics.registeredMessage,
      [{ text: t.mealDetails.ok }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          title: t.bioinformatics.title,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <View style={styles.closeButtonInner}>
          <X size={20} color={Colors.text} />
        </View>
      </TouchableOpacity>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.dnaIconContainer}>
            <Dna size={48} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{t.bioinformatics.title}</Text>
          <Text style={styles.heroSubtitle}>
            {t.bioinformatics.subtitle}
          </Text>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>{t.bioinformatics.betaNoticeTitle}</Text>
          <Text style={styles.noticeText}>
            {t.bioinformatics.betaNoticeText}
          </Text>
          <Text style={styles.noticeSubtext}>
            {t.bioinformatics.betaNoticeSubtext}
          </Text>
          <Text style={styles.priorityText}>
            {t.bioinformatics.priorityText}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.bioinformatics.whatIsTitle}</Text>
          <View style={styles.contentCard}>
            <Text style={styles.bodyText}>
              {t.bioinformatics.whatIsText1}
            </Text>
            <Text style={[styles.bodyText, styles.marginTop]}>
              {t.bioinformatics.whatIsText2}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.bioinformatics.whyImportantTitle}
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <TrendingUp size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>
                {t.bioinformatics.benefit1}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Activity size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>
                {t.bioinformatics.benefit2}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Brain size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>
                {t.bioinformatics.benefit3}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <CheckCircle2 size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>
                {t.bioinformatics.benefit4}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Users size={20} color={Colors.primary} />
              </View>
              <Text style={styles.benefitText}>
                {t.bioinformatics.benefit5}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.bioinformatics.planToCustomizeTitle}</Text>
          <View style={styles.contentCard}>
            <Text style={styles.listTitle}>
              {t.bioinformatics.planToCustomizeIntro}
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>
                {t.bioinformatics.planItem1}
              </Text>
              <Text style={styles.featureItem}>
                {t.bioinformatics.planItem2}
              </Text>
              <Text style={styles.featureItem}>
                {t.bioinformatics.planItem3}
              </Text>
              <Text style={styles.featureItem}>
                {t.bioinformatics.planItem4}
              </Text>
              <Text style={styles.featureItem}>
                {t.bioinformatics.planItem5}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.bioinformatics.howWorksTitle}</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  {t.bioinformatics.step1}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  {t.bioinformatics.step2}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  {t.bioinformatics.step3}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  {t.bioinformatics.step4}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  {t.bioinformatics.step5}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.bioinformatics.privacyTitle}</Text>
          <View style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <Shield size={32} color={Colors.primary} />
            </View>
            <Text style={styles.privacyText}>
              {t.bioinformatics.privacyText1}
            </Text>
            <Text style={[styles.privacyText, styles.marginTop]}>
              {t.bioinformatics.privacyText2}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.bioinformatics.betaStatusTitle}</Text>
          <View style={styles.contentCard}>
            <Text style={styles.statusText}>
              {t.bioinformatics.betaStatusIntro}
            </Text>
            <View style={styles.statusList}>
              <Text style={styles.statusItem}>
                {t.bioinformatics.betaStatusItem1}
              </Text>
              <Text style={styles.statusItem}>
                {t.bioinformatics.betaStatusItem2}
              </Text>
              <Text style={styles.statusItem}>
                {t.bioinformatics.betaStatusItem3}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.waitlistSection}>
          <Text style={styles.waitlistTitle}>{t.bioinformatics.waitlistTitle}</Text>
          <Text style={styles.waitlistSubtitle}>
            {t.bioinformatics.waitlistSubtitle}
          </Text>
          {!isWaitlisted ? (
            <>
              <TextInput
                style={styles.input}
                placeholder={t.bioinformatics.emailPlaceholder}
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinWaitlist}
              >
                <Text style={styles.joinButtonText}>{t.bioinformatics.joinWaitlist}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successCard}>
              <CheckCircle2 size={48} color={Colors.success} />
              <Text style={styles.successText}>{t.bioinformatics.successTitle}</Text>
              <Text style={styles.successSubtext}>
                {t.bioinformatics.successSubtitle}
              </Text>
            </View>
          )}
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
  backButton: {
    padding: 8,
  },
  closeButton: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    zIndex: 1000,
  },
  closeButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  dnaIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  noticeCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.accent + "20",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.accent,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  noticeSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  priorityText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.accent,
    textAlign: "center",
    marginTop: 8,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  marginTop: {
    marginTop: 12,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  listTitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  privacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  privacyIcon: {
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  statusText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
    fontWeight: "600" as const,
  },
  statusList: {
    gap: 8,
  },
  statusItem: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  waitlistSection: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  waitlistTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.background,
    textAlign: "center",
  },
  waitlistSubtitle: {
    fontSize: 15,
    color: Colors.background + "E6",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  joinButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  successCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  successText: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.success,
  },
  successSubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
