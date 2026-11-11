import SwiftUI

struct RepDetailView: View {
    let detail: RepDetailModel
    let settings: CommissionSettingsModel
    let clock: MonthClock
    let section: SellerSection
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        VStack(spacing: 14) {
            // Main Content Card
            VStack(spacing: 0) {
                // Balance Header Card on Summary tab
                if section == .summary {
                    SummaryHeroHeader(detail: detail, settings: settings, clock: clock)
                }

                VStack(spacing: 20) {
                    switch section {
                    case .summary:
                        SummarySection(detail: detail, settings: settings, clock: clock)
                    case .sales:
                        SalesSection(detail: detail, viewModel: viewModel)
                    case .collections:
                        CollectionsSection(detail: detail, clock: clock)
                    case .statement:
                        StatementSection(detail: detail, settings: settings)
                    }
                }
                .padding(16)
            }
            .background(RoundedRectangle(cornerRadius: 24).fill(c.card))
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(c.border, lineWidth: 1))
            .shadow(color: Color.black.opacity(c.isDark ? 0.3 : 0.05), radius: 10, x: 0, y: 4)

            // Auto-update footer on summary tab
            if section == .summary {
                Text(clock.closed
                     ? tr("أرقام نهائية لشهر مغلق.", "Final figures for a closed month.", isAr: isAr)
                     : tr("تتحدث تلقائيًا كل بضع دقائق مع ترحيل الفواتير والمدفوعات.", "Updates automatically every few minutes as invoices are posted.", isAr: isAr))
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundColor(c.mutedForeground)
                    .multilineTextAlignment(.center)
                    .padding(.vertical, 6)
            }
        }
    }
}

// ============================================================================
// TAB 1: SUMMARY (الرئيسية)
// ============================================================================

private struct SummaryHeroHeader: View {
    let detail: RepDetailModel
    let settings: CommissionSettingsModel
    let clock: MonthClock
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        let rep = detail.rep
        let r = rep.result

        VStack(spacing: 16) {
            // Rep Name & Day progress
            HStack {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.18))
                            .frame(width: 38, height: 38)
                        Image(systemName: "person.fill")
                            .foregroundColor(.white)
                            .font(.system(size: 16))
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(rep.odooName ?? rep.name)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)

                        Text(tr(
                            "\(Format.monthLabel(clock.month, isAr: isAr)) · اليوم \(clock.elapsedDays) من \(clock.monthDays)",
                            "\(Format.monthLabel(clock.month, isAr: isAr)) · Day \(clock.elapsedDays) of \(clock.monthDays)",
                            isAr: isAr
                        ))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color.white.opacity(0.75))
                    }
                }

                Spacer()

                if r.allTargetsMet {
                    Text(tr("الدرجات مقفلة", "Targets Met", isAr: isAr))
                        .font(.system(size: 10.5, weight: .bold))
                        .foregroundColor(Color(hex: 0x4ADE80))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color(hex: 0x136C34).opacity(0.35)))
                }
            }

            // Commission Value
            VStack(spacing: 4) {
                Text(tr("عمولتك حتى الآن", "Your commission so far", isAr: isAr))
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.8))

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(Format.number(r.total))
                        .font(.system(size: 34, weight: .black))
                        .foregroundColor(.white)
                    Text(isAr ? "ج.م" : "EGP")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color.white.opacity(0.85))
                }
            }

            // Target Progress Bar
            let target = rep.totalTarget ?? 0
            let achPct = target > 0 ? min(1.5, max(0.0, r.sales / target)) : 0.0

            VStack(spacing: 6) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.2))
                            .frame(height: 7)

                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: 0xFDE047), Color(hex: 0x4ADE80)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: max(8, geo.size.width * CGFloat(min(1.0, achPct))), height: 7)
                    }
                }
                .frame(height: 7)

                HStack {
                    Text(tr("الهدف", "Target", isAr: isAr))
                    Spacer()
                    Text("70%")
                    Spacer()
                    Text("90%")
                    Spacer()
                    Text("100%")
                }
                .font(.system(size: 9.5, weight: .semibold))
                .foregroundColor(Color.white.opacity(0.65))
            }

            // Bottom Metrics (المبيعات | الهدف حتى اليوم | المحقق)
            HStack {
                VStack(spacing: 2) {
                    Text(tr("المبيعات", "Sales", isAr: isAr))
                        .font(.system(size: 10.5))
                        .foregroundColor(Color.white.opacity(0.7))
                    Text(Format.compactCurrency(r.sales, isAr: isAr))
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity)

                VStack(spacing: 2) {
                    Text(tr("الهدف حتى اليوم", "Target to Date", isAr: isAr))
                        .font(.system(size: 10.5))
                        .foregroundColor(Color.white.opacity(0.7))
                    Text(Format.compactCurrency(rep.totalTargetToDate ?? 0, isAr: isAr))
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity)

                VStack(spacing: 2) {
                    Text(tr("المحقق", "Achieved", isAr: isAr))
                        .font(.system(size: 10.5))
                        .foregroundColor(Color.white.opacity(0.7))
                    Text(Format.percent(r.achievement))
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundColor(Color(hex: 0x4ADE80))
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.top, 4)
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [c.heroStart, c.heroMid, c.heroEnd],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}

private struct SummarySection: View {
    let detail: RepDetailModel
    let settings: CommissionSettingsModel
    let clock: MonthClock
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        let rep = detail.rep
        let r = rep.result

        VStack(spacing: 18) {
            // Targets Breakdown (أهدافي)
            NsSectionTitle(title: tr("أهدافي", "My targets", isAr: isAr))

            VStack(spacing: 10) {
                // Total Target To Date
                TargetRow(
                    label: tr("الهدف حتى اليوم", "Target to date", isAr: isAr),
                    achievedPct: r.achievement ?? 0,
                    valueText: "\(Format.compact(r.sales, isAr: isAr)) / \(Format.compact(rep.totalTargetToDate ?? 0, isAr: isAr))",
                    iconName: "target"
                )

                // Slow goods
                TargetRow(
                    label: tr("الراكد", "Slow-moving", isAr: isAr),
                    achievedPct: r.slowCategory.achievement ?? 0,
                    valueText: "\(Format.compact(r.slowCategory.amount, isAr: isAr)) / \(Format.compact(r.slowCategory.target ?? 0, isAr: isAr))",
                    iconName: "archivebox"
                )

                // Digital
                TargetRow(
                    label: tr("الديجيتال", "Digital", isAr: isAr),
                    achievedPct: r.digitalCategory.achievement ?? 0,
                    valueText: "\(Format.compact(r.digitalCategory.amount, isAr: isAr)) / \(Format.compact(r.digitalCategory.target ?? 0, isAr: isAr))",
                    iconName: "sparkles"
                )

                // Tiers A, B, C
                ForEach(r.tiers) { tier in
                    TargetRow(
                        label: tr("الشريحة \(tier.key.uppercased())", "Tier \(tier.key.uppercased())", isAr: isAr),
                        achievedPct: tier.achievement ?? 0,
                        valueText: "\(Format.compact(tier.amount, isAr: isAr)) / \(Format.compact(tier.target ?? 0, isAr: isAr))",
                        iconName: "chart.bar"
                    )
                }

                // Collections vs Sales
                TargetRow(
                    label: tr("التحصيل مقابل مبيعات الشهر", "Collections vs MTD Sales", isAr: isAr),
                    achievedPct: (r.collectionRatio ?? 0) * 100,
                    valueText: "\(Format.compact(r.collections, isAr: isAr)) / \(Format.compact(r.sales, isAr: isAr))",
                    iconName: "banknote"
                )
            }

            // Projections (معدلي)
            NsSectionTitle(title: tr("معدلي", "My run rate", isAr: isAr))

            HStack(spacing: 12) {
                ProjectionBox(
                    title: tr("المتوقع نهاية الشهر", "End of month projection", isAr: isAr),
                    value: Format.compactCurrency(rep.projectedSales, isAr: isAr),
                    sub: Format.percent(rep.projectedAchievement)
                )

                ProjectionBox(
                    title: tr("المطلوب يومياً", "Required daily", isAr: isAr),
                    value: Format.compactCurrency(rep.perDayToTarget ?? 0, isAr: isAr),
                    sub: tr("\(clock.remainingDays) يوم متبقٍ", "\(clock.remainingDays) days left", isAr: isAr)
                )
            }

            // How to increase commissions
            NsSectionTitle(title: tr("كيف تزيد عمولتك", "How to increase your commission", isAr: isAr))

            VStack(spacing: 8) {
                IncreaseTipCard(
                    title: tr("حقق جميع الأهداف للحصول على زيادة 20% على العمولة.", "Achieve all targets for a +20% bonus.", isAr: isAr),
                    icon: "star.fill"
                )

                if let gap = rep.totalTarget.map({ max(0, $0 - r.sales) }), gap > 0 {
                    IncreaseTipCard(
                        title: tr("باقي \(Format.compactCurrency(gap, isAr: isAr)) للوصول إلى هدف الشهر بالكامل.", "\(Format.compactCurrency(gap, isAr: isAr)) left to reach full monthly target.", isAr: isAr),
                        icon: "arrow.up.circle.fill"
                    )
                }
            }

            // Month Stats
            NsSectionTitle(title: tr("هذا الشهر", "This month", isAr: isAr))

            HStack(spacing: 12) {
                StatCard(
                    title: tr("الفواتير", "Invoices", isAr: isAr),
                    value: "\(rep.invoices)",
                    sub: tr("\(rep.customers) عميل", "\(rep.customers) clients", isAr: isAr),
                    icon: "doc.plaintext"
                )

                StatCard(
                    title: tr("المبيعات المسددة", "Paid Sales", isAr: isAr),
                    value: Format.percent(r.cashShare),
                    sub: tr("60% تستحق حافزًا", "60% earns bonus", isAr: isAr),
                    icon: "creditcard"
                )
            }
        }
    }
}

private struct TargetRow: View {
    let label: String
    let achievedPct: Double
    let valueText: String
    let iconName: String
    @Environment(\.nsColors) private var c

    var body: some View {
        let isMet = achievedPct >= 100.0
        let color: Color = isMet ? c.success : (achievedPct >= 70 ? c.warning : c.destructive)

        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(c.accent)
                    .frame(width: 36, height: 36)
                Image(systemName: iconName)
                    .foregroundColor(c.primary)
                    .font(.system(size: 15))
            }

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(label)
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundColor(c.foreground)
                    Spacer()
                    Text(Format.percent(achievedPct))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(color)
                }

                HStack {
                    Text(valueText)
                        .font(.system(size: 11.5))
                        .foregroundColor(c.mutedForeground)
                    Spacer()
                    if isMet {
                        Text("تم تحقيق الهدف ✓")
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundColor(c.success)
                    }
                }
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.45)))
    }
}

private struct ProjectionBox: View {
    let title: String
    let value: String
    let sub: String
    @Environment(\.nsColors) private var c

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 11.5, weight: .medium))
                .foregroundColor(c.mutedForeground)
            Text(value)
                .font(.system(size: 15.5, weight: .bold))
                .foregroundColor(c.foreground)
            Text(sub)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(c.primary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.45)))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.border, lineWidth: 1))
    }
}

private struct IncreaseTipCard: View {
    let title: String
    let icon: String
    @Environment(\.nsColors) private var c

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundColor(Color(hex: 0xD97706))
                .font(.system(size: 16))
            Text(title)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundColor(c.foreground)
                .lineSpacing(2)
            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 14).fill(c.accent.opacity(0.6)))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.primary.opacity(0.2), lineWidth: 1))
    }
}

private struct StatCard: View {
    let title: String
    let value: String
    let sub: String
    let icon: String
    @Environment(\.nsColors) private var c

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(c.accent).frame(width: 36, height: 36)
                Image(systemName: icon).foregroundColor(c.primary).font(.system(size: 15))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 12))
                    .foregroundColor(c.mutedForeground)
                Text(value)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(c.foreground)
                Text(sub)
                    .font(.system(size: 10.5))
                    .foregroundColor(c.mutedForeground)
            }
            Spacer()
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.45)))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.border, lineWidth: 1))
    }
}

// ============================================================================
// TAB 2: SALES (المبيعات) with 4 Modern Selection Cards & Searchable Sub-pages
// ============================================================================

private struct SalesSection: View {
    let detail: RepDetailModel
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        if let subView = viewModel.salesSubView {
            // Detailed Sub-page with Modern Title & Modern Expandable Search Bar!
            SalesSubDetailView(
                subView: subView,
                detail: detail,
                searchQuery: $viewModel.salesSearchQuery
            ) {
                viewModel.salesSubView = nil
                viewModel.salesSearchQuery = ""
            }
        } else {
            // 4 Selection Cards matching User's screenshot
            VStack(spacing: 14) {
                Text(tr("اختر طريقة عرض العمولة", "Choose how to view commission", isAr: isAr))
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundColor(c.foreground)
                    .padding(.top, 4)

                SalesSelectionCard(
                    title: tr("حسب اليوم", "By Day", isAr: isAr),
                    iconName: "calendar"
                ) {
                    viewModel.salesSubView = "day"
                }

                SalesSelectionCard(
                    title: tr("حسب العميل", "By Customer", isAr: isAr),
                    iconName: "person.2"
                ) {
                    viewModel.salesSubView = "customer"
                }

                SalesSelectionCard(
                    title: tr("حسب الفاتورة", "By Invoice", isAr: isAr),
                    iconName: "doc.text"
                ) {
                    viewModel.salesSubView = "invoice"
                }

                SalesSelectionCard(
                    title: tr("حسب المنتج", "By Product", isAr: isAr),
                    iconName: "shippingbox"
                ) {
                    viewModel.salesSubView = "product"
                }
            }
        }
    }
}

private struct SalesSelectionCard: View {
    let title: String
    let iconName: String
    let action: () -> Void
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: isAr ? "chevron.left" : "chevron.right")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(c.mutedForeground)

                Spacer()

                Text(title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(c.foreground)

                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.accent)
                        .frame(width: 48, height: 48)

                    Image(systemName: iconName)
                        .font(.system(size: 20))
                        .foregroundColor(c.primary)
                }
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 18).fill(c.card))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(c.border, lineWidth: 1))
            .shadow(color: Color.black.opacity(c.isDark ? 0.2 : 0.04), radius: 6, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}

private struct SalesSubDetailView: View {
    let subView: String
    let detail: RepDetailModel
    @Binding var searchQuery: String
    let onBack: () -> Void
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        VStack(spacing: 14) {
            // Modern Title Header with Back Button
            let headerData: (title: String, subtitle: String, icon: String) = {
                switch subView {
                case "day":
                    return (
                        tr("المبيعات والعمولة حسب اليوم", "Commissions by Day", isAr: isAr),
                        tr("استعراض الأداء اليومي ومبالغ الفواتير", "View daily performance and totals", isAr: isAr),
                        "calendar"
                    )
                case "customer":
                    return (
                        tr("المبيعات والعمولة حسب العميل", "Commissions by Customer", isAr: isAr),
                        tr("إجمالي مبيعات وعمولات كل عميل", "Total sales and commission per client", isAr: isAr),
                        "person.2"
                    )
                case "invoice":
                    return (
                        tr("المبيعات والعمولة حسب الفاتورة", "Commissions by Invoice", isAr: isAr),
                        tr("تفاصيل كل فاتورة ومبلغ العمولة المستحق", "Invoice lines and earned commission", isAr: isAr),
                        "doc.text"
                    )
                default:
                    return (
                        tr("المبيعات والعمولة حسب المنتج", "Commissions by Product", isAr: isAr),
                        tr("الكميات والمبالغ ونسب الشرائح لكل صنف", "Quantities, tiers and rates per item", isAr: isAr),
                        "shippingbox"
                    )
                }
            }()

            ModernSalesPageHeader(
                title: headerData.title,
                subtitle: headerData.subtitle,
                iconName: headerData.icon,
                onBack: onBack
            )

            // Modern Expandable Search Bar below the title
            ExpandableModernSearchBar(
                query: $searchQuery,
                placeholder: tr("ابحث في النتائج…", "Search results…", isAr: isAr)
            )

            // Filtered Content
            let q = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

            switch subView {
            case "day":
                let days = detail.daily.filter { q.isEmpty || $0.day.contains(q) }
                ForEach(days) { d in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(Format.dayLabel(d.day, isAr: isAr))
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(tr("تحصيل: \(Format.currency(d.collections, isAr: isAr))", "Collected: \(Format.currency(d.collections, isAr: isAr))", isAr: isAr))
                                .font(.system(size: 11.5))
                                .foregroundColor(c.mutedForeground)
                        }
                        Spacer()
                        Text(Format.currency(d.sales, isAr: isAr))
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(c.primary)
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.4)))
                }

            case "customer":
                let customers = detail.customerRows.filter { q.isEmpty || $0.name.lowercased().contains(q) }
                ForEach(customers) { cust in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(cust.name)
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(tr("\(cust.invoices) فاتورة", "\(cust.invoices) invoices", isAr: isAr))
                                .font(.system(size: 11.5))
                                .foregroundColor(c.mutedForeground)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(Format.currency(cust.amount, isAr: isAr))
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(tr("عمولة: \(Format.currency(cust.commission, isAr: isAr))", "Comm: \(Format.currency(cust.commission, isAr: isAr))", isAr: isAr))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(c.primary)
                        }
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.4)))
                }

            case "invoice":
                let invoices = detail.invoiceRows.filter {
                    q.isEmpty || $0.name.lowercased().contains(q) || $0.customer.lowercased().contains(q)
                }
                ForEach(invoices) { inv in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(inv.name)
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(inv.customer)
                                .font(.system(size: 11.5))
                                .foregroundColor(c.mutedForeground)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(Format.currency(inv.amount, isAr: isAr))
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(tr("عمولة: \(Format.currency(inv.commission, isAr: isAr))", "Comm: \(Format.currency(inv.commission, isAr: isAr))", isAr: isAr))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(c.primary)
                        }
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.4)))
                }

            default:
                let products = detail.products.filter {
                    q.isEmpty || $0.productName.lowercased().contains(q) || ($0.code?.lowercased().contains(q) ?? false)
                }
                ForEach(products) { prod in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(prod.productName)
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(tr("شريحة \(prod.bucket) · \(Format.rate(prod.rate))", "Tier \(prod.bucket) · \(Format.rate(prod.rate))", isAr: isAr))
                                .font(.system(size: 11.5))
                                .foregroundColor(c.mutedForeground)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(Format.currency(prod.amount, isAr: isAr))
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundColor(c.foreground)
                            Text(tr("عمولة: \(Format.currency(prod.commission, isAr: isAr))", "Comm: \(Format.currency(prod.commission, isAr: isAr))", isAr: isAr))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(c.primary)
                        }
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.4)))
                }
            }
        }
    }
}

// ============================================================================
// TAB 3: COLLECTIONS (التحصيل)
// ============================================================================

private struct CollectionsSection: View {
    let detail: RepDetailModel
    let clock: MonthClock
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        let rep = detail.rep
        let r = rep.result
        let col = detail.collections

        VStack(spacing: 18) {
            // Brown Collections Hero Card
            VStack(spacing: 14) {
                HStack {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.18))
                            .frame(width: 38, height: 38)
                        Image(systemName: "banknote")
                            .foregroundColor(.white)
                            .font(.system(size: 16))
                    }

                    Text(tr("المحصّل هذا الشهر", "Collected this month", isAr: isAr))
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)

                    Spacer()

                    Text(Format.percent((r.collectionRatio ?? 0) * 100))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.black.opacity(0.25)))
                }

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(Format.number(r.collections))
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(.white)
                    Text(isAr ? "ج.م" : "EGP")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color.white.opacity(0.85))
                }
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [c.collectionsStart, c.collectionsMid, c.collectionsEnd],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(20)

            // Sources Breakdown (حسب المصدر)
            NsSectionTitle(title: tr("حسب المصدر", "By source", isAr: isAr))

            VStack(spacing: 10) {
                CollectionSourceRow(
                    label: tr("مدفوعات", "Payments", isAr: isAr),
                    amount: col.payment,
                    iconName: "creditcard"
                )

                CollectionSourceRow(
                    label: tr("شيكات محصلة", "Collected cheques", isAr: isAr),
                    amount: col.cheque,
                    iconName: "doc.plaintext"
                )

                CollectionSourceRow(
                    label: tr("مقبوضات خزينة", "Cash receipts", isAr: isAr),
                    amount: col.manual,
                    iconName: "banknote"
                )
            }

            // Customers Card (عملائي: المستحق عليهم اليوم)
            NsSectionTitle(title: tr("عملائي", "My customers", isAr: isAr))

            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(tr("المستحق عليهم اليوم", "Outstanding balance today", isAr: isAr))
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundColor(c.foreground)

                    Text(tr("إجمالي مديونية عملائك المفتوحة", "Total open debt of your customers", isAr: isAr))
                        .font(.system(size: 12))
                        .foregroundColor(c.mutedForeground)
                }

                Spacer()

                Text(Format.currency(rep.receivables ?? 0, isAr: isAr))
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundColor(c.foreground)

                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(c.accent)
                        .frame(width: 44, height: 44)

                    CustomerBalancesIcon(size: 20, color: c.primary)
                }
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 16).fill(c.card))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border, lineWidth: 1))
        }
    }
}

private struct CollectionSourceRow: View {
    let label: String
    let amount: Double
    let iconName: String
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        HStack {
            Text(Format.number(amount))
                .font(.system(size: 14.5, weight: .bold))
                .foregroundColor(c.foreground)

            Spacer()

            Text(label)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(c.foreground)

            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(c.accent)
                    .frame(width: 36, height: 36)
                Image(systemName: iconName)
                    .foregroundColor(c.primary)
                    .font(.system(size: 16))
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.45)))
    }
}

// ============================================================================
// TAB 4: STATEMENT (كشف العمولة)
// ============================================================================

private struct StatementSection: View {
    let detail: RepDetailModel
    let settings: CommissionSettingsModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        let rep = detail.rep
        let r = rep.result

        VStack(spacing: 16) {
            HStack {
                Text(tr("كشف العمولة", "Commission Statement", isAr: isAr))
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundColor(c.foreground)
                Spacer()
                Text(tr("النظام الكامل", "Full Regime", isAr: isAr))
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(c.success)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(c.successSoft))
            }

            // Tiers Breakdown
            VStack(spacing: 10) {
                ForEach(r.tiers) { tier in
                    StatementRow(
                        title: tr("الشريحة \(tier.key.uppercased())", "Tier \(tier.key.uppercased())", isAr: isAr),
                        detail: "\(Format.number(tier.amount)) × \(Format.rate(tier.rate))",
                        amount: tier.commission
                    )
                }

                StatementRow(
                    title: tr("الراكد", "Slow-moving", isAr: isAr),
                    detail: "\(Format.number(r.slowCategory.amount)) × \(Format.rate(r.slowCategory.rate))",
                    amount: r.slowCategory.commission
                )
            }

            Divider()

            // Subtotal
            HStack {
                Text(tr("عمولة البنود", "Line Commission Subtotal", isAr: isAr))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(c.foreground)
                Spacer()
                Text(Format.number(r.base))
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundColor(c.foreground)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 12).fill(c.accent.opacity(0.5)))

            // Adjustments & Penalties
            VStack(spacing: 8) {
                ForEach(r.adjustments) { adj in
                    HStack {
                        Image(systemName: adj.amount < 0 ? "minus.circle.fill" : "plus.circle.fill")
                            .foregroundColor(adj.amount < 0 ? c.destructive : c.success)
                            .font(.system(size: 14))

                        Text(adj.key == "collectionShare"
                             ? tr("تعديل العمولة حسب نسبة التحصيل", "Adjustment by collection ratio", isAr: isAr)
                             : tr("حافز تحقيق الأهداف", "Target achievement bonus", isAr: isAr))
                            .font(.system(size: 12.5, weight: .medium))
                            .foregroundColor(c.foreground)

                        Spacer()

                        Text(Format.signedNumber(adj.amount))
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(adj.amount < 0 ? c.destructive : c.success)
                    }
                    .padding(.horizontal, 4)
                }
            }

            Divider()

            // Net Payout ("تستحق")
            HStack {
                Text(tr("تستحق", "Net Payout", isAr: isAr))
                    .font(.system(size: 20, weight: .black))
                    .foregroundColor(c.foreground)

                Spacer()

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(Format.number(r.total))
                        .font(.system(size: 24, weight: .black))
                        .foregroundColor(c.success)
                    Text(isAr ? "ج.م" : "EGP")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(c.success)
                }
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 14).fill(c.successSoft))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.success.opacity(0.3), lineWidth: 1))
        }
    }
}

private struct StatementRow: View {
    let title: String
    let detail: String
    let amount: Double
    @Environment(\.nsColors) private var c

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundColor(c.foreground)
                Text(detail)
                    .font(.system(size: 11))
                    .foregroundColor(c.mutedForeground)
            }
            Spacer()
            Text(Format.number(amount))
                .font(.system(size: 14.5, weight: .bold))
                .foregroundColor(c.foreground)
        }
        .padding(.horizontal, 4)
    }
}
