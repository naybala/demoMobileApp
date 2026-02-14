import { ProductSearchModal } from "@/components/ProductSearchModal";
import { Text, View, useThemeColor } from "@/components/Themed";
import {
  getDailyIncomes,
  storeDailyIncome,
} from "@/src/services/dailyIncomeService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
  basePrice: number;
  baseInvestment: number;
  baseProfit: number;
}

interface DailyIncomeRecord {
  id: number;
  date: string;
  name: string | null;
  own_product_id: number;
  own_product: string;
  amount: string;
  price: string;
  investment: string;
  profit: string;
  unit: string;
  is_instant: number;
  voucher_no: string;
  note: string | null;
}

export default function DailyIncomeScreen() {
  const [view, setView] = useState<"index" | "create">("index");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Index state
  const [records, setRecords] = useState<DailyIncomeRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const token = useAuthStore((state) => state.token);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor(
    { light: "#f9f9f9", dark: "#2a2a2a" },
    "background",
  );
  const borderColor = useThemeColor({ light: "#eee", dark: "#333" }, "text");

  useEffect(() => {
    if (view === "index" && token) {
      fetchRecords(1);
    }
  }, [view, token]);

  const fetchRecords = async (pageNumber: number, isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoadingRecords(true);

    try {
      const response = await getDailyIncomes(token, {
        page: pageNumber,
        search,
        from_date: fromDate,
        to_date: toDate,
      });

      if (pageNumber === 1) {
        setRecords(response.data);
      } else {
        setRecords((prev) => [...prev, ...response.data]);
      }
      setLastPage(response.meta.last_page);
      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to fetch daily incomes", error);
    } finally {
      setLoadingRecords(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchRecords(1, true);
  const handleLoadMore = () => {
    if (page < lastPage && !loadingRecords) fetchRecords(page + 1);
  };

  const formatCurrency = (value: number | string) => {
    const num =
      typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    return num.toLocaleString(undefined, {
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
      await storeDailyIncome(token!, payload);
      Alert.alert("Success", "Daily income saved successfully!");
      setItems([]);
      setView("index");
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

  const renderIndexItem = ({
    item,
    index,
  }: {
    item: DailyIncomeRecord;
    index: number;
  }) => {
    const prevItem = index > 0 ? records[index - 1] : null;
    const hideVoucher = prevItem && prevItem.voucher_no === item.voucher_no;

    return (
      <View style={[styles.recordRow, { borderBottomColor: borderColor }]}>
        <View style={styles.recordColSmall}>
          <Text style={styles.recordTextPrimary}>
            {!hideVoucher ? item.date : ""}
          </Text>
        </View>
        <View style={styles.recordColLarge}>
          <Text style={styles.recordTextSecondary}>
            {!hideVoucher ? item.voucher_no : ""}
          </Text>
          <Text style={styles.recordTextPrimary}>{item.own_product}</Text>
        </View>
        <View style={styles.recordColSmall}>
          <Text style={styles.recordTextPrimary}>{item.amount}</Text>
          <Text style={styles.recordTextSecondary}>{item.unit}</Text>
        </View>
        <View style={styles.recordColMedium}>
          <Text style={styles.recordTextPrimary}>
            {formatCurrency(item.price)}
          </Text>
          <Text style={[styles.recordTextPrimary, { color: "#28a745" }]}>
            {formatCurrency(item.profit)}
          </Text>
        </View>
      </View>
    );
  };

  if (view === "create") {
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
          <View style={styles.viewHeader}>
            <TouchableOpacity onPress={() => setView("index")}>
              <FontAwesome name="arrow-left" size={20} color={textColor} />
            </TouchableOpacity>
            <Text style={styles.viewTitle}>Create Daily Income</Text>
          </View>

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
                    onPress={() => {
                      setActiveItemIndex(index);
                      setIsModalVisible(true);
                    }}
                  >
                    <Text
                      style={
                        item.product_id
                          ? { color: textColor }
                          : { color: "#888" }
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
                    style={[
                      styles.smallInput,
                      { borderColor, color: textColor },
                    ]}
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
                    style={[
                      styles.smallDisplay,
                      { borderColor, color: textColor },
                    ]}
                  >
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                <View style={[styles.gridItem, { flex: 2 }]}>
                  <Text style={styles.itemLabel}>Profit</Text>
                  <Text
                    style={[
                      styles.smallDisplay,
                      { borderColor, color: "#28a745" },
                    ]}
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
                <Text style={styles.totalLabel}>Total Price</Text>
                <Text style={styles.totalPrice}>
                  {formatCurrency(totals.price)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Profit</Text>
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
        </ScrollView>
        <ProductSearchModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSelect={onProductSelect}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.listHeader}>
        <View style={styles.toolbar}>
          <View style={[styles.searchBox, { borderColor }]}>
            <FontAwesome name="search" size={16} color="#888" />
            <TextInput
              style={[styles.searchLabel, { color: textColor }]}
              placeholder="Search products, vouchers..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => fetchRecords(1)}
            />
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setView("create")}
          >
            <FontAwesome name="plus" size={14} color="#fff" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterBar}>
          <TextInput
            style={[styles.filterInput, { borderColor, color: textColor }]}
            placeholder="From: YYYY-MM-DD"
            placeholderTextColor="#888"
            value={fromDate}
            onChangeText={setFromDate}
          />
          <TextInput
            style={[styles.filterInput, { borderColor, color: textColor }]}
            placeholder="To: YYYY-MM-DD"
            placeholderTextColor="#888"
            value={toDate}
            onChangeText={setToDate}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => fetchRecords(1)}
          >
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
          <Text style={[styles.headerCol, styles.recordColSmall]}>Date</Text>
          <Text style={[styles.headerCol, styles.recordColLarge]}>
            Product/Voucher
          </Text>
          <Text style={[styles.headerCol, styles.recordColSmall]}>Qty</Text>
          <Text style={[styles.headerCol, styles.recordColMedium]}>
            Price/Profit
          </Text>
        </View>
      </View>

      <FlatList
        data={records}
        renderItem={renderIndexItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
        ListFooterComponent={
          loadingRecords ? (
            <ActivityIndicator style={{ padding: 20 }} color="#007AFF" />
          ) : null
        }
        ListEmptyComponent={
          !loadingRecords ? (
            <Text style={styles.emptyText}>No records found.</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  viewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  viewTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 15 },
  dateContainer: { marginBottom: 20, backgroundColor: "transparent" },
  label: { fontSize: 16, marginBottom: 8, opacity: 0.8 },
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
  addButtonText: { color: "#fff", fontWeight: "600" },
  itemCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    backgroundColor: "transparent",
  },
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
    backgroundColor: "transparent",
  },
  deleteButton: { marginLeft: 15, padding: 5 },
  gridRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  gridItem: { flex: 1, backgroundColor: "transparent" },
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
    backgroundColor: "transparent",
  },
  totalLabel: { fontSize: 14, opacity: 0.7 },
  totalPrice: { fontSize: 16, fontWeight: "600" },
  totalProfit: { fontSize: 18, fontWeight: "bold", color: "#28a745" },
  listHeader: { padding: 15, paddingBottom: 0 },
  toolbar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: "transparent",
  },
  searchLabel: { flex: 1, marginLeft: 8, fontSize: 14 },
  createBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  createBtnText: { color: "#fff", fontWeight: "600" },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
    backgroundColor: "transparent",
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 35,
    fontSize: 12,
  },
  filterBtn: {
    backgroundColor: "#6c757d",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  filterBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  headerCol: { fontSize: 12, fontWeight: "bold", opacity: 0.6 },
  recordRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 15,
    backgroundColor: "transparent",
  },
  recordColSmall: { width: 60 },
  recordColMedium: { width: 90, alignItems: "flex-end" },
  recordColLarge: { flex: 1, paddingRight: 10 },
  recordTextPrimary: { fontSize: 13, fontWeight: "500" },
  recordTextSecondary: { fontSize: 11, opacity: 0.5, marginBottom: 2 },
  emptyText: { textAlign: "center", marginTop: 40, opacity: 0.5 },
});
