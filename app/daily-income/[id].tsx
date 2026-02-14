import { DailyIncomeForm } from "@/components/DailyIncome/DailyIncomeForm";
import { useThemeColor } from "@/components/Themed";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

export default function DailyIncomeEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.token);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor(
    { light: "#f9f9f9", dark: "#2a2a2a" },
    "background",
  );
  const borderColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");

  if (!token) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{ title: "Edit Daily Income", headerShown: true }}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <DailyIncomeForm
          token={token}
          backgroundColor={backgroundColor}
          textColor={textColor}
          cardColor={cardColor}
          borderColor={borderColor}
          editId={Number(id)}
          onBack={() => router.back()}
          onSuccess={() => router.back()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
