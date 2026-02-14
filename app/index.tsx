import { Redirect } from "expo-router";
import { useFitness } from "@/providers/FitnessProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";

export default function Index() {
  const { hasProfile, isLoading: profileLoading, profile } = useFitness();
  const { hasSelectedLanguage, isLoading: languageLoading, t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  if (languageLoading || profileLoading || authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>{t.common.loading}</Text>
      </View>
    );
  }

  if (!hasSelectedLanguage) {
    return <Redirect href="/welcome" />;
  }

  if (user && hasProfile) {
    console.log('[Index] User logged in with profile in Supabase, redirecting to plan');
    return <Redirect href="/(tabs)/plan" />;
  }

  if (user && !hasProfile) {
    console.log('[Index] User logged in without profile, redirecting to onboarding');
    return <Redirect href="/onboarding" />;
  }

  if (!user && hasProfile) {
    console.log('[Index] Guest with local profile, redirecting to plan');
    return <Redirect href="/(tabs)/plan" />;
  }

  console.log('[Index] No user, no profile, showing account prompt');
  return <Redirect href="/account-prompt" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    gap: 12,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
