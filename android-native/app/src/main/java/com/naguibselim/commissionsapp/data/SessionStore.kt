package com.naguibselim.commissionsapp.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.UUID

data class AuthSession(
    val accessToken: String,
    val refreshToken: String,
    val expiresAt: Long
)

class SessionStore(context: Context) {
    private val appContext = context.applicationContext

    private val encryptedPrefs: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(appContext)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                appContext,
                "ns_commissions_secure_session",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (_: Throwable) {
            appContext.getSharedPreferences("ns_commissions_fallback_session", Context.MODE_PRIVATE)
        }
    }

    private val appPrefs: SharedPreferences by lazy {
        appContext.getSharedPreferences("ns_commissions_app_prefs", Context.MODE_PRIVATE)
    }

    fun readSession(): AuthSession? {
        val access = encryptedPrefs.getString("access_token", null)
        val refresh = encryptedPrefs.getString("refresh_token", null)
        val expiresAt = encryptedPrefs.getLong("expires_at", 0L)
        if (access.isNullOrBlank() || refresh.isNullOrBlank()) return null
        return AuthSession(accessToken = access, refreshToken = refresh, expiresAt = expiresAt)
    }

    fun saveSession(session: AuthSession) {
        encryptedPrefs.edit()
            .putString("access_token", session.accessToken)
            .putString("refresh_token", session.refreshToken)
            .putLong("expires_at", session.expiresAt)
            .apply()
    }

    fun clearSession() {
        encryptedPrefs.edit()
            .remove("access_token")
            .remove("refresh_token")
            .remove("expires_at")
            .apply()
    }

    fun installId(): String {
        val existing = appPrefs.getString("install_id", null)
        if (!existing.isNullOrBlank() && existing.length >= 8) return existing
        val created = UUID.randomUUID().toString()
        appPrefs.edit().putString("install_id", created).apply()
        return created
    }

    /** "ar" or "en" */
    fun language(): String {
        val saved = appPrefs.getString("language", null)
        if (saved == "ar" || saved == "en") return saved
        val sys = java.util.Locale.getDefault().language
        return if (sys.startsWith("ar")) "ar" else "en"
    }

    fun setLanguage(lang: String) {
        appPrefs.edit().putString("language", if (lang == "en") "en" else "ar").apply()
    }

    /** "system", "light", or "dark" */
    fun themeMode(): String = appPrefs.getString("theme_mode", "system") ?: "system"

    fun setThemeMode(mode: String) {
        appPrefs.edit().putString("theme_mode", mode).apply()
    }

    fun cacheCommissionsJson(key: String, rawJson: String) {
        appPrefs.edit()
            .putString("cache_cm_$key", rawJson)
            .putLong("cache_cm_time_$key", System.currentTimeMillis())
            .apply()
    }

    fun readCachedCommissionsJson(key: String): Pair<String, Long>? {
        val raw = appPrefs.getString("cache_cm_$key", null) ?: return null
        val at = appPrefs.getLong("cache_cm_time_$key", 0L)
        return raw to at
    }

    fun recordFeedStatus(status: String, itemsCount: Int) {
        appPrefs.edit()
            .putLong("last_feed_check_at", System.currentTimeMillis())
            .putString("last_feed_status", status)
            .putInt("last_feed_items", itemsCount)
            .apply()
    }

    fun lastFeedCheckAt(): Long = appPrefs.getLong("last_feed_check_at", 0L)

    fun isBatteryPromptShown(): Boolean = appPrefs.getBoolean("battery_prompt_shown", false)
    fun markBatteryPromptShown() {
        appPrefs.edit().putBoolean("battery_prompt_shown", true).apply()
    }
}
