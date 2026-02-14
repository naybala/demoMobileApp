import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { logout as apiLogout } from "@/src/services/authService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Alert, TouchableOpacity, View } from "react-native";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { token, user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            if (token && user) {
              await apiLogout(token, user.id);
            }
          } catch (error) {
            console.error("Logout failed", error);
          } finally {
            logout();
          }
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTintColor: "#000",
        headerRight: () => (
          <View style={{ flexDirection: "row", marginRight: 15 }}>
            <TouchableOpacity onPress={handleLogout}>
              <FontAwesome name="sign-out" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Categories",
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="own-products"
        options={{
          title: "Own Products",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="shopping-basket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="daily-income"
        options={{
          title: "Daily Income",
          tabBarIcon: ({ color }) => <TabBarIcon name="money" color={color} />,
        }}
      />
    </Tabs>
  );
}
