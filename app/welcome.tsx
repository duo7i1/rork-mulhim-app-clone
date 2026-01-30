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
import { Globe } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/providers/LanguageProvider";
import { Language } from "@/constants/translations";

export default function WelcomeScreen() {
  const router = useRouter();
  const { setLanguage } = useLanguage();
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

  const handleSelectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    router.replace("/");
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
            <Globe size={64} color={Colors.primary} />
          </View>
          
          <Text style={styles.helloText}>أهلاً</Text>
          <Text style={styles.helloTextEn}>Hello</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.selectText}>اختر اللغة / Select Language</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => handleSelectLanguage('ar')}
              activeOpacity={0.8}
            >
              <Text style={styles.languageButtonText}>العربية</Text>
              <Text style={styles.languageButtonSubtext}>Arabic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageButton, styles.languageButtonAlt]}
              onPress={() => handleSelectLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.languageButtonText, styles.languageButtonTextAlt]}>English</Text>
              <Text style={[styles.languageButtonSubtext, styles.languageButtonSubtextAlt]}>الإنجليزية</Text>
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
  helloText: {
    fontSize: 48,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  helloTextEn: {
    fontSize: 32,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: 32,
  },
  selectText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
  },
  languageButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 4,
  },
  languageButtonAlt: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  languageButtonText: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  languageButtonTextAlt: {
    color: Colors.primary,
  },
  languageButtonSubtext: {
    fontSize: 14,
    color: Colors.background,
    opacity: 0.8,
  },
  languageButtonSubtextAlt: {
    color: Colors.textSecondary,
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
