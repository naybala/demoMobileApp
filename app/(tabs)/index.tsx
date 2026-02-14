import { Text, View } from "@/components/Themed";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet } from "react-native";
import { getCategories } from "../../src/services/categoryService";
import { useAuthStore } from "../../src/store/useAuthStore";

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    fetchCategories(1);
  }, []);

  const fetchCategories = async (pageNumber: number) => {
    if (!token) return;
    if (pageNumber > 1) setLoadingMore(true);

    try {
      const response = await getCategories(token, pageNumber);
      if (pageNumber === 1) {
        setCategories(response.data);
      } else {
        setCategories((prev) => [...prev, ...response.data]);
      }
      setLastPage(response.meta.last_page);
      setPage(pageNumber);
    } catch (error: any) {
      Alert.alert("Error", "Failed to fetch categories");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < lastPage) {
      fetchCategories(page + 1);
    }
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.item}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
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
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centered}>
              <Text>No categories found.</Text>
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
    padding: 15,
  },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  itemDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
