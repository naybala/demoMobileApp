import { Text, View } from "@/components/Themed";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { getOwnProducts } from "../../src/services/ownProductService";
import { useAuthStore } from "../../src/store/useAuthStore";

interface OwnProduct {
  id: number;
  name: string;
  unit: string;
  category: string;
  price: string;
  investment: string;
  profit: string;
  image: string;
  created_at: string;
}

export default function OwnProductsScreen() {
  const [products, setProducts] = useState<OwnProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const token = useAuthStore((state) => state.token);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const BASE_DOMAIN = API_URL?.includes("/api")
    ? API_URL.split("/api")[0]
    : API_URL;

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = async (pageNumber: number) => {
    if (!token) return;
    if (pageNumber > 1) setLoadingMore(true);

    try {
      const response = await getOwnProducts(token, pageNumber);
      if (pageNumber === 1) {
        setProducts(response.data);
      } else {
        setProducts((prev) => [...prev, ...response.data]);
      }
      setLastPage(response.meta.last_page);
      setPage(pageNumber);
    } catch (error: any) {
      Alert.alert("Error", "Failed to fetch products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < lastPage) {
      fetchProducts(page + 1);
    }
  };

  const renderItem = ({ item }: { item: OwnProduct }) => (
    <View style={styles.item}>
      <Image
        source={{ uri: `${BASE_DOMAIN}${item.image}` }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>
          {item.category} ({item.unit})
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{item.price}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Profit</Text>
            <Text style={[styles.priceValue, { color: "#28a745" }]}>
              {item.profit}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centered}>
              <Text>No products found.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  listContent: {
    padding: 10,
  },
  item: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: "#f0f0f0",
  },
  details: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  category: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceBox: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: "#999",
    textTransform: "uppercase",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
