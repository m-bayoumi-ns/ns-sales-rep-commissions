package com.naguibselim.commissionsapp.data

import android.os.Build
import com.naguibselim.commissionsapp.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val code: String, val status: Int = 0, val detail: String? = null, val user: UserProfile? = null) : ApiResult<Nothing>()
}

class ApiClient(private val store: SessionStore) {
    private val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/')
    private val refreshMutex = Mutex()
    private val userAgent: String =
        "NSCommissionsNative/${BuildConfig.VERSION_NAME} (Android ${Build.VERSION.RELEASE}; ${Build.MODEL})"

    private fun openConnection(path: String, method: String, token: String? = null): HttpURLConnection {
        val url = URL("$baseUrl$path")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 20_000
            readTimeout = 45_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", userAgent)
            setRequestProperty("X-NS-Install", store.installId())
            if (token != null) {
                setRequestProperty("Authorization", "Bearer $token")
            }
            if (method == "POST" || method == "PUT" || method == "PATCH") {
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
            }
        }
        return conn
    }

    private fun readBody(conn: HttpURLConnection): Pair<Int, String> {
        val status = conn.responseCode
        val stream = if (status in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.use {
            BufferedReader(InputStreamReader(it, Charsets.UTF_8)).readText()
        } ?: ""
        return status to text
    }

    suspend fun signIn(identifier: String, password: String): ApiResult<AuthSession> = withContext(Dispatchers.IO) {
        try {
            val conn = openConnection("/api/app/session", "POST")
            val body = JSONObject().apply {
                put("identifier", identifier.trim())
                put("password", password)
            }
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
            val (status, raw) = readBody(conn)
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json != null) {
                val session = AuthSession(
                    accessToken = json.optString("accessToken", ""),
                    refreshToken = json.optString("refreshToken", ""),
                    expiresAt = json.optLong("expiresAt", 0L)
                )
                if (session.accessToken.isNotEmpty()) {
                    store.saveSession(session)
                    return@withContext ApiResult.Success(session)
                }
            }
            val errCode = json?.optString("error") ?: "network_error"
            ApiResult.Error(code = errCode, status = status)
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun validAccessToken(forceRefresh: Boolean = false): String? = withContext(Dispatchers.IO) {
        refreshMutex.withLock {
            val current = store.readSession() ?: return@withLock null
            val nowSec = System.currentTimeMillis() / 1000L
            if (!forceRefresh && current.expiresAt > nowSec + 90) {
                return@withLock current.accessToken
            }
            try {
                val conn = openConnection("/api/app/session/refresh", "POST")
                val payload = JSONObject().put("refreshToken", current.refreshToken)
                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }
                val (status, raw) = readBody(conn)
                val json = runCatching { JSONObject(raw) }.getOrNull()
                if (status in 200..299 && json != null) {
                    val refreshed = AuthSession(
                        accessToken = json.optString("accessToken", ""),
                        refreshToken = json.optString("refreshToken", ""),
                        expiresAt = json.optLong("expiresAt", 0L)
                    )
                    if (refreshed.accessToken.isNotEmpty()) {
                        store.saveSession(refreshed)
                        return@withLock refreshed.accessToken
                    }
                }
                if (status == 401 || status == 400) {
                    store.clearSession()
                    return@withLock null
                }
                current.accessToken
            } catch (_: Throwable) {
                current.accessToken
            }
        }
    }

    private suspend fun executeAuthed(
        path: String,
        method: String = "GET",
        bodyJson: String? = null
    ): Pair<Int, String> = withContext(Dispatchers.IO) {
        var token = validAccessToken(false) ?: return@withContext (401 to """{"error":"signed_out"}""")
        val conn1 = openConnection(path, method, token)
        if (bodyJson != null) {
            OutputStreamWriter(conn1.outputStream, Charsets.UTF_8).use { it.write(bodyJson) }
        }
        val (status1, text1) = readBody(conn1)
        if (status1 == 401) {
            val refreshed = validAccessToken(true)
            if (refreshed != null) {
                token = refreshed
                val conn2 = openConnection(path, method, token)
                if (bodyJson != null) {
                    OutputStreamWriter(conn2.outputStream, Charsets.UTF_8).use { it.write(bodyJson) }
                }
                return@withContext readBody(conn2)
            }
        }
        status1 to text1
    }

    suspend fun fetchCommissions(month: String?, rep: String?): ApiResult<CommissionsViewPayload> = withContext(Dispatchers.IO) {
        val cacheKey = "${month ?: "current"}_${rep ?: "default"}"
        try {
            val params = mutableListOf<String>()
            if (!month.isNullOrBlank()) params.add("month=${URLEncoder.encode(month, "UTF-8")}")
            if (!rep.isNullOrBlank()) params.add("rep=${URLEncoder.encode(rep, "UTF-8")}")
            val query = if (params.isEmpty()) "" else "?${params.joinToString("&")}"
            val (status, raw) = executeAuthed("/api/app/commissions$query", "GET")
            val json = runCatching { JSONObject(raw) }.getOrNull()

            if (status in 200..299 && json != null) {
                store.cacheCommissionsJson(cacheKey, raw)
                if (month == null && rep == null) {
                    store.cacheCommissionsJson("latest_default", raw)
                }
                return@withContext ApiResult.Success(JsonParsers.parseCommissionsPayload(json))
            }
            val errCode = json?.optString("error") ?: "load_failed"
            val userObj = json?.optJSONObject("user")?.let { JsonParsers.parseUser(it) }
            if (status == 401) {
                store.clearSession()
                return@withContext ApiResult.Error(code = "signed_out", status = 401)
            }
            if (status == 403) {
                return@withContext ApiResult.Error(code = errCode, status = 403, detail = json?.optString("email"), user = userObj)
            }
            // Fallback to cache on server/network hiccup
            val cached = store.readCachedCommissionsJson(cacheKey) ?: store.readCachedCommissionsJson("latest_default")
            if (cached != null) {
                val cachedJson = runCatching { JSONObject(cached.first) }.getOrNull()
                if (cachedJson != null) {
                    return@withContext ApiResult.Success(
                        JsonParsers.parseCommissionsPayload(cachedJson, isOffline = true, cachedAt = cached.second)
                    )
                }
            }
            ApiResult.Error(code = errCode, status = status)
        } catch (e: Throwable) {
            val cached = store.readCachedCommissionsJson(cacheKey) ?: store.readCachedCommissionsJson("latest_default")
            if (cached != null) {
                val cachedJson = runCatching { JSONObject(cached.first) }.getOrNull()
                if (cachedJson != null) {
                    return@withContext ApiResult.Success(
                        JsonParsers.parseCommissionsPayload(cachedJson, isOffline = true, cachedAt = cached.second)
                    )
                }
            }
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun fetchNotifications(): ApiResult<NotificationsPayload> = withContext(Dispatchers.IO) {
        try {
            val (status, raw) = executeAuthed("/api/app/notifications", "GET")
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json != null) {
                ApiResult.Success(JsonParsers.parseNotifications(json))
            } else {
                ApiResult.Error(code = json?.optString("error") ?: "load_failed", status = status)
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun markNotificationsRead(): Boolean = withContext(Dispatchers.IO) {
        runCatching {
            val (status, _) = executeAuthed("/api/app/notifications", "POST", "{}")
            status in 200..299
        }.getOrDefault(false)
    }

    suspend fun fetchFeed(): ApiResult<List<FeedItemModel>> = withContext(Dispatchers.IO) {
        try {
            val locale = store.language()
            val (status, raw) = executeAuthed("/api/app/feed?locale=$locale", "GET")
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json != null) {
                val arr = json.optJSONArray("items") ?: JSONArray()
                val items = (0 until arr.length()).map { i ->
                    val item = arr.getJSONObject(i)
                    FeedItemModel(
                        id = item.optString("id", ""),
                        channel = item.optString("channel", "commission"),
                        title = item.optString("title", ""),
                        body = item.optString("body", ""),
                        path = item.optString("path", "/commissions")
                    )
                }
                store.recordFeedStatus("ok", items.size)
                ApiResult.Success(items)
            } else {
                store.recordFeedStatus("http_$status", 0)
                ApiResult.Error(code = json?.optString("error") ?: "feed_error", status = status)
            }
        } catch (e: Throwable) {
            store.recordFeedStatus("error", 0)
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun fetchAccount(): ApiResult<AccountPayload> = withContext(Dispatchers.IO) {
        try {
            val (status, raw) = executeAuthed("/api/app/account", "GET")
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json != null) {
                ApiResult.Success(JsonParsers.parseAccountPayload(json))
            } else {
                ApiResult.Error(code = json?.optString("error") ?: "load_failed", status = status)
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun changePassword(current: String, next: String, confirm: String): ApiResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("action", "changePassword")
                put("currentPassword", current)
                put("newPassword", next)
                put("confirmPassword", confirm)
            }
            val (status, raw) = executeAuthed("/api/app/account", "POST", body.toString())
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json?.optBoolean("ok") == true) {
                json.optJSONObject("session")?.let { s ->
                    val access = s.optString("accessToken", "")
                    val refresh = s.optString("refreshToken", "")
                    val exp = s.optLong("expiresAt", 0L)
                    if (access.isNotEmpty() && refresh.isNotEmpty()) {
                        store.saveSession(AuthSession(access, refresh, exp))
                    }
                }
                ApiResult.Success(Unit)
            } else {
                ApiResult.Error(code = json?.optString("reason") ?: "error", status = status)
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun sendTestNotification(): Boolean = withContext(Dispatchers.IO) {
        runCatching {
            val body = JSONObject().put("action", "testNotification").toString()
            val (status, raw) = executeAuthed("/api/app/account", "POST", body)
            status in 200..299 && JSONObject(raw).optBoolean("ok", false)
        }.getOrDefault(false)
    }

    suspend fun fetchAdminSettings(month: String?): ApiResult<AdminSettingsPayload> = withContext(Dispatchers.IO) {
        try {
            val q = if (!month.isNullOrBlank()) "?month=${URLEncoder.encode(month, "UTF-8")}" else ""
            val (status, raw) = executeAuthed("/api/app/admin/settings$q", "GET")
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json != null) {
                ApiResult.Success(JsonParsers.parseAdminSettings(json))
            } else {
                ApiResult.Error(code = json?.optString("error") ?: "load_failed", status = status)
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun searchOdooProducts(query: String): List<ProductSearchResultModel> = withContext(Dispatchers.IO) {
        if (query.trim().length < 2) return@withContext emptyList()
        runCatching {
            val q = URLEncoder.encode(query.trim(), "UTF-8")
            val (status, raw) = executeAuthed("/api/app/admin/settings?search=$q", "GET")
            if (status !in 200..299) return@withContext emptyList()
            val arr = JSONObject(raw).optJSONArray("products") ?: JSONArray()
            (0 until arr.length()).map { i ->
                val p = arr.getJSONObject(i)
                val vArr = p.optJSONArray("variants") ?: JSONArray()
                ProductSearchResultModel(
                    templateId = p.optInt("templateId", 0),
                    name = p.optString("name", ""),
                    code = if (p.isNull("code")) null else p.optString("code"),
                    variants = (0 until vArr.length()).map { j ->
                        val v = vArr.getJSONObject(j)
                        ProductVariantOption(
                            id = v.optInt("id", 0),
                            color = if (v.isNull("color")) null else v.optString("color")
                        )
                    }
                )
            }
        }.getOrDefault(emptyList())
    }

    suspend fun saveAdminSettings(
        settings: CommissionSettingsModel,
        notifyMode: String,
        notifyUserIds: List<String>,
        notifyNote: String
    ): ApiResult<Pair<String, Int>> = withContext(Dispatchers.IO) {
        try {
            val payload = JSONObject().apply {
                put("settings", JsonParsers.settingsToJson(settings))
                put("notify", JSONObject().apply {
                    put("mode", notifyMode)
                    put("userIds", JSONArray(notifyUserIds))
                    if (notifyNote.isNotBlank()) put("note", notifyNote.trim())
                })
            }
            val (status, raw) = executeAuthed("/api/app/admin/settings", "PUT", payload.toString())
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json?.optBoolean("ok") == true) {
                ApiResult.Success(json.optString("savedAt", "") to json.optInt("notified", 0))
            } else {
                ApiResult.Error(
                    code = json?.optString("reason") ?: "error",
                    status = status,
                    detail = json?.optString("detail")
                )
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun fetchAdminAccounts(): ApiResult<AdminAccountsPayload> = withContext(Dispatchers.IO) {
        try {
            val (status, raw) = executeAuthed("/api/app/admin/accounts", "GET")
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json != null) {
                ApiResult.Success(JsonParsers.parseAdminAccounts(json))
            } else {
                ApiResult.Error(code = json?.optString("error") ?: "load_failed", status = status)
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }

    suspend fun patchAdminAccounts(body: JSONObject): ApiResult<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val (status, raw) = executeAuthed("/api/app/admin/accounts", "PATCH", body.toString())
            val json = runCatching { JSONObject(raw) }.getOrNull()
            if (status in 200..299 && json?.optBoolean("ok") == true) {
                ApiResult.Success(json)
            } else {
                ApiResult.Error(
                    code = json?.optString("reason") ?: "error",
                    status = status,
                    detail = json?.optString("detail")
                )
            }
        } catch (e: Throwable) {
            ApiResult.Error(code = "network_error", detail = e.localizedMessage)
        }
    }
}
