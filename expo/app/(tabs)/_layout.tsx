import { Tabs } from "expo-router";
import {
  Dumbbell,
  UtensilsCrossed,
  Sparkles,
  User,
} from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/providers/LanguageProvider";

export default function TabLayout() {
  const { t } = useLanguage();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === "ios" ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: t.tabs.plan,
          tabBarIcon: ({ color, size }) => <Dumbbell size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t.tabs.nutrition,
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t.tabs.coach,
          tabBarIcon: ({ color, size }) => <Sparkles size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color, size }) => <User size={size ?? 24} color={color} />,
        }}
      />
    </Tabs>
  );
}
