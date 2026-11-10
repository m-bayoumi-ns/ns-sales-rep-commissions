package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.util.Format
import java.util.Locale

val LocalFormat = staticCompositionLocalOf { Format(Locale.US) }

/** "ar" or "en": the website path segment for the phone's language. */
@Composable
@ReadOnlyComposable
fun langSegment(): String = if (LocalConfiguration.current.locales[0].language == "ar") "ar" else "en"

@Composable
@ReadOnlyComposable
fun problemText(problem: Problem): String = stringResource(
    when (problem) {
        Problem.Offline -> R.string.err_offline
        Problem.InvalidCredentials -> R.string.err_invalid_credentials
        Problem.Locked -> R.string.err_locked
        Problem.NoAccess -> R.string.err_no_access
        Problem.Inactive -> R.string.err_inactive
        Problem.MustChangePassword -> R.string.err_must_change_password
        Problem.NotConnected -> R.string.err_not_connected
        Problem.LoadFailed -> R.string.err_load_failed
        Problem.Generic -> R.string.err_generic
    },
)

@Composable
fun NoticeBanner(text: String, warn: Boolean, modifier: Modifier = Modifier) {
    val status = LocalStatus.current
    val fg = if (warn) status.warning else MaterialTheme.colorScheme.onPrimaryContainer
    val bg = if (warn) status.warningSoft else MaterialTheme.colorScheme.primaryContainer
    Row(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(bg)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(if (warn) Icons.Filled.Warning else Icons.Filled.Info, contentDescription = null, tint = fg, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        Text(text, color = fg, style = MaterialTheme.typography.bodyMedium)
    }
}

/** A rounded themed card with an optional title and subtitle. */
@Composable
fun SectionCard(title: String? = null, subtitle: String? = null, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
    ) {
        Column(Modifier.padding(16.dp)) {
            if (title != null) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                if (subtitle != null) {
                    Spacer(Modifier.height(2.dp))
                    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Spacer(Modifier.height(12.dp))
            }
            content()
        }
    }
}

/** Small KPI tile: label, big value, caption. */
@Composable
fun StatTile(label: String, value: String, caption: String? = null, modifier: Modifier = Modifier, accent: Color? = null) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.5.dp),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = accent ?: MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (caption != null) {
                Spacer(Modifier.height(2.dp))
                Text(caption, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/** Colour for an achievement percentage: green at 100 %+, amber from 70 %, red below. */
@Composable
fun achievementColor(pct: Double?): Color {
    val status = LocalStatus.current
    return when {
        pct == null -> MaterialTheme.colorScheme.onSurfaceVariant
        pct >= 100 -> status.success
        pct >= 70 -> MaterialTheme.colorScheme.primary
        pct >= 50 -> status.warning
        else -> status.danger
    }
}

/** Horizontal progress bar with an optional faint projection marker. */
@Composable
fun ProgressBar(pct: Double?, projected: Double? = null, modifier: Modifier = Modifier, height: Int = 10) {
    val color = achievementColor(pct)
    val fraction = ((pct ?: 0.0) / 100.0).coerceIn(0.0, 1.0).toFloat()
    val projectedFraction = projected?.let { (it / 100.0).coerceIn(0.0, 1.0).toFloat() }
    Box(
        modifier
            .fillMaxWidth()
            .height(height.dp)
            .clip(RoundedCornerShape(50))
            .background(MaterialTheme.colorScheme.surfaceVariant),
    ) {
        if (projectedFraction != null && projectedFraction > fraction) {
            Box(Modifier.fillMaxWidth(projectedFraction).fillMaxHeight().background(color.copy(alpha = 0.22f)))
        }
        if (fraction > 0f) Box(Modifier.fillMaxWidth(fraction).fillMaxHeight().clip(RoundedCornerShape(50)).background(color))
    }
}

/** Rounded label chip. */
@Composable
fun Pill(text: String, fg: Color, bg: Color, modifier: Modifier = Modifier) {
    Text(
        text,
        color = fg,
        style = MaterialTheme.typography.labelMedium,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        maxLines = 1,
    )
}

@Composable
fun RegimePill(regime: String) {
    val status = LocalStatus.current
    val (fg, bg) = when (regime) {
        "full" -> status.success to status.successSoft
        "old" -> status.warning to status.warningSoft
        "low" -> status.danger to status.dangerSoft
        else -> MaterialTheme.colorScheme.onSurfaceVariant to MaterialTheme.colorScheme.surfaceVariant
    }
    Pill(regimeLabel(regime), fg, bg)
}

@Composable
@ReadOnlyComposable
fun regimeLabel(regime: String): String = stringResource(
    when (regime) {
        "full" -> R.string.regime_full
        "old" -> R.string.regime_old
        "low" -> R.string.regime_low
        else -> R.string.regime_no_target
    },
)

/** Two texts on one line: label at the start, value at the end. */
@Composable
fun LabelValue(label: String, value: String, modifier: Modifier = Modifier, valueColor: Color? = null, bold: Boolean = false) {
    Row(modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f, fill = false))
        Spacer(Modifier.width(12.dp))
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.SemiBold,
            color = valueColor ?: MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
fun OutlinedBox(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(16.dp))
            .padding(12.dp),
    ) { content() }
}
