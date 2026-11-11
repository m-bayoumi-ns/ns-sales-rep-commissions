import SwiftUI

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}

struct NsColors: Equatable {
    let isDark: Bool
    let background: Color
    let card: Color
    let foreground: Color
    let muted: Color
    let mutedForeground: Color
    let primary: Color
    let primaryForeground: Color
    let accent: Color
    let border: Color
    let success: Color
    let successSoft: Color
    let warning: Color
    let warningSoft: Color
    let destructive: Color
    let destructiveSoft: Color
    let heroStart: Color
    let heroMid: Color
    let heroEnd: Color
    let collectionsStart: Color
    let collectionsMid: Color
    let collectionsEnd: Color

    static let light = NsColors(
        isDark: false,
        background: Color(hex: 0xF6F5F3),
        card: Color(hex: 0xFFFFFF),
        foreground: Color(hex: 0x1C1917),
        muted: Color(hex: 0xF1EFEC),
        mutedForeground: Color(hex: 0x5F5750),
        primary: Color(hex: 0x744C27),
        primaryForeground: Color(hex: 0xFFFFFF),
        accent: Color(hex: 0xF4ECE3),
        border: Color(hex: 0xE4E0DA),
        success: Color(hex: 0x136C34),
        successSoft: Color(hex: 0xE6F3EA),
        warning: Color(hex: 0x94530A),
        warningSoft: Color(hex: 0xFCF0DC),
        destructive: Color(hex: 0xB42318),
        destructiveSoft: Color(hex: 0xFCEBE9),
        heroStart: Color(hex: 0x5A3A1D),
        heroMid: Color(hex: 0x4A2D16),
        heroEnd: Color(hex: 0x2E1D0F),
        collectionsStart: Color(hex: 0x805A34),
        collectionsMid: Color(hex: 0x704A2A),
        collectionsEnd: Color(hex: 0x54381F)
    )

    static let dark = NsColors(
        isDark: true,
        background: Color(hex: 0x121110),
        card: Color(hex: 0x1C1A18),
        foreground: Color(hex: 0xF3EFEA),
        muted: Color(hex: 0x262320),
        mutedForeground: Color(hex: 0xA8A096),
        primary: Color(hex: 0xD2A574),
        primaryForeground: Color(hex: 0x1C1917),
        accent: Color(hex: 0x2B231C),
        border: Color(hex: 0x332E2A),
        success: Color(hex: 0x4ADE80),
        successSoft: Color(hex: 0x132E1E),
        warning: Color(hex: 0xFBBF24),
        warningSoft: Color(hex: 0x33240C),
        destructive: Color(hex: 0xF87171),
        destructiveSoft: Color(hex: 0x361515),
        heroStart: Color(hex: 0x5A3A1D),
        heroMid: Color(hex: 0x432813),
        heroEnd: Color(hex: 0x26170B),
        collectionsStart: Color(hex: 0x75502C),
        collectionsMid: Color(hex: 0x5E3E20),
        collectionsEnd: Color(hex: 0x422B16)
    )
}

private struct NsColorsKey: EnvironmentKey {
    static let defaultValue: NsColors = .light
}

private struct IsArabicKey: EnvironmentKey {
    static let defaultValue: Bool = true
}

extension EnvironmentValues {
    var nsColors: NsColors {
        get { self[NsColorsKey.self] }
        set { self[NsColorsKey.self] = newValue }
    }
    var isArabic: Bool {
        get { self[IsArabicKey.self] }
        set { self[IsArabicKey.self] = newValue }
    }
}

func tr(_ ar: String, _ en: String, isAr: Bool) -> String {
    return isAr ? ar : en
}

// MARK: - Formatting Utilities (1:1 with Format.kt)

enum Format {
    private static let intFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        f.groupingSeparator = ","
        return f
    }()

    private static let dec1Formatter: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.numberStyle = .decimal
        f.minimumFractionDigits = 1
        f.maximumFractionDigits = 1
        f.groupingSeparator = ","
        return f
    }()

    private static let dec2Formatter: NumberFormatter = {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.numberStyle = .decimal
        f.minimumFractionDigits = 0
        f.maximumFractionDigits = 2
        f.groupingSeparator = ","
        return f
    }()

    static func number(_ value: Double) -> String {
        return intFormatter.string(from: NSNumber(value: value.rounded())) ?? "0"
    }

    static func integer(_ value: Double) -> String {
        if value == floor(value) {
            return String(Int(value))
        }
        return dec2Formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    static func signedNumber(_ value: Double) -> String {
        let rounded = value.rounded()
        let absStr = intFormatter.string(from: NSNumber(value: abs(rounded))) ?? "0"
        if rounded > 0 { return "+\(absStr)" }
        if rounded < 0 { return "-\(absStr)" }
        return "0"
    }

    static func currency(_ value: Double, isAr: Bool) -> String {
        let num = number(value)
        return isAr ? "\(num) ج.م" : "EGP \(num)"
    }

    static func compact(_ value: Double, isAr: Bool) -> String {
        let absVal = abs(value)
        let sign = value < 0 ? "-" : ""
        if absVal >= 1_000_000 {
            let m = absVal / 1_000_000.0
            let s = dec2Formatter.string(from: NSNumber(value: m)) ?? String(format: "%.2f", m)
            return isAr ? "\(sign)\(s) مليون" : "\(sign)\(s)M"
        }
        if absVal >= 1_000 {
            let k = absVal / 1_000.0
            let s = dec2Formatter.string(from: NSNumber(value: k)) ?? String(format: "%.1f", k)
            return isAr ? "\(sign)\(s) ألف" : "\(sign)\(s)K"
        }
        return number(value)
    }

    static func compactCurrency(_ value: Double, isAr: Bool) -> String {
        let c = compact(value, isAr: isAr)
        return isAr ? "\(c) ج.م" : "EGP \(c)"
    }

    static func percent(_ value: Double?, decimals: Int = 1) -> String {
        guard let v = value else { return "—" }
        if decimals == 0 {
            return "\(Int(v.rounded()))%"
        }
        let s = dec1Formatter.string(from: NSNumber(value: v)) ?? String(format: "%.1f", v)
        return "\(s)%"
    }

    static func rate(_ value: Double?) -> String {
        guard let v = value else { return "—" }
        let s = dec2Formatter.string(from: NSNumber(value: v)) ?? "\(v)"
        return "\(s)%"
    }

    static func monthLabel(_ ym: String, isAr: Bool) -> String {
        let parts = ym.split(separator: "-")
        guard parts.count == 2,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              (1...12).contains(month) else {
            return ym
        }
        let arNames = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ]
        let enNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        return isAr ? "\(arNames[month - 1]) \(year)" : "\(enNames[month - 1]) \(year)"
    }

    static func dayLabel(_ isoDay: String, isAr: Bool) -> String {
        let parts = isoDay.split(separator: "-")
        guard parts.count == 3,
              let month = Int(parts[1]),
              let day = Int(parts[2]),
              (1...12).contains(month) else {
            return isoDay
        }
        let arShort = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
        let enShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return isAr ? "\(day) \(arShort[month - 1])" : "\(enShort[month - 1]) \(day)"
    }
}
