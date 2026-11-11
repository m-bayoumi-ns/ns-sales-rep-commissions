import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../theme";

export function BottomNavBar({ activeTab, onSelectTab, isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const tabs = [
    { id: "statement", label: "الكشف", icon: "document-text-outline", activeIcon: "document-text" },
    { id: "collections", label: "التحصيل", isCustom: "collections" },
    { id: "home", label: "الرئيسية", isCenter: true },
    { id: "sales", label: "المبيعات", icon: "trending-up", activeIcon: "trending-up", isCustom: "sales" },
    { id: "account", label: "حسابي", isCustom: "account" },
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <View key={tab.id} style={styles.centerContainer}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onSelectTab("home")}
                  style={[
                    styles.centerButton,
                    {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                    },
                  ]}
                >
                  <Image
                    source={require("../../assets/ns-mark.png")}
                    style={{ width: 28, height: 28, tintColor: isDark ? "#12100E" : "#FFFFFF" }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? theme.primary : theme.textMuted,
                      fontWeight: isActive ? "bold" : "normal",
                      marginTop: 4,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabItem}
            >
              {tab.isCustom === "account" ? (
                <MaterialCommunityIcons
                  name={isActive ? "account-cog" : "account-cog-outline"}
                  size={23}
                  color={isActive ? theme.primary : theme.textMuted}
                />
              ) : tab.isCustom === "collections" ? (
                <MaterialCommunityIcons
                  name="hand-coin-outline"
                  size={22}
                  color={isActive ? theme.primary : theme.textMuted}
                />
              ) : tab.isCustom === "sales" ? (
                <MaterialCommunityIcons
                  name="chart-line-variant"
                  size={22}
                  color={isActive ? theme.primary : theme.textMuted}
                />
              ) : (
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? theme.primary : theme.textMuted}
                />
              )}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.primary : theme.textMuted,
                    fontWeight: isActive ? "bold" : "normal",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 6,
    elevation: 10,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  container: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
    height: 54,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    top: -12,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  label: {
    fontSize: 10,
  },
});
