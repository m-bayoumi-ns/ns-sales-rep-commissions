import Foundation
import UIKit

enum ApiResult<T> {
    case success(T)
    case error(code: String, status: Int = 0, detail: String? = nil, user: UserProfile? = nil)
}

final class ApiClient {
    static let shared = ApiClient(store: .shared)
    private let store: SessionStore
    private let baseUrl = "https://ns-sales-rep-commissions.vercel.app"

    init(store: SessionStore) {
        self.store = store
    }

    private var userAgent: String {
        let ver = store.appVersionName()
        let sysVer = UIDevice.current.systemVersion
        let model = UIDevice.current.model
        return "NSCommissionsNative/\(ver) (iOS \(sysVer); \(model))"
    }

    private func makeRequest(path: String, method: String = "GET", token: String? = nil, bodyData: Data? = nil) -> URLRequest? {
        guard let url = URL(string: baseUrl + path) else { return nil }
        var req = URLRequest(url: url, timeoutInterval: 35)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        req.setValue(store.installId(), forHTTPHeaderField: "X-NS-Install")
        if let token = token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let bodyData = bodyData {
            req.httpBody = bodyData
            req.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
        }
        return req
    }

    private func send(_ req: URLRequest) async throws -> (Int, String) {
        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let text = String(data: data, encoding: .utf8) ?? ""
        return (status, text)
    }

    func signIn(identifier: String, password: String) async -> ApiResult<AuthSession> {
        let payload: [String: Any] = [
            "identifier": identifier.trimmingCharacters(in: .whitespacesAndNewlines),
            "password": password
        ]
        guard let body = try? JSONSerialization.data(withJSONObject: payload),
              let req = makeRequest(path: "/api/app/session", method: "POST", bodyData: body) else {
            return .error(code: "invalid_input")
        }
        do {
            let (status, raw) = try await send(req)
            let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any]
            if (200...299).contains(status), let json = json {
                let access = (json["accessToken"] as? String) ?? ""
                let refresh = (json["refreshToken"] as? String) ?? ""
                let exp = (json["expiresAt"] as? NSNumber)?.int64Value ?? 0
                if !access.isEmpty {
                    let session = AuthSession(accessToken: access, refreshToken: refresh, expiresAt: exp)
                    store.saveSession(session)
                    return .success(session)
                }
            }
            let errCode = (json?["error"] as? String) ?? "network_error"
            return .error(code: errCode, status: status)
        } catch {
            return .error(code: "network_error", detail: error.localizedDescription)
        }
    }

    func validAccessToken(forceRefresh: Bool = false) async -> String? {
        guard let current = store.readSession() else { return nil }
        let nowSec = Int64(Date().timeIntervalSince1970)
        if !forceRefresh && current.expiresAt > nowSec + 90 {
            return current.accessToken
        }
        let payload = ["refreshToken": current.refreshToken]
        guard let body = try? JSONSerialization.data(withJSONObject: payload),
              let req = makeRequest(path: "/api/app/session/refresh", method: "POST", bodyData: body) else {
            return current.accessToken
        }
        do {
            let (status, raw) = try await send(req)
            if (200...299).contains(status),
               let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any] {
                let access = (json["accessToken"] as? String) ?? ""
                let refresh = (json["refreshToken"] as? String) ?? ""
                let exp = (json["expiresAt"] as? NSNumber)?.int64Value ?? 0
                if !access.isEmpty {
                    store.saveSession(AuthSession(accessToken: access, refreshToken: refresh, expiresAt: exp))
                    return access
                }
            }
            if status == 401 || status == 400 {
                store.clearSession()
                return nil
            }
            return current.accessToken
        } catch {
            return current.accessToken
        }
    }

    private func executeAuthed(path: String, method: String = "GET", bodyData: Data? = nil) async throws -> (Int, String) {
        guard var token = await validAccessToken(forceRefresh: false) else {
            return (401, #"{"error":"signed_out"}"#)
        }
        guard let req1 = makeRequest(path: path, method: method, token: token, bodyData: bodyData) else {
            return (400, "")
        }
        let (status1, text1) = try await send(req1)
        if status1 == 401 {
            if let refreshed = await validAccessToken(forceRefresh: true) {
                token = refreshed
                if let req2 = makeRequest(path: path, method: method, token: token, bodyData: bodyData) {
                    return try await send(req2)
                }
            }
        }
        return (status1, text1)
    }

    func fetchCommissions(month: String?, rep: String?) async -> ApiResult<CommissionsViewPayload> {
        let cacheKey = "\(month ?? "current")_\(rep ?? "default")"
        var queryItems: [String] = []
        if let m = month, !m.isEmpty, let enc = m.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
            queryItems.append("month=\(enc)")
        }
        if let r = rep, !r.isEmpty, let enc = r.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
            queryItems.append("rep=\(enc)")
        }
        let query = queryItems.isEmpty ? "" : "?" + queryItems.joined(separator: "&")

        do {
            let (status, raw) = try await executeAuthed(path: "/api/app/commissions\(query)")
            let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any]
            if (200...299).contains(status), let json = json {
                store.cacheCommissionsJson(key: cacheKey, rawJson: raw)
                if month == nil && rep == nil {
                    store.cacheCommissionsJson(key: "latest_default", rawJson: raw)
                }
                return .success(JsonParsers.parseCommissionsPayload(json))
            }
            if status == 401 {
                store.clearSession()
                return .error(code: "signed_out", status: 401)
            }
            let errCode = (json?["error"] as? String) ?? "load_failed"
            if status == 403 {
                let userObj = (json?["user"] as? [String: Any]).map(JsonParsers.parseUser)
                return .error(code: errCode, status: 403, detail: json?["email"] as? String, user: userObj)
            }
            if let cached = store.readCachedCommissionsJson(key: cacheKey) ?? store.readCachedCommissionsJson(key: "latest_default"),
               let cachedJson = (try? JSONSerialization.jsonObject(with: Data(cached.0.utf8))) as? [String: Any] {
                return .success(JsonParsers.parseCommissionsPayload(cachedJson, isOffline: true, cachedAt: cached.1))
            }
            return .error(code: errCode, status: status)
        } catch {
            if let cached = store.readCachedCommissionsJson(key: cacheKey) ?? store.readCachedCommissionsJson(key: "latest_default"),
               let cachedJson = (try? JSONSerialization.jsonObject(with: Data(cached.0.utf8))) as? [String: Any] {
                return .success(JsonParsers.parseCommissionsPayload(cachedJson, isOffline: true, cachedAt: cached.1))
            }
            return .error(code: "network_error", detail: error.localizedDescription)
        }
    }

    func fetchNotifications() async -> ApiResult<NotificationsPayload> {
        do {
            let (status, raw) = try await executeAuthed(path: "/api/app/notifications")
            if (200...299).contains(status),
               let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any] {
                return .success(JsonParsers.parseNotifications(json))
            }
            return .error(code: "load_failed", status: status)
        } catch {
            return .error(code: "network_error")
        }
    }

    func markNotificationsRead() async {
        _ = try? await executeAuthed(path: "/api/app/notifications", method: "POST", bodyData: Data("{}".utf8))
    }

    func changePassword(current: String, next: String, confirm: String) async -> String {
        let payload: [String: Any] = [
            "action": "changePassword",
            "currentPassword": current,
            "newPassword": next,
            "confirmPassword": confirm
        ]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else { return "error" }
        do {
            let (status, raw) = try await executeAuthed(path: "/api/app/account", method: "POST", bodyData: body)
            let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any]
            if (200...299).contains(status), (json?["ok"] as? Bool) == true {
                if let s = json?["session"] as? [String: Any],
                   let access = s["accessToken"] as? String,
                   let refresh = s["refreshToken"] as? String {
                    let exp = (s["expiresAt"] as? NSNumber)?.int64Value ?? 0
                    store.saveSession(AuthSession(accessToken: access, refreshToken: refresh, expiresAt: exp))
                }
                return "saved"
            }
            return (json?["reason"] as? String) ?? "error"
        } catch {
            return "error"
        }
    }

    func sendTestNotification() async -> Bool {
        let payload = ["action": "testNotification"]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else { return false }
        do {
            let (status, raw) = try await executeAuthed(path: "/api/app/account", method: "POST", bodyData: body)
            let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any]
            return (200...299).contains(status) && ((json?["ok"] as? Bool) == true)
        } catch {
            return false
        }
    }

    func checkMandatoryUpdate() async -> AppUpdateInfo? {
        guard let req = makeRequest(path: "/api/app/download?info=1&variant=native") else { return nil }
        do {
            let (status, raw) = try await send(req)
            guard (200...299).contains(status),
                  let json = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [String: Any] else {
                return nil
            }
            let remoteVersion = ((json["version"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let currentVersion = store.appVersionName().trimmingCharacters(in: .whitespacesAndNewlines)
            if !remoteVersion.isEmpty && isNewerVersion(remote: remoteVersion, current: currentVersion) {
                return AppUpdateInfo(
                    version: remoteVersion,
                    currentVersion: currentVersion,
                    bytes: (json["bytes"] as? NSNumber)?.int64Value ?? 0,
                    publishedAt: (json["publishedAt"] as? String) ?? "",
                    downloadUrl: "https://ns-scw.bayoumi.dev/api/app/download?variant=native",
                    downloadPageUrl: "https://ns-scw.bayoumi.dev/ar/get-app"
                )
            }
            return nil
        } catch {
            return nil
        }
    }

    private func isNewerVersion(remote: String, current: String) -> Bool {
        let cleanRemote = remote.replacingOccurrences(of: "^[vV]", with: "", options: .regularExpression)
        let cleanCurrent = current.replacingOccurrences(of: "^[vV]", with: "", options: .regularExpression)
        if cleanRemote.caseInsensitiveCompare(cleanCurrent) == .orderedSame { return false }

        let rParts = cleanRemote.split(whereSeparator: { $0 == "." || $0 == "-" || $0 == "_" }).compactMap { Int($0) }
        let cParts = cleanCurrent.split(whereSeparator: { $0 == "." || $0 == "-" || $0 == "_" }).compactMap { Int($0) }
        guard !rParts.isEmpty && !cParts.isEmpty else { return false }

        let maxLen = max(rParts.count, cParts.count)
        for i in 0..<maxLen {
            let rv = i < rParts.count ? rParts[i] : 0
            let cv = i < cParts.count ? cParts[i] : 0
            if rv != cv { return rv > cv }
        }
        return false
    }
}
