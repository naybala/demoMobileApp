import { getDailyIncomes } from "@/src/services/dailyIncomeService";
import { FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
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
  onEditPress: (id: number) => void;
}

export const DailyIncomeList: React.FC<DailyIncomeListProps> = ({
  token,
  borderColor,
  textColor,
  backgroundColor,
  onCreatePress,
  onEditPress,
}) => {
  const [records, setRecords] = useState<DailyIncomeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // date picker visibility
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRecords(1);
    }, []),
  );

  const fetchRecords = async (
    pageNumber: number,
    isRefresh = false,
    searchOverride?: string,
    fromDateOverride?: string,
    toDateOverride?: string,
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await getDailyIncomes(token, {
        page: pageNumber,
        search: searchOverride !== undefined ? searchOverride : search,
        from_date: fromDateOverride !== undefined ? fromDateOverride : fromDate,
        to_date: toDateOverride !== undefined ? toDateOverride : toDate,
      });

      if (pageNumber === 1) setRecords(response.data);
      else setRecords((prev) => [...prev, ...response.data]);

      setLastPage(response.meta.last_page);
      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEditPress(item.id)}
        >
          <FontAwesome name="edit" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* HEADER */}
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

        {/* FILTER BAR */}
        <View style={styles.filterBar}>
          {/* FROM DATE */}
          <TouchableOpacity
            style={[
              styles.filterInput,
              { borderColor, justifyContent: "center" },
            ]}
            onPress={() => setShowFromPicker(true)}
          >
            <Text
              style={{ color: fromDate ? textColor : "#888", fontSize: 12 }}
            >
              {fromDate || "From: YYYY-MM-DD"}
            </Text>
          </TouchableOpacity>

          {/* TO DATE */}
          <TouchableOpacity
            style={[
              styles.filterInput,
              { borderColor, justifyContent: "center" },
            ]}
            onPress={() => setShowToPicker(true)}
          >
            <Text style={{ color: toDate ? textColor : "#888", fontSize: 12 }}>
              {toDate || "To: YYYY-MM-DD"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => fetchRecords(1)}
          >
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>

          {(fromDate !== "" || toDate !== "") && (
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: "#dc3545" }]}
              onPress={() => {
                setFromDate("");
                setToDate("");
                fetchRecords(1, false, undefined, "", "");
              }}
            >
              <FontAwesome name="times" size={12} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* TABLE HEADER */}
        <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
          <Text style={[styles.headerCol, styles.recordColSmall]}>Date</Text>
          <Text style={[styles.headerCol, styles.recordColLarge]}>
            Product/Voucher
          </Text>
          <Text style={[styles.headerCol, styles.recordColSmall]}>Qty</Text>
          <Text style={[styles.headerCol, { width: 30 }]} />
        </View>
      </View>

      {/* LIST */}
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
          loading ? <ActivityIndicator style={{ padding: 20 }} /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No records found.</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* FROM DATE PICKER */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate ? new Date(fromDate) : new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) {
              setFromDate(selectedDate.toISOString().split("T")[0]);
            }
          }}
        />
      )}

      {/* TO DATE PICKER */}
      {showToPicker && (
        <DateTimePicker
          value={toDate ? new Date(toDate) : new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) {
              setToDate(selectedDate.toISOString().split("T")[0]);
            }
          }}
        />
      )}
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
  recordColLarge: { flex: 1, paddingRight: 10 },

  recordTextPrimary: { fontSize: 12, fontWeight: "500" },
  recordTextSecondary: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 2,
    color: "#888",
  },

  editBtn: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: { textAlign: "center", marginTop: 40, opacity: 0.5 },
});
