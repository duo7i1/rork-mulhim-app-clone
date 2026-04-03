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
import { LogIn, ArrowRight, Shield, RefreshCw } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/providers/LanguageProvider";

export default function AccountPromptScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(40)).current;
  const benefitsOpacity = React.useRef(new Animated.Value(0)).current;
  const benefitsSlide = React.useRef(new Animated.Value(30)).current;
  const buttonsOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonsSlide = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.sequence([
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
        Animated.timing(benefitsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(benefitsSlide, {
          toValue: 0,
          duration: 400,
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
  }, [fadeAnim, slideAnim, benefitsOpacity, benefitsSlide, buttonsOpacity, buttonsSlide]);

  const handleLogin = () => {
    router.push("/auth/login" as any);
  };

  const handleSkip = () => {
    router.replace("/onboarding" as any);
  };

  const benefits = [
    {
      icon: <RefreshCw size={18} color={Colors.primary} />,
      text: isRTL ? "مزامنة بياناتك عبر الأجهزة" : "Sync data across devices",
    },
    {
      icon: <Shield size={18} color={Colors.primary} />,
      text: isRTL ? "حفظ تقدمك بأمان" : "Keep your progress safe",
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconWrapper}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.title, isRTL && styles.rtlText]}>
              {t.auth.accountPromptTitle}
            </Text>
            <Text style={[styles.description, isRTL && styles.rtlText]}>
              {t.auth.accountPromptDesc}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.benefitsSection,
              {
                opacity: benefitsOpacity,
                transform: [{ translateY: benefitsSlide }],
              },
            ]}
          >
            {benefits.map((benefit, index) => (
              <View
                key={index}
                style={[styles.benefitRow, isRTL && styles.benefitRowRTL]}
              >
                <View style={styles.benefitIconCircle}>{benefit.icon}</View>
                <Text style={[styles.benefitText, isRTL && styles.rtlText]}>
                  {benefit.text}
                </Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonsSection,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsSlide }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.85}
              testID="account-login"
            >
              <LogIn size={22} color={Colors.background} />
              <Text style={styles.loginButtonText}>{t.auth.login}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.8}
              testID="account-skip"
            >
              <Text style={styles.skipButtonText}>{t.auth.skip}</Text>
              <ArrowRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>{t.profile.appName}</Text>
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
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  rtlText: {
    writingDirection: "rtl" as const,
  },
  benefitsSection: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 36,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  benefitRowRTL: {
    flexDirection: "row-reverse",
  },
  benefitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500" as const,
    flex: 1,
  },
  buttonsSection: {
    gap: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  skipButton: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
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
