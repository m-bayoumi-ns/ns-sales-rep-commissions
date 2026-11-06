package com.naguibselim.commissionsapp.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/** The signed-in session, kept encrypted on the phone (Android Keystore). */
class SessionStore(context: Context) {
    private val prefs: SharedPreferences = open(context.applicationContext)

    var tokens: SessionTokens?
        get() {
            val access = prefs.getString(KEY_ACCESS, null) ?: return null
            val refresh = prefs.getString(KEY_REFRESH, null) ?: return null
            return SessionTokens(access, refresh, prefs.getLong(KEY_EXPIRES, 0L))
        }
        set(value) {
            prefs.edit().apply {
                if (value == null) {
                    remove(KEY_ACCESS); remove(KEY_REFRESH); remove(KEY_EXPIRES)
                } else {
                    putString(KEY_ACCESS, value.accessToken)
                    putString(KEY_REFRESH, value.refreshToken)
                    putLong(KEY_EXPIRES, value.expiresAt)
                }
            }.apply()
        }

    /** What the user typed last time, to prefill the sign-in form. */
    var lastIdentifier: String
        get() = prefs.getString(KEY_IDENTIFIER, "") ?: ""
        set(value) = prefs.edit().putString(KEY_IDENTIFIER, value).apply()

    /** Random id of this installation; the server keeps what it last told each phone under it. */
    val installId: String
        get() = prefs.getString(KEY_INSTALL, null) ?: java.util.UUID.randomUUID().toString().also {
            prefs.edit().putString(KEY_INSTALL, it).apply()
        }

    private companion object {
        const val FILE = "ns_session"
        const val KEY_ACCESS = "access"
        const val KEY_REFRESH = "refresh"
        const val KEY_EXPIRES = "expires_at"
        const val KEY_IDENTIFIER = "identifier"
        const val KEY_INSTALL = "install_id"

        fun open(context: Context): SharedPreferences = try {
            create(context)
        } catch (error: Exception) {
            // A restored or corrupted keystore entry: start over with a fresh file (the user signs in again).
            context.deleteSharedPreferences(FILE)
            create(context)
        }

        fun create(context: Context): SharedPreferences {
            val key = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
            return EncryptedSharedPreferences.create(
                context,
                FILE,
                key,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        }
    }
}
