import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { getOwnProducts } from "../src/services/ownProductService";
import { useAuthStore } from "../src/store/useAuthStore";
import { Text, View, useThemeColor } from "./Themed";

interface Product {
  id: number;
  name: string;
  unit: string;
  price: string;
  investment: string;
  profit: string;
}

interface ProductSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export function ProductSearchModal({
  visible,
  onClose,
  onSelect,
}: ProductSearchModalProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");

  useEffect(() => {
    if (visible && token) {
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // For now, load first 50 products and filter locally
      // If the API supports search, it should be updated here
      const response = await getOwnProducts(token!, 1);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error("Failed to load products for search", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
    setFilteredProducts(filtered);
  }, [search, products]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Product</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { borderColor }]}>
            <FontAwesome
              name="search"
              size={18}
              color={textColor}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.productItem,
                    { borderBottomColor: borderColor },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productInfo}>
                    {item.unit} - {item.price}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No products found.</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 45,
    backgroundColor: "transparent",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  productItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
  },
  productInfo: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    opacity: 0.5,
  },
});
