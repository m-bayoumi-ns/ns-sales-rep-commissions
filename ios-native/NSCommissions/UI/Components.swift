import SwiftUI

// MARK: - Custom Vector Icons (1:1 with LucideIcons.kt)

struct WhatsAppVectorIcon: View {
    var size: CGFloat = 22
    var color: Color = .white

    var body: some View {
        Canvas { context, canvasSize in
            let scaleX = canvasSize.width / 24.0
            let scaleY = canvasSize.height / 24.0

            // Speech bubble with bottom-left pointer
            var bubble = Path()
            bubble.move(to: CGPoint(x: 21 * scaleX, y: 11.5 * scaleY))
            bubble.addArc(
                center: CGPoint(x: 12.5 * scaleX, y: 11.5 * scaleY),
                radius: 8.5 * min(scaleX, scaleY),
                startAngle: .degrees(0),
                endAngle: .degrees(145),
                clockwise: true
            )
            bubble.addLine(to: CGPoint(x: 3.0 * scaleX, y: 21.0 * scaleY))
            bubble.addLine(to: CGPoint(x: 7.8 * scaleX, y: 19.3 * scaleY))
            bubble.addArc(
                center: CGPoint(x: 12.5 * scaleX, y: 11.5 * scaleY),
                radius: 8.5 * min(scaleX, scaleY),
                startAngle: .degrees(125),
                endAngle: .degrees(0),
                clockwise: true
            )
            bubble.closeSubpath()

            context.stroke(
                bubble,
                with: .color(color),
                style: StrokeStyle(lineWidth: 2.0 * min(scaleX, scaleY), lineCap: .round, lineJoin: .round)
            )

            // Phone handset receiver inside
            var phone = Path()
            phone.move(to: CGPoint(x: 9.0 * scaleX, y: 8.5 * scaleY))
            phone.addQuadCurve(
                to: CGPoint(x: 10.2 * scaleX, y: 12.9 * scaleY),
                control: CGPoint(x: 8.4 * scaleX, y: 11.0 * scaleY)
            )
            phone.addQuadCurve(
                to: CGPoint(x: 14.6 * scaleX, y: 14.1 * scaleY),
                control: CGPoint(x: 12.2 * scaleX, y: 14.7 * scaleY)
            )
            phone.addLine(to: CGPoint(x: 13.5 * scaleX, y: 12.8 * scaleY))
            phone.addLine(to: CGPoint(x: 12.3 * scaleX, y: 13.3 * scaleY))
            phone.addQuadCurve(
                to: CGPoint(x: 10.7 * scaleX, y: 11.7 * scaleY),
                control: CGPoint(x: 11.3 * scaleX, y: 12.6 * scaleY)
            )
            phone.addLine(to: CGPoint(x: 11.2 * scaleX, y: 10.6 * scaleY))
            phone.closeSubpath()

            context.stroke(
                phone,
                with: .color(color),
                style: StrokeStyle(lineWidth: 1.85 * min(scaleX, scaleY), lineCap: .round, lineJoin: .round)
            )
        }
        .frame(width: size, height: size)
    }
}

/// Modern Sales Icon (`ChartNoAxesCombined` — Rising Bars + Upward Trend Arrow)
struct SalesRisingIcon: View {
    var size: CGFloat = 22
    var color: Color

    var body: some View {
        Canvas { context, canvasSize in
            let sx = canvasSize.width / 24.0
            let sy = canvasSize.height / 24.0
            let stroke = StrokeStyle(lineWidth: 2.1 * min(sx, sy), lineCap: .round, lineJoin: .round)

            var bars = Path()
            // Bar 1 (Left, short)
            bars.move(to: CGPoint(x: 5 * sx, y: 20 * sy))
            bars.addLine(to: CGPoint(x: 5 * sx, y: 15 * sy))
            // Bar 2 (Middle-left)
            bars.move(to: CGPoint(x: 10 * sx, y: 20 * sy))
            bars.addLine(to: CGPoint(x: 10 * sx, y: 12 * sy))
            // Bar 3 (Middle-right)
            bars.move(to: CGPoint(x: 15 * sx, y: 20 * sy))
            bars.addLine(to: CGPoint(x: 15 * sx, y: 14 * sy))
            // Bar 4 (Right, tall)
            bars.move(to: CGPoint(x: 20 * sx, y: 20 * sy))
            bars.addLine(to: CGPoint(x: 20 * sx, y: 9 * sy))
            context.stroke(bars, with: .color(color), style: stroke)

            // Upward trend line with arrow head
            var trend = Path()
            trend.move(to: CGPoint(x: 3.5 * sx, y: 11 * sy))
            trend.addLine(to: CGPoint(x: 9.5 * sx, y: 6.5 * sy))
            trend.addLine(to: CGPoint(x: 13.5 * sx, y: 9.5 * sy))
            trend.addLine(to: CGPoint(x: 20.5 * sx, y: 3.5 * sy))
            // Arrow head
            trend.move(to: CGPoint(x: 16.5 * sx, y: 3.5 * sy))
            trend.addLine(to: CGPoint(x: 20.5 * sx, y: 3.5 * sy))
            trend.addLine(to: CGPoint(x: 20.5 * sx, y: 7.5 * sy))
            context.stroke(trend, with: .color(color), style: stroke)
        }
        .frame(width: size, height: size)
    }
}

/// Customer Balances Icon (`CustomerBalances` / `Users` — Customers who have outstanding balances)
struct CustomerBalancesIcon: View {
    var size: CGFloat = 22
    var color: Color

    var body: some View {
        Image(systemName: "person.2")
            .resizable()
            .scaledToFit()
            .font(.system(size: size, weight: .semibold))
            .foregroundColor(color)
            .frame(width: size, height: size)
    }
}

// MARK: - Circular Lightbulb Day/Night Toggle Button (with Modern Transition)

struct LightbulbThemeButton: View {
    let isDark: Bool
    let onToggle: () -> Void
    @Environment(\.nsColors) private var c

    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.42, dampingFraction: 0.72)) {
                onToggle()
            }
        }) {
            ZStack {
                Circle()
                    .fill(isDark ? Color(hex: 0x2D241C) : Color(hex: 0xFFF7E6))
                    .overlay(
                        Circle()
                            .stroke(
                                isDark ? c.primary.opacity(0.45) : Color(hex: 0xD97706).opacity(0.35),
                                lineWidth: 1.2
                            )
                    )
                    .shadow(
                        color: (isDark ? c.primary : Color(hex: 0xF59E0B)).opacity(0.22),
                        radius: isDark ? 3 : 6,
                        x: 0,
                        y: 2
                    )

                Image(systemName: isDark ? "lightbulb" : "lightbulb.fill")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(isDark ? c.primary : Color(hex: 0xD97706))
                    .rotationEffect(.degrees(isDark ? -12 : 0))
                    .scaleEffect(isDark ? 0.94 : 1.06)
                    .animation(.spring(response: 0.42, dampingFraction: 0.68), value: isDark)
            }
            .frame(width: 38, height: 38)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isDark ? "Switch to Light Mode" : "Switch to Dark Mode")
    }
}

// MARK: - Centered NS Loading Screen (1:1 with MainActivity CenteredLoader)

struct CenteredNsLoader: View {
    @Environment(\.nsColors) private var c
    @State private var rotation: Double = 0

    var body: some View {
        ZStack {
            c.background.ignoresSafeArea()

            ZStack {
                Circle()
                    .stroke(c.border, lineWidth: 2.5)
                    .frame(width: 76, height: 76)

                Circle()
                    .trim(from: 0.0, to: 0.28)
                    .stroke(
                        c.primary,
                        style: StrokeStyle(lineWidth: 2.8, lineCap: .round)
                    )
                    .frame(width: 76, height: 76)
                    .rotationEffect(.degrees(rotation))

                Image("ns_mark")
                    .resizable()
                    .renderingMode(.template)
                    .scaledToFit()
                    .foregroundColor(c.primary)
                    .frame(width: 38, height: 38)
            }
            .onAppear {
                withAnimation(.linear(duration: 1.15).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }
        }
    }
}

// MARK: - Modern Expandable Search Bar (for Sales Sub-views)

struct ExpandableModernSearchBar: View {
    @Binding var query: String
    let placeholder: String
    @Environment(\.nsColors) private var c
    @State private var isExpanded: Bool = false
    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: 10) {
            if isExpanded || !query.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(c.primary)

                    TextField(placeholder, text: $query)
                        .focused($isFocused)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(c.foreground)
                        .submitLabel(.search)

                    Button(action: {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            if !query.isEmpty {
                                query = ""
                            } else {
                                isFocused = false
                                isExpanded = false
                            }
                        }
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 17))
                            .foregroundColor(c.mutedForeground)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 14)
                .frame(height: 44)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.muted.opacity(0.65))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(c.primary.opacity(0.45), lineWidth: 1.2)
                )
                .transition(.asymmetric(
                    insertion: .scale(scale: 0.92).combined(with: .opacity),
                    removal: .scale(scale: 0.92).combined(with: .opacity)
                ))
            } else {
                Button(action: {
                    withAnimation(.spring(response: 0.38, dampingFraction: 0.78)) {
                        isExpanded = true
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                        isFocused = true
                    }
                }) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(c.accent)
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Circle()
                                        .stroke(c.primary.opacity(0.28), lineWidth: 1)
                                )

                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(c.primary)
                        }

                        Text(placeholder)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(c.mutedForeground)

                        Spacer()
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(c.muted.opacity(0.45))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(c.border, lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Modern Sales Sub-page Header

struct ModernSalesPageHeader: View {
    let title: String
    let subtitle: String
    let iconName: String
    let onBack: () -> Void
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: onBack) {
                HStack(spacing: 6) {
                    Image(systemName: isAr ? "chevron.right" : "chevron.left")
                        .font(.system(size: 13, weight: .bold))
                    Text(tr("العودة لطرق العرض", "Back to views", isAr: isAr))
                        .font(.system(size: 13, weight: .semibold))
                }
                .foregroundColor(c.primary)
                .padding(.vertical, 4)
            }
            .buttonStyle(.plain)

            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [c.heroStart, c.heroMid],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 48, height: 48)
                        .shadow(color: c.primary.opacity(0.2), radius: 6, x: 0, y: 3)

                    Image(systemName: iconName)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.system(size: 19, weight: .heavy))
                        .foregroundColor(c.foreground)

                    Text(subtitle)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundColor(c.mutedForeground)
                }

                Spacer()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(c.accent.opacity(0.55))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(c.primary.opacity(0.18), lineWidth: 1)
            )
        }
    }
}

// MARK: - Reusable Row & Section Helpers

struct NsSectionTitle: View {
    let title: String
    var trailing: String? = nil
    @Environment(\.nsColors) private var c

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(c.mutedForeground)
            Spacer()
            if let trailing = trailing {
                Text(trailing)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(c.mutedForeground)
            }
        }
        .padding(.horizontal, 4)
    }
}

struct StatusBanner: View {
    let text: String
    var tone: String = "error" // "error" | "warn" | "success"
    @Environment(\.nsColors) private var c

    var body: some View {
        let bg: Color = {
            switch tone {
            case "success": return c.successSoft
            case "warn": return c.warningSoft
            default: return c.destructiveSoft
            }
        }()
        let fg: Color = {
            switch tone {
            case "success": return c.success
            case "warn": return c.warning
            default: return c.destructive
            }
        }()
        let icon: String = {
            switch tone {
            case "success": return "checkmark.circle.fill"
            case "warn": return "exclamationmark.triangle.fill"
            default: return "exclamationmark.circle.fill"
            }
        }()

        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(fg)
                .padding(.top, 1)

            Text(text)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(fg)
                .multilineTextAlignment(.leading)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(bg)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(fg.opacity(0.25), lineWidth: 1)
        )
    }
}
