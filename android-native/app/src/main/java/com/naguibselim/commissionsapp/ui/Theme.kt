package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp

@Immutable
data class NsColors(
    val isDark: Boolean,
    val background: Color,
    val card: Color,
    val foreground: Color,
    val muted: Color,
    val mutedForeground: Color,
    val primary: Color,
    val primaryForeground: Color,
    val accent: Color,
    val border: Color,
    val success: Color,
    val successSoft: Color,
    val warning: Color,
    val warningSoft: Color,
    val destructive: Color,
    val destructiveSoft: Color,
    val heroStart: Color,
    val heroMid: Color,
    val heroEnd: Color,
    val collectionsStart: Color,
    val collectionsMid: Color,
    val collectionsEnd: Color
)

val LightNsColors = NsColors(
    isDark = false,
    background = Color(0xFFF6F5F3),
    card = Color(0xFFFFFFFF),
    foreground = Color(0xFF1C1917),
    muted = Color(0xFFF1EFEC),
    mutedForeground = Color(0xFF5F5750),
    primary = Color(0xFF744C27),
    primaryForeground = Color(0xFFFFFFFF),
    accent = Color(0xFFF4ECE3),
    border = Color(0xFFE4E0DA),
    success = Color(0xFF136C34),
    successSoft = Color(0xFFE6F3EA),
    warning = Color(0xFF94530A),
    warningSoft = Color(0xFFFCF0DC),
    destructive = Color(0xFFB42318),
    destructiveSoft = Color(0xFFFCEBE9),
    heroStart = Color(0xFF5A3A1D),
    heroMid = Color(0xFF4A2D16),
    heroEnd = Color(0xFF2E1D0F),
    collectionsStart = Color(0xFF805A34),
    collectionsMid = Color(0xFF704A2A),
    collectionsEnd = Color(0xFF54381F)
)

val DarkNsColors = NsColors(
    isDark = true,
    background = Color(0xFF121110),
    card = Color(0xFF1C1A18),
    foreground = Color(0xFFF3EFEA),
    muted = Color(0xFF262320),
    mutedForeground = Color(0xFFA8A096),
    primary = Color(0xFFD2A574),
    primaryForeground = Color(0xFF1C1917),
    accent = Color(0xFF2B231C),
    border = Color(0xFF332E2A),
    success = Color(0xFF4ADE80),
    successSoft = Color(0xFF132E1E),
    warning = Color(0xFFFBBF24),
    warningSoft = Color(0xFF33240C),
    destructive = Color(0xFFF87171),
    destructiveSoft = Color(0xFF361515),
    heroStart = Color(0xFF5A3A1D),
    heroMid = Color(0xFF432813),
    heroEnd = Color(0xFF26170B),
    collectionsStart = Color(0xFF75502C),
    collectionsMid = Color(0xFF5E3E20),
    collectionsEnd = Color(0xFF422B16)
)

val LocalNsColors = staticCompositionLocalOf { LightNsColors }
val LocalIsArabic = staticCompositionLocalOf { true }

private val LightM3 = lightColorScheme(
    primary = LightNsColors.primary,
    onPrimary = LightNsColors.primaryForeground,
    primaryContainer = LightNsColors.accent,
    onPrimaryContainer = LightNsColors.foreground,
    secondary = Color(0xFFC49A6C),
    onSecondary = Color.White,
    background = LightNsColors.background,
    onBackground = LightNsColors.foreground,
    surface = LightNsColors.card,
    onSurface = LightNsColors.foreground,
    surfaceVariant = LightNsColors.muted,
    onSurfaceVariant = LightNsColors.mutedForeground,
    outline = LightNsColors.border,
    error = LightNsColors.destructive,
    onError = Color.White
)

private val DarkM3 = darkColorScheme(
    primary = DarkNsColors.primary,
    onPrimary = DarkNsColors.primaryForeground,
    primaryContainer = DarkNsColors.accent,
    onPrimaryContainer = DarkNsColors.foreground,
    secondary = Color(0xFFC49A6C),
    onSecondary = Color(0xFF1C1917),
    background = DarkNsColors.background,
    onBackground = DarkNsColors.foreground,
    surface = DarkNsColors.card,
    onSurface = DarkNsColors.foreground,
    surfaceVariant = DarkNsColors.muted,
    onSurfaceVariant = DarkNsColors.mutedForeground,
    outline = DarkNsColors.border,
    error = DarkNsColors.destructive,
    onError = Color(0xFF1C1917)
)

private val NsTypography = Typography(
    headlineLarge = TextStyle(fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 36.sp),
    headlineMedium = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, lineHeight = 28.sp),
    titleLarge = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, lineHeight = 24.sp),
    titleMedium = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.SemiBold, lineHeight = 21.sp),
    bodyLarge = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Normal, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontSize = 13.5.sp, fontWeight = FontWeight.Normal, lineHeight = 19.sp),
    labelLarge = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.SemiBold, lineHeight = 18.sp),
    labelMedium = TextStyle(fontSize = 11.5.sp, fontWeight = FontWeight.Medium, lineHeight = 15.sp)
)

@Composable
fun NsTheme(
    themeMode: String, // "system" | "light" | "dark"
    language: String,  // "ar" | "en"
    content: @Composable () -> Unit
) {
    val sysDark = isSystemInDarkTheme()
    val useDark = when (themeMode) {
        "dark" -> true
        "light" -> false
        else -> sysDark
    }
    val isAr = language != "en"
    val colors = if (useDark) DarkNsColors else LightNsColors
    val direction = if (isAr) LayoutDirection.Rtl else LayoutDirection.Ltr

    CompositionLocalProvider(
        LocalNsColors provides colors,
        LocalIsArabic provides isAr,
        LocalLayoutDirection provides direction
    ) {
        MaterialTheme(
            colorScheme = if (useDark) DarkM3 else LightM3,
            typography = NsTypography,
            content = content
        )
    }
}
