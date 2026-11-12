import Foundation

enum SellerSection: String, CaseIterable {
    case summary = "summary"
    case sales = "sales"
    case collections = "collections"
    case statement = "statement"
}

enum NavDestination: String {
    case commissions = "commissions"
    case account = "account"
    case adminSettings = "adminSettings"
    case adminAccounts = "adminAccounts"
}

struct AuthSession: Codable, Equatable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Int64
}

struct UserProfile: Equatable {
    let id: String
    let name: String
    let displayName: String
    let email: String
    let role: String // "admin" | "manager" | "seller"
    let mustChangePassword: Bool
    let linkedRep: String?
}

struct MonthClock: Equatable {
    let month: String
    let closed: Bool
    let elapsedDays: Int
    let monthDays: Int
    let remainingDays: Int
    let asOf: String
}

struct TierRule: Equatable {
    var from: Double
    var to: Double?
    var rate: Double
}

struct ProductRuleModel: Equatable, Identifiable {
    var id: String { key }
    let key: String
    let templateId: Int
    let templateName: String
    let code: String?
    let variantId: Int?
    let color: String?
    let category: String // "slow" | "digital"
}

struct BonusStepModel: Equatable {
    var from: Double
    var to: Double?
    var amount: Double
}

struct RepSettingModel: Equatable {
    let name: String
    var odooUserId: Int?
    var totalTarget: Double?
    var slowTarget: Double?
    var digitalTarget: Double?
    var rangeTargets: [Double?]
}

struct RulesModel: Equatable {
    var allTargetsBonusPct: Double
    var slowMinPct: Double
    var slowDeductionPct: Double
    var cashSharePct: Double
    var cashBonus: Double
    var cashMinAchievementPct: Double?
    var collectionPct: Double
    var collectionBonus: Double
    var collectionMinAchievementPct: Double?
    var lowAchievementPct: Double
    var lowRate: Double
    var oldSystemUntilPct: Double
    var oldSystemTiers: [TierRule]
    var minimumSales: Double
    var salesBonuses: [BonusStepModel]
    var statementDetails: [String: Bool]
    var rangeUnit: String
    var digitalUnit: String
}

struct CommissionSettingsModel: Equatable {
    let month: String
    var tiers: [TierRule]
    var products: [ProductRuleModel]
    var slowRate: Double
    var digitalRate: Double
    var rules: RulesModel
    var reps: [RepSettingModel]
    let updatedAt: String?
    let updatedBy: String?
}

struct GateInfo: Equatable {
    let required: Double
    let achievement: Double?
    let met: Bool
    let preset: Bool
}

struct AdjustmentModel: Equatable, Identifiable {
    var id: String { key }
    let key: String
    let met: Bool
    let applies: Bool
    let amount: Double
    let current: Double?
    let threshold: Double?
    let gate: GateInfo?
}

struct BucketResultModel: Equatable {
    let key: String
    let qty: Double
    let amount: Double
    let commission: Double
    let rate: Double?
}

struct RangeResultModel: Equatable, Identifiable {
    var id: String { key }
    let key: String
    let qty: Double
    let amount: Double
    let commission: Double
    let rate: Double?
    let target: Double?
    let targetToDate: Double?
    let unit: String
    let achieved: Double
    let achievement: Double?
}

struct RepResultModel: Equatable {
    let sales: Double
    let qty: Double
    let cashSales: Double
    let cashShare: Double?
    let collections: Double
    let collectionRatio: Double?
    let collectionFactor: Double
    let base: Double
    let tiers: [RangeResultModel]
    let oldTiers: [BucketResultModel]
    let unpriced: BucketResultModel
    let slowCategory: RangeResultModel
    let digitalCategory: RangeResultModel
    let totalTarget: Double?
    let totalTargetToDate: Double?
    let achievement: Double?
    let allTargetsMet: Bool
    let regime: String // "noTarget" | "low" | "old" | "full"
    let adjustments: [AdjustmentModel]
    let beforeCollection: Double
    let total: Double
    let belowMinimum: Bool
}

struct RepSummaryModel: Equatable, Identifiable {
    var id: String { key }
    let key: String
    let name: String
    let odooUserId: Int?
    let odooName: String?
    let linkedBy: String?
    let totalTarget: Double?
    let slowTarget: Double?
    let digitalTarget: Double?
    let rangeTargets: [Double?]
    let result: RepResultModel
    let receivables: Double?
    let invoices: Int
    let customers: Int
    let projectedSales: Double
    let projectedAchievement: Double?
    let minimumRisk: Bool
    let perDayToTarget: Double?
}

struct ProductSoldRow: Equatable, Identifiable {
    var id: String { key }
    let key: String
    let productName: String
    let code: String?
    let color: String?
    let uom: String?
    let qty: Double
    let amount: Double
    let avgPrice: Double?
    let bucket: String
    let rate: Double
    let commission: Double
    let invoices: [String]
}

struct InvoiceSoldRow: Equatable, Identifiable {
    var id: Int { moveId }
    let moveId: Int
    let name: String
    let day: String
    let customer: String
    let refund: Bool
    let qty: Double
    let amount: Double
    let commission: Double
    let lines: Int
}

struct CustomerSoldRow: Equatable, Identifiable {
    var id: String { name }
    let name: String
    let invoices: Int
    let qty: Double
    let amount: Double
    let commission: Double
}

struct DailyPoint: Equatable, Identifiable {
    var id: String { day }
    let day: String
    let sales: Double
    let collections: Double
    let cash: Double
}

struct CollectionsBreakdown: Equatable {
    let payment: Double
    let refund: Double
    let cheque: Double
    let manual: Double
}

struct RepDetailModel: Equatable {
    let rep: RepSummaryModel
    let products: [ProductSoldRow]
    let daily: [DailyPoint]
    let invoiceRows: [InvoiceSoldRow]
    let customerRows: [CustomerSoldRow]
    let collections: CollectionsBreakdown
}

struct TeamTotals: Equatable {
    let sales: Double
    let target: Double
    let targetToDate: Double
    let commission: Double
    let collections: Double
    let onTrack: Int
    let flagged: Int
}

struct RepOptionItem: Equatable, Identifiable {
    var id: String { key }
    let key: String
    let name: String
    let linked: Bool
}

struct CommissionsViewPayload: Equatable {
    let user: UserProfile
    let selectedRep: String
    let repOptions: [RepOptionItem]
    let displayNames: [String: String]
    let hasRates: Bool
    let fetchedAt: String
    let clock: MonthClock
    let months: [String]
    let settings: CommissionSettingsModel
    let source: String
    let inheritedFrom: String?
    let sheetFound: Bool
    let reps: [RepSummaryModel]
    let unlinked: [String]
    let totals: TeamTotals
    let detail: RepDetailModel?
    let isOfflineCache: Bool
    let cachedAtMs: Int64
}

struct RateChangeModel: Equatable {
    let kind: String
    let key: String?
    let from: String?
    let to: String?
    let name: String?
    let category: String?
}

struct NotificationItemModel: Equatable, Identifiable {
    let id: String
    let at: String
    let month: String
    let by: String
    let note: String?
    let changes: [RateChangeModel]
    let recipientCount: Int?
}

struct NotificationsPayload: Equatable {
    let items: [NotificationItemModel]
    let unread: Int
    let lastRead: String
}

struct AccountPayload: Equatable {
    let user: UserProfile
}

struct AppUpdateInfo: Equatable {
    let version: String
    let currentVersion: String
    let bytes: Int64
    let publishedAt: String
    let downloadUrl: String
    let downloadPageUrl: String
}

// MARK: - JSON Parsing Helpers (1:1 with JsonParsers in Models.kt)

enum JsonParsers {
    private static func dbl(_ dict: [String: Any], _ key: String, default def: Double = 0.0) -> Double {
        if let n = dict[key] as? NSNumber { return n.doubleValue }
        if let s = dict[key] as? String, let d = Double(s) { return d }
        return def
    }

    private static func dblOpt(_ dict: [String: Any], _ key: String) -> Double? {
        if dict[key] is NSNull || dict[key] == nil { return nil }
        if let n = dict[key] as? NSNumber { return n.doubleValue }
        if let s = dict[key] as? String, let d = Double(s) { return d }
        return nil
    }

    private static func intVal(_ dict: [String: Any], _ key: String, default def: Int = 0) -> Int {
        if let n = dict[key] as? NSNumber { return n.intValue }
        if let s = dict[key] as? String, let i = Int(s) { return i }
        return def
    }

    private static func intOpt(_ dict: [String: Any], _ key: String) -> Int? {
        if dict[key] is NSNull || dict[key] == nil { return nil }
        if let n = dict[key] as? NSNumber { return n.intValue }
        if let s = dict[key] as? String, let i = Int(s) { return i }
        return nil
    }

    private static func str(_ dict: [String: Any], _ key: String, default def: String = "") -> String {
        return (dict[key] as? String) ?? def
    }

    private static func strOpt(_ dict: [String: Any], _ key: String) -> String? {
        guard let s = dict[key] as? String, !s.isEmpty else { return nil }
        return s
    }

    private static func boolVal(_ dict: [String: Any], _ key: String, default def: Bool = false) -> Bool {
        if let b = dict[key] as? Bool { return b }
        if let n = dict[key] as? NSNumber { return n.boolValue }
        return def
    }

    static func parseUser(_ d: [String: Any]) -> UserProfile {
        return UserProfile(
            id: str(d, "id"),
            name: str(d, "name"),
            displayName: str(d, "displayName", default: str(d, "name")),
            email: str(d, "email"),
            role: str(d, "role", default: "seller"),
            mustChangePassword: boolVal(d, "mustChangePassword"),
            linkedRep: strOpt(d, "linkedRep")
        )
    }

    static func parseClock(_ d: [String: Any]) -> MonthClock {
        return MonthClock(
            month: str(d, "month"),
            closed: boolVal(d, "closed"),
            elapsedDays: intVal(d, "elapsedDays", default: 1),
            monthDays: intVal(d, "monthDays", default: 30),
            remainingDays: intVal(d, "remainingDays", default: 0),
            asOf: str(d, "asOf")
        )
    }

    static func parseTierRule(_ d: [String: Any]) -> TierRule {
        return TierRule(
            from: dbl(d, "from"),
            to: dblOpt(d, "to"),
            rate: dbl(d, "rate")
        )
    }

    static func parseSettings(_ d: [String: Any]) -> CommissionSettingsModel {
        let tiersArr = (d["tiers"] as? [[String: Any]]) ?? []
        let prodsArr = (d["products"] as? [[String: Any]]) ?? []
        let rulesObj = (d["rules"] as? [String: Any]) ?? [:]
        let repsArr = (d["reps"] as? [[String: Any]]) ?? []

        let oldTiersArr = (rulesObj["oldSystemTiers"] as? [[String: Any]]) ?? []
        let bonusesArr = (rulesObj["salesBonuses"] as? [[String: Any]]) ?? []
        let stmtObj = (rulesObj["statementDetails"] as? [String: Any]) ?? [:]
        var stmtMap: [String: Bool] = [:]
        for (k, v) in stmtObj {
            if let b = v as? Bool { stmtMap[k] = b }
        }

        let rules = RulesModel(
            allTargetsBonusPct: dbl(rulesObj, "allTargetsBonusPct", default: 20),
            slowMinPct: dbl(rulesObj, "slowMinPct", default: 60),
            slowDeductionPct: dbl(rulesObj, "slowDeductionPct", default: 15),
            cashSharePct: dbl(rulesObj, "cashSharePct", default: 60),
            cashBonus: dbl(rulesObj, "cashBonus", default: 2000),
            cashMinAchievementPct: dblOpt(rulesObj, "cashMinAchievementPct"),
            collectionPct: dbl(rulesObj, "collectionPct", default: 120),
            collectionBonus: dbl(rulesObj, "collectionBonus", default: 2000),
            collectionMinAchievementPct: dblOpt(rulesObj, "collectionMinAchievementPct"),
            lowAchievementPct: dbl(rulesObj, "lowAchievementPct", default: 50),
            lowRate: dbl(rulesObj, "lowRate", default: 0.1),
            oldSystemUntilPct: dbl(rulesObj, "oldSystemUntilPct", default: 70),
            oldSystemTiers: oldTiersArr.isEmpty ? tiersArr.map(parseTierRule) : oldTiersArr.map(parseTierRule),
            minimumSales: dbl(rulesObj, "minimumSales", default: 0),
            salesBonuses: bonusesArr.map {
                BonusStepModel(from: dbl($0, "from"), to: dblOpt($0, "to"), amount: dbl($0, "amount"))
            },
            statementDetails: stmtMap,
            rangeUnit: str(rulesObj, "rangeUnit", default: "amount"),
            digitalUnit: str(rulesObj, "digitalUnit", default: "amount")
        )

        return CommissionSettingsModel(
            month: str(d, "month"),
            tiers: tiersArr.map(parseTierRule),
            products: prodsArr.map {
                ProductRuleModel(
                    key: str($0, "key"),
                    templateId: intVal($0, "templateId"),
                    templateName: str($0, "templateName"),
                    code: strOpt($0, "code"),
                    variantId: intOpt($0, "variantId"),
                    color: strOpt($0, "color"),
                    category: str($0, "category", default: "slow")
                )
            },
            slowRate: dbl(d, "slowRate", default: 1.0),
            digitalRate: dbl(d, "digitalRate", default: 0.4),
            rules: rules,
            reps: repsArr.map { r in
                let rt = (r["rangeTargets"] as? [Any]) ?? []
                return RepSettingModel(
                    name: str(r, "name"),
                    odooUserId: intOpt(r, "odooUserId"),
                    totalTarget: dblOpt(r, "totalTarget"),
                    slowTarget: dblOpt(r, "slowTarget"),
                    digitalTarget: dblOpt(r, "digitalTarget"),
                    rangeTargets: rt.map { ($0 as? NSNumber)?.doubleValue }
                )
            },
            updatedAt: strOpt(d, "updatedAt"),
            updatedBy: strOpt(d, "updatedBy")
        )
    }

    static func parseBucket(_ d: [String: Any]) -> BucketResultModel {
        return BucketResultModel(
            key: str(d, "key"),
            qty: dbl(d, "qty"),
            amount: dbl(d, "amount"),
            commission: dbl(d, "commission"),
            rate: dblOpt(d, "rate")
        )
    }

    static func parseRange(_ d: [String: Any]) -> RangeResultModel {
        return RangeResultModel(
            key: str(d, "key"),
            qty: dbl(d, "qty"),
            amount: dbl(d, "amount"),
            commission: dbl(d, "commission"),
            rate: dblOpt(d, "rate"),
            target: dblOpt(d, "target"),
            targetToDate: dblOpt(d, "targetToDate"),
            unit: str(d, "unit", default: "amount"),
            achieved: dbl(d, "achieved"),
            achievement: dblOpt(d, "achievement")
        )
    }

    static func parseRepSummary(_ d: [String: Any]) -> RepSummaryModel {
        let resObj = (d["result"] as? [String: Any]) ?? [:]
        let tiersArr = (resObj["tiers"] as? [[String: Any]]) ?? []
        let oldTiersArr = (resObj["oldTiers"] as? [[String: Any]]) ?? []
        let adjArr = (resObj["adjustments"] as? [[String: Any]]) ?? []

        let result = RepResultModel(
            sales: dbl(resObj, "sales"),
            qty: dbl(resObj, "qty"),
            cashSales: dbl(resObj, "cashSales"),
            cashShare: dblOpt(resObj, "cashShare"),
            collections: dbl(resObj, "collections"),
            collectionRatio: dblOpt(resObj, "collectionRatio"),
            collectionFactor: dbl(resObj, "collectionFactor", default: 1.0),
            base: dbl(resObj, "base"),
            tiers: tiersArr.map(parseRange),
            oldTiers: oldTiersArr.map(parseBucket),
            unpriced: parseBucket((resObj["unpriced"] as? [String: Any]) ?? [:]),
            slowCategory: parseRange((resObj["slowCategory"] as? [String: Any]) ?? [:]),
            digitalCategory: parseRange((resObj["digitalCategory"] as? [String: Any]) ?? [:]),
            totalTarget: dblOpt(resObj, "totalTarget"),
            totalTargetToDate: dblOpt(resObj, "totalTargetToDate"),
            achievement: dblOpt(resObj, "achievement"),
            allTargetsMet: boolVal(resObj, "allTargetsMet"),
            regime: str(resObj, "regime", default: "full"),
            adjustments: adjArr.map { a in
                var gate: GateInfo? = nil
                if let gObj = a["gate"] as? [String: Any] {
                    gate = GateInfo(
                        required: dbl(gObj, "required"),
                        achievement: dblOpt(gObj, "achievement"),
                        met: boolVal(gObj, "met"),
                        preset: boolVal(gObj, "preset")
                    )
                }
                return AdjustmentModel(
                    key: str(a, "key"),
                    met: boolVal(a, "met"),
                    applies: boolVal(a, "applies"),
                    amount: dbl(a, "amount"),
                    current: dblOpt(a, "current"),
                    threshold: dblOpt(a, "threshold"),
                    gate: gate
                )
            },
            beforeCollection: dbl(resObj, "beforeCollection"),
            total: dbl(resObj, "total"),
            belowMinimum: boolVal(resObj, "belowMinimum")
        )

        let rt = (d["rangeTargets"] as? [Any]) ?? []
        return RepSummaryModel(
            key: str(d, "key", default: str(d, "name")),
            name: str(d, "name"),
            odooUserId: intOpt(d, "odooUserId"),
            odooName: strOpt(d, "odooName"),
            linkedBy: strOpt(d, "linkedBy"),
            totalTarget: dblOpt(d, "totalTarget"),
            slowTarget: dblOpt(d, "slowTarget"),
            digitalTarget: dblOpt(d, "digitalTarget"),
            rangeTargets: rt.map { ($0 as? NSNumber)?.doubleValue },
            result: result,
            receivables: dblOpt(d, "receivables"),
            invoices: intVal(d, "invoices"),
            customers: intVal(d, "customers"),
            projectedSales: dbl(d, "projectedSales"),
            projectedAchievement: dblOpt(d, "projectedAchievement"),
            minimumRisk: boolVal(d, "minimumRisk"),
            perDayToTarget: dblOpt(d, "perDayToTarget")
        )
    }

    static func parseRepDetail(_ d: [String: Any]) -> RepDetailModel {
        let repObj = (d["rep"] as? [String: Any]) ?? d
        let prodsArr = (d["products"] as? [[String: Any]]) ?? []
        let dailyArr = (d["daily"] as? [[String: Any]]) ?? []
        let invArr = (d["invoiceRows"] as? [[String: Any]]) ?? []
        let custArr = (d["customerRows"] as? [[String: Any]]) ?? []
        let colObj = (d["collections"] as? [String: Any]) ?? [:]

        return RepDetailModel(
            rep: parseRepSummary(repObj),
            products: prodsArr.map { p in
                let invs = (p["invoices"] as? [String]) ?? []
                return ProductSoldRow(
                    key: str(p, "key", default: UUID().uuidString),
                    productName: str(p, "productName"),
                    code: strOpt(p, "code"),
                    color: strOpt(p, "color"),
                    uom: strOpt(p, "uom"),
                    qty: dbl(p, "qty"),
                    amount: dbl(p, "amount"),
                    avgPrice: dblOpt(p, "avgPrice"),
                    bucket: str(p, "bucket"),
                    rate: dbl(p, "rate"),
                    commission: dbl(p, "commission"),
                    invoices: invs
                )
            },
            daily: dailyArr.map { dp in
                DailyPoint(
                    day: str(dp, "day"),
                    sales: dbl(dp, "sales"),
                    collections: dbl(dp, "collections"),
                    cash: dbl(dp, "cash")
                )
            },
            invoiceRows: invArr.map { inv in
                InvoiceSoldRow(
                    moveId: intVal(inv, "moveId"),
                    name: str(inv, "name"),
                    day: str(inv, "day"),
                    customer: str(inv, "customer"),
                    refund: boolVal(inv, "refund"),
                    qty: dbl(inv, "qty"),
                    amount: dbl(inv, "amount"),
                    commission: dbl(inv, "commission"),
                    lines: intVal(inv, "lines")
                )
            },
            customerRows: custArr.map { c in
                CustomerSoldRow(
                    name: str(c, "name"),
                    invoices: intVal(c, "invoices"),
                    qty: dbl(c, "qty"),
                    amount: dbl(c, "amount"),
                    commission: dbl(c, "commission")
                )
            },
            collections: CollectionsBreakdown(
                payment: dbl(colObj, "payment"),
                refund: dbl(colObj, "refund"),
                cheque: dbl(colObj, "cheque"),
                manual: dbl(colObj, "manual")
            )
        )
    }

    static func parseCommissionsPayload(_ d: [String: Any], isOffline: Bool = false, cachedAt: Int64 = 0) -> CommissionsViewPayload {
        let userObj = (d["user"] as? [String: Any]) ?? [:]
        let repOptsArr = (d["repOptions"] as? [[String: Any]]) ?? []
        let dispObj = (d["displayNames"] as? [String: String]) ?? [:]
        let clockObj = (d["clock"] as? [String: Any]) ?? [:]
        let monthsArr = (d["months"] as? [String]) ?? []
        let settingsObj = (d["settings"] as? [String: Any]) ?? [:]
        let repsArr = (d["reps"] as? [[String: Any]]) ?? []
        let unlinkedArr = (d["unlinked"] as? [String]) ?? []
        let totalsObj = (d["totals"] as? [String: Any]) ?? [:]
        let detailObj = d["detail"] as? [String: Any]

        return CommissionsViewPayload(
            user: parseUser(userObj),
            selectedRep: str(d, "selectedRep"),
            repOptions: repOptsArr.map {
                RepOptionItem(
                    key: str($0, "key"),
                    name: str($0, "name"),
                    linked: boolVal($0, "linked")
                )
            },
            displayNames: dispObj,
            hasRates: boolVal(d, "hasRates", default: true),
            fetchedAt: str(d, "fetchedAt"),
            clock: parseClock(clockObj),
            months: monthsArr,
            settings: parseSettings(settingsObj),
            source: str(d, "source"),
            inheritedFrom: strOpt(d, "inheritedFrom"),
            sheetFound: boolVal(d, "sheetFound", default: true),
            reps: repsArr.map(parseRepSummary),
            unlinked: unlinkedArr,
            totals: TeamTotals(
                sales: dbl(totalsObj, "sales"),
                target: dbl(totalsObj, "target"),
                targetToDate: dbl(totalsObj, "targetToDate"),
                commission: dbl(totalsObj, "commission"),
                collections: dbl(totalsObj, "collections"),
                onTrack: intVal(totalsObj, "onTrack"),
                flagged: intVal(totalsObj, "flagged")
            ),
            detail: detailObj.map(parseRepDetail),
            isOfflineCache: isOffline,
            cachedAtMs: cachedAt
        )
    }

    static func parseNotifications(_ d: [String: Any]) -> NotificationsPayload {
        let itemsArr = (d["items"] as? [[String: Any]]) ?? []
        return NotificationsPayload(
            items: itemsArr.map { item in
                let chArr = (item["changes"] as? [[String: Any]]) ?? []
                return NotificationItemModel(
                    id: str(item, "id", default: UUID().uuidString),
                    at: str(item, "at"),
                    month: str(item, "month"),
                    by: str(item, "by"),
                    note: strOpt(item, "note"),
                    changes: chArr.map { c in
                        RateChangeModel(
                            kind: str(c, "kind"),
                            key: strOpt(c, "key"),
                            from: strOpt(c, "from"),
                            to: strOpt(c, "to"),
                            name: strOpt(c, "name"),
                            category: strOpt(c, "category")
                        )
                    },
                    recipientCount: intOpt(item, "recipientCount")
                )
            },
            unread: intVal(d, "unread"),
            lastRead: str(d, "lastRead")
        )
    }
}
