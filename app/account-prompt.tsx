import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { UserCircle, LogIn, ArrowRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AccountPromptScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleSkip = () => {
    router.replace("/onboarding");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <UserCircle size={64} color={Colors.primary} />
          </View>

          <Text style={styles.title}>{t.auth.accountPromptTitle}</Text>
          <Text style={styles.description}>{t.auth.accountPromptDesc}</Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LogIn size={24} color={Colors.background} />
              <Text style={styles.loginButtonText}>{t.auth.login}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>{t.auth.skip}</Text>
              <ArrowRight size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ملهم</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 48,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  skipButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  skipButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "600" as const,
  },
});
