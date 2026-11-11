import Foundation
import LocalAuthentication
import SwiftUI

@MainActor
final class AppViewModel: ObservableObject {
    @Published var signedIn: Bool = false
    @Published var signingIn: Bool = false
    @Published var signInError: String? = nil

    @Published var userProfile: UserProfile? = nil
    @Published var commissionsData: CommissionsViewPayload? = nil
    @Published var loadingCommissions: Bool = false
    @Published var commissionsError: String? = nil

    @Published var selectedMonth: String? = nil
    @Published var selectedRep: String? = nil
    @Published var activeSection: SellerSection = .summary
    @Published var activeDestination: NavDestination = .commissions

    // Sales view navigation inside Tab 2
    @Published var salesSubView: String? = nil // nil | "day" | "customer" | "invoice" | "product"
    @Published var salesSearchQuery: String = ""

    // Notifications
    @Published var notificationsPayload: NotificationsPayload? = nil
    @Published var notificationsOpen: Bool = false

    // App Preferences
    @Published var themeMode: String = "light"
    @Published var language: String = "ar"

    // Mandatory Update
    @Published var mandatoryUpdate: AppUpdateInfo? = nil

    // Account state
    @Published var passwordSaving: Bool = false
    @Published var passwordStatus: String? = nil
    @Published var testNotifStatus: String? = nil

    let api: ApiClient
    let store: SessionStore

    init(api: ApiClient = .shared, store: SessionStore = .shared) {
        self.api = api
        self.store = store
        self.themeMode = store.themeMode()
        self.language = store.language()
        checkInitialSession()
    }

    var isArabic: Bool {
        return language != "en"
    }

    private func checkInitialSession() {
        if let session = store.readSession(), !session.accessToken.isEmpty {
            self.signedIn = true
            Task {
                await loadCommissions(month: nil, rep: nil)
                await checkMandatoryUpdate()
            }
        }
    }

    func toggleTheme() {
        let next = themeMode == "dark" ? "light" : "dark"
        setThemeMode(next)
    }

    func setThemeMode(_ mode: String) {
        self.themeMode = mode
        store.setThemeMode(mode)
    }

    func toggleLanguage() {
        let next = language == "ar" ? "en" : "ar"
        setLanguage(next)
    }

    func setLanguage(_ lang: String) {
        self.language = lang
        store.setLanguage(lang)
    }

    func signIn(identifier: String, pass: String, rememberMe: Bool) async {
        guard !identifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !pass.isEmpty else {
            self.signInError = "invalid_input"
            return
        }
        self.signingIn = true
        self.signInError = nil

        store.setRememberMe(rememberMe)
        let res = await api.signIn(identifier: identifier, password: pass)
        self.signingIn = false

        switch res {
        case .success(let session):
            if rememberMe {
                store.saveCredentials(username: identifier, password: pass)
            } else {
                store.clearSavedPassword()
            }
            self.signedIn = true
            await loadCommissions(month: nil, rep: nil)
            await checkMandatoryUpdate()
        case .error(let code, _, _, _):
            self.signInError = code
        }
    }

    func biometricSignIn() async {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return
        }

        let savedUser = store.savedUsername()
        let savedPass = store.savedPassword()
        guard !savedUser.isEmpty, !savedPass.isEmpty else {
            return
        }

        let reason = isArabic ? "استخدم البصمة لتسجيل الدخول السريع" : "Sign in using Biometrics"
        do {
            let success = try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
            if success {
                await signIn(identifier: savedUser, pass: savedPass, rememberMe: true)
            }
        } catch {
            // User cancelled or biometric failed
        }
    }

    func signOut() {
        store.clearSession()
        self.signedIn = false
        self.commissionsData = nil
        self.userProfile = nil
        self.activeDestination = .commissions
        self.activeSection = .summary
    }

    func loadCommissions(month: String?, rep: String?) async {
        self.loadingCommissions = true
        self.commissionsError = nil

        let m = month ?? self.selectedMonth
        let r = rep ?? self.selectedRep
        let res = await api.fetchCommissions(month: m, rep: r)
        self.loadingCommissions = false

        switch res {
        case .success(let data):
            self.commissionsData = data
            self.userProfile = data.user
            self.selectedMonth = data.clock.month
            self.selectedRep = data.selectedRep
        case .error(let code, let status, _, let user):
            if status == 401 {
                signOut()
            } else {
                self.commissionsError = code
                if let u = user { self.userProfile = u }
            }
        }
    }

    func selectMonth(_ month: String) {
        guard month != selectedMonth else { return }
        self.selectedMonth = month
        Task {
            await loadCommissions(month: month, rep: selectedRep)
        }
    }

    func selectRep(_ rep: String) {
        guard rep != selectedRep else { return }
        self.selectedRep = rep
        Task {
            await loadCommissions(month: selectedMonth, rep: rep)
        }
    }

    func openNotifications() {
        self.notificationsOpen = true
        Task {
            let res = await api.fetchNotifications()
            if case .success(let payload) = res {
                self.notificationsPayload = payload
                await api.markNotificationsRead()
            }
        }
    }

    func checkMandatoryUpdate() async {
        let update = await api.checkMandatoryUpdate()
        self.mandatoryUpdate = update
    }

    func dismissUpdateDialog() {
        self.mandatoryUpdate = nil
    }

    func changePassword(current: String, next: String, confirm: String) async {
        self.passwordSaving = true
        self.passwordStatus = nil
        let code = await api.changePassword(current: current, next: next, confirm: confirm)
        self.passwordSaving = false
        self.passwordStatus = code
    }

    func sendTestNotification() async {
        self.testNotifStatus = "sending"
        let ok = await api.sendTestNotification()
        self.testNotifStatus = ok ? "sent" : "error"
    }
}
