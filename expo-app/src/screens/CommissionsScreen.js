import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, formatCurrency, formatNumber, formatPercent } from "../theme";
import { LightbulbThemeButton, ExpandableModernSearchBar } from "../components/Common";
import { DemoRepDetail } from "../api";

export function CommissionsScreen({ isDark, onToggleTheme, activeTab, onSelectTab }) {
  const theme = isDark ? Colors.dark : Colors.light;
  const detail = DemoRepDetail;

  // Sales subcategory
  const [salesCategory, setSalesCategory] = useState(null); // 'day' | 'customer' | 'invoice' | 'product' | null
  const [searchQuery, setSearchQuery] = useState("");

  const salesCategories = [
    { id: "day", title: "حسب اليوم", subtitle: "المبيعات اليومية خلال الشهر", icon: "calendar-outline" },
    { id: "customer", title: "حسب العميل", subtitle: "إجمالي فواتير ومسحوبات كل عميل", icon: "people-outline" },
    { id: "invoice", title: "حسب الفاتورة", subtitle: "سجل الفواتير والإشعارات", icon: "document-text-outline" },
    { id: "product", title: "حسب المنتج", subtitle: "أصناف السيراميك والبورسلين", icon: "cube-outline" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/ns-mark.png")}
            style={[styles.smallLogo, { tintColor: isDark ? "#D2A574" : "#744C27" }]}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>عمولات نجيب سليم</Text>
            <Text style={[styles.repName, { color: theme.textMuted }]}>{detail.repName}</Text>
          </View>
        </View>
        <LightbulbThemeButton isDark={isDark} onToggle={onToggleTheme} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TAB 1: HOME SUMMARY */}
        {activeTab === "home" && (
          <View style={styles.tabContent}>
            {/* Hero Gradient Card */}
            <LinearGradient
              colors={theme.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>صافي عمولة الشهر الحالية (MTD)</Text>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>نوفمبر 2026</Text>
                </View>
              </View>

              <Text style={styles.heroAmount}>{formatCurrency(detail.commissionMtd)}</Text>

              {/* Target progress bar */}
              <View style={styles.targetProgressContainer}>
                <View style={styles.targetLabelRow}>
                  <Text style={styles.targetSubText}>نسبة تحقيق الهدف</Text>
                  <Text style={styles.targetPercentText}>{formatPercent(detail.achievementRate)}</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(detail.achievementRate * 100, 100)}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Stats Grid inside Hero */}
              <View style={styles.heroStatsGrid}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>مبيعات الشهر</Text>
                  <Text style={styles.heroStatVal}>{formatCurrency(detail.salesMtd)}</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>المستهدف الشهري</Text>
                  <Text style={styles.heroStatVal}>{formatCurrency(detail.target)}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Quick Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="trending-up" size={24} color={theme.primary} />
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>توقع نهاية الشهر</Text>
                <Text style={[styles.metricVal, { color: theme.text }]}>{formatCurrency(detail.runRateCommission)}</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="account-cash-outline" size={24} color={theme.success} />
                <Text style={[styles.metricLabel, { color: theme.textMuted }]}>إجمالي التحصيل</Text>
                <Text style={[styles.metricVal, { color: theme.text }]}>{formatCurrency(detail.collectionsTotal)}</Text>
              </View>
            </View>

            {/* Shortcut button to sales */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSelectTab("sales")}
              style={[styles.actionBanner, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.primary} />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>تفاصيل المبيعات والفواتير</Text>
                <Text style={[styles.actionSubtitle, { color: theme.textMuted }]}>استعراض المبيعات حسب اليوم، العميل، والمنتج</Text>
              </View>
              <MaterialCommunityIcons name="chart-box-outline" size={28} color={theme.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: SALES */}
        {activeTab === "sales" && (
          <View style={styles.tabContent}>
            {!salesCategory ? (
              // 4 Category selection cards
              <View>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>تحليلات المبيعات</Text>
                <Text style={[styles.sectionSubheading, { color: theme.textMuted }]}>اختر طريقة استعراض الفواتير والمبيعات:</Text>
                <View style={styles.categoriesList}>
                  {salesCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSalesCategory(cat.id);
                        setSearchQuery("");
                      }}
                      style={[styles.catCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.textMuted} />
                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <Text style={[styles.catTitle, { color: theme.text }]}>{cat.title}</Text>
                        <Text style={[styles.catSubtitle, { color: theme.textMuted }]}>{cat.subtitle}</Text>
                      </View>
                      <View style={[styles.catIconWrap, { backgroundColor: theme.surfaceVariant }]}>
                        <Ionicons name={cat.icon} size={22} color={theme.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // Sub-page with modern title + Expandable search bar
              <View>
                <View style={styles.subHeaderRow}>
                  <ExpandableModernSearchBar
                    isDark={isDark}
                    query={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={[styles.subPageTitle, { color: theme.text }]}>
                      {salesCategories.find((c) => c.id === salesCategory)?.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSalesCategory(null)}
                    style={[styles.backBtn, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                  >
                    <Ionicons name="arrow-forward" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                {/* Filtered items */}
                {salesCategory === "day" && (
                  <View style={styles.itemsList}>
                    {detail.salesByDay
                      .filter((d) => !searchQuery || d.label.includes(searchQuery))
                      .map((d, i) => (
                        <View key={i} style={[styles.dataRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <Text style={[styles.dataAmount, { color: theme.primary }]}>{formatCurrency(d.amount)}</Text>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.dataTitle, { color: theme.text }]}>{d.label}</Text>
                            <Text style={[styles.dataSub, { color: theme.textMuted }]}>{d.invoicesCount} فواتير</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}

                {salesCategory === "customer" && (
                  <View style={styles.itemsList}>
                    {detail.salesByCustomer
                      .filter((c) => !searchQuery || c.name.includes(searchQuery))
                      .map((c, i) => (
                        <View key={i} style={[styles.dataRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <View style={{ alignItems: "flex-start" }}>
                            <Text style={[styles.dataAmount, { color: theme.primary }]}>{formatCurrency(c.amount)}</Text>
                            <Text style={[styles.dataSub, { color: theme.error }]}>متبقي: {formatCurrency(c.balance)}</Text>
                          </View>
                          <View style={{ flex: 1, alignItems: "flex-end" }}>
                            <Text style={[styles.dataTitle, { color: theme.text }]}>{c.name}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}

                {salesCategory === "invoice" && (
                  <View style={styles.itemsList}>
                    {detail.salesByInvoice
                      .filter((inv) => !searchQuery || inv.number.includes(searchQuery) || inv.customer.includes(searchQuery))
                      .map((inv, i) => (
                        <View key={i} style={[styles.dataRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <Text style={[styles.dataAmount, { color: theme.primary }]}>{formatCurrency(inv.amount)}</Text>
                          <View style={{ flex: 1, alignItems: "flex-end" }}>
                            <Text style={[styles.dataTitle, { color: theme.text }]}>{inv.number}</Text>
                            <Text style={[styles.dataSub, { color: theme.textMuted }]}>{inv.customer} • {inv.date}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}

                {salesCategory === "product" && (
                  <View style={styles.itemsList}>
                    {detail.salesByProduct
                      .filter((p) => !searchQuery || p.name.includes(searchQuery))
                      .map((p, i) => (
                        <View key={i} style={[styles.dataRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <View style={{ alignItems: "flex-start" }}>
                            <Text style={[styles.dataAmount, { color: theme.primary }]}>{formatCurrency(p.amount)}</Text>
                            <Text style={[styles.dataSub, { color: theme.textMuted }]}>{p.qty} متر / قطعة</Text>
                          </View>
                          <View style={{ flex: 1, alignItems: "flex-end" }}>
                            <Text style={[styles.dataTitle, { color: theme.text }]}>{p.name}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: COLLECTIONS */}
        {activeTab === "collections" && (
          <View style={styles.tabContent}>
            {/* Total collections card */}
            <View style={[styles.collectionsHero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconBadgeLarge, { backgroundColor: theme.surfaceVariant }]}>
                <MaterialCommunityIcons name="account-cash" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.collectionsLabel, { color: theme.textMuted }]}>إجمالي المبالغ المحصلة</Text>
              <Text style={[styles.collectionsAmount, { color: theme.text }]}>{formatCurrency(detail.collectionsTotal)}</Text>
              <View style={[styles.rateTag, { backgroundColor: theme.success + "20" }]}>
                <Text style={[styles.rateTagText, { color: theme.success }]}>
                  نسبة التحصيل: {formatPercent(detail.collectionsRate)}
                </Text>
              </View>
            </View>

            {/* Outstanding customer balances row */}
            <View style={[styles.debtBox, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.debtTitle, { color: theme.text }]}>عملائي: المستحق عليهم اليوم</Text>
                <Text style={[styles.debtAmount, { color: theme.error }]}>
                  {formatCurrency(detail.outstandingCustomerDebt)}
                </Text>
              </View>
              <View style={[styles.debtIconWrap, { backgroundColor: theme.surface }]}>
                <MaterialCommunityIcons name="account-multiple-outline" size={24} color={theme.error} />
              </View>
            </View>

            {/* Breakdown */}
            <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 14 }]}>مصادر التحصيل</Text>
            {detail.collectionsBreakdown.map((item, idx) => (
              <View key={idx} style={[styles.dataRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.dataAmount, { color: theme.primary }]}>{formatCurrency(item.amount)}</Text>
                <Text style={[styles.dataTitle, { color: theme.text }]}>{item.type}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: STATEMENT */}
        {activeTab === "statement" && (
          <View style={styles.tabContent}>
            <View style={[styles.statementHero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statementHeroLabel, { color: theme.textMuted }]}>صافي العمولة المستحقة للصرف</Text>
              <Text style={[styles.statementHeroAmount, { color: theme.primary }]}>
                {formatCurrency(detail.netPayableCommission)}
              </Text>
              <Text style={[styles.statementHeroSub, { color: theme.textMuted }]}>
                نوفمبر 2026 • محسوبة طبقاً لنسب الشرائح والتحصيل
              </Text>
            </View>

            <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 14 }]}>تفاصيل الشرائح والمكافآت</Text>
            {detail.statementItems.map((item, idx) => (
              <View key={idx} style={[styles.statementRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ alignItems: "flex-start" }}>
                  <Text style={[styles.dataAmount, { color: theme.primary }]}>{formatCurrency(item.commission)}</Text>
                  <Text style={[styles.dataSub, { color: theme.textMuted }]}>النسبة: {item.rate}</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.dataTitle, { color: theme.text }]}>{item.category}</Text>
                  {item.sales > 0 && (
                    <Text style={[styles.dataSub, { color: theme.textMuted }]}>المبيعات: {formatCurrency(item.sales)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
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
  brandRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  smallLogo: {
    width: 34,
    height: 34,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
  },
  repName: {
    fontSize: 11,
    textAlign: "right",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tabContent: {
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  heroHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
  monthBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  heroAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "right",
  },
  targetProgressContainer: {
    marginTop: 6,
    gap: 6,
  },
  targetLabelRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  targetSubText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  targetPercentText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  heroStatsGrid: {
    flexDirection: "row-reverse",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 12,
    marginTop: 6,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginBottom: 4,
  },
  heroStatVal: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  summaryGrid: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "flex-end",
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
  sectionSubheading: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 10,
  },
  categoriesList: {
    gap: 10,
  },
  catCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  catSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  subHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  subPageTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemsList: {
    gap: 10,
  },
  dataRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dataTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  dataSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  dataAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  collectionsHero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 8,
  },
  iconBadgeLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  collectionsLabel: {
    fontSize: 13,
  },
  collectionsAmount: {
    fontSize: 28,
    fontWeight: "bold",
  },
  rateTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  rateTagText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  debtBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
  },
  debtIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  debtTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  statementHero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  statementHeroLabel: {
    fontSize: 13,
  },
  statementHeroAmount: {
    fontSize: 30,
    fontWeight: "bold",
  },
  statementHeroSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statementRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
});
