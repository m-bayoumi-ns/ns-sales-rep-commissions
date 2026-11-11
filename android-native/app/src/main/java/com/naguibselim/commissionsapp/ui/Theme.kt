package com.naguibselim.commissionsapp.ui

import android.app.Activity
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.naguibselim.commissionsapp.R

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

val CairoFontFamily = FontFamily(
    Font(R.font.cairo, FontWeight.Normal),
    Font(R.font.cairo, FontWeight.Medium),
    Font(R.font.cairo, FontWeight.SemiBold),
    Font(R.font.cairo, FontWeight.Bold),
    Font(R.font.cairo, FontWeight.ExtraBold)
)

val InterFontFamily = FontFamily(
    Font(R.font.inter, FontWeight.Normal),
    Font(R.font.inter, FontWeight.Medium),
    Font(R.font.inter, FontWeight.SemiBold),
    Font(R.font.inter, FontWeight.Bold),
    Font(R.font.inter, FontWeight.ExtraBold)
)

val LocalAppFontFamily = staticCompositionLocalOf { CairoFontFamily }

fun createNsTypography(fontFamily: FontFamily) = Typography(
    displayLarge = TextStyle(fontFamily = fontFamily, fontSize = 57.sp, lineHeight = 64.sp),
    displayMedium = TextStyle(fontFamily = fontFamily, fontSize = 45.sp, lineHeight = 52.sp),
    displaySmall = TextStyle(fontFamily = fontFamily, fontSize = 36.sp, lineHeight = 44.sp),
    headlineLarge = TextStyle(fontFamily = fontFamily, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 36.sp),
    headlineMedium = TextStyle(fontFamily = fontFamily, fontSize = 22.sp, fontWeight = FontWeight.Bold, lineHeight = 28.sp),
    headlineSmall = TextStyle(fontFamily = fontFamily, fontSize = 19.sp, fontWeight = FontWeight.Bold, lineHeight = 25.sp),
    titleLarge = TextStyle(fontFamily = fontFamily, fontSize = 18.sp, fontWeight = FontWeight.Bold, lineHeight = 24.sp),
    titleMedium = TextStyle(fontFamily = fontFamily, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, lineHeight = 21.sp),
    titleSmall = TextStyle(fontFamily = fontFamily, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, lineHeight = 20.sp),
    bodyLarge = TextStyle(fontFamily = fontFamily, fontSize = 15.sp, fontWeight = FontWeight.Normal, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontFamily = fontFamily, fontSize = 13.5.sp, fontWeight = FontWeight.Normal, lineHeight = 19.sp),
    bodySmall = TextStyle(fontFamily = fontFamily, fontSize = 12.sp, fontWeight = FontWeight.Normal, lineHeight = 16.sp),
    labelLarge = TextStyle(fontFamily = fontFamily, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, lineHeight = 18.sp),
    labelMedium = TextStyle(fontFamily = fontFamily, fontSize = 11.5.sp, fontWeight = FontWeight.Medium, lineHeight = 15.sp),
    labelSmall = TextStyle(fontFamily = fontFamily, fontSize = 10.sp, fontWeight = FontWeight.Medium, lineHeight = 14.sp)
)

@Composable
private fun animateNsColors(target: NsColors): NsColors {
    val spec = tween<Color>(durationMillis = 420, easing = FastOutSlowInEasing)
    val background by animateColorAsState(target.background, spec, label = "bg")
    val card by animateColorAsState(target.card, spec, label = "card")
    val foreground by animateColorAsState(target.foreground, spec, label = "fg")
    val muted by animateColorAsState(target.muted, spec, label = "muted")
    val mutedForeground by animateColorAsState(target.mutedForeground, spec, label = "mutedFg")
    val primary by animateColorAsState(target.primary, spec, label = "primary")
    val primaryForeground by animateColorAsState(target.primaryForeground, spec, label = "primaryFg")
    val accent by animateColorAsState(target.accent, spec, label = "accent")
    val border by animateColorAsState(target.border, spec, label = "border")
    val success by animateColorAsState(target.success, spec, label = "success")
    val successSoft by animateColorAsState(target.successSoft, spec, label = "successSoft")
    val warning by animateColorAsState(target.warning, spec, label = "warning")
    val warningSoft by animateColorAsState(target.warningSoft, spec, label = "warningSoft")
    val destructive by animateColorAsState(target.destructive, spec, label = "destructive")
    val destructiveSoft by animateColorAsState(target.destructiveSoft, spec, label = "destructiveSoft")
    val heroStart by animateColorAsState(target.heroStart, spec, label = "heroStart")
    val heroMid by animateColorAsState(target.heroMid, spec, label = "heroMid")
    val heroEnd by animateColorAsState(target.heroEnd, spec, label = "heroEnd")
    val collectionsStart by animateColorAsState(target.collectionsStart, spec, label = "colStart")
    val collectionsMid by animateColorAsState(target.collectionsMid, spec, label = "colMid")
    val collectionsEnd by animateColorAsState(target.collectionsEnd, spec, label = "colEnd")

    return NsColors(
        isDark = target.isDark,
        background = background,
        card = card,
        foreground = foreground,
        muted = muted,
        mutedForeground = mutedForeground,
        primary = primary,
        primaryForeground = primaryForeground,
        accent = accent,
        border = border,
        success = success,
        successSoft = successSoft,
        warning = warning,
        warningSoft = warningSoft,
        destructive = destructive,
        destructiveSoft = destructiveSoft,
        heroStart = heroStart,
        heroMid = heroMid,
        heroEnd = heroEnd,
        collectionsStart = collectionsStart,
        collectionsMid = collectionsMid,
        collectionsEnd = collectionsEnd
    )
}

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
    val appFontFamily = if (isAr) CairoFontFamily else InterFontFamily
    val targetColors = if (useDark) DarkNsColors else LightNsColors
    val colors = animateNsColors(targetColors)
    val direction = if (isAr) LayoutDirection.Rtl else LayoutDirection.Ltr

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = !useDark
            insetsController.isAppearanceLightNavigationBars = !useDark
        }
    }

    val colorScheme = if (useDark) {
        darkColorScheme(
            primary = colors.primary,
            onPrimary = colors.primaryForeground,
            primaryContainer = colors.accent,
            onPrimaryContainer = colors.foreground,
            secondary = Color(0xFFC49A6C),
            onSecondary = Color(0xFF1C1917),
            background = colors.background,
            onBackground = colors.foreground,
            surface = colors.card,
            onSurface = colors.foreground,
            surfaceVariant = colors.muted,
            onSurfaceVariant = colors.mutedForeground,
            outline = colors.border,
            error = colors.destructive,
            onError = Color(0xFF1C1917)
        )
    } else {
        lightColorScheme(
            primary = colors.primary,
            onPrimary = colors.primaryForeground,
            primaryContainer = colors.accent,
            onPrimaryContainer = colors.foreground,
            secondary = Color(0xFFC49A6C),
            onSecondary = Color.White,
            background = colors.background,
            onBackground = colors.foreground,
            surface = colors.card,
            onSurface = colors.foreground,
            surfaceVariant = colors.muted,
            onSurfaceVariant = colors.mutedForeground,
            outline = colors.border,
            error = colors.destructive,
            onError = Color.White
        )
    }

    CompositionLocalProvider(
        LocalNsColors provides colors,
        LocalIsArabic provides isAr,
        LocalLayoutDirection provides direction,
        LocalAppFontFamily provides appFontFamily
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = createNsTypography(appFontFamily)
        ) {
            ProvideTextStyle(
                value = TextStyle(fontFamily = appFontFamily),
                content = content
            )
        }
    }
}
