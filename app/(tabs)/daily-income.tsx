import { ProductSearchModal } from "@/components/ProductSearchModal";
import { Text, View, useThemeColor } from "@/components/Themed";
import { storeDailyIncome } from "@/src/services/dailyIncomeService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

interface IncomeItem {
  id: string; // Internal unique ID for React list key
  product_id: number | null;
  name: string;
  amount: number;
  unit: string;
  price: number;
  investment: number;
  profit: number;
  // Store base values for calculations
  basePrice: number;
  baseInvestment: number;
  baseProfit: number;
}

export default function DailyIncomeScreen() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const token = useAuthStore((state) => state.token);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor(
    { light: "#f9f9f9", dark: "#2a2a2a" },
    "background",
  );
  const borderColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");

  const addMoreProduct = () => {
    const newItem: IncomeItem = {
      id: Math.random().toString(36).substring(7),
      product_id: null,
      name: "Select an option",
      amount: 1,
      unit: "",
      price: 0,
      investment: 0,
      profit: 0,
      basePrice: 0,
      baseInvestment: 0,
      baseProfit: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const openProductPicker = (index: number) => {
    setActiveItemIndex(index);
    setIsModalVisible(true);
  };

  const onProductSelect = (product: any) => {
    if (activeItemIndex === null) return;

    const newItems = [...items];
    const item = newItems[activeItemIndex];

    const price = parseFloat(product.price.replace(/,/g, ""));
    const investment = parseFloat(product.investment.replace(/,/g, ""));
    const profit = parseFloat(product.profit.replace(/,/g, ""));

    item.product_id = product.id;
    item.name = product.name;
    item.unit = product.unit;
    item.basePrice = price;
    item.baseInvestment = investment;
    item.baseProfit = profit;

    // Trigger calculation
    calculateItem(item, item.amount);
    setItems(newItems);
  };

  const calculateItem = (item: IncomeItem, amount: number) => {
    item.amount = amount;
    item.price = item.basePrice * amount;
    item.investment = item.baseInvestment * amount;
    item.profit = item.baseProfit * amount;
  };

  const handleAmountChange = (index: number, text: string) => {
    const amount = parseInt(text) || 0;
    const newItems = [...items];
    calculateItem(newItems[index], amount);
    setItems(newItems);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one product.");
      return;
    }

    const invalidItems = items.filter((item) => !item.product_id);
    if (invalidItems.length > 0) {
      Alert.alert("Error", "Please select a product for all rows.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        items: items.map((item) => ({
          product_id: item.product_id,
          amount: item.amount,
          price: item.price,
          investment: item.investment,
          profit: item.profit,
        })),
      };

      await storeDailyIncome(token!, payload);
      Alert.alert("Success", "Daily income saved successfully!", [
        { text: "OK", onPress: () => setItems([]) },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save daily income.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Daily Income</Text>

        <View style={styles.dateContainer}>
          <Text style={styles.label}>Date</Text>
          <View style={[styles.dateInput, { borderColor }]}>
            <FontAwesome
              name="calendar"
              size={18}
              color="#888"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={{ flex: 1, color: textColor }}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addMoreProduct}>
          <FontAwesome
            name="plus"
            size={16}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addButtonText}>Add More Product</Text>
        </TouchableOpacity>

        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <View style={styles.row}>
              <View style={{ flex: 1, backgroundColor: "transparent" }}>
                <Text style={styles.itemLabel}>Name</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { borderColor }]}
                  onPress={() => openProductPicker(index)}
                >
                  <Text
                    style={
                      item.product_id ? { color: textColor } : { color: "#888" }
                    }
                  >
                    {item.name}
                  </Text>
                  <FontAwesome name="chevron-down" size={12} color="#888" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeItem(index)}
              >
                <FontAwesome name="trash" size={18} color="#dc3545" />
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Amount</Text>
                <TextInput
                  style={[styles.smallInput, { borderColor, color: textColor }]}
                  keyboardType="numeric"
                  value={item.amount.toString()}
                  onChangeText={(text) => handleAmountChange(index, text)}
                />
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Unit</Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    { borderColor, color: textColor, opacity: 0.7 },
                  ]}
                  value={item.unit}
                  editable={false}
                  placeholder="Unit"
                />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Price</Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    { borderColor, color: textColor, opacity: 0.7 },
                  ]}
                  value={formatCurrency(item.price)}
                  editable={false}
                  placeholder="Price"
                />
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Investment</Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    { borderColor, color: textColor, opacity: 0.7 },
                  ]}
                  value={formatCurrency(item.investment)}
                  editable={false}
                  placeholder="Investment"
                />
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Profit</Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    { borderColor, color: textColor, opacity: 0.7 },
                  ]}
                  value={formatCurrency(item.profit)}
                  editable={false}
                  placeholder="Profit"
                />
              </View>
            </View>
          </View>
        ))}

        {items.length > 0 && (
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Daily Income</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <ProductSearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={onProductSelect}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  dateContainer: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: "transparent",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  itemCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  itemLabel: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: "transparent",
  },
  deleteButton: {
    marginLeft: 15,
    padding: 5,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  gridItem: {
    flex: 1,
    backgroundColor: "transparent",
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    height: 55,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
