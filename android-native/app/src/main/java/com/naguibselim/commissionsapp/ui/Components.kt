package com.naguibselim.commissionsapp.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LtrText(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: androidx.compose.ui.unit.TextUnit = androidx.compose.ui.unit.TextUnit.Unspecified,
    fontWeight: FontWeight? = null,
    textAlign: TextAlign? = null,
    maxLines: Int = Int.MAX_VALUE
) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Text(
            text = text,
            modifier = modifier,
            color = color,
            fontSize = fontSize,
            fontWeight = fontWeight,
            textAlign = textAlign,
            maxLines = maxLines,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun NsGroupCard(
    title: String,
    modifier: Modifier = Modifier,
    footer: String? = null,
    action: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val c = LocalNsColors.current
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title.uppercase(),
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Bold,
                color = c.mutedForeground,
                letterSpacing = 0.5.sp
            )
            action?.invoke()
        }
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = c.card,
            border = BorderStroke(1.dp, c.border),
            shadowElevation = 1.dp
        ) {
            Column(modifier = Modifier.fillMaxWidth(), content = content)
        }
        if (!footer.isNullOrBlank()) {
            Text(
                text = footer,
                modifier = Modifier.padding(horizontal = 4.dp),
                fontSize = 11.5.sp,
                color = c.mutedForeground
            )
        }
    }
}

@Composable
fun NsDivider() {
    HorizontalDivider(thickness = 1.dp, color = LocalNsColors.current.border.copy(alpha = 0.7f))
}

@Composable
fun NsListRow(
    icon: ImageVector? = null,
    iconBadgeText: String? = null,
    label: String,
    sub: String? = null,
    value: String? = null,
    valueSub: String? = null,
    tone: String? = null, // "good" | "bad" | "muted" | "warn"
    progress: Double? = null,
    onClick: (() -> Unit)? = null
) {
    val c = LocalNsColors.current
    val valColor = when (tone) {
        "good" -> c.success
        "bad" -> c.destructive
        "warn" -> c.warning
        "muted" -> c.mutedForeground
        else -> c.foreground
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 16.dp, vertical = 13.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (icon != null || iconBadgeText != null) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(c.accent),
                    contentAlignment = Alignment.Center
                ) {
                    if (icon != null) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    } else if (iconBadgeText != null) {
                        Text(
                            text = iconBadgeText,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.primary
                        )
                    }
                }
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = label,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = c.foreground,
                    lineHeight = 19.sp
                )
                if (!sub.isNullOrBlank()) {
                    Text(
                        text = sub,
                        fontSize = 12.sp,
                        color = c.mutedForeground,
                        lineHeight = 16.sp
                    )
                }
            }
            if (value != null) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    LtrText(
                        text = value,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = valColor
                    )
                    if (!valueSub.isNullOrBlank()) {
                        Text(
                            text = valueSub,
                            fontSize = 11.sp,
                            color = c.mutedForeground,
                            textAlign = TextAlign.End
                        )
                    }
                }
            }
        }
        if (progress != null) {
            AnimatedProgressBar(progress = progress)
        }
    }
}

@Composable
fun AnimatedProgressBar(
    progress: Double,
    modifier: Modifier = Modifier,
    heightDp: Int = 6
) {
    val c = LocalNsColors.current
    var started by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { started = true }

    val clamped = (progress.coerceIn(0.0, 100.0) / 100.0).toFloat()
    val animated by animateFloatAsState(
        targetValue = if (started) clamped else 0f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "progress"
    )
    val barColor = when {
        progress >= 100.0 -> c.success
        progress >= 70.0 -> c.warning
        else -> c.destructive
    }
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(heightDp.dp)
                .clip(CircleShape)
                .background(c.muted)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animated)
                    .fillMaxHeight()
                    .clip(CircleShape)
                    .background(barColor)
            )
        }
    }
}

@Composable
fun StatusBanner(
    text: String,
    tone: String = "info", // "info" | "warn" | "error" | "success"
    icon: ImageVector? = null,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null
) {
    val c = LocalNsColors.current
    val (bg, fg, borderCol) = when (tone) {
        "warn" -> Triple(c.warningSoft, c.warning, c.warning.copy(alpha = 0.35f))
        "error" -> Triple(c.destructiveSoft, c.destructive, c.destructive.copy(alpha = 0.35f))
        "success" -> Triple(c.successSoft, c.success, c.success.copy(alpha = 0.35f))
        else -> Triple(c.accent, c.foreground, c.border)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(bg)
            .border(1.dp, borderCol, RoundedCornerShape(16.dp))
            .padding(horizontal = 14.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = fg,
                modifier = Modifier.size(18.dp)
            )
        }
        Text(
            text = text,
            modifier = Modifier.weight(1f),
            fontSize = 13.sp,
            color = fg,
            lineHeight = 18.sp
        )
        if (!actionLabel.isNullOrBlank() && onAction != null) {
            Text(
                text = actionLabel,
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Bold,
                color = fg,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onAction)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
fun NsStateCard(
    title: String,
    body: String,
    icon: ImageVector? = null,
    isError: Boolean = false,
    retryLabel: String? = null,
    onRetry: (() -> Unit)? = null
) {
    val c = LocalNsColors.current
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        shape = RoundedCornerShape(24.dp),
        color = c.card,
        border = BorderStroke(1.dp, if (isError) c.destructive.copy(alpha = 0.35f) else c.border)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (icon != null) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(if (isError) c.destructiveSoft else c.accent),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = if (isError) c.destructive else c.primary,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = c.foreground,
                textAlign = TextAlign.Center
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodyMedium,
                color = c.mutedForeground,
                textAlign = TextAlign.Center
            )
            if (!retryLabel.isNullOrBlank() && onRetry != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Button(
                    onClick = onRetry,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = c.primary,
                        contentColor = c.primaryForeground
                    )
                ) {
                    Text(text = retryLabel, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun NsLoadingCard() {
    val c = LocalNsColors.current
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 36.dp),
        shape = RoundedCornerShape(24.dp),
        color = c.card,
        border = BorderStroke(1.dp, c.border)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            CircularProgressIndicator(
                color = c.primary,
                strokeWidth = 3.dp,
                modifier = Modifier.size(38.dp)
            )
            Text(
                text = tr("جارٍ تحميل أرقام العمولات…", "Loading commission figures…"),
                style = MaterialTheme.typography.titleMedium,
                color = c.foreground,
                textAlign = TextAlign.Center
            )
            Text(
                text = tr(
                    "قراءة الفواتير والمنتجات وربط التحصيلات بالمندوبين وحساب العمولات والحوافز…",
                    "Reading invoices, linking collections, and calculating commissions & bonuses…"
                ),
                style = MaterialTheme.typography.bodyMedium,
                color = c.mutedForeground,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun SegmentedPills(
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val c = LocalNsColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(c.muted)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        options.forEach { (key, label) ->
            val active = key == selected
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (active) c.card else Color.Transparent)
                    .clickable { onSelect(key) }
                    .padding(vertical = 8.dp, horizontal = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    fontSize = 12.5.sp,
                    fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                    color = if (active) c.foreground else c.mutedForeground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun RegimeBadgeChip(regime: String, onDarkHeader: Boolean = false) {
    val c = LocalNsColors.current
    val label = when (regime) {
        "full" -> tr("الحوافز مفعلة", "Bonuses active")
        "old" -> tr("النظام القديم", "Old system")
        "low" -> tr("أقل من 50%", "Below 50%")
        else -> tr("بدون هدف", "No target")
    }
    val (bg, fg) = if (onDarkHeader) {
        when (regime) {
            "full" -> Color(0x3334D399) to Color(0xFFD1FAE5)
            "old" -> Color(0x33FCD34D) to Color(0xFFFEF3C7)
            "low" -> Color(0x40F87171) to Color(0xFFFEE2E2)
            else -> Color(0x26FFFFFF) to Color.White
        }
    } else {
        when (regime) {
            "full" -> c.successSoft to c.success
            "old" -> c.warningSoft to c.warning
            "low" -> c.destructiveSoft to c.destructive
            else -> c.muted to c.mutedForeground
        }
    }
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = fg
        )
    }
}
