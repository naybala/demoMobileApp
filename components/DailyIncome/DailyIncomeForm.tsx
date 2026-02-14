import { storeDailyIncome } from "@/src/services/dailyIncomeService";
import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ProductSearchModal } from "../ProductSearchModal";
import { IncomeItem } from "./types";

interface DailyIncomeFormProps {
  token: string;
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  borderColor: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const DailyIncomeForm: React.FC<DailyIncomeFormProps> = ({
  token,
  backgroundColor,
  textColor,
  cardColor,
  borderColor,
  onBack,
  onSuccess,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addMoreProduct = () => {
    setItems([
      ...items,
      {
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
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (product: any) => {
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

    item.price = item.basePrice * item.amount;
    item.investment = item.baseInvestment * item.amount;
    item.profit = item.baseProfit * item.amount;
    setItems(newItems);
  };

  const handleAmountChange = (index: number, text: string) => {
    const amount = parseInt(text) || 0;
    const newItems = [...items];
    const item = newItems[index];
    item.amount = amount;
    item.price = item.basePrice * amount;
    item.investment = item.baseInvestment * amount;
    item.profit = item.baseProfit * amount;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (items.length === 0 || items.some((i) => !i.product_id)) {
      Alert.alert("Error", "Please complete all product entries.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        items: items.map((i) => ({
          product_id: i.product_id,
          amount: i.amount,
          price: i.price,
          investment: i.investment,
          profit: i.profit,
        })),
      };
      await storeDailyIncome(token, payload);
      Alert.alert("Success", "Daily income saved successfully!");
      onSuccess();
    } catch (error) {
      Alert.alert("Error", "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const totals = items.reduce(
    (acc, item) => ({
      price: acc.price + item.price,
      investment: acc.investment + item.investment,
      profit: acc.profit + item.profit,
    }),
    { price: 0, investment: 0, profit: 0 },
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.viewHeader}>
        <TouchableOpacity onPress={onBack}>
          <FontAwesome name="arrow-left" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: textColor }]}>
          Create Daily Income
        </Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={[styles.label, { color: textColor }]}>Date</Text>
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
          style={[styles.itemCard, { backgroundColor: cardColor, borderColor }]}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>Name</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { borderColor }]}
                onPress={() => {
                  setActiveItemIndex(index);
                  setIsModalVisible(true);
                }}
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
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.gridItem, { flex: 2 }]}>
              <Text style={styles.itemLabel}>Price</Text>
              <Text
                style={[styles.smallDisplay, { borderColor, color: textColor }]}
              >
                {formatCurrency(item.price)}
              </Text>
            </View>
            <View style={[styles.gridItem, { flex: 2 }]}>
              <Text style={styles.itemLabel}>Profit</Text>
              <Text
                style={[styles.smallDisplay, { borderColor, color: "#28a745" }]}
              >
                {formatCurrency(item.profit)}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {items.length > 0 && (
        <View
          style={[
            styles.totalsCard,
            { borderColor, backgroundColor: cardColor },
          ]}
        >
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: textColor }]}>
              Total Price
            </Text>
            <Text style={[styles.totalPrice, { color: textColor }]}>
              {formatCurrency(totals.price)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: textColor }]}>
              Total Profit
            </Text>
            <Text style={styles.totalProfit}>
              {formatCurrency(totals.profit)}
            </Text>
          </View>
        </View>
      )}

      {items.length > 0 && (
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      )}

      <ProductSearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={handleProductSelect}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  viewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  viewTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 15 },
  dateContainer: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, opacity: 0.8 },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
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
  addButtonText: { color: "#fff", fontWeight: "600" },
  itemCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  itemLabel: {
    fontSize: 10,
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
    height: 45,
  },
  deleteButton: { marginLeft: 15, padding: 5 },
  gridRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  gridItem: { flex: 1 },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    fontSize: 14,
  },
  smallDisplay: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    fontSize: 14,
    textAlignVertical: "center",
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  totalsCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  totalLabel: { fontSize: 14, opacity: 0.7 },
  totalPrice: { fontSize: 16, fontWeight: "600" },
  totalProfit: { fontSize: 18, fontWeight: "bold", color: "#28a745" },
});
