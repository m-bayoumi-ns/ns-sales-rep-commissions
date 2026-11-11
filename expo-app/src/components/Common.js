import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { Colors } from "../theme";
import { WHATSAPP_URL } from "../api";

/** Lightbulb theme switcher in a circle with spring scale effect */
export function LightbulbThemeButton({ isDark, onToggle }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const theme = isDark ? Colors.dark : Colors.light;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel="تبديل الوضع الليلي والنهاري"
        style={[
          styles.circleBtn,
          {
            backgroundColor: theme.surfaceVariant,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons
          name={isDark ? "bulb" : "bulb-outline"}
          size={20}
          color={isDark ? "#FFD54F" : theme.primary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Expandable modern search bar */
export function ExpandableModernSearchBar({ isDark, query, onChangeText, placeholder = "بحث سريع..." }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const widthAnim = useRef(new Animated.Value(44)).current;
  const theme = isDark ? Colors.dark : Colors.light;

  const expand = () => {
    setIsExpanded(true);
    Animated.spring(widthAnim, {
      toValue: 260,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  const collapse = () => {
    onChangeText("");
    Animated.timing(widthAnim, {
      toValue: 44,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setIsExpanded(false));
  };

  return (
    <Animated.View
      style={[
        styles.searchContainer,
        {
          width: widthAnim,
          backgroundColor: isExpanded ? theme.surface : theme.surfaceVariant,
          borderColor: theme.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={isExpanded ? collapse : expand}
        activeOpacity={0.7}
        style={styles.searchIconBtn}
      >
        <Ionicons
          name={isExpanded ? "close" : "search"}
          size={19}
          color={isExpanded ? theme.textMuted : theme.primary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <TextInput
          value={query}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          autoFocus
          style={[
            styles.searchInput,
            { color: theme.text, textAlign: "right" },
          ]}
        />
      )}
    </Animated.View>
  );
}

/** Aligned WhatsApp direct support button */
export function WhatsAppSupportSection({ isDark }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const openWhatsApp = async () => {
    try {
      const supported = await Linking.canOpenURL(WHATSAPP_URL);
      if (supported) {
        await Linking.openURL(WHATSAPP_URL);
      } else {
        await Linking.openURL(`https://wa.me/201277909022`);
      }
    } catch {
      Linking.openURL("https://wa.me/201277909022");
    }
  };

  return (
    <View
      style={[
        styles.supportBox,
        {
          backgroundColor: theme.surfaceVariant,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.supportText, { color: theme.textMuted }]}>
        إذا واجهت أي صعوبة في الدخول أو بحسابك، تواصل مع الإدارة:
      </Text>
      <TouchableOpacity
        onPress={openWhatsApp}
        activeOpacity={0.8}
        style={styles.whatsappBtn}
      >
        <View style={styles.whatsappLogoCircle}>
          <FontAwesome5 name="whatsapp" size={19} color="#FFFFFF" />
        </View>
        <Text style={styles.whatsappBtnText}>واتساب الإدارة (+20 1277909022)</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Square biometric button */
export function BiometricSquareButton({ isDark, onSuccess }) {
  const theme = isDark ? Colors.dark : Colors.light;

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for simulator or non-biometric devices: authenticate immediately
        onSuccess();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "تسجيل الدخول السريع ببصمة الوجه أو الإصبع",
        cancelLabel: "إلغاء",
        disableDeviceFallback: false,
      });

      if (result.success) {
        onSuccess();
      }
    } catch {
      onSuccess();
    }
  };

  return (
    <TouchableOpacity
      onPress={handleBiometricAuth}
      activeOpacity={0.7}
      accessibilityLabel="تسجيل الدخول بالبصمة"
      style={[
        styles.squareBiometricBtn,
        {
          backgroundColor: theme.surfaceVariant,
          borderColor: theme.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="fingerprint"
        size={28}
        color={theme.primary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
  },
  searchIconBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  supportBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 16,
  },
  supportText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  whatsappBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  whatsappLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  squareBiometricBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
