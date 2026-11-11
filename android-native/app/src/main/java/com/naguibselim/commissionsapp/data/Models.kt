package com.naguibselim.commissionsapp.data

import org.json.JSONArray
import org.json.JSONObject

data class UserProfile(
    val id: String,
    val name: String,
    val displayName: String,
    val email: String,
    val role: String, // "admin" | "manager" | "seller"
    val mustChangePassword: Boolean,
    val linkedRep: String?
)

data class MonthClock(
    val month: String,
    val closed: Boolean,
    val elapsedDays: Int,
    val monthDays: Int,
    val remainingDays: Int,
    val asOf: String
)

data class TierRule(
    val from: Double,
    val to: Double?,
    val rate: Double
)

data class ProductRuleModel(
    val key: String,
    val templateId: Int,
    val templateName: String,
    val code: String?,
    val variantId: Int?,
    val color: String?,
    val category: String // "slow" | "digital"
)

data class BonusStepModel(
    val from: Double,
    val to: Double?,
    val amount: Double
)

data class RepSettingModel(
    val name: String,
    val odooUserId: Int?,
    val totalTarget: Double?,
    val slowTarget: Double?,
    val digitalTarget: Double?,
    val rangeTargets: List<Double?>
)

data class RulesModel(
    val allTargetsBonusPct: Double,
    val slowMinPct: Double,
    val slowDeductionPct: Double,
    val cashSharePct: Double,
    val cashBonus: Double,
    val cashMinAchievementPct: Double?,
    val collectionPct: Double,
    val collectionBonus: Double,
    val collectionMinAchievementPct: Double?,
    val lowAchievementPct: Double,
    val lowRate: Double,
    val oldSystemUntilPct: Double,
    val oldSystemMode: String, // "tiers" | "base" | "rate"
    val oldSystemTiers: List<TierRule>,
    val oldRate: Double,
    val minimumSales: Double,
    val salesBonuses: List<BonusStepModel>,
    val statementDetails: Map<String, Boolean>,
    val rangeUnit: String, // "amount" | "qty"
    val digitalUnit: String // "amount" | "qty"
)

data class CommissionSettingsModel(
    val month: String,
    val tiers: List<TierRule>,
    val products: List<ProductRuleModel>,
    val slowRate: Double,
    val digitalRate: Double,
    val rules: RulesModel,
    val reps: List<RepSettingModel>,
    val updatedAt: String?,
    val updatedBy: String?
)

data class GateInfo(
    val required: Double,
    val achievement: Double?,
    val met: Boolean,
    val preset: Boolean
)

data class AdjustmentModel(
    val key: String,
    val met: Boolean,
    val applies: Boolean,
    val amount: Double,
    val current: Double?,
    val threshold: Double?,
    val gate: GateInfo?
)

data class BucketResultModel(
    val key: String,
    val qty: Double,
    val amount: Double,
    val commission: Double,
    val rate: Double?
)

data class RangeResultModel(
    val key: String,
    val qty: Double,
    val amount: Double,
    val commission: Double,
    val rate: Double?,
    val target: Double?,
    val targetToDate: Double?,
    val unit: String,
    val achieved: Double,
    val achievement: Double?
)

data class RepResultModel(
    val sales: Double,
    val qty: Double,
    val cashSales: Double,
    val cashShare: Double?,
    val collections: Double,
    val collectionRatio: Double?,
    val collectionFactor: Double,
    val base: Double,
    val tiers: List<RangeResultModel>,
    val oldTiers: List<BucketResultModel>,
    val unpriced: BucketResultModel,
    val slowCategory: RangeResultModel,
    val digitalCategory: RangeResultModel,
    val totalTarget: Double?,
    val totalTargetToDate: Double?,
    val achievement: Double?,
    val allTargetsMet: Boolean,
    val regime: String, // "noTarget" | "low" | "old" | "full"
    val adjustments: List<AdjustmentModel>,
    val beforeCollection: Double,
    val total: Double,
    val belowMinimum: Boolean
)

data class RepSummaryModel(
    val key: String,
    val name: String,
    val odooUserId: Int?,
    val odooName: String?,
    val linkedBy: String?,
    val totalTarget: Double?,
    val slowTarget: Double?,
    val digitalTarget: Double?,
    val rangeTargets: List<Double?>,
    val result: RepResultModel,
    val receivables: Double?,
    val invoices: Int,
    val customers: Int,
    val projectedSales: Double,
    val projectedAchievement: Double?,
    val minimumRisk: Boolean,
    val perDayToTarget: Double?
)

data class ProductSoldRow(
    val key: String,
    val productName: String,
    val code: String?,
    val color: String?,
    val uom: String?,
    val qty: Double,
    val amount: Double,
    val avgPrice: Double?,
    val bucket: String,
    val rate: Double,
    val commission: Double,
    val invoices: List<String>
)

data class InvoiceSoldRow(
    val moveId: Int,
    val name: String,
    val day: String,
    val customer: String,
    val refund: Boolean,
    val qty: Double,
    val amount: Double,
    val commission: Double,
    val lines: Int
)

data class CustomerSoldRow(
    val name: String,
    val invoices: Int,
    val qty: Double,
    val amount: Double,
    val commission: Double
)

data class DailyPoint(
    val day: String,
    val sales: Double,
    val collections: Double,
    val cash: Double
)

data class CollectionsBreakdown(
    val payment: Double,
    val refund: Double,
    val cheque: Double,
    val manual: Double
)

data class RepDetailModel(
    val rep: RepSummaryModel,
    val products: List<ProductSoldRow>,
    val daily: List<DailyPoint>,
    val invoiceRows: List<InvoiceSoldRow>,
    val customerRows: List<CustomerSoldRow>,
    val collections: CollectionsBreakdown
)

data class TeamTotals(
    val sales: Double,
    val target: Double,
    val targetToDate: Double,
    val commission: Double,
    val collections: Double,
    val onTrack: Int,
    val flagged: Int
)

data class RepOptionItem(
    val key: String,
    val name: String,
    val linked: Boolean
)

data class CommissionsViewPayload(
    val user: UserProfile,
    val selectedRep: String,
    val repOptions: List<RepOptionItem>,
    val displayNames: Map<String, String>,
    val hasRates: Boolean,
    val fetchedAt: String,
    val clock: MonthClock,
    val months: List<String>,
    val settings: CommissionSettingsModel,
    val source: String,
    val inheritedFrom: String?,
    val sheetFound: Boolean,
    val reps: List<RepSummaryModel>,
    val unlinked: List<String>,
    val totals: TeamTotals,
    val detail: RepDetailModel?,
    val isOfflineCache: Boolean = false,
    val cachedAtMs: Long = 0L
)

// Notifications
data class RateChangeModel(
    val kind: String,
    val key: String?,
    val from: String?,
    val to: String?,
    val name: String?,
    val category: String?
)

data class NotificationItemModel(
    val id: String,
    val at: String,
    val month: String,
    val by: String,
    val note: String?,
    val changes: List<RateChangeModel>,
    val recipientCount: Int? // null = all
)

data class NotificationsPayload(
    val items: List<NotificationItemModel>,
    val unread: Int,
    val lastRead: String
)

// Feed items (background notification worker)
data class FeedItemModel(
    val id: String,
    val channel: String,
    val title: String,
    val body: String,
    val path: String
)

// Account & Security
data class DeviceInfoModel(
    val installId: String,
    val lastSeenAt: String?,
    val appVersion: String?,
    val device: String?,
    val lastItems: Int?
)

data class LoginEventModel(
    val at: String,
    val sessionId: String?,
    val device: String
)

data class AccountPayload(
    val user: UserProfile,
    val sessionId: String?,
    val devices: List<DeviceInfoModel>,
    val logins: List<LoginEventModel>
)

// Admin Settings
data class OdooCandidate(val id: Int, val name: String)
data class ActiveAccountOption(val id: String, val name: String, val email: String)
data class SheetMeta(
    val found: Boolean,
    val path: String,
    val count: Int,
    val columns: List<String>
)

data class ProductVariantOption(val id: Int, val color: String?)
data class ProductSearchResultModel(
    val templateId: Int,
    val name: String,
    val code: String?,
    val variants: List<ProductVariantOption>
)

data class AdminSettingsPayload(
    val month: String,
    val months: List<String>,
    val settings: CommissionSettingsModel,
    val source: String,
    val inheritedFrom: String?,
    val sheet: SheetMeta,
    val reps: List<RepSummaryEntry>,
    val candidates: List<OdooCandidate>,
    val accounts: List<ActiveAccountOption>
)

data class RepSummaryEntry(
    val key: String,
    val name: String,
    val odooUserId: Int?,
    val odooName: String?,
    val linkedBy: String?,
    val totalTarget: Double?,
    val slowTarget: Double?,
    val digitalTarget: Double?,
    val rangeTargets: List<Double?>
)

// Admin Accounts
data class SellerAccountModel(
    val id: String,
    val email: String,
    val username: String?,
    val name: String,
    val salesReps: List<String>,
    val active: Boolean,
    val mustChangePassword: Boolean,
    val createdAt: String?,
    val lastSignInAt: String?
)

data class SheetRepAccountModel(
    val name: String,
    val displayName: String,
    val odooUserId: Int?,
    val account: SellerAccountModel?,
    val username: String
)

data class AdminAccountsPayload(
    val sheetMonth: String?,
    val sheetReps: List<SheetRepAccountModel>,
    val otherAccounts: List<SellerAccountModel>,
    val androidDownload: String,
    val defaultPassword: String
)

// App Release / Mandatory Update Info
data class AppUpdateInfo(
    val version: String,
    val currentVersion: String,
    val bytes: Long,
    val publishedAt: String,
    val downloadUrl: String
)

// JSON Parsing Helpers
object JsonParsers {
    private fun JSONObject.optDoubleNull(key: String): Double? =
        if (isNull(key) || !has(key)) null else optDouble(key).takeIf { !it.isNaN() }

    private fun JSONObject.optIntNull(key: String): Int? =
        if (isNull(key) || !has(key)) null else optInt(key)

    private fun JSONObject.optStringNull(key: String): String? =
        if (isNull(key) || !has(key)) null else optString(key).takeIf { it.isNotEmpty() && it != "null" }

    fun parseUser(obj: JSONObject): UserProfile {
        val name = obj.optString("name", "")
        return UserProfile(
            id = obj.optString("id", ""),
            name = name,
            displayName = obj.optStringNull("displayName") ?: name,
            email = obj.optString("email", ""),
            role = obj.optString("role", "seller"),
            mustChangePassword = obj.optBoolean("mustChangePassword", false),
            linkedRep = obj.optStringNull("linkedRep")
        )
    }

    fun parseSettings(obj: JSONObject): CommissionSettingsModel {
        val tiersArr = obj.optJSONArray("tiers") ?: JSONArray()
        val tiers = (0 until tiersArr.length()).map { i ->
            val t = tiersArr.getJSONObject(i)
            TierRule(
                from = t.optDouble("from", 0.0),
                to = t.optDoubleNull("to"),
                rate = t.optDouble("rate", 0.0)
            )
        }
        val productsArr = obj.optJSONArray("products") ?: JSONArray()
        val products = (0 until productsArr.length()).map { i ->
            val p = productsArr.getJSONObject(i)
            ProductRuleModel(
                key = p.optString("key", ""),
                templateId = p.optInt("templateId", 0),
                templateName = p.optString("templateName", ""),
                code = p.optStringNull("code"),
                variantId = p.optIntNull("variantId"),
                color = p.optStringNull("color"),
                category = p.optString("category", "slow")
            )
        }
        val catRates = obj.optJSONObject("categoryRates") ?: JSONObject()
        val rulesObj = obj.optJSONObject("rules") ?: JSONObject()
        val oldTiersArr = rulesObj.optJSONArray("oldSystemTiers") ?: JSONArray()
        val oldTiers = (0 until oldTiersArr.length()).map { i ->
            val t = oldTiersArr.getJSONObject(i)
            TierRule(
                from = t.optDouble("from", 0.0),
                to = t.optDoubleNull("to"),
                rate = t.optDouble("rate", 0.0)
            )
        }
        val bonusesArr = rulesObj.optJSONArray("salesBonuses") ?: JSONArray()
        val bonuses = (0 until bonusesArr.length()).map { i ->
            val b = bonusesArr.getJSONObject(i)
            BonusStepModel(
                from = b.optDouble("from", 0.0),
                to = b.optDoubleNull("to"),
                amount = b.optDouble("amount", 0.0)
            )
        }
        val detailsObj = rulesObj.optJSONObject("statementDetails") ?: JSONObject()
        val statementDetails = mapOf(
            "A" to detailsObj.optBoolean("A", true),
            "B" to detailsObj.optBoolean("B", true),
            "C" to detailsObj.optBoolean("C", true),
            "slow" to detailsObj.optBoolean("slow", true),
            "digital" to detailsObj.optBoolean("digital", true)
        )
        val catUnits = rulesObj.optJSONObject("categoryUnits") ?: JSONObject()
        val rules = RulesModel(
            allTargetsBonusPct = rulesObj.optDouble("allTargetsBonusPct", 20.0),
            slowMinPct = rulesObj.optDouble("slowMinPct", 60.0),
            slowDeductionPct = rulesObj.optDouble("slowDeductionPct", 15.0),
            cashSharePct = rulesObj.optDouble("cashSharePct", 60.0),
            cashBonus = rulesObj.optDouble("cashBonus", 2000.0),
            cashMinAchievementPct = rulesObj.optDoubleNull("cashMinAchievementPct"),
            collectionPct = rulesObj.optDouble("collectionPct", 120.0),
            collectionBonus = rulesObj.optDouble("collectionBonus", 2000.0),
            collectionMinAchievementPct = rulesObj.optDoubleNull("collectionMinAchievementPct"),
            lowAchievementPct = rulesObj.optDouble("lowAchievementPct", 50.0),
            lowRate = rulesObj.optDouble("lowRate", 0.1),
            oldSystemUntilPct = rulesObj.optDouble("oldSystemUntilPct", 70.0),
            oldSystemMode = rulesObj.optString("oldSystemMode", "tiers"),
            oldSystemTiers = oldTiers.ifEmpty { tiers },
            oldRate = rulesObj.optDouble("oldRate", 0.0),
            minimumSales = rulesObj.optDouble("minimumSales", 478000.0),
            salesBonuses = bonuses,
            statementDetails = statementDetails,
            rangeUnit = rulesObj.optString("rangeUnit", "amount"),
            digitalUnit = catUnits.optString("digital", "amount")
        )
        val repsArr = obj.optJSONArray("reps") ?: JSONArray()
        val reps = (0 until repsArr.length()).map { i ->
            val r = repsArr.getJSONObject(i)
            val rtArr = r.optJSONArray("rangeTargets") ?: JSONArray()
            val rt = (0 until 3).map { idx ->
                if (idx < rtArr.length() && !rtArr.isNull(idx)) rtArr.optDouble(idx) else null
            }
            RepSettingModel(
                name = r.optString("name", ""),
                odooUserId = r.optIntNull("odooUserId"),
                totalTarget = r.optDoubleNull("totalTarget"),
                slowTarget = r.optDoubleNull("slowTarget"),
                digitalTarget = r.optDoubleNull("digitalTarget"),
                rangeTargets = rt
            )
        }
        return CommissionSettingsModel(
            month = obj.optString("month", ""),
            tiers = tiers,
            products = products,
            slowRate = catRates.optDouble("slow", 0.0),
            digitalRate = catRates.optDouble("digital", 0.0),
            rules = rules,
            reps = reps,
            updatedAt = obj.optStringNull("updatedAt"),
            updatedBy = obj.optStringNull("updatedBy")
        )
    }

    fun settingsToJson(s: CommissionSettingsModel): JSONObject {
        val obj = JSONObject()
        obj.put("version", 1)
        obj.put("month", s.month)
        val tiersArr = JSONArray()
        s.tiers.forEach { t ->
            tiersArr.put(JSONObject().apply {
                put("from", t.from)
                put("to", t.to ?: JSONObject.NULL)
                put("rate", t.rate)
            })
        }
        obj.put("tiers", tiersArr)
        val productsArr = JSONArray()
        s.products.forEach { p ->
            productsArr.put(JSONObject().apply {
                put("key", p.key)
                put("templateId", p.templateId)
                put("templateName", p.templateName)
                put("code", p.code ?: JSONObject.NULL)
                put("variantId", p.variantId ?: JSONObject.NULL)
                put("color", p.color ?: JSONObject.NULL)
                put("category", p.category)
            })
        }
        obj.put("products", productsArr)
        obj.put("categoryRates", JSONObject().apply {
            put("slow", s.slowRate)
            put("digital", s.digitalRate)
        })
        val r = s.rules
        obj.put("rules", JSONObject().apply {
            put("allTargetsBonusPct", r.allTargetsBonusPct)
            put("slowMinPct", r.slowMinPct)
            put("slowDeductionPct", r.slowDeductionPct)
            put("cashSharePct", r.cashSharePct)
            put("cashBonus", r.cashBonus)
            put("cashMinAchievementPct", r.cashMinAchievementPct ?: JSONObject.NULL)
            put("collectionPct", r.collectionPct)
            put("collectionBonus", r.collectionBonus)
            put("collectionMinAchievementPct", r.collectionMinAchievementPct ?: JSONObject.NULL)
            put("lowAchievementPct", r.lowAchievementPct)
            put("lowRate", r.lowRate)
            put("oldSystemUntilPct", r.oldSystemUntilPct)
            put("oldSystemMode", r.oldSystemMode)
            val oldArr = JSONArray()
            r.oldSystemTiers.forEach { t ->
                oldArr.put(JSONObject().apply {
                    put("from", t.from)
                    put("to", t.to ?: JSONObject.NULL)
                    put("rate", t.rate)
                })
            }
            put("oldSystemTiers", oldArr)
            put("oldRate", r.oldRate)
            put("minimumSales", r.minimumSales)
            val bonusArr = JSONArray()
            r.salesBonuses.forEach { b ->
                bonusArr.put(JSONObject().apply {
                    put("from", b.from)
                    put("to", b.to ?: JSONObject.NULL)
                    put("amount", b.amount)
                })
            }
            put("salesBonuses", bonusArr)
            put("statementDetails", JSONObject().apply {
                put("A", r.statementDetails["A"] ?: true)
                put("B", r.statementDetails["B"] ?: true)
                put("C", r.statementDetails["C"] ?: true)
                put("slow", r.statementDetails["slow"] ?: true)
                put("digital", r.statementDetails["digital"] ?: true)
            })
            put("rangeUnit", r.rangeUnit)
            put("categoryUnits", JSONObject().apply {
                put("slow", "amount")
                put("digital", r.digitalUnit)
            })
        })
        val repsArr = JSONArray()
        s.reps.forEach { rep ->
            repsArr.put(JSONObject().apply {
                put("name", rep.name)
                put("odooUserId", rep.odooUserId ?: JSONObject.NULL)
                put("totalTarget", rep.totalTarget ?: JSONObject.NULL)
                put("slowTarget", rep.slowTarget ?: JSONObject.NULL)
                put("digitalTarget", rep.digitalTarget ?: JSONObject.NULL)
                val rt = JSONArray()
                rep.rangeTargets.forEach { rt.put(it ?: JSONObject.NULL) }
                put("rangeTargets", rt)
            })
        }
        obj.put("reps", repsArr)
        return obj
    }

    private fun parseRangeResult(obj: JSONObject): RangeResultModel = RangeResultModel(
        key = obj.optString("key", ""),
        qty = obj.optDouble("qty", 0.0),
        amount = obj.optDouble("amount", 0.0),
        commission = obj.optDouble("commission", 0.0),
        rate = obj.optDoubleNull("rate"),
        target = obj.optDoubleNull("target"),
        targetToDate = obj.optDoubleNull("targetToDate"),
        unit = obj.optString("unit", "amount"),
        achieved = obj.optDouble("achieved", 0.0),
        achievement = obj.optDoubleNull("achievement")
    )

    private fun parseBucketResult(obj: JSONObject): BucketResultModel = BucketResultModel(
        key = obj.optString("key", ""),
        qty = obj.optDouble("qty", 0.0),
        amount = obj.optDouble("amount", 0.0),
        commission = obj.optDouble("commission", 0.0),
        rate = obj.optDoubleNull("rate")
    )

    private fun parseRepResult(obj: JSONObject): RepResultModel {
        val tiersArr = obj.optJSONArray("tiers") ?: JSONArray()
        val tiers = (0 until tiersArr.length()).map { parseRangeResult(tiersArr.getJSONObject(it)) }
        val oldTiersArr = obj.optJSONArray("oldTiers") ?: JSONArray()
        val oldTiers = (0 until oldTiersArr.length()).map { parseBucketResult(oldTiersArr.getJSONObject(it)) }
        val cats = obj.optJSONObject("categories") ?: JSONObject()
        val adjArr = obj.optJSONArray("adjustments") ?: JSONArray()
        val adjustments = (0 until adjArr.length()).map { i ->
            val a = adjArr.getJSONObject(i)
            val gateObj = a.optJSONObject("gate")
            AdjustmentModel(
                key = a.optString("key", ""),
                met = a.optBoolean("met", false),
                applies = a.optBoolean("applies", false),
                amount = a.optDouble("amount", 0.0),
                current = a.optDoubleNull("current"),
                threshold = a.optDoubleNull("threshold"),
                gate = gateObj?.let {
                    GateInfo(
                        required = it.optDouble("required", 100.0),
                        achievement = it.optDoubleNull("achievement"),
                        met = it.optBoolean("met", false),
                        preset = it.optBoolean("preset", false)
                    )
                }
            )
        }
        return RepResultModel(
            sales = obj.optDouble("sales", 0.0),
            qty = obj.optDouble("qty", 0.0),
            cashSales = obj.optDouble("cashSales", 0.0),
            cashShare = obj.optDoubleNull("cashShare"),
            collections = obj.optDouble("collections", 0.0),
            collectionRatio = obj.optDoubleNull("collectionRatio"),
            collectionFactor = obj.optDouble("collectionFactor", 0.0),
            base = obj.optDouble("base", 0.0),
            tiers = tiers,
            oldTiers = oldTiers,
            unpriced = parseBucketResult(obj.optJSONObject("unpriced") ?: JSONObject()),
            slowCategory = parseRangeResult(cats.optJSONObject("slow") ?: JSONObject()),
            digitalCategory = parseRangeResult(cats.optJSONObject("digital") ?: JSONObject()),
            totalTarget = obj.optDoubleNull("totalTarget"),
            totalTargetToDate = obj.optDoubleNull("totalTargetToDate"),
            achievement = obj.optDoubleNull("achievement"),
            allTargetsMet = obj.optBoolean("allTargetsMet", false),
            regime = obj.optString("regime", "noTarget"),
            adjustments = adjustments,
            beforeCollection = obj.optDouble("beforeCollection", 0.0),
            total = obj.optDouble("total", 0.0),
            belowMinimum = obj.optBoolean("belowMinimum", false)
        )
    }

    private fun parseRepSummary(obj: JSONObject): RepSummaryModel {
        val rtArr = obj.optJSONArray("rangeTargets") ?: JSONArray()
        val rt = (0 until 3).map { idx ->
            if (idx < rtArr.length() && !rtArr.isNull(idx)) rtArr.optDouble(idx) else null
        }
        return RepSummaryModel(
            key = obj.optString("key", ""),
            name = obj.optString("name", ""),
            odooUserId = obj.optIntNull("odooUserId"),
            odooName = obj.optStringNull("odooName"),
            linkedBy = obj.optStringNull("linkedBy"),
            totalTarget = obj.optDoubleNull("totalTarget"),
            slowTarget = obj.optDoubleNull("slowTarget"),
            digitalTarget = obj.optDoubleNull("digitalTarget"),
            rangeTargets = rt,
            result = parseRepResult(obj.optJSONObject("result") ?: JSONObject()),
            receivables = obj.optDoubleNull("receivables"),
            invoices = obj.optInt("invoices", 0),
            customers = obj.optInt("customers", 0),
            projectedSales = obj.optDouble("projectedSales", 0.0),
            projectedAchievement = obj.optDoubleNull("projectedAchievement"),
            minimumRisk = obj.optBoolean("minimumRisk", false),
            perDayToTarget = obj.optDoubleNull("perDayToTarget")
        )
    }

    fun parseCommissionsPayload(root: JSONObject, isOffline: Boolean = false, cachedAt: Long = 0L): CommissionsViewPayload {
        val user = parseUser(root.optJSONObject("user") ?: JSONObject())
        val selectedRep = root.optString("selectedRep", "all")
        val optsArr = root.optJSONArray("repOptions") ?: JSONArray()
        val repOptions = (0 until optsArr.length()).map { i ->
            val o = optsArr.getJSONObject(i)
            RepOptionItem(
                key = o.optString("key", ""),
                name = o.optString("name", ""),
                linked = o.optBoolean("linked", false)
            )
        }
        val dnObj = root.optJSONObject("displayNames") ?: JSONObject()
        val displayNames = mutableMapOf<String, String>()
        dnObj.keys().forEach { k -> displayNames[k] = dnObj.optString(k, "") }

        val view = root.optJSONObject("view") ?: JSONObject()
        val clockObj = view.optJSONObject("clock") ?: JSONObject()
        val clock = MonthClock(
            month = clockObj.optString("month", ""),
            closed = clockObj.optBoolean("closed", false),
            elapsedDays = clockObj.optInt("elapsedDays", 1),
            monthDays = clockObj.optInt("monthDays", 30),
            remainingDays = clockObj.optInt("remainingDays", 0),
            asOf = clockObj.optString("asOf", "")
        )
        val monthsArr = view.optJSONArray("months") ?: JSONArray()
        val months = (0 until monthsArr.length()).map { monthsArr.optString(it) }
        val settings = parseSettings(view.optJSONObject("settings") ?: JSONObject())
        val repsArr = view.optJSONArray("reps") ?: JSONArray()
        val reps = (0 until repsArr.length()).map { parseRepSummary(repsArr.getJSONObject(it)) }
        val unlinkedArr = view.optJSONArray("unlinked") ?: JSONArray()
        val unlinked = (0 until unlinkedArr.length()).map { unlinkedArr.optString(it) }
        val totalsObj = view.optJSONObject("totals") ?: JSONObject()
        val totals = TeamTotals(
            sales = totalsObj.optDouble("sales", 0.0),
            target = totalsObj.optDouble("target", 0.0),
            targetToDate = totalsObj.optDouble("targetToDate", 0.0),
            commission = totalsObj.optDouble("commission", 0.0),
            collections = totalsObj.optDouble("collections", 0.0),
            onTrack = totalsObj.optInt("onTrack", 0),
            flagged = totalsObj.optInt("flagged", 0)
        )

        val detailObj = view.optJSONObject("detail")
        val detail = detailObj?.let { d ->
            val pArr = d.optJSONArray("products") ?: JSONArray()
            val products = (0 until pArr.length()).map { idx ->
                val p = pArr.getJSONObject(idx)
                val invArr = p.optJSONArray("invoices") ?: JSONArray()
                ProductSoldRow(
                    key = p.optString("key", ""),
                    productName = p.optString("productName", ""),
                    code = p.optStringNull("code"),
                    color = p.optStringNull("color"),
                    uom = p.optStringNull("uom"),
                    qty = p.optDouble("qty", 0.0),
                    amount = p.optDouble("amount", 0.0),
                    avgPrice = p.optDoubleNull("avgPrice"),
                    bucket = p.optString("bucket", ""),
                    rate = p.optDouble("rate", 0.0),
                    commission = p.optDouble("commission", 0.0),
                    invoices = (0 until invArr.length()).map { invArr.optString(it) }
                )
            }
            val dailyArr = d.optJSONArray("daily") ?: JSONArray()
            val daily = (0 until dailyArr.length()).map { idx ->
                val pt = dailyArr.getJSONObject(idx)
                DailyPoint(
                    day = pt.optString("day", ""),
                    sales = pt.optDouble("sales", 0.0),
                    collections = pt.optDouble("collections", 0.0),
                    cash = pt.optDouble("cash", 0.0)
                )
            }
            val iArr = d.optJSONArray("invoiceRows") ?: JSONArray()
            val invoiceRows = (0 until iArr.length()).map { idx ->
                val inv = iArr.getJSONObject(idx)
                InvoiceSoldRow(
                    moveId = inv.optInt("moveId", 0),
                    name = inv.optString("name", ""),
                    day = inv.optString("day", ""),
                    customer = inv.optString("customer", ""),
                    refund = inv.optBoolean("refund", false),
                    qty = inv.optDouble("qty", 0.0),
                    amount = inv.optDouble("amount", 0.0),
                    commission = inv.optDouble("commission", 0.0),
                    lines = inv.optInt("lines", 0)
                )
            }
            val cArr = d.optJSONArray("customerRows") ?: JSONArray()
            val customerRows = (0 until cArr.length()).map { idx ->
                val c = cArr.getJSONObject(idx)
                CustomerSoldRow(
                    name = c.optString("name", ""),
                    invoices = c.optInt("invoices", 0),
                    qty = c.optDouble("qty", 0.0),
                    amount = c.optDouble("amount", 0.0),
                    commission = c.optDouble("commission", 0.0)
                )
            }
            val colObj = d.optJSONObject("collections") ?: JSONObject()
            RepDetailModel(
                rep = parseRepSummary(d.optJSONObject("rep") ?: JSONObject()),
                products = products,
                daily = daily,
                invoiceRows = invoiceRows,
                customerRows = customerRows,
                collections = CollectionsBreakdown(
                    payment = colObj.optDouble("payment", 0.0),
                    refund = colObj.optDouble("refund", 0.0),
                    cheque = colObj.optDouble("cheque", 0.0),
                    manual = colObj.optDouble("manual", 0.0)
                )
            )
        }

        return CommissionsViewPayload(
            user = user,
            selectedRep = selectedRep,
            repOptions = repOptions,
            displayNames = displayNames,
            hasRates = root.optBoolean("hasRates", false),
            fetchedAt = view.optString("fetchedAt", ""),
            clock = clock,
            months = months,
            settings = settings,
            source = view.optString("source", "default"),
            inheritedFrom = view.optStringNull("inheritedFrom"),
            sheetFound = view.optBoolean("sheetFound", false),
            reps = reps,
            unlinked = unlinked,
            totals = totals,
            detail = detail,
            isOfflineCache = isOffline,
            cachedAtMs = cachedAt
        )
    }

    fun parseNotifications(root: JSONObject): NotificationsPayload {
        val arr = root.optJSONArray("items") ?: JSONArray()
        val items = (0 until arr.length()).map { i ->
            val n = arr.getJSONObject(i)
            val cArr = n.optJSONArray("changes") ?: JSONArray()
            val changes = (0 until cArr.length()).map { j ->
                val c = cArr.getJSONObject(j)
                RateChangeModel(
                    kind = c.optString("kind", ""),
                    key = c.optStringNull("key"),
                    from = c.optStringNull("from"),
                    to = c.optStringNull("to"),
                    name = c.optStringNull("name"),
                    category = c.optStringNull("category")
                )
            }
            val recObj = n.optJSONObject("recipients")
            val recCount = if (recObj?.optString("mode") == "users") {
                recObj.optJSONArray("userIds")?.length()
            } else null
            NotificationItemModel(
                id = n.optString("id", ""),
                at = n.optString("at", ""),
                month = n.optString("month", ""),
                by = n.optString("by", ""),
                note = n.optStringNull("note"),
                changes = changes,
                recipientCount = recCount
            )
        }
        return NotificationsPayload(
            items = items,
            unread = root.optInt("unread", 0),
            lastRead = root.optString("lastRead", "")
        )
    }

    fun parseAccountPayload(root: JSONObject): AccountPayload {
        val user = parseUser(root.optJSONObject("user") ?: JSONObject())
        val dArr = root.optJSONArray("devices") ?: JSONArray()
        val devices = (0 until dArr.length()).map { i ->
            val d = dArr.getJSONObject(i)
            DeviceInfoModel(
                installId = d.optString("installId", ""),
                lastSeenAt = d.optStringNull("lastSeenAt"),
                appVersion = d.optStringNull("appVersion"),
                device = d.optStringNull("device"),
                lastItems = d.optIntNull("lastItems")
            )
        }
        val lArr = root.optJSONArray("logins") ?: JSONArray()
        val logins = (0 until lArr.length()).map { i ->
            val l = lArr.getJSONObject(i)
            LoginEventModel(
                at = l.optString("at", ""),
                sessionId = l.optStringNull("sessionId"),
                device = l.optString("device", "")
            )
        }
        return AccountPayload(
            user = user,
            sessionId = root.optStringNull("sessionId"),
            devices = devices,
            logins = logins
        )
    }

    fun parseAdminSettings(root: JSONObject): AdminSettingsPayload {
        val monthsArr = root.optJSONArray("months") ?: JSONArray()
        val months = (0 until monthsArr.length()).map { monthsArr.optString(it) }
        val settings = parseSettings(root.optJSONObject("settings") ?: JSONObject())
        val sheetObj = root.optJSONObject("sheet") ?: JSONObject()
        val colsObj = sheetObj.optJSONObject("columns") ?: JSONObject()
        val cols = mutableListOf<String>()
        colsObj.optStringNull("total")?.let { cols.add(it) }
        colsObj.optJSONArray("ranges")?.let { rArr ->
            for (i in 0 until rArr.length()) rArr.optString(i).takeIf { it.isNotEmpty() && it != "null" }?.let { cols.add(it) }
        }
        colsObj.optStringNull("slow")?.let { cols.add(it) }
        colsObj.optStringNull("digital")?.let { cols.add(it) }

        val repsArr = root.optJSONArray("reps") ?: JSONArray()
        val reps = (0 until repsArr.length()).map { i ->
            val r = repsArr.getJSONObject(i)
            val rtArr = r.optJSONArray("rangeTargets") ?: JSONArray()
            val rt = (0 until 3).map { idx ->
                if (idx < rtArr.length() && !rtArr.isNull(idx)) rtArr.optDouble(idx) else null
            }
            RepSummaryEntry(
                key = r.optString("key", ""),
                name = r.optString("name", ""),
                odooUserId = r.optIntNull("odooUserId"),
                odooName = r.optStringNull("odooName"),
                linkedBy = r.optStringNull("linkedBy"),
                totalTarget = r.optDoubleNull("totalTarget"),
                slowTarget = r.optDoubleNull("slowTarget"),
                digitalTarget = r.optDoubleNull("digitalTarget"),
                rangeTargets = rt
            )
        }
        val candArr = root.optJSONArray("candidates") ?: JSONArray()
        val candidates = (0 until candArr.length()).map { i ->
            val c = candArr.getJSONObject(i)
            OdooCandidate(id = c.optInt("id", 0), name = c.optString("name", ""))
        }
        val accArr = root.optJSONArray("accounts") ?: JSONArray()
        val accounts = (0 until accArr.length()).map { i ->
            val a = accArr.getJSONObject(i)
            ActiveAccountOption(id = a.optString("id", ""), name = a.optString("name", ""), email = a.optString("email", ""))
        }
        return AdminSettingsPayload(
            month = root.optString("month", ""),
            months = months,
            settings = settings,
            source = root.optString("source", "default"),
            inheritedFrom = root.optStringNull("inheritedFrom"),
            sheet = SheetMeta(
                found = sheetObj.optBoolean("found", false),
                path = sheetObj.optString("path", ""),
                count = sheetObj.optInt("count", 0),
                columns = cols
            ),
            reps = reps,
            candidates = candidates,
            accounts = accounts
        )
    }

    private fun parseSellerAccount(obj: JSONObject): SellerAccountModel {
        val srArr = obj.optJSONArray("salesReps") ?: JSONArray()
        return SellerAccountModel(
            id = obj.optString("id", ""),
            email = obj.optString("email", ""),
            username = obj.optStringNull("username"),
            name = obj.optString("name", ""),
            salesReps = (0 until srArr.length()).map { srArr.optString(it) },
            active = obj.optBoolean("active", true),
            mustChangePassword = obj.optBoolean("mustChangePassword", false),
            createdAt = obj.optStringNull("createdAt"),
            lastSignInAt = obj.optStringNull("lastSignInAt")
        )
    }

    fun parseAdminAccounts(root: JSONObject): AdminAccountsPayload {
        val sheetObj = root.optJSONObject("sheet")
        val sheetMonth = sheetObj?.optStringNull("month")
        val sRepsArr = sheetObj?.optJSONArray("reps") ?: JSONArray()
        val sheetReps = (0 until sRepsArr.length()).map { i ->
            val r = sRepsArr.getJSONObject(i)
            val accObj = r.optJSONObject("account")
            SheetRepAccountModel(
                name = r.optString("name", ""),
                displayName = r.optString("displayName", r.optString("name", "")),
                odooUserId = r.optIntNull("odooUserId"),
                account = accObj?.let { parseSellerAccount(it) },
                username = r.optString("username", "")
            )
        }
        val otherArr = root.optJSONArray("accounts") ?: JSONArray()
        val otherAccounts = (0 until otherArr.length()).map { parseSellerAccount(otherArr.getJSONObject(it)) }
        return AdminAccountsPayload(
            sheetMonth = sheetMonth,
            sheetReps = sheetReps,
            otherAccounts = otherAccounts,
            androidDownload = root.optString("androidDownload", "native"),
            defaultPassword = root.optString("defaultPassword", "00000000")
        )
    }
}
