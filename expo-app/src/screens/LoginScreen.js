import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import {
  LightbulbThemeButton,
  WhatsAppSupportSection,
  BiometricSquareButton,
} from "../components/Common";

export function LoginScreen({ isDark, onToggleTheme, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const theme = isDark ? Colors.dark : Colors.light;

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Simulate/perform login
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess({
          name: identifier.trim() || "مندوب مبيعات",
          email: identifier.includes("@") ? identifier.trim() : `${identifier.trim() || "rep"}@naguibselim.com`,
          role: "مندوب مبيعات",
        });
      }, 500);
    } catch (e) {
      setLoading(false);
      setError(e.message || "حدث خطأ أثناء تسجيل الدخول");
    }
  };

  const handleBiometricSuccess = () => {
    onLoginSuccess({
      name: "مندوب مبيعات (بصمة)",
      email: "rep@naguibselim.com",
      role: "مندوب مبيعات",
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Top Header */}
      <View style={styles.topBar}>
        <LightbulbThemeButton isDark={isDark} onToggle={onToggleTheme} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <Image
            source={require("../../assets/ns-mark.png")}
            style={[styles.logoMark, { tintColor: isDark ? "#D2A574" : "#744C27" }]}
            resizeMode="contain"
          />
          <Image
            source={require("../../assets/ns-wordmark.png")}
            style={[styles.logoWordmark, { tintColor: isDark ? "#D2A574" : "#744C27" }]}
            resizeMode="contain"
          />
          <Text style={[styles.appTitle, { color: theme.textMuted }]}>
            عمولات المندوبين
          </Text>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            تسجيل الدخول إلى حسابك
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
            أدخل البريد الإلكتروني أو اسم المستخدم وكلمة المرور للوصول إلى لوحة العمولات.
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.error + "15", borderColor: theme.error }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Identifier field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>اسم المستخدم أو البريد</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="name@naguibselim.com أو nsr305"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, textAlign: "right" }]}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>كلمة المرور</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.border,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { color: theme.text, textAlign: "right" }]}
              />
            </View>
          </View>

          {/* Remember me checkbox */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.rememberRow}
          >
            <Ionicons
              name={rememberMe ? "checkbox" : "square-outline"}
              size={20}
              color={rememberMe ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.rememberText, { color: theme.text }]}>
              تذكرني على هذا الجهاز
            </Text>
          </TouchableOpacity>

          {/* Buttons Row: Sign In + Square Biometric Button */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              style={[
                styles.loginBtn,
                { backgroundColor: theme.primary },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? "#12100E" : "#FFFFFF"} />
              ) : (
                <Text
                  style={[
                    styles.loginBtnText,
                    { color: isDark ? "#12100E" : "#FFFFFF" },
                  ]}
                >
                  تسجيل الدخول
                </Text>
              )}
            </TouchableOpacity>

            <BiometricSquareButton
              isDark={isDark}
              onSuccess={handleBiometricSuccess}
            />
          </View>

          {/* WhatsApp Support Box */}
          <WhatsAppSupportSection isDark={isDark} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: Platform.OS === "ios" ? 54 : 32,
    paddingHorizontal: 20,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  logoMark: {
    width: 68,
    height: 48,
  },
  logoWordmark: {
    width: 140,
    height: 38,
    marginTop: 6,
  },
  appTitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    marginBottom: 18,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    textAlign: "right",
  },
  fieldGroup: {
    marginBottom: 14,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  inputWrapper: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  rememberRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
  },
  rememberText: {
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  loginBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
