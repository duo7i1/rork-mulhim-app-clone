import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useLanguage } from "@/providers/LanguageProvider";
import { Language } from "@/constants/translations";

export default function WelcomeScreen() {
  console.log("[WelcomeScreen] Rendering welcome screen");
  const router = useRouter();
  const { setLanguage } = useLanguage();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const iconScale = React.useRef(new Animated.Value(0.5)).current;
  const iconOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonsSlide = React.useRef(new Animated.Value(50)).current;
  const buttonsOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, iconScale, iconOpacity, buttonsSlide, buttonsOpacity]);

  const handleSelectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.topAccent} />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  opacity: iconOpacity,
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.helloText}>أهلاً</Text>
              <Text style={styles.helloTextEn}>Hello</Text>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerDot} />
                <View style={styles.dividerLine} />
              </View>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.bottomSection,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsSlide }],
              },
            ]}
          >
            <Text style={styles.selectText}>اختر اللغة / Select Language</Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => handleSelectLanguage("ar")}
                activeOpacity={0.85}
                testID="welcome-language-ar"
              >
                <View style={styles.langContent}>
                  <Text style={styles.languageEmoji}>🇸🇦</Text>
                  <View style={styles.langTextGroup}>
                    <Text style={styles.languageButtonText}>العربية</Text>
                    <Text style={styles.languageButtonSubtext}>Arabic</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.languageButton, styles.languageButtonAlt]}
                onPress={() => handleSelectLanguage("en")}
                activeOpacity={0.85}
                testID="welcome-language-en"
              >
                <View style={styles.langContent}>
                  <Text style={styles.languageEmoji}>🇺🇸</Text>
                  <View style={styles.langTextGroup}>
                    <Text style={[styles.languageButtonText, styles.languageButtonTextAlt]}>
                      English
                    </Text>
                    <Text style={[styles.languageButtonSubtext, styles.languageButtonSubtextAlt]}>
                      الإنجليزية
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Mulhim</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  topAccent: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  topSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },
  appIcon: {
    width: 110,
    height: 110,
    borderRadius: 28,
  },
  textContainer: {
    alignItems: "center",
  },
  helloText: {
    fontSize: 44,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  helloTextEn: {
    fontSize: 28,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    opacity: 0.4,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  bottomSection: {
    gap: 20,
  },
  selectText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  buttonsContainer: {
    width: "100%",
    gap: 14,
  },
  languageButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  languageButtonAlt: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  langContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  languageEmoji: {
    fontSize: 28,
  },
  langTextGroup: {
    flex: 1,
  },
  languageButtonText: {
    fontSize: 19,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  languageButtonTextAlt: {
    color: Colors.text,
  },
  languageButtonSubtext: {
    fontSize: 13,
    color: Colors.background,
    opacity: 0.75,
    marginTop: 2,
  },
  languageButtonSubtextAlt: {
    color: Colors.textSecondary,
    opacity: 1,
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  footerLine: {
    width: 30,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: "600" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
});
