package com.naguibselim.commissionsapp.data

import com.naguibselim.commissionsapp.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlinx.serialization.Serializable

/** Why a call failed, in terms the screens can show. */
sealed class ApiException(message: String) : Exception(message) {
    /** No network, timeout, DNS… */
    class Offline(cause: IOException) : ApiException(cause.message ?: "offline")
    /** The session is gone (refresh failed): back to the sign-in screen. */
    class SignedOut : ApiException("signed_out")
    /** The server said no, with its error code (invalid_credentials, locked, no_access, inactive, must_change_password…). */
    class Server(val code: String, val status: Int) : ApiException(code)
}

/**
 * Talks to the website's /api/app endpoints (session, session/refresh, commissions). The Odoo and Supabase keys stay on the server; the phone only
 * holds the user's own Supabase session, refreshed here before it expires.
 */
class Api(private val store: SessionStore) {
    private val baseUrl = BuildConfig.API_BASE_URL
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false; coerceInputValues = true }
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        // Odoo reads for a long month can take a while on the server (maxDuration 60 s).
        .readTimeout(75, TimeUnit.SECONDS)
        .build()
    private val refreshLock = Mutex()
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val userAgent = "NSCommissionsApp/${BuildConfig.VERSION_NAME} (Android ${android.os.Build.VERSION.RELEASE}; ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL})"

    val isSignedIn: Boolean get() = store.tokens != null

    @Serializable
    private data class SignInBody(val identifier: String, val password: String)

    @Serializable
    private data class RefreshBody(val refreshToken: String)

    suspend fun signIn(identifier: String, password: String) {
        val body = json.encodeToString(SignInBody(identifier.trim(), password))
        val tokens: SessionTokens = post("/api/app/session", body)
        store.tokens = tokens
        store.lastIdentifier = identifier.trim()
    }

    fun signOut() {
        store.tokens = null
    }

    suspend fun commissions(month: String?, rep: String?): CommissionsResponse {
        val url = "$baseUrl/api/app/commissions".toHttpUrl().newBuilder().apply {
            if (!month.isNullOrBlank()) addQueryParameter("month", month)
            if (!rep.isNullOrBlank()) addQueryParameter("rep", rep)
        }.build()
        return authorized { token ->
            Request.Builder().url(url).header("Authorization", "Bearer $token").header("User-Agent", userAgent).get().build()
        }
    }

    // ------------------------------------------------------------------ plumbing

    private suspend inline fun <reified T> authorized(crossinline build: (String) -> Request): T {
        val first = validAccessToken()
        val (status, text) = execute(build(first))
        if (status == 401) {
            // Token rejected (revoked, or the clock is off): refresh once and retry.
            val second = refresh(force = true)
            val (status2, text2) = execute(build(second))
            return parse(status2, text2)
        }
        return parse(status, text)
    }

    private suspend fun validAccessToken(): String {
        val tokens = store.tokens ?: throw ApiException.SignedOut()
        val now = System.currentTimeMillis() / 1000
        return if (tokens.expiresAt - now > 60) tokens.accessToken else refresh(force = false)
    }

    private suspend fun refresh(force: Boolean): String = refreshLock.withLock {
        val current = store.tokens ?: throw ApiException.SignedOut()
        val now = System.currentTimeMillis() / 1000
        // Another call refreshed while we waited for the lock.
        if (!force && current.expiresAt - now > 60) return@withLock current.accessToken
        val body = json.encodeToString(RefreshBody(current.refreshToken))
        try {
            val tokens: SessionTokens = post("/api/app/session/refresh", body)
            store.tokens = tokens
            tokens.accessToken
        } catch (error: ApiException.Server) {
            if (error.status == 401 || error.status == 400) {
                store.tokens = null
                throw ApiException.SignedOut()
            }
            throw error
        }
    }

    private suspend inline fun <reified T> post(path: String, body: String): T {
        val request = Request.Builder()
            .url("$baseUrl$path")
            .header("User-Agent", userAgent)
            .post(body.toRequestBody(jsonType))
            .build()
        val (status, text) = execute(request)
        return parse(status, text)
    }

    private suspend fun execute(request: Request): Pair<Int, String> = withContext(Dispatchers.IO) {
        try {
            client.newCall(request).execute().use { response -> response.code to (response.body?.string() ?: "") }
        } catch (error: IOException) {
            throw ApiException.Offline(error)
        }
    }

    private inline fun <reified T> parse(status: Int, text: String): T {
        if (status in 200..299) return json.decodeFromString<T>(text)
        val code = runCatching { json.decodeFromString<ApiError>(text).error }.getOrDefault("http_$status")
        if (status == 401 && code == "signed_out") {
            store.tokens = null
            throw ApiException.SignedOut()
        }
        throw ApiException.Server(code, status)
    }
}
