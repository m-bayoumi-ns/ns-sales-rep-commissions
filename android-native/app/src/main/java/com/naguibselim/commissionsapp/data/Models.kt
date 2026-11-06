package com.naguibselim.commissionsapp.data

import kotlinx.serialization.Serializable

/**
 * JSON of GET /api/app/commissions on the website (app/api/app/commissions/route.ts).
 * Mirrors CommissionsView in lib/commissions/view.ts and RepResult in lib/commissions/engine.ts.
 * Unknown fields are ignored, so the website can add fields without breaking older app versions.
 */
@Serializable
data class CommissionsResponse(
    val user: AppUser,
    val fetchedAt: String,
    val clock: MonthClock,
    val months: List<String> = emptyList(),
    val settings: Settings,
    val notices: List<Notice> = emptyList(),
    val allReps: String = "all",
    val repOptions: List<RepOption> = emptyList(),
    val reps: List<RepSummary> = emptyList(),
    val totals: Totals,
    val detail: RepDetail? = null,
)

@Serializable
data class AppUser(
    val name: String,
    val email: String,
    val admin: Boolean = false,
    val seller: Boolean = false,
    val salesRepLimited: Boolean = false,
)

@Serializable
data class MonthClock(
    val month: String,
    val closed: Boolean,
    val elapsedDays: Int,
    val monthDays: Int,
    val remainingDays: Int,
    val asOf: String,
)

@Serializable
data class Tier(val from: Double = 0.0, val to: Double? = null, val rate: Double = 0.0)

@Serializable
data class CategoryRates(val slow: Double = 0.0, val digital: Double = 0.0)

@Serializable
data class BonusStep(val from: Double, val to: Double? = null, val amount: Double)

@Serializable
data class Rules(
    val allTargetsBonusPct: Double = 20.0,
    val slowMinPct: Double = 60.0,
    val slowDeductionPct: Double = 15.0,
    val cashSharePct: Double = 60.0,
    val cashBonus: Double = 2000.0,
    val cashMinAchievementPct: Double? = null,
    val collectionPct: Double = 120.0,
    val collectionBonus: Double = 2000.0,
    val collectionMinAchievementPct: Double? = null,
    val lowAchievementPct: Double = 50.0,
    val lowRate: Double = 0.1,
    val oldSystemUntilPct: Double = 70.0,
    val oldSystemMode: String = "base",
    val oldRate: Double = 0.0,
    val minimumSales: Double = 478_000.0,
    val salesBonuses: List<BonusStep> = emptyList(),
    val rangeUnit: String = "amount",
)

@Serializable
data class Settings(val tiers: List<Tier> = emptyList(), val categoryRates: CategoryRates = CategoryRates(), val rules: Rules = Rules())

@Serializable
data class Notice(val key: String, val tone: String = "info", val from: String? = null, val names: List<String> = emptyList())

@Serializable
data class RepOption(val key: String, val name: String, val linked: Boolean = true)

@Serializable
data class Totals(
    val sales: Double = 0.0,
    val target: Double = 0.0,
    val targetToDate: Double = 0.0,
    val commission: Double = 0.0,
    val collections: Double = 0.0,
    val onTrack: Int = 0,
    val flagged: Int = 0,
)

@Serializable
data class BucketResult(val key: String, val qty: Double = 0.0, val amount: Double = 0.0, val commission: Double = 0.0, val rate: Double? = null)

@Serializable
data class TargetBucket(
    val key: String,
    val qty: Double = 0.0,
    val amount: Double = 0.0,
    val commission: Double = 0.0,
    val rate: Double? = null,
    val target: Double? = null,
    val targetToDate: Double? = null,
    val unit: String = "amount",
    val achieved: Double = 0.0,
    val achievement: Double? = null,
)

@Serializable
data class Gate(val required: Double, val achievement: Double? = null, val met: Boolean)

@Serializable
data class Adjustment(
    val key: String,
    val met: Boolean,
    val applies: Boolean,
    val amount: Double,
    val current: Double? = null,
    val threshold: Double? = null,
    val gate: Gate? = null,
)

@Serializable
data class RepResult(
    val sales: Double = 0.0,
    val qty: Double = 0.0,
    val cashSales: Double = 0.0,
    val cashShare: Double? = null,
    val collections: Double = 0.0,
    val collectionRatio: Double? = null,
    val collectionFactor: Double = 0.0,
    val base: Double = 0.0,
    val tiers: List<TargetBucket> = emptyList(),
    val unpriced: BucketResult = BucketResult("none"),
    val categories: Map<String, TargetBucket> = emptyMap(),
    val totalTarget: Double? = null,
    val totalTargetToDate: Double? = null,
    val achievement: Double? = null,
    val allTargetsMet: Boolean = false,
    /** "noTarget" | "low" | "old" | "full" */
    val regime: String = "noTarget",
    val adjustments: List<Adjustment> = emptyList(),
    val beforeCollection: Double = 0.0,
    val total: Double = 0.0,
    val belowMinimum: Boolean = false,
)

@Serializable
data class RepSummary(
    val key: String,
    val name: String,
    val odooUserId: Long? = null,
    val odooName: String? = null,
    val totalTarget: Double? = null,
    val result: RepResult,
    val receivables: Double? = null,
    val invoices: Int = 0,
    val customers: Int = 0,
    val projectedSales: Double = 0.0,
    val projectedAchievement: Double? = null,
    val minimumRisk: Boolean = false,
    val perDayToTarget: Double? = null,
)

@Serializable
data class ProductRow(
    val key: String,
    val productName: String,
    val code: String? = null,
    val color: String? = null,
    val uom: String? = null,
    val qty: Double = 0.0,
    val amount: Double = 0.0,
    val avgPrice: Double? = null,
    val bucket: String,
    val rate: Double = 0.0,
    val commission: Double = 0.0,
    val invoices: List<String> = emptyList(),
)

@Serializable
data class DailyRow(val day: String, val sales: Double = 0.0, val collections: Double = 0.0, val cash: Double = 0.0)

@Serializable
data class InvoiceRow(
    val moveId: Long,
    val name: String,
    val day: String,
    val customer: String = "",
    val refund: Boolean = false,
    val qty: Double = 0.0,
    val amount: Double = 0.0,
    val commission: Double = 0.0,
    val lines: Int = 0,
)

@Serializable
data class CustomerRow(val name: String, val invoices: Int = 0, val qty: Double = 0.0, val amount: Double = 0.0, val commission: Double = 0.0)

@Serializable
data class CollectionSplit(val payment: Double = 0.0, val refund: Double = 0.0, val cheque: Double = 0.0, val manual: Double = 0.0)

@Serializable
data class RepDetail(
    val rep: RepSummary,
    val products: List<ProductRow> = emptyList(),
    val daily: List<DailyRow> = emptyList(),
    val invoiceRows: List<InvoiceRow> = emptyList(),
    val customerRows: List<CustomerRow> = emptyList(),
    val collections: CollectionSplit = CollectionSplit(),
)

/** POST /api/app/session and /api/app/session/refresh. */
@Serializable
data class SessionTokens(val accessToken: String, val refreshToken: String, val expiresAt: Long)

@Serializable
data class ApiError(val error: String = "error")
