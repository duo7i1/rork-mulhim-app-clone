import { Redirect } from "expo-router";
import { useFitness } from "@/providers/FitnessProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";

export default function Index() {
  const { hasProfile, isLoading: profileLoading } = useFitness();
  const { hasSelectedLanguage, isLoading: languageLoading, t } = useLanguage();

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

  if (!hasProfile) {
    return <Redirect href="/account-prompt" />;
  }

  return <Redirect href="/(tabs)/plan" />;
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
