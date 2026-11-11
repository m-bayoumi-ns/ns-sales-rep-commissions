import SwiftUI

struct BottomNavBar: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        let isCommissions = viewModel.activeDestination == .commissions
        let isAccount = viewModel.activeDestination == .account
        let section = viewModel.activeSection

        let isSummary = isCommissions && section == .summary
        let isSales = isCommissions && section == .sales
        let isCollections = isCommissions && section == .collections
        let isStatement = isCommissions && section == .statement

        ZStack(alignment: .bottom) {
            // Main navigation pill bar
            HStack(spacing: 0) {
                // 1. Account (الحساب)
                NavSideButton(
                    label: tr("الحساب", "Account", isAr: isAr),
                    systemIcon: "person",
                    selected: isAccount
                ) {
                    viewModel.activeDestination = .account
                }
                .frame(maxWidth: .infinity)

                // 2. Sales (المبيعات) with Rising Bars Trend Icon
                Button(action: {
                    viewModel.activeDestination = .commissions
                    viewModel.activeSection = .sales
                }) {
                    VStack(spacing: 4) {
                        SalesRisingIcon(size: 21, color: isSales ? c.primary : c.mutedForeground)
                        Text(tr("المبيعات", "Sales", isAr: isAr))
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(isSales ? c.primary : c.mutedForeground)
                    }
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity)

                // 3. Center Space for the floating button
                Spacer().frame(width: 58)

                // 4. Collections (التحصيل) with Customer Balances Icon
                Button(action: {
                    viewModel.activeDestination = .commissions
                    viewModel.activeSection = .collections
                }) {
                    VStack(spacing: 4) {
                        CustomerBalancesIcon(size: 21, color: isCollections ? c.primary : c.mutedForeground)
                        Text(tr("التحصيل", "Collections", isAr: isAr))
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(isCollections ? c.primary : c.mutedForeground)
                    }
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity)

                // 5. Statement (الكشف)
                NavSideButton(
                    label: tr("الكشف", "Statement", isAr: isAr),
                    systemIcon: "doc.text",
                    selected: isStatement
                ) {
                    viewModel.activeDestination = .commissions
                    viewModel.activeSection = .statement
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 8)
            .frame(height: 62)
            .background(
                c.card.opacity(0.96)
                    .background(.ultraThinMaterial)
            )
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(c.border.opacity(0.7)),
                alignment: .top
            )

            // Center Floating Home NS Button (الرئيسية)
            VStack(spacing: 2) {
                Button(action: {
                    viewModel.activeDestination = .commissions
                    viewModel.activeSection = .summary
                }) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [c.heroStart, c.heroMid, c.heroEnd],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 54, height: 54)
                            .overlay(
                                Circle()
                                    .stroke(
                                        isSummary ? c.primary : Color.white.opacity(0.4),
                                        lineWidth: isSummary ? 2.5 : 1.5
                                    )
                            )
                            .shadow(color: c.primary.opacity(0.35), radius: 8, x: 0, y: 4)

                        Image("ns_mark")
                            .resizable()
                            .renderingMode(.template)
                            .scaledToFit()
                            .foregroundColor(.white)
                            .frame(width: 32, height: 32)
                    }
                }
                .buttonStyle(.plain)
                .offset(y: -18)

                Text(tr("الرئيسية", "Home", isAr: isAr))
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(isSummary ? c.primary : c.mutedForeground)
                    .offset(y: -14)
            }
        }
        .frame(height: 72)
    }
}

private struct NavSideButton: View {
    let label: String
    let systemIcon: String
    let selected: Bool
    let action: () -> Void
    @Environment(\.nsColors) private var c

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: systemIcon)
                    .font(.system(size: 19, weight: selected ? .bold : .medium))
                    .foregroundColor(selected ? c.primary : c.mutedForeground)

                Text(label)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(selected ? c.primary : c.mutedForeground)
            }
        }
        .buttonStyle(.plain)
    }
}
