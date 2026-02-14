import { getDailyIncomes } from "@/src/services/dailyIncomeService";
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DailyIncomeRecord } from "./types";

interface DailyIncomeListProps {
  token: string;
  borderColor: string;
  textColor: string;
  backgroundColor: string;
  onCreatePress: () => void;
}

export const DailyIncomeList: React.FC<DailyIncomeListProps> = ({
  token,
  borderColor,
  textColor,
  backgroundColor,
  onCreatePress,
}) => {
  const [records, setRecords] = useState<DailyIncomeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchRecords(1);
  }, []);

  const fetchRecords = async (pageNumber: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

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
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ""));
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderItem = ({
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
          <Text style={[styles.recordTextPrimary, { color: textColor }]}>
            {!hideVoucher ? item.date : ""}
          </Text>
        </View>
        <View style={styles.recordColLarge}>
          <Text style={styles.recordTextSecondary}>
            {!hideVoucher ? item.voucher_no : ""}
          </Text>
          <Text style={[styles.recordTextPrimary, { color: textColor }]}>
            {item.own_product}
          </Text>
        </View>
        <View style={styles.recordColSmall}>
          <Text style={[styles.recordTextPrimary, { color: textColor }]}>
            {item.amount}
          </Text>
          <Text style={styles.recordTextSecondary}>{item.unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
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
          <TouchableOpacity style={styles.createBtn} onPress={onCreatePress}>
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
        </View>
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() =>
          page < lastPage && !loading && fetchRecords(page + 1)
        }
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRecords(1, true)}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator style={{ padding: 20 }} color="#007AFF" />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No records found.</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listHeader: { padding: 15, paddingBottom: 0 },
  toolbar: { flexDirection: "row", gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
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
  filterBar: { flexDirection: "row", gap: 8, marginBottom: 15 },
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
  },
  headerCol: { fontSize: 12, fontWeight: "bold", opacity: 0.6, color: "#888" },
  recordRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 15,
  },
  recordColSmall: { width: 80 },
  recordColMedium: { width: 90, alignItems: "flex-end" },
  recordColLarge: { flex: 1, paddingRight: 10 },
  recordTextPrimary: { fontSize: 12, fontWeight: "500" },
  recordTextSecondary: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 2,
    color: "#888",
  },
  emptyText: { textAlign: "center", marginTop: 40, opacity: 0.5 },
});
