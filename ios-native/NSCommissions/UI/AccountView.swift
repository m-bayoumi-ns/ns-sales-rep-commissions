import SwiftUI

struct AccountView: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    @State private var passwordExpanded: Bool = false
    @State private var appearanceExpanded: Bool = false
    @State private var languageExpanded: Bool = false
    @State private var notificationsExpanded: Bool = false

    @State private var currentPass: String = ""
    @State private var nextPass: String = ""
    @State private var confirmPass: String = ""
    @State private var showPass: Bool = false

    var body: some View {
        let user = viewModel.userProfile ?? viewModel.commissionsData?.user

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header Title
                Text(tr("حسابي", "My account", isAr: isAr))
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(c.foreground)
                    .padding(.horizontal, 4)

                // 1. User Identity Profile Card
                VStack(spacing: 0) {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(c.accent)
                                .frame(width: 48, height: 48)

                            Image(systemName: "person.fill")
                                .font(.system(size: 22))
                                .foregroundColor(c.primary)
                        }

                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: 8) {
                                Text(user?.displayName.isEmpty == false ? user!.displayName : (user?.name ?? "—"))
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(c.foreground)

                                let roleLabel: String = {
                                    switch user?.role {
                                    case "admin": return tr("مسؤول", "Administrator", isAr: isAr)
                                    case "manager": return tr("مدير", "Manager", isAr: isAr)
                                    default: return tr("مندوب مبيعات", "Sales rep", isAr: isAr)
                                    }
                                }()

                                Text(roleLabel)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(
                                        Capsule()
                                            .fill(Color(hex: 0x5A3A1D))
                                    )
                            }

                            if let email = user?.email, !email.isEmpty {
                                Text(email)
                                    .font(.system(size: 12.5))
                                    .foregroundColor(c.mutedForeground)
                            }
                        }

                        Spacer()
                    }
                    .padding(18)
                }
                .background(RoundedRectangle(cornerRadius: 24).fill(c.card))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(c.border, lineWidth: 1))

                // 2. Settings Card with the 4 uniform expandable sections in the requested order:
                // 1. تغيير كلمة المرور
                // 2. تغيير الوضع / المظهر
                // 3. تغيير اللغة
                // 4. إشعارات الهاتف
                VStack(alignment: .leading, spacing: 14) {
                    Text(tr("الإعدادات", "Settings", isAr: isAr))
                        .font(.system(size: 15.5, weight: .semibold))
                        .foregroundColor(c.foreground)

                    // 1. تغيير كلمة المرور
                    VStack(spacing: 0) {
                        Button(action: {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                passwordExpanded.toggle()
                            }
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: "key")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(c.primary)

                                Text(tr("تغيير كلمة المرور", "Change password", isAr: isAr))
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(c.foreground)

                                Spacer()

                                Image(systemName: passwordExpanded ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(c.mutedForeground)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                        }
                        .buttonStyle(.plain)

                        if passwordExpanded {
                            VStack(spacing: 12) {
                                if let code = viewModel.passwordStatus {
                                    let (tone, msg): (String, String) = {
                                        switch code {
                                        case "saved":
                                            return ("success", tr("تم تغيير كلمة المرور.", "Password changed.", isAr: isAr))
                                        case "invalid":
                                            return ("error", tr("أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل.", "Enter your current password and a new one of at least 8 characters.", isAr: isAr))
                                        case "mismatch":
                                            return ("error", tr("كلمتا المرور الجديدتان غير متطابقتين.", "The new passwords do not match.", isAr: isAr))
                                        case "same":
                                            return ("error", tr("اختر كلمة مرور مختلفة عن الحالية.", "Choose a password different from the current one.", isAr: isAr))
                                        case "wrongCurrent":
                                            return ("error", tr("كلمة المرور الحالية غير صحيحة.", "The current password is not correct.", isAr: isAr))
                                        default:
                                            return ("error", tr("تعذر تغيير كلمة المرور. حاول مرة أخرى.", "The password could not be changed. Try again.", isAr: isAr))
                                        }
                                    }()
                                    StatusBanner(text: msg, tone: tone)
                                }

                                HStack {
                                    if showPass {
                                        TextField(tr("كلمة المرور الحالية", "Current password", isAr: isAr), text: $currentPass)
                                    } else {
                                        SecureField(tr("كلمة المرور الحالية", "Current password", isAr: isAr), text: $currentPass)
                                    }
                                    Button(action: { showPass.toggle() }) {
                                        Image(systemName: showPass ? "eye.slash" : "eye")
                                            .foregroundColor(c.mutedForeground)
                                    }
                                }
                                .padding(.horizontal, 12)
                                .frame(height: 44)
                                .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.45)))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border, lineWidth: 1))

                                HStack {
                                    if showPass {
                                        TextField(tr("كلمة المرور الجديدة (8 أحرف على الأقل)", "New password (at least 8 chars)", isAr: isAr), text: $nextPass)
                                    } else {
                                        SecureField(tr("كلمة المرور الجديدة (8 أحرف على الأقل)", "New password (at least 8 chars)", isAr: isAr), text: $nextPass)
                                    }
                                }
                                .padding(.horizontal, 12)
                                .frame(height: 44)
                                .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.45)))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border, lineWidth: 1))

                                HStack {
                                    if showPass {
                                        TextField(tr("تأكيد كلمة المرور الجديدة", "Confirm new password", isAr: isAr), text: $confirmPass)
                                    } else {
                                        SecureField(tr("تأكيد كلمة المرور الجديدة", "Confirm new password", isAr: isAr), text: $confirmPass)
                                    }
                                }
                                .padding(.horizontal, 12)
                                .frame(height: 44)
                                .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.45)))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border, lineWidth: 1))

                                Button(action: {
                                    Task {
                                        await viewModel.changePassword(current: currentPass, next: nextPass, confirm: confirmPass)
                                    }
                                }) {
                                    HStack {
                                        if viewModel.passwordSaving {
                                            ProgressView().scaleEffect(0.9)
                                        }
                                        Text(tr("حفظ كلمة المرور", "Save Password", isAr: isAr))
                                            .font(.system(size: 14, weight: .bold))
                                    }
                                    .foregroundColor(c.primaryForeground)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 44)
                                    .background(RoundedRectangle(cornerRadius: 12).fill(c.primary))
                                }
                                .buttonStyle(.plain)
                                .disabled(viewModel.passwordSaving)
                            }
                            .padding(.horizontal, 14)
                            .padding(.bottom, 14)
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.2)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.border, lineWidth: 1))

                    // 2. تغيير الوضع / المظهر
                    VStack(spacing: 0) {
                        Button(action: {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                appearanceExpanded.toggle()
                            }
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: "sun.max")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(c.primary)

                                Text(tr("تغيير الوضع / المظهر", "Change appearance", isAr: isAr))
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(c.foreground)

                                Spacer()

                                Image(systemName: appearanceExpanded ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(c.mutedForeground)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                        }
                        .buttonStyle(.plain)

                        if appearanceExpanded {
                            HStack(spacing: 8) {
                                ChoiceButton(
                                    label: tr("تلقائي", "Auto", isAr: isAr),
                                    icon: "circle.lefthalf.filled",
                                    selected: viewModel.themeMode == "system"
                                ) {
                                    viewModel.setThemeMode("system")
                                }

                                ChoiceButton(
                                    label: tr("فاتح", "Light", isAr: isAr),
                                    icon: "sun.max.fill",
                                    selected: viewModel.themeMode == "light"
                                ) {
                                    viewModel.setThemeMode("light")
                                }

                                ChoiceButton(
                                    label: tr("داكن", "Dark", isAr: isAr),
                                    icon: "moon.fill",
                                    selected: viewModel.themeMode == "dark"
                                ) {
                                    viewModel.setThemeMode("dark")
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.bottom, 14)
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.2)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.border, lineWidth: 1))

                    // 3. تغيير اللغة
                    VStack(spacing: 0) {
                        Button(action: {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                languageExpanded.toggle()
                            }
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: "globe")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(c.primary)

                                Text(tr("تغيير اللغة", "Change language", isAr: isAr))
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(c.foreground)

                                Spacer()

                                Image(systemName: languageExpanded ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(c.mutedForeground)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                        }
                        .buttonStyle(.plain)

                        if languageExpanded {
                            HStack(spacing: 8) {
                                ChoiceButton(
                                    label: "العربية",
                                    icon: nil,
                                    selected: viewModel.language == "ar"
                                ) {
                                    viewModel.setLanguage("ar")
                                }

                                ChoiceButton(
                                    label: "English",
                                    icon: nil,
                                    selected: viewModel.language == "en"
                                ) {
                                    viewModel.setLanguage("en")
                                }
                            }
                            .padding(.horizontal, 14)
                            .padding(.bottom, 14)
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.2)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.border, lineWidth: 1))

                    // 4. إشعارات الهاتف
                    VStack(spacing: 0) {
                        Button(action: {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                notificationsExpanded.toggle()
                            }
                        }) {
                            HStack(spacing: 8) {
                                Image(systemName: "bell.badge")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(c.primary)

                                Text(tr("إشعارات الهاتف", "Phone notifications", isAr: isAr))
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(c.foreground)

                                Spacer()

                                Image(systemName: notificationsExpanded ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(c.mutedForeground)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                        }
                        .buttonStyle(.plain)

                        if notificationsExpanded {
                            VStack(spacing: 12) {
                                HStack(spacing: 8) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(c.success)
                                    Text(tr("إشعارات التطبيق مفعلة وجاهزة للاستقبال", "Notifications active on this device", isAr: isAr))
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(c.success)
                                    Spacer()
                                }

                                Button(action: {
                                    Task { await viewModel.sendTestNotification() }
                                }) {
                                    HStack(spacing: 8) {
                                        if viewModel.testNotifStatus == "sending" {
                                            ProgressView().scaleEffect(0.8)
                                        }
                                        Text(viewModel.testNotifStatus == "sent"
                                             ? tr("تم إرسال إشعار تجريبي ✓", "Test notification sent ✓", isAr: isAr)
                                             : tr("إرسال إشعار تجريبي", "Send test notification", isAr: isAr))
                                            .font(.system(size: 13.5, weight: .semibold))
                                            .foregroundColor(viewModel.testNotifStatus == "sent" ? c.success : c.foreground)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 42)
                                    .background(RoundedRectangle(cornerRadius: 12).fill(c.muted.opacity(0.45)))
                                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border, lineWidth: 1))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.horizontal, 14)
                            .padding(.bottom, 14)
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 14).fill(c.muted.opacity(0.2)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.border, lineWidth: 1))

                    Spacer().frame(height: 4)

                    // Sign Out Button
                    Button(action: { viewModel.signOut() }) {
                        HStack(spacing: 8) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.system(size: 17, weight: .semibold))
                            Text(tr("تسجيل الخروج", "Sign out", isAr: isAr))
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .foregroundColor(c.destructive)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(RoundedRectangle(cornerRadius: 14).fill(c.destructiveSoft))
                    }
                    .buttonStyle(.plain)
                }
                .padding(20)
                .background(RoundedRectangle(cornerRadius: 24).fill(c.card))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(c.border, lineWidth: 1))

                Spacer().frame(height: 24)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .background(c.background.ignoresSafeArea())
    }
}

private struct ChoiceButton: View {
    let label: String
    let icon: String?
    let selected: Boolean
    let onClick: () -> Void

    @Environment(\.nsColors) private var c

    var body: some View {
        Button(action: onClick) {
            HStack(spacing: 6) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 14))
                }
                Text(label)
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundColor(selected ? c.primary : c.mutedForeground)
            .frame(maxWidth: .infinity)
            .frame(height: 42)
            .background(RoundedRectangle(cornerRadius: 12).fill(selected ? c.accent : c.card))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selected ? c.primary : c.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
