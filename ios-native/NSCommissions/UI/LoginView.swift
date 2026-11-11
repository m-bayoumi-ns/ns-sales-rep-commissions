import LocalAuthentication
import SwiftUI

struct LoginView: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    @State private var identifier: String = ""
    @State private var password: String = ""
    @State private var rememberMe: Bool = true
    @State private var showPassword: Bool = false
    @State private var biometricAvailable: Bool = false

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: c.isDark
                    ? [Color(hex: 0x14110E), Color(hex: 0x191511)]
                    : [Color(hex: 0xF8F6F2), Color(hex: 0xEFE9E1)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    // Top Actions: Lightbulb day/night toggle + Language switch
                    HStack(spacing: 12) {
                        LightbulbThemeButton(isDark: c.isDark) {
                            viewModel.toggleTheme()
                        }

                        Button(action: {
                            viewModel.toggleLanguage()
                        }) {
                            Text(isAr ? "EN" : "عربي")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(c.primary)
                                .frame(height: 38)
                                .padding(.horizontal, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 19)
                                        .fill(c.muted)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 19)
                                        .stroke(c.border, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)

                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 14)

                    Spacer(minLength: 24)

                    // Centered Card (1:1 with Android native LoginScreen)
                    VStack(spacing: 20) {
                        // Brand Header
                        VStack(spacing: 10) {
                            Image("ns_mark")
                                .resizable()
                                .renderingMode(.template)
                                .scaledToFit()
                                .foregroundColor(c.primary)
                                .frame(width: 58, height: 58)

                            Image("ns_wordmark")
                                .resizable()
                                .renderingMode(.template)
                                .scaledToFit()
                                .foregroundColor(c.primary)
                                .frame(height: 22)

                            Text(tr("عمولات المندوبين", "Sales Rep Commissions", isAr: isAr))
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(c.mutedForeground)
                        }
                        .padding(.top, 8)

                        // Title & Subtitle
                        VStack(spacing: 4) {
                            Text(tr("تسجيل الدخول", "Sign in to your account", isAr: isAr))
                                .font(.system(size: 21, weight: .heavy))
                                .foregroundColor(c.foreground)

                            Text(tr(
                                "أدخل البريد أو اسم المستخدم وكلمة المرور للوصول إلى لوحة العمولات.",
                                "Enter your email or username and password to access your commission dashboard.",
                                isAr: isAr
                            ))
                            .font(.system(size: 12.5, weight: .medium))
                            .foregroundColor(c.mutedForeground)
                            .multilineTextAlignment(.center)
                            .lineSpacing(2)
                            .padding(.horizontal, 8)
                        }

                        // Error Banner if any
                        if let error = viewModel.signInError {
                            let msg: String = {
                                switch error {
                                case "invalid_input":
                                    return tr("أدخل البريد أو اسم المستخدم وكلمة المرور.", "Enter your email/username and password.", isAr: isAr)
                                case "unknown_user":
                                    return tr("هذا اليوزر غير متاح بالنظام. راجع اسم المستخدم أو اطلب حسابك من المسؤول.", "This user is not registered. Check your username or ask the administrator.", isAr: isAr)
                                case "invalid_credentials":
                                    return tr("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Incorrect username/email or password.", isAr: isAr)
                                case "locked":
                                    return tr("محاولات كثيرة. تم إيقاف تسجيل الدخول مؤقتًا.", "Too many attempts. Sign-in is paused.", isAr: isAr)
                                default:
                                    return tr("تعذّر تسجيل الدخول. حاول مرة أخرى.", "Could not sign in. Please try again.", isAr: isAr)
                                }
                            }()
                            StatusBanner(text = msg, tone: "error")
                        }

                        // Input Fields
                        VStack(spacing: 14) {
                            // Identifier Input
                            VStack(alignment: .leading, spacing: 6) {
                                Text(tr("اسم المستخدم أو البريد الإلكتروني", "Email or username", isAr: isAr))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(c.foreground)

                                HStack {
                                    TextField("nsr305 or name@naguibselim.com", text: $identifier)
                                        .font(.system(size: 14))
                                        .foregroundColor(c.foreground)
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                }
                                .padding(.horizontal, 14)
                                .frame(height: 48)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(c.muted.opacity(0.55))
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(c.border, lineWidth: 1)
                                )
                            }

                            // Password Input
                            VStack(alignment: .leading, spacing: 6) {
                                Text(tr("كلمة المرور", "Password", isAr: isAr))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(c.foreground)

                                HStack {
                                    if showPassword {
                                        TextField(tr("كلمة المرور", "Password", isAr: isAr), text: $password)
                                            .font(.system(size: 14))
                                            .foregroundColor(c.foreground)
                                    } else {
                                        SecureField(tr("كلمة المرور", "Password", isAr: isAr), text: $password)
                                            .font(.system(size: 14))
                                            .foregroundColor(c.foreground)
                                    }

                                    Button(action: { showPassword.toggle() }) {
                                        Image(systemName: showPassword ? "eye.slash" : "eye")
                                            .font(.system(size: 15))
                                            .foregroundColor(c.mutedForeground)
                                    }
                                    .buttonStyle(.plain)
                                }
                                .padding(.horizontal, 14)
                                .frame(height: 48)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(c.muted.opacity(0.55))
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(c.border, lineWidth: 1)
                                )
                            }
                        }

                        // Remember Me Checkbox
                        Button(action: { rememberMe.toggle() }) {
                            HStack(spacing: 10) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(rememberMe ? c.primary : Color.clear)
                                        .frame(width: 20, height: 20)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 6)
                                                .stroke(rememberMe ? c.primary : c.border, lineWidth: 1.5)
                                        )

                                    if rememberMe {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundColor(c.primaryForeground)
                                    }
                                }

                                Text(tr("تذكرني على هذا الجهاز", "Remember me on this device", isAr: isAr))
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(c.foreground)

                                Spacer()
                            }
                        }
                        .buttonStyle(.plain)

                        // Sign-in Row: Primary Button + Square Biometric Button
                        HStack(spacing: 10) {
                            Button(action: {
                                Task {
                                    await viewModel.signIn(identifier: identifier, pass: password, rememberMe: rememberMe)
                                }
                            }) {
                                HStack(spacing: 8) {
                                    if viewModel.signingIn {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: c.primaryForeground))
                                            .scaleEffect(0.9)
                                        Text(tr("جارٍ تسجيل الدخول…", "Signing in…", isAr: isAr))
                                            .font(.system(size: 14, weight: .bold))
                                    } else {
                                        Text(tr("تسجيل الدخول", "Sign in", isAr: isAr))
                                            .font(.system(size: 14, weight: .bold))
                                    }
                                }
                                .foregroundColor(c.primaryForeground)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(c.primary)
                                )
                            }
                            .buttonStyle(.plain)
                            .disabled(viewModel.signingIn)

                            // Square Biometric (Face ID / Touch ID) Button placed next to Sign-in
                            if biometricAvailable {
                                Button(action: {
                                    Task {
                                        await viewModel.biometricSignIn()
                                    }
                                }) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(c.muted.opacity(0.75))
                                            .frame(width: 48, height: 48)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 14)
                                                    .stroke(c.primary.opacity(0.35), lineWidth: 1.2)
                                            )

                                        Image(systemName: LAContext().biometryType == .faceID ? "faceid" : "touchid")
                                            .font(.system(size: 22, weight: .semibold))
                                            .foregroundColor(c.primary)
                                    }
                                }
                                .buttonStyle(.plain)
                                .disabled(viewModel.signingIn)
                                .accessibilityLabel("Biometric Sign In")
                            }
                        }

                        // WhatsApp Admin Support Card with aligned icon and text
                        Button(action: openWhatsAppSupport) {
                            HStack(spacing: 12) {
                                // Circular WhatsApp Logo Button
                                ZStack {
                                    Circle()
                                        .fill(Color(hex: 0x25D366))
                                        .frame(width: 42, height: 42)
                                        .shadow(color: Color(hex: 0x25D366).opacity(0.35), radius: 3, x: 0, y: 2)

                                    WhatsAppVectorIcon(size: 22, color: .white)
                                }

                                Text(tr(
                                    "إذا واجهتك أي مشكلة في تسجيل الدخول أو حسابك، يرجى التواصل مع المسؤول مباشرة عبر واتساب.",
                                    "If you experience issues logging in or with your account, please contact the administrator via WhatsApp.",
                                    isAr: isAr
                                ))
                                .font(.system(size: 11.8, weight: .medium))
                                .foregroundColor(c.mutedForeground)
                                .lineSpacing(2.5)
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(c.muted.opacity(0.55))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(c.border, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(22)
                    .background(
                        RoundedRectangle(cornerRadius: 28)
                            .fill(c.card)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(c.border, lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(c.isDark ? 0.35 : 0.06), radius: 16, x: 0, y: 8)
                    .padding(.horizontal, 18)

                    Spacer(minLength: 28)
                }
            }
        }
        .onAppear {
            let saved = viewModel.store.savedUsername()
            if !saved.isEmpty {
                self.identifier = saved
            }
            let ctx = LAContext()
            var err: NSError?
            self.biometricAvailable = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err)
        }
    }

    private func openWhatsAppSupport() {
        let text = tr(
            "السلام عليكم، أحتاج مساعدة في تسجيل الدخول لتطبيق عمولات نجيب سليم.",
            "Hello, I need assistance logging in to the Naguib Selim Commissions app.",
            isAr: isAr
        )
        guard let encoded = text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let appUrl = URL(string: "whatsapp://send?phone=201277909022&text=\(encoded)") else {
            return
        }
        if UIApplication.shared.canOpenURL(appUrl) {
            UIApplication.shared.open(appUrl)
        } else if let webUrl = URL(string: "https://wa.me/201277909022?text=\(encoded)") {
            UIApplication.shared.open(webUrl)
        }
    }
}
