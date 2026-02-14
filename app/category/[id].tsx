import { Text, View, useThemeColor } from "@/components/Themed";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from "react-native";
import { getCategoryDetail } from "../../src/services/categoryService";
import { useAuthStore } from "../../src/store/useAuthStore";

interface CategoryDetail {
  id: number;
  name: string;
  name_other: string;
  description: string;
  description_other: string;
}

export default function CategoryDetailScreen() {
  const cardBackground = useThemeColor({}, "background");
  const dividerColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");
  const { id } = useLocalSearchParams();
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    fetchCategoryDetail();
  }, [id]);

  const fetchCategoryDetail = async () => {
    if (!token || !id) return;
    try {
      const response = await getCategoryDetail(token, id);
      setCategory(response.data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to fetch category details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.centered}>
        <Text>Category not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{category.name}</Text>

        <Text style={styles.label}>Other Name</Text>
        <Text style={styles.value}>{category.name_other || "-"}</Text>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <Text style={styles.label}>Description</Text>
        <Text style={styles.description}>{category.description || "-"}</Text>

        <Text style={styles.label}>Other Description</Text>
        <Text style={styles.description}>
          {category.description_other || "-"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 15,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
});
