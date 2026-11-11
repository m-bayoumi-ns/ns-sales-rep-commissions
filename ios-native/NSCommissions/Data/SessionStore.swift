import Foundation

final class SessionStore {
    static let shared = SessionStore()
    private let defaults = UserDefaults.standard
    private let prefix = "ns_commissions_"

    private init() {}

    func appVersionName() -> String {
        return (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "2.0.27"
    }

    func installId() -> String {
        let key = prefix + "install_id"
        if let existing = defaults.string(forKey: key), !existing.isEmpty {
            return existing
        }
        let generated = UUID().uuidString.lowercased()
        defaults.set(generated, forKey: key)
        return generated
    }

    func saveSession(_ session: AuthSession) {
        defaults.set(session.accessToken, forKey: prefix + "access_token")
        defaults.set(session.refreshToken, forKey: prefix + "refresh_token")
        defaults.set(session.expiresAt, forKey: prefix + "expires_at")
    }

    func readSession() -> AuthSession? {
        guard let access = defaults.string(forKey: prefix + "access_token"), !access.isEmpty,
              let refresh = defaults.string(forKey: prefix + "refresh_token"), !refresh.isEmpty else {
            return nil
        }
        let exp = Int64(defaults.integer(forKey: prefix + "expires_at"))
        return AuthSession(accessToken: access, refreshToken: refresh, expiresAt: exp)
    }

    func clearSession() {
        defaults.removeObject(forKey: prefix + "access_token")
        defaults.removeObject(forKey: prefix + "refresh_token")
        defaults.removeObject(forKey: prefix + "expires_at")
    }

    func isRememberMe() -> Bool {
        if defaults.object(forKey: prefix + "remember_me") == nil { return true }
        return defaults.bool(forKey: prefix + "remember_me")
    }

    func setRememberMe(_ value: Bool) {
        defaults.set(value, forKey: prefix + "remember_me")
    }

    func saveCredentials(username: String, password: String) {
        defaults.set(username, forKey: prefix + "saved_user")
        defaults.set(password, forKey: prefix + "saved_pass")
    }

    func clearSavedPassword() {
        defaults.removeObject(forKey: prefix + "saved_pass")
    }

    func savedUsername() -> String {
        return defaults.string(forKey: prefix + "saved_user") ?? ""
    }

    func savedPassword() -> String {
        return defaults.string(forKey: prefix + "saved_pass") ?? ""
    }

    func language() -> String {
        return defaults.string(forKey: prefix + "language") ?? "ar"
    }

    func setLanguage(_ lang: String) {
        defaults.set(lang, forKey: prefix + "language")
    }

    func themeMode() -> String {
        return defaults.string(forKey: prefix + "theme_mode") ?? "light"
    }

    func setThemeMode(_ mode: String) {
        defaults.set(mode, forKey: prefix + "theme_mode")
    }

    func cacheCommissionsJson(key: String, rawJson: String) {
        defaults.set(rawJson, forKey: prefix + "cache_json_" + key)
        defaults.set(Int64(Date().timeIntervalSince1970 * 1000), forKey: prefix + "cache_ts_" + key)
    }

    func readCachedCommissionsJson(key: String) -> (String, Int64)? {
        guard let raw = defaults.string(forKey: prefix + "cache_json_" + key), !raw.isEmpty else {
            return nil
        }
        let ts = Int64(defaults.integer(forKey: prefix + "cache_ts_" + key))
        return (raw, ts)
    }
}
