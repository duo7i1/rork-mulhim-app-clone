import { Redirect } from "expo-router";
import { useFitness } from "@/providers/FitnessProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";

export default function Index() {
  const { hasProfile, isLoading: profileLoading } = useFitness();
  const { hasSelectedLanguage, isLoading: languageLoading, t } = useLanguage();
  const { user } = useAuth();

  if (languageLoading || profileLoading) {
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

  if (hasProfile) {
    return <Redirect href="/(tabs)/plan" />;
  }

  if (user) {
    return <Redirect href="/onboarding" />;
  }

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
