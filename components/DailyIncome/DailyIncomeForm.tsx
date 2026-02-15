import {
  getDailyIncomeDetail,
  storeDailyIncome,
  updateDailyIncome,
} from "@/src/services/dailyIncomeService";
import { FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
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
  editId?: number | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const DailyIncomeForm: React.FC<DailyIncomeFormProps> = ({
  token,
  backgroundColor,
  textColor,
  cardColor,
  borderColor,
  editId,
  onBack,
  onSuccess,
}) => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [voucherNo, setVoucherNo] = useState<string | null>(null);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [isInstant, setIsInstant] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editId) {
      loadDetail();
    } else {
      setVoucherNo(null);
    }
  }, [editId]);

  const loadDetail = async () => {
    setFetching(true);
    try {
      const response = await getDailyIncomeDetail(token, editId!);
      const record = response.data;
      setDate(new Date(record.date));
      setVoucherNo(record.voucher_no);
      setIsInstant(record.is_instant === 1 || record.is_instant === true);
      setNote(record.note || "");

      const mappedItems: IncomeItem[] = record.items.map((item: any) => {
        const price = parseFloat(item.price.replace(/,/g, ""));
        const investment = parseFloat(item.investment.replace(/,/g, ""));
        const profit = parseFloat(item.profit.replace(/,/g, ""));
        const amount = parseFloat(item.amount);

        return {
          id: Math.random().toString(36).substring(7),
          product_id: item.own_product_id,
          name: item.own_product,
          amount: amount,
          unit: item.unit,
          unit_id: item.unit_id,
          price: price,
          investment: investment,
          profit: profit,
          basePrice: price / amount,
          baseInvestment: investment / amount,
          baseProfit: profit / amount,
        };
      });
      setItems(mappedItems);
    } catch (error) {
      Alert.alert("Error", "Failed to load details.");
      onBack();
    } finally {
      setFetching(false);
    }
  };

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
        unit_id: null,
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
    item.unit_id = product.unit_id;
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
        date: date.toISOString().split("T")[0],
        is_instant: isInstant ? 1 : 0,
        note,
        items: items.map((i) => ({
          product_id: i.product_id,
          amount: i.amount,
          price: i.price,
          investment: i.investment,
          profit: i.profit,
          unit_id: i.unit_id,
        })),
      };
      if (editId) {
        await updateDailyIncome(token, editId, payload);
        Alert.alert("Success", "Daily income updated successfully!");
      } else {
        await storeDailyIncome(token, payload);
        Alert.alert("Success", "Daily income saved successfully!");
      }
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

  if (fetching) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Loading details...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Internal header removed in favor of Stack.Screen */}

      {voucherNo && (
        <Text style={[styles.voucherBadge, { color: textColor, borderColor }]}>
          Voucher: {voucherNo}
        </Text>
      )}

      <View style={styles.dateContainer}>
        <Text style={[styles.label, { color: textColor }]}>Date</Text>
        <TouchableOpacity
          style={[styles.dateInput, { borderColor }]}
          onPress={() => setShowDatePicker(true)}
        >
          <FontAwesome
            name="calendar"
            size={18}
            color="#888"
            style={{ marginRight: 10 }}
          />
          <Text style={{ flex: 1, color: textColor }}>
            {date.toISOString().split("T")[0]}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

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
              Total Investment
            </Text>
            <Text style={[styles.totalPrice, { color: textColor }]}>
              {formatCurrency(totals.investment)}
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

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsInstant(!isInstant)}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor },
            isInstant && styles.checkboxActive,
          ]}
        >
          {isInstant && <FontAwesome name="check" size={12} color="#fff" />}
        </View>
        <Text style={[styles.checkboxLabel, { color: textColor }]}>
          Is Instant
        </Text>
      </TouchableOpacity>

      <View style={styles.noteContainer}>
        <Text style={[styles.label, { color: textColor }]}>Note</Text>
        <TextInput
          style={[styles.noteInput, { borderColor, color: textColor }]}
          multiline
          numberOfLines={4}
          placeholder="Enter note here..."
          placeholderTextColor="#888"
          value={note}
          onChangeText={setNote}
        />
      </View>

      {items.length > 0 && (
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading || fetching}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {editId ? "Update" : "Submit"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <ProductSearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={handleProductSelect}
      />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  viewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  viewTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 15 },
  voucherBadge: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: 15,
    paddingHorizontal: 4,
  },
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
    color: "#6d6868ff",
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
    height: 50,
    fontSize: 14,
    backgroundColor: "transparent",
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  noteContainer: {
    marginBottom: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.7,
  },
});
