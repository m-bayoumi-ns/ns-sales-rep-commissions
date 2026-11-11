import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../theme";
import { LightbulbThemeButton } from "../components/Common";

export function AccountScreen({ isDark, onToggleTheme, user, onLogout }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  const [currentPass, setCurrentPass] = useState("");
  const [nextPass, setNextPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");
  const [testNotifSent, setTestNotifSent] = useState(false);

  const handleSavePassword = () => {
    if (!currentPass || !nextPass || nextPass.length < 8) {
      setPasswordStatus("يرجى إدخال كلمة المرور الحالية وكلمة جديدة لا تقل عن 8 أحرف");
      return;
    }
    if (nextPass !== confirmPass) {
      setPasswordStatus("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }
    setPasswordStatus("تم حفظ كلمة المرور بنجاح ✓");
    setTimeout(() => {
      setPasswordExpanded(false);
      setPasswordStatus("");
      setCurrentPass("");
      setNextPass("");
      setConfirmPass("");
    }, 1500);
  };

  const handleTestNotification = () => {
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.topTitle, { color: theme.text }]}>الملف الشخصي والإعدادات</Text>
        <LightbulbThemeButton isDark={isDark} onToggle={onToggleTheme} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. User Identity Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.surfaceVariant }]}>
            <MaterialCommunityIcons name="account" size={38} color={theme.primary} />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.name || "مندوب مبيعات"}</Text>
          <Text style={[styles.userRole, { color: theme.textMuted }]}>{user?.role || "مندوب مبيعات"}</Text>
          <Text style={[styles.userEmail, { color: theme.primary }]}>{user?.email || "rep@naguibselim.com"}</Text>
        </View>

        {/* 2. Main Settings Card with 4 expandable sections in exact requested order */}
        <View style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>الإعدادات</Text>

          {/* 1. تغيير كلمة المرور */}
          <View style={[styles.expandableBox, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPasswordExpanded(!passwordExpanded)}
              style={styles.boxHeaderRow}
            >
              <View style={styles.boxHeaderTitle}>
                <Ionicons name="key-outline" size={17} color={theme.primary} />
                <Text style={[styles.boxTitleText, { color: theme.text }]}>تغيير كلمة المرور</Text>
              </View>
              <Ionicons
                name={passwordExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {passwordExpanded && (
              <View style={styles.expandedContent}>
                {passwordStatus ? (
                  <View style={[styles.statusMsg, { backgroundColor: theme.primary + "18" }]}>
                    <Text style={{ color: theme.primary, fontSize: 12, textAlign: "right" }}>{passwordStatus}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>كلمة المرور الحالية</Text>
                  <TextInput
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    secureTextEntry={!showPass}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>كلمة المرور الجديدة (8 أحرف على الأقل)</Text>
                  <TextInput
                    value={nextPass}
                    onChangeText={setNextPass}
                    secureTextEntry={!showPass}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>تأكيد كلمة المرور الجديدة</Text>
                  <TextInput
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    secureTextEntry={!showPass}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSavePassword}
                  style={[styles.savePassBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: isDark ? "#12100E" : "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                    حفظ كلمة المرور
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 2. تغيير الوضع / المظهر */}
          <View style={[styles.expandableBox, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAppearanceExpanded(!appearanceExpanded)}
              style={styles.boxHeaderRow}
            >
              <View style={styles.boxHeaderTitle}>
                <Ionicons name="sunny-outline" size={17} color={theme.primary} />
                <Text style={[styles.boxTitleText, { color: theme.text }]}>تغيير الوضع / المظهر</Text>
              </View>
              <Ionicons
                name={appearanceExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {appearanceExpanded && (
              <View style={[styles.expandedContent, { flexDirection: "row-reverse", gap: 8 }]}>
                <TouchableOpacity
                  onPress={onToggleTheme}
                  activeOpacity={0.7}
                  style={[
                    styles.prefChoiceBtn,
                    {
                      backgroundColor: !isDark ? theme.primary : theme.surface,
                      borderColor: !isDark ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons name="sunny-outline" size={15} color={!isDark ? "#FFFFFF" : theme.textMuted} />
                  <Text style={{ color: !isDark ? "#FFFFFF" : theme.textMuted, fontSize: 13, fontWeight: "600" }}>فاتح</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onToggleTheme}
                  activeOpacity={0.7}
                  style={[
                    styles.prefChoiceBtn,
                    {
                      backgroundColor: isDark ? theme.primary : theme.surface,
                      borderColor: isDark ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons name="moon-outline" size={15} color={isDark ? "#12100E" : theme.textMuted} />
                  <Text style={{ color: isDark ? "#12100E" : theme.textMuted, fontSize: 13, fontWeight: "600" }}>داكن</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 3. تغيير اللغة */}
          <View style={[styles.expandableBox, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setLanguageExpanded(!languageExpanded)}
              style={styles.boxHeaderRow}
            >
              <View style={styles.boxHeaderTitle}>
                <Ionicons name="globe-outline" size={17} color={theme.primary} />
                <Text style={[styles.boxTitleText, { color: theme.text }]}>تغيير اللغة</Text>
              </View>
              <Ionicons
                name={languageExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {languageExpanded && (
              <View style={[styles.expandedContent, { flexDirection: "row-reverse", gap: 8 }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.prefChoiceBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <Text style={{ color: isDark ? "#12100E" : "#FFFFFF", fontSize: 13, fontWeight: "600" }}>العربية</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.prefChoiceBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>English</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 4. إشعارات الهاتف */}
          <View style={[styles.expandableBox, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setNotificationsExpanded(!notificationsExpanded)}
              style={styles.boxHeaderRow}
            >
              <View style={styles.boxHeaderTitle}>
                <Ionicons name="notifications-outline" size={17} color={theme.primary} />
                <Text style={[styles.boxTitleText, { color: theme.text }]}>إشعارات الهاتف</Text>
              </View>
              <Ionicons
                name={notificationsExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {notificationsExpanded && (
              <View style={styles.expandedContent}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                  <Text style={{ color: theme.success, fontSize: 13, fontWeight: "600" }}>
                    إشعارات الهاتف مفعلة وتعمل على هذا الجهاز
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleTestNotification}
                  style={[styles.testNotifBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                >
                  <Text style={{ color: testNotifSent ? theme.success : theme.text, fontSize: 13, fontWeight: "600" }}>
                    {testNotifSent ? "تم إرسال إشعار تجريبي ✓" : "إرسال إشعار تجريبي"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onLogout}
            style={[styles.logoutBtn, { borderColor: theme.error }]}
          >
            <Ionicons name="log-out-outline" size={19} color={theme.error} />
            <Text style={[styles.logoutBtnText, { color: theme.error }]}>تسجيل الخروج من الحساب</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingTop: Platform.OS === "ios" ? 50 : 28,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: "bold",
  },
  userRole: {
    fontSize: 12,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 2,
  },
  expandableBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  boxHeaderRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boxHeaderTitle: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  boxTitleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  expandedContent: {
    paddingTop: 12,
    gap: 10,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  inputField: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    textAlign: "right",
  },
  savePassBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  statusMsg: {
    padding: 8,
    borderRadius: 8,
  },
  prefChoiceBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  testNotifBtn: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  logoutBtn: {
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
