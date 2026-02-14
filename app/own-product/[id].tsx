import { Text, View, useThemeColor } from "@/components/Themed";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { getOwnProductDetail } from "../../src/services/ownProductService";
import { useAuthStore } from "../../src/store/useAuthStore";

interface OwnProductDetail {
  id: number;
  name: string;
  unit_id: number;
  category_id: number;
  unit: string;
  category: string;
  price: string;
  investment: string;
  profit: string;
  image: string;
  created_at: string;
}

export default function OwnProductDetailScreen() {
  const cardBackground = useThemeColor({}, "background");
  const dividerColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<OwnProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const BASE_DOMAIN = API_URL?.includes("/api")
    ? API_URL.split("/api")[0]
    : API_URL;

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    if (!token || !id) return;
    try {
      const response = await getOwnProductDetail(token, id);
      setProduct(response.data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to fetch product details");
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

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={{ uri: `${BASE_DOMAIN}${product.image}` }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.category}>
          {product.category} ({product.unit})
        </Text>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{product.price}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Investment</Text>
            <Text style={styles.value}>{product.investment}</Text>
          </View>
        </View>

        <View style={styles.profitCard}>
          <Text style={styles.profitLabel}>Estimated Profit</Text>
          <Text style={styles.profitValue}>{product.profit}</Text>
        </View>

        <Text style={styles.label}>Created At</Text>
        <Text style={styles.date}>
          {new Date(product.created_at).toLocaleDateString()}
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
    padding: 15,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 300,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
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
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  category: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 5,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "600",
  },
  profitCard: {
    backgroundColor: "#1b5e20",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  profitLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginBottom: 5,
  },
  profitValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
  },
});
