import { DailyIncomeForm } from "@/components/DailyIncome/DailyIncomeForm";
import { DailyIncomeList } from "@/components/DailyIncome/DailyIncomeList";
import { useThemeColor } from "@/components/Themed";
import { useAuthStore } from "@/src/store/useAuthStore";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

export default function DailyIncomeScreen() {
  const [view, setView] = useState<"index" | "create">("index");
  const [editId, setEditId] = useState<number | null>(null);
  const token = useAuthStore((state) => state.token);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor(
    { light: "#f9f9f9", dark: "#2a2a2a" },
    "background",
  );
  const borderColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");

  const handleEdit = (id: number) => {
    setEditId(id);
    setView("create");
  };

  const handleCreate = () => {
    setEditId(null);
    setView("create");
  };

  if (!token) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {view === "index" ? (
          <DailyIncomeList
            token={token}
            backgroundColor={backgroundColor}
            textColor={textColor}
            borderColor={borderColor}
            onCreatePress={handleCreate}
            onEditPress={handleEdit}
          />
        ) : (
          <DailyIncomeForm
            token={token}
            backgroundColor={backgroundColor}
            textColor={textColor}
            cardColor={cardColor}
            borderColor={borderColor}
            editId={editId}
            onBack={() => setView("index")}
            onSuccess={() => setView("index")}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
