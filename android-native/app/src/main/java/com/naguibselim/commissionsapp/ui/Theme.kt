package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/** Naguib Selim brand colours (same as the website and the WebView app). */
private val Light = lightColorScheme(
    primary = Color(0xFF744C27),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFF1E4D6),
    onPrimaryContainer = Color(0xFF3B2410),
    secondary = Color(0xFFC49A6C),
    onSecondary = Color(0xFF1C1917),
    background = Color(0xFFF6F5F3),
    onBackground = Color(0xFF1C1917),
    surface = Color.White,
    onSurface = Color(0xFF1C1917),
    surfaceVariant = Color(0xFFEFECE8),
    onSurfaceVariant = Color(0xFF5F5750),
    surfaceContainerLow = Color.White,
    surfaceContainer = Color.White,
    surfaceContainerHigh = Color(0xFFF9F8F6),
    outline = Color(0xFFD6D1CB),
    outlineVariant = Color(0xFFE7E3DE),
    error = Color(0xFFB3261E),
)

private val Dark = darkColorScheme(
    primary = Color(0xFFD2A574),
    onPrimary = Color(0xFF2A1A0B),
    primaryContainer = Color(0xFF4A3220),
    onPrimaryContainer = Color(0xFFF4E3D0),
    secondary = Color(0xFFC49A6C),
    onSecondary = Color(0xFF1C1917),
    background = Color(0xFF0D0F12),
    onBackground = Color(0xFFF4F1EC),
    surface = Color(0xFF16191E),
    onSurface = Color(0xFFF4F1EC),
    surfaceVariant = Color(0xFF1E2228),
    onSurfaceVariant = Color(0xFFA8A29A),
    surfaceContainerLow = Color(0xFF16191E),
    surfaceContainer = Color(0xFF16191E),
    surfaceContainerHigh = Color(0xFF1C2026),
    outline = Color(0xFF3A3F47),
    outlineVariant = Color(0xFF2A2E35),
    error = Color(0xFFF2B8B5),
)

/** Status colours that Material does not have. */
@Immutable
data class StatusColors(val success: Color, val successSoft: Color, val warning: Color, val warningSoft: Color, val danger: Color, val dangerSoft: Color)

private val LightStatus = StatusColors(
    success = Color(0xFF1E7A46), successSoft = Color(0xFFE3F3EA),
    warning = Color(0xFF9A5B00), warningSoft = Color(0xFFFFF3DC),
    danger = Color(0xFFB3261E), dangerSoft = Color(0xFFFCE8E6),
)
private val DarkStatus = StatusColors(
    success = Color(0xFF6FD39A), successSoft = Color(0xFF14301F),
    warning = Color(0xFFF5C06A), warningSoft = Color(0xFF3A2A0E),
    danger = Color(0xFFF2B8B5), dangerSoft = Color(0xFF3B1715),
)

val LocalStatus = staticCompositionLocalOf { LightStatus }

@Composable
fun NsTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    CompositionLocalProvider(LocalStatus provides if (dark) DarkStatus else LightStatus) {
        MaterialTheme(colorScheme = if (dark) Dark else Light, content = content)
    }
}
