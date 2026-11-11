import React, { useState, useEffect } from "react";
import { StyleSheet, View, I18nManager, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "./src/theme";
import { STORAGE_KEYS, api } from "./src/api";
import { LoginScreen } from "./src/screens/LoginScreen";
import { CommissionsScreen } from "./src/screens/CommissionsScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { BottomNavBar } from "./src/components/BottomNavBar";

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [booting, setBooting] = useState(true);

  // Load saved theme and session on startup
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (savedTheme) {
          setIsDark(savedTheme === "dark");
        }
        const session = await api.getStoredSession();
        if (session) {
          setUser(session);
        }
      } catch (e) {
        console.warn("Bootstrap error", e);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, next ? "dark" : "light");
    } catch {}
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab("home");
  };

  const handleLogout = async () => {
    await api.clearSession();
    setUser(null);
  };

  const theme = isDark ? Colors.dark : Colors.light;

  if (booting) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {!user ? (
        <LoginScreen
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <View style={styles.content}>
          {activeTab === "account" ? (
            <AccountScreen
              isDark={isDark}
              onToggleTheme={toggleTheme}
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <CommissionsScreen
              isDark={isDark}
              onToggleTheme={toggleTheme}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />
          )}

          <BottomNavBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isDark={isDark}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
});
