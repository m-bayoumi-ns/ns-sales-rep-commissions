package com.naguibselim.commissionsapp.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.AccessTime
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Clear
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.Layers
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.outlined.RemoveCircleOutline
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Straighten
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.data.AdjustmentModel
import com.naguibselim.commissionsapp.data.CommissionSettingsModel
import com.naguibselim.commissionsapp.data.MonthClock
import com.naguibselim.commissionsapp.data.ProductSoldRow
import com.naguibselim.commissionsapp.data.RepDetailModel
import com.naguibselim.commissionsapp.data.RulesModel
import com.naguibselim.commissionsapp.util.Format
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

@Composable
fun RepDetailView(
    detail: RepDetailModel,
    settings: CommissionSettingsModel,
    clock: MonthClock,
    section: SellerSection,
    salesResetTick: Int = 0,
    onSelectSection: (SellerSection) -> Unit,
    showTeamBackLink: Boolean,
    onBackToTeam: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (showTeamBackLink) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .clickable(onClick = onBackToTeam)
                    .padding(vertical = 4.dp, horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = if (isAr) Icons.AutoMirrored.Outlined.KeyboardArrowRight else Icons.AutoMirrored.Outlined.KeyboardArrowLeft,
                    contentDescription = null,
                    tint = c.mutedForeground,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = tr("كل المندوبين", "All sellers"),
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Medium,
                    color = c.mutedForeground
                )
            }
        }

        // Single outer rounded-3xl white card wrapping the header (on Summary) and the active tab body
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = c.card,
            border = BorderStroke(1.dp, c.border),
            shadowElevation = 1.dp
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Balance header is shown ONLY on the Summary ("الرئيسية") tab, matching Screenshot 2
                if (section == SellerSection.SUMMARY) {
                    BalanceHeaderCard(detail = detail, settings = settings, clock = clock)
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    when (section) {
                        SellerSection.SUMMARY -> SummarySection(detail = detail, settings = settings, clock = clock)
                        SellerSection.SALES -> SalesSection(detail = detail, salesResetTick = salesResetTick)
                        SellerSection.COLLECTIONS -> CollectionsSection(detail = detail, clock = clock)
                        SellerSection.STATEMENT -> StatementSection(detail = detail, settings = settings)
                    }
                }
            }
        }

        // Footer note is shown ONLY on the Summary ("الرئيسية") tab, matching Screenshot 2
        if (section == SellerSection.SUMMARY) {
            Text(
                text = if (clock.closed) {
                    tr("أرقام نهائية لشهر مغلق.", "Final figures for a closed month.")
                } else {
                    tr(
                        "تتحدث تلقائيًا كل بضع دقائق مع ترحيل الفواتير والمدفوعات.",
                        "Updates automatically every few minutes as invoices and payments are posted."
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 2.dp, bottom = 8.dp),
                textAlign = TextAlign.Center,
                fontSize = 11.5.sp,
                color = c.mutedForeground
            )
        }
    }
}

@Composable
private fun BalanceHeaderCard(
    detail: RepDetailModel,
    settings: CommissionSettingsModel,
    clock: MonthClock
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val rep = detail.rep
    val r = rep.result

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.linearGradient(
                    colors = listOf(c.heroStart, c.heroMid, c.heroEnd)
                )
            )
            .padding(horizontal = 20.dp, vertical = 22.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
            // Top identity row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.15f))
                        .border(2.dp, Color.White.copy(alpha = 0.25f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = LucideIcons.UserRound,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = rep.name,
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    val monthStr = Format.monthLabel(clock.month, isAr)
                    val dayStr = if (clock.closed) {
                        tr("شهر مغلق", "Month closed")
                    } else {
                        tr("اليوم ${clock.elapsedDays} من ${clock.monthDays}", "Day ${clock.elapsedDays} of ${clock.monthDays}")
                    }
                    Text(
                        text = "$monthStr · $dayStr",
                        color = Color.White.copy(alpha = 0.72f),
                        fontSize = 12.sp
                    )
                }
                RegimeBadgeChip(regime = r.regime, onDarkHeader = true)
            }

            // Center commission figure
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = if (clock.closed) tr("عمولتك هذا الشهر", "Your commission this month")
                    else tr("عمولتك حتى الآن", "Your commission so far"),
                    color = Color.White.copy(alpha = 0.75f),
                    fontSize = 13.5.sp
                )
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                    Row(
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = Format.number(r.total),
                            color = Color.White,
                            fontSize = 46.sp,
                            fontWeight = FontWeight.ExtraBold,
                            lineHeight = 50.sp
                        )
                        Text(
                            text = if (isAr) "ج.م" else "EGP",
                            color = Color.White.copy(alpha = 0.72f),
                            fontSize = 19.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                    }
                }
                if (r.regime != "full") {
                    val regimeNote = when (r.regime) {
                        "old" -> tr(
                            "النظام القديم — تجاوز ${Format.integer(settings.rules.oldSystemUntilPct)}% للدخول إلى النظام الكامل",
                            "Old system — exceed ${Format.integer(settings.rules.oldSystemUntilPct)}% to enter the full system"
                        )
                        "low" -> tr(
                            "أقل من ${Format.integer(settings.rules.lowAchievementPct)}% — ${Format.rate(settings.rules.lowRate)} على الأصناف الأخرى مع استمرار Product Category",
                            "Below ${Format.integer(settings.rules.lowAchievementPct)}% — ${Format.rate(settings.rules.lowRate)} on other products; Product Category commissions remain"
                        )
                        else -> tr("لم يُحدد هدف هذا الشهر", "No target set this month")
                    }
                    Text(
                        text = regimeNote,
                        color = Color.White.copy(alpha = 0.72f),
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Level Road Bar
            if (r.achievement != null) {
                LevelRoadBar(
                    achievement = r.achievement,
                    projected = if (clock.closed) null else rep.projectedAchievement,
                    low = settings.rules.lowAchievementPct,
                    old = settings.rules.oldSystemUntilPct
                )
            }

            // 3 Mini KPIs row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.10f))
                    .padding(vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                MiniHeaderStat(
                    label = tr("المبيعات", "Sales"),
                    value = Format.compactCurrency(r.sales, isAr),
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(30.dp)
                        .background(Color.White.copy(alpha = 0.15f))
                )
                MiniHeaderStat(
                    label = if (clock.closed) tr("الهدف الإجمالي", "Total target") else tr("الهدف حتى اليوم", "Target to date"),
                    value = if (r.totalTargetToDate != null) Format.compactCurrency(r.totalTargetToDate, isAr) else "—",
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(30.dp)
                        .background(Color.White.copy(alpha = 0.15f))
                )
                MiniHeaderStat(
                    label = tr("المحقق", "Achieved"),
                    value = Format.percent(r.achievement),
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun MiniHeaderStat(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.65f),
            fontSize = 11.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = value,
            color = Color.White,
            fontSize = 13.5.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            maxLines = 2
        )
    }
}

@Composable
private fun LevelRoadBar(
    achievement: Double,
    projected: Double?,
    low: Double,
    old: Double
) {
    val targetLabel = tr("الهدف", "Target")
    var entered by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { entered = true }

    val maxVal = max(110.0, min(160.0, ceil(max(achievement, projected ?: 0.0) / 10.0) * 10.0 + 10.0))
    val frac = { v: Double -> (v.coerceIn(0.0, maxVal) / maxVal).toFloat() }

    val animAch by animateFloatAsState(
        targetValue = if (entered) frac(achievement) else 0f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "ach"
    )
    val animProj by animateFloatAsState(
        targetValue = if (entered && projected != null && projected > achievement) frac(projected) else 0f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "proj"
    )

    val marks = listOf(
        low to "${Format.integer(low)}%",
        old to "${Format.integer(old)}%",
        100.0 to targetLabel
    )

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Column(modifier = Modifier.fillMaxWidth()) {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(20.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                val widthDp = maxWidth
                // Track
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.15f))
                )
                // Projected bar
                if (projected != null && projected > achievement) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(animProj)
                            .height(10.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.25f))
                    )
                }
                // Achieved bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animAch)
                        .height(10.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFFFCD34D), Color(0xFF6EE7B7))
                            )
                        )
                )
                // Milestone dots
                marks.forEach { (v, _) ->
                    val f = frac(v)
                    val passed = achievement >= v
                    Box(
                        modifier = Modifier
                            .offset(x = (widthDp * f) - 7.dp)
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(if (passed) Color(0xFF6EE7B7) else Color(0xFF4A2D16))
                            .border(2.dp, if (passed) Color.White else Color.White.copy(alpha = 0.6f), CircleShape)
                    )
                }
                // Current position indicator
                Box(
                    modifier = Modifier
                        .offset(x = (widthDp * animAch) - 9.dp)
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFFCD34D))
                        .border(3.dp, Color.White, CircleShape)
                )
            }
            // Labels row
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp)
                    .height(16.dp)
            ) {
                val widthDp = maxWidth
                marks.forEach { (v, label) ->
                    val f = frac(v)
                    Text(
                        text = label,
                        color = Color.White.copy(alpha = 0.72f),
                        fontSize = 10.sp,
                        modifier = Modifier.offset(x = (widthDp * f) - 16.dp)
                    )
                }
            }
        }
    }
}

// ============================================================================
// TAB 1: SUMMARY (Matches Screenshot 2)
// ============================================================================
@Composable
private fun SummarySection(
    detail: RepDetailModel,
    settings: CommissionSettingsModel,
    clock: MonthClock
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val rep = detail.rep
    val r = rep.result
    val qtyUnit = tr("م", "m")
    val flagged = r.belowMinimum || rep.minimumRisk

    if (flagged) {
        val msg = if (r.belowMinimum) {
            tr(
                "مبيعاتك في نهاية الشهر أقل من الحد الأدنى ${Format.currency(settings.rules.minimumSales, isAr)}.",
                "Your month-end sales are below the minimum of ${Format.currency(settings.rules.minimumSales, isAr)}."
            )
        } else {
            tr(
                "بهذا المعدل سينتهي الشهر عند حوالي ${Format.currency(rep.projectedSales, isAr)}، أقل من الحد الأدنى ${Format.currency(settings.rules.minimumSales, isAr)}.",
                "At this pace the month ends at about ${Format.currency(rep.projectedSales, isAr)}, below the minimum of ${Format.currency(settings.rules.minimumSales, isAr)}."
            )
        }
        StatusBanner(text = msg, tone = "error", icon = Icons.Outlined.Flag)
    }

    // 1. My Targets Group ("أهدافي")
    NsGroupCard(title = tr("أهدافي", "My targets")) {
        NsListRow(
            icon = LucideIcons.Target,
            label = if (clock.closed) tr("الهدف الإجمالي", "Total target") else tr("الهدف حتى اليوم", "Target to date"),
            sub = "${Format.compactCurrency(r.sales, isAr)} / ${if (r.totalTargetToDate != null) Format.compactCurrency(r.totalTargetToDate, isAr) else "—"}",
            value = Format.percent(r.achievement),
            progress = r.achievement,
            hasProgressSlot = true
        )

        listOf("slow" to r.slowCategory, "digital" to r.digitalCategory).forEach { (key, cat) ->
            NsDivider()
            val fmt = { v: Double? ->
                if (v == null) "—"
                else if (cat.unit == "amount") Format.compactCurrency(v, isAr)
                else "${Format.number(v)} $qtyUnit"
            }
            val valSub = when {
                cat.targetToDate == null -> null
                cat.achieved >= cat.targetToDate -> tr("تحقق الهدف", "Target reached")
                else -> {
                    val rem = cat.targetToDate - cat.achieved
                    val remStr = if (cat.unit == "amount") Format.compactCurrency(rem, isAr) else "${Format.integer(ceil(rem))} $qtyUnit"
                    tr("المتبقي $remStr", "$remStr remaining")
                }
            }
            NsListRow(
                icon = if (key == "slow") Icons.Outlined.Layers else Icons.Outlined.Bolt,
                label = if (key == "slow") tr("الراكد", "Slow-moving") else tr("الديجيتال", "Digital"),
                sub = "${fmt(cat.achieved)} / ${fmt(cat.targetToDate)}",
                value = if (cat.targetToDate != null) Format.percent(cat.achievement) else "—",
                valueSub = valSub,
                progress = if (cat.targetToDate != null) cat.achievement else null,
                hasProgressSlot = true
            )
        }

        r.tiers.filter { it.targetToDate != null }.forEach { range ->
            val target = range.targetToDate ?: return@forEach
            NsDivider()
            val fmt = { v: Double? ->
                if (v == null) "—"
                else if (range.unit == "amount") Format.compactCurrency(v, isAr)
                else "${Format.number(v)} $qtyUnit"
            }
            val valSub = if (range.achieved >= target) {
                tr("تحقق الهدف", "Target reached")
            } else {
                val rem = target - range.achieved
                val remStr = if (range.unit == "amount") Format.compactCurrency(rem, isAr) else "${Format.integer(ceil(rem))} $qtyUnit"
                tr("المتبقي $remStr", "$remStr remaining")
            }
            NsListRow(
                iconBadgeText = range.key,
                label = tr("الشريحة ${range.key}", "Range ${range.key}"),
                sub = "${fmt(range.achieved)} / ${fmt(range.targetToDate)}",
                value = Format.percent(range.achievement),
                valueSub = valSub,
                progress = range.achievement,
                hasProgressSlot = true
            )
        }

        NsDivider()
        NsListRow(
            icon = LucideIcons.HandCoins,
            label = tr("التحصيل مقابل المبيعات", "Collections vs sales"),
            sub = "${Format.compactCurrency(r.collections, isAr)} / ${Format.compactCurrency(r.sales, isAr)} ${tr("المحصّل / المبيعات", "collected / sales")}",
            value = Format.percent(r.collectionRatio),
            valueSub = null,
            progress = r.collectionFactor,
            hasProgressSlot = true
        )
    }

    // 2. My Pace Group ("معدلي") — value inline with label, matching Screenshot 2
    if (!clock.closed && r.totalTarget != null) {
        NsGroupCard(title = tr("معدلي", "My pace")) {
            InlineValueRow(
                icon = Icons.AutoMirrored.Outlined.TrendingUp,
                labelPrefix = tr("المتوقع نهاية الشهر", "Expected by month end"),
                inlineValue = Format.compactCurrency(rep.projectedSales, isAr),
                sub = Format.percent(rep.projectedAchievement)
            )
            NsDivider()
            InlineValueRow(
                icon = Icons.Outlined.AccessTime,
                labelPrefix = tr("المطلوب يوميًا", "Needed per day"),
                inlineValue = if (rep.perDayToTarget != null) Format.compactCurrency(rep.perDayToTarget, isAr) else tr("تحقق", "Reached"),
                inlineValueColor = if (rep.perDayToTarget == null) c.success else c.foreground,
                sub = tr("${clock.remainingDays} يوم متبقٍ", "${clock.remainingDays} days left")
            )
        }
    }

    // 3. How to Earn More Group ("كيف تزيد عمولتك")
    val tips = remember(detail, settings, isAr) { buildEarnMoreTips(detail, settings, isAr) }
    NsGroupCard(
        title = tr("كيف تزيد عمولتك", "How to earn more"),
        footer = tr("محسوبة من أرقام اليوم.", "Worked out from today's figures.")
    ) {
        if (tips.isEmpty()) {
            Text(
                text = tr("لا يوجد ما يُفعّل — أحسنت.", "Nothing left to unlock — well done."),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 22.dp),
                textAlign = TextAlign.Center,
                fontSize = 13.5.sp,
                color = c.mutedForeground
            )
        } else {
            tips.forEachIndexed { idx, tip ->
                if (idx > 0) NsDivider()
                val isWarnBg = (tip.tone == "warn" && tip.key != "slowMin") || tip.condition
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isWarnBg) c.warningSoft else Color.Transparent)
                        .padding(horizontal = 16.dp, vertical = 13.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Lightbulb,
                        contentDescription = null,
                        tint = if (isWarnBg) c.warning else c.foreground,
                        modifier = Modifier
                            .padding(top = 2.dp)
                            .size(16.dp)
                    )
                    val annotated = buildAnnotatedString {
                        if (!tip.rewardAmount.isNullOrBlank()) {
                            withStyle(SpanStyle(color = c.success, fontWeight = FontWeight.Bold)) {
                                append(tip.rewardAmount)
                                append(" ")
                            }
                        }
                        withStyle(
                            SpanStyle(
                                color = if (isWarnBg) c.warning else c.foreground,
                                fontWeight = if (tip.condition) FontWeight.SemiBold else FontWeight.Normal
                            )
                        ) {
                            append(tip.text)
                        }
                    }
                    Text(
                        text = annotated,
                        fontSize = 13.5.sp,
                        lineHeight = 19.sp,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }

    // 4. This Month Group ("هذا الشهر") — value inline with label, matching Screenshot 2
    NsGroupCard(title = tr("هذا الشهر", "This month")) {
        InlineValueRow(
            icon = LucideIcons.ReceiptText,
            labelPrefix = tr("الفواتير", "Invoices"),
            inlineValue = Format.integer(rep.invoices),
            sub = tr("${rep.customers} عميل", "${rep.customers} customers")
        )
        NsDivider()
        val cashGood = (r.cashShare ?: 0.0) >= settings.rules.cashSharePct
        InlineValueRow(
            icon = LucideIcons.Banknote,
            labelPrefix = tr("المبيعات المسددة", "This month's invoices paid"),
            inlineValue = Format.percent(r.cashShare),
            inlineValueColor = if (cashGood) c.success else c.foreground,
            sub = tr("${Format.integer(settings.rules.cashSharePct)}% تستحق حافزًا", "${Format.integer(settings.rules.cashSharePct)}% earns a bonus")
        )
    }
}

@Composable
private fun InlineValueRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    labelPrefix: String,
    inlineValue: String,
    inlineValueColor: Color = LocalNsColors.current.foreground,
    sub: String
) {
    val c = LocalNsColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(c.accent),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = c.primary,
                modifier = Modifier.size(16.dp)
            )
        }
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            val text = buildAnnotatedString {
                withStyle(SpanStyle(color = c.foreground, fontWeight = FontWeight.Medium)) {
                    append(labelPrefix)
                    append(" ")
                }
                withStyle(SpanStyle(color = inlineValueColor, fontWeight = FontWeight.Bold)) {
                    append(inlineValue)
                }
            }
            Text(
                text = text,
                fontSize = 14.sp,
                lineHeight = 19.sp
            )
            Text(
                text = sub,
                fontSize = 12.sp,
                color = c.mutedForeground,
                lineHeight = 16.sp
            )
        }
    }
}

private data class EarnTip(
    val key: String,
    val text: String,
    val tone: String, // "good" | "todo" | "warn"
    val rewardAmount: String? = null,
    val condition: Boolean = false
)

private fun buildEarnMoreTips(
    detail: RepDetailModel,
    settings: CommissionSettingsModel,
    isAr: Boolean
): List<EarnTip> {
    val r = detail.rep.result
    val rules = settings.rules
    val money = { v: Double -> Format.currency(ceil(v), isAr) }
    val uom = if (isAr) "م" else "m"
    val tips = mutableListOf<EarnTip>()
    val target = r.totalTargetToDate
    var hasUnmetTargets = false

    if (target != null && target > 0) {
        if (r.regime == "low") {
            val gap = money((target * rules.lowAchievementPct) / 100.0 - r.sales)
            tips.add(
                EarnTip(
                    key = "low",
                    tone = "warn",
                    text = trLang(
                        isAr,
                        "حقق مبيعات إضافية $gap لتصل إلى ${Format.integer(rules.lowAchievementPct)}% من الهدف وتخرج من نظام أقل من 50%.",
                        "Sell $gap more to reach ${Format.integer(rules.lowAchievementPct)}% of target and leave the below-50% system."
                    )
                )
            )
        }
        if (r.regime == "low" || r.regime == "old") {
            val threshold = (target * rules.oldSystemUntilPct) / 100.0
            val gap = money(maxOf(0.01, threshold - r.sales + 0.01))
            tips.add(
                EarnTip(
                    key = "full",
                    tone = "warn",
                    text = trLang(
                        isAr,
                        "حقق مبيعات إضافية $gap لتتجاوز ${Format.integer(rules.oldSystemUntilPct)}% من الهدف وتدخل النظام الكامل.",
                        "Sell $gap more to exceed ${Format.integer(rules.oldSystemUntilPct)}% of target and enter the full system."
                    )
                )
            )
        }
        if (r.sales < target) hasUnmetTargets = true
    } else {
        tips.add(
            EarnTip(
                key = "noTarget",
                tone = "warn",
                text = trLang(isAr, "لم يُحدد هدف إجمالي لهذا المندوب هذا الشهر.", "No total target is set for this rep this month.")
            )
        )
    }

    listOf(r.slowCategory, r.digitalCategory).forEach { cat ->
        if (cat.targetToDate != null && cat.achieved < cat.targetToDate) hasUnmetTargets = true
    }
    r.tiers.forEach { range ->
        if (range.targetToDate != null && range.achieved < range.targetToDate) hasUnmetTargets = true
    }

    if (hasUnmetTargets) {
        tips.add(
            EarnTip(
                key = "target",
                tone = "todo",
                text = trLang(
                    isAr,
                    "حقق جميع الأهداف للحصول على زيادة ${Format.integer(rules.allTargetsBonusPct)}% على العمولة.",
                    "Meet all targets to earn a ${Format.integer(rules.allTargetsBonusPct)}% commission increase."
                ),
                condition = true
            )
        )
    }

    val slow = r.slowCategory
    if (slow.targetToDate != null && slow.achievement != null && slow.achievement < rules.slowMinPct) {
        val need = (slow.targetToDate * rules.slowMinPct) / 100.0 - slow.achieved
        val deduction = r.adjustments.find { it.key == "slowDeduction" }?.amount ?: 0.0
        val gapStr = if (slow.unit == "amount") money(need) else "${Format.integer(ceil(need))} $uom"
        tips.add(
            EarnTip(
                key = "slowMin",
                tone = "warn",
                text = trLang(
                    isAr,
                    "احصل على المبلغ عند زيادة مبيعات الراكد $gapStr وبلوغ ${Format.integer(rules.slowMinPct)}% من هدف الراكد، وتجنب الخصم.",
                    "Earn this amount by selling $gapStr more slow-moving, reaching ${Format.integer(rules.slowMinPct)}% of its target, and avoiding the deduction."
                ),
                rewardAmount = if (deduction < 0) money(abs(deduction)) else null
            )
        )
    }

    if (r.sales > 0) {
        if (r.collectionFactor < 100.0) {
            val colAdj = r.adjustments.find { it.key == "collectionShare" }
            if (colAdj != null) {
                val gap = money(r.sales - r.collections)
                tips.add(
                    EarnTip(
                        key = "commissionAtFullCollection",
                        tone = "todo",
                        text = trLang(
                            isAr,
                            "قيمة الخصم الحالي بسبب فرق نسبة التحصيل. حصّل $gap لتجنب الخصم.",
                            "is currently deducted due to the collection-rate gap. Collect $gap more to avoid the deduction."
                        ),
                        rewardAmount = money(abs(colAdj.amount))
                    )
                )
            }
        }
        if ((r.cashShare ?: 0.0) < rules.cashSharePct) {
            tips.add(
                EarnTip(
                    key = "cash",
                    tone = "todo",
                    text = trLang(
                        isAr,
                        "ارفع نسبة المبيعات المسددة الحالية ${Format.percent(r.cashShare)} إلى ${Format.integer(rules.cashSharePct)}% لاستحقاق الحافز.",
                        "Raise paid invoice sales from ${Format.percent(r.cashShare)} to ${Format.integer(rules.cashSharePct)}% to earn the bonus."
                    ),
                    rewardAmount = money(rules.cashBonus)
                )
            )
        }
        val collectNeed = (r.sales * rules.collectionPct) / 100.0 - r.collections
        if (collectNeed >= 0) {
            tips.add(
                EarnTip(
                    key = "collect",
                    tone = "todo",
                    text = trLang(
                        isAr,
                        "حصّل ${money(collectNeed + 1)} إضافية لتستحق حافز التحصيل.",
                        "Collect ${money(collectNeed + 1)} more to earn the collections bonus."
                    ),
                    rewardAmount = money(rules.collectionBonus)
                )
            )
        }
    }

    val ladder = r.adjustments.find { it.key == "salesLadder" }
    if (ladder?.threshold != null) {
        val nextBonus = rules.salesBonuses
            .filter { it.from == ladder.threshold }
            .maxOfOrNull { it.amount } ?: 0.0
        tips.add(
            EarnTip(
                key = "ladder",
                tone = "todo",
                text = trLang(
                    isAr,
                    "حقق مبيعات إضافية ${money(ladder.threshold - r.sales)} لتصل إلى حافز المبيعات التالي عند ${Format.compactCurrency(ladder.threshold, isAr)}.",
                    "Sell ${money(ladder.threshold - r.sales)} more to reach the next sales bonus at ${Format.compactCurrency(ladder.threshold, isAr)}."
                ),
                rewardAmount = if (nextBonus > 0) money(nextBonus) else null
            )
        )
    }

    if (r.allTargetsMet) {
        tips.add(
            0,
            EarnTip(
                key = "great",
                tone = "good",
                text = trLang(
                    isAr,
                    "تحققت كل الأهداف — حافز +${Format.integer(rules.allTargetsBonusPct)}% مستحق.",
                    "Every target is met — the +${Format.integer(rules.allTargetsBonusPct)}% bonus is earned."
                )
            )
        )
    }
    return tips
}

// ============================================================================
// TAB 2: SALES (Matches Screenshot 4 — 4 large chooser cards first, then list)
// ============================================================================
private data class DayAggRow(
    val day: String,
    val invoices: Int,
    val refunds: Int,
    val customersCount: Int,
    val qty: Double,
    val amount: Double,
    val commission: Double
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SalesSection(
    detail: RepDetailModel,
    salesResetTick: Int
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    var mobileView by rememberSaveable(salesResetTick) { mutableStateOf<String?>(null) } // null | "days" | "customers" | "invoices" | "products"
    var query by rememberSaveable(mobileView) { mutableStateOf("") }
    var searchExpanded by rememberSaveable(mobileView) { mutableStateOf(false) }
    var showAll by rememberSaveable(mobileView) { mutableStateOf(false) }
    val searchFocusRequester = remember { FocusRequester() }

    LaunchedEffect(searchExpanded) {
        if (searchExpanded) {
            runCatching { searchFocusRequester.requestFocus() }
        }
    }

    // Screenshot 4: When mobileView == null, show "اختر طريقة عرض العمولة" and 4 large cards
    if (mobileView == null) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = tr("اختر طريقة عرض العمولة", "Choose a commission view"),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp),
                textAlign = TextAlign.Center,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = c.foreground
            )

            val views = listOf(
                Triple("days", tr("حسب اليوم", "By day"), LucideIcons.CalendarDays),
                Triple("customers", tr("حسب العميل", "By customer"), LucideIcons.Users),
                Triple("invoices", tr("حسب الفاتورة", "By invoice"), LucideIcons.ReceiptText),
                Triple("products", tr("حسب المنتج", "By product"), LucideIcons.Package)
            )

            views.forEach { (key, label, icon) ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 80.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .clickable {
                            mobileView = key
                            showAll = false
                            query = ""
                            searchExpanded = false
                        },
                    shape = RoundedCornerShape(16.dp),
                    color = c.card,
                    border = BorderStroke(1.dp, c.border),
                    shadowElevation = 1.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(c.accent),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = c.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Text(
                            text = label,
                            modifier = Modifier.weight(1f),
                            fontSize = 15.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                        Icon(
                            imageVector = if (isAr) Icons.AutoMirrored.Outlined.KeyboardArrowLeft else Icons.AutoMirrored.Outlined.KeyboardArrowRight,
                            contentDescription = null,
                            tint = c.mutedForeground,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
        return
    }

    val currentView = mobileView ?: "days"
    val q = query.trim().lowercase()
    val match = { text: String -> q.isEmpty() || text.lowercase().contains(q) }

    val products = remember(detail.products, q) {
        detail.products.filter { match("${it.productName} ${it.code ?: ""} ${it.color ?: ""} ${it.invoices.joinToString(" ")}") }
    }
    val invoices = remember(detail.invoiceRows, q) {
        detail.invoiceRows.filter { match("${it.name} ${it.customer}") }
    }
    val customers = remember(detail.customerRows, q) {
        detail.customerRows.filter { match(it.name) }
    }
    val days = remember(detail.invoiceRows, q) {
        val map = linkedMapOf<String, Triple<Int, Int, MutableSet<String>>>()
        val sums = linkedMapOf<String, Triple<Double, Double, Double>>()
        for (row in detail.invoiceRows) {
            if (!match("${row.name} ${row.customer} ${row.day}")) continue
            val prev = map[row.day] ?: Triple(0, 0, mutableSetOf())
            prev.third.add(row.customer)
            map[row.day] = Triple(
                prev.first + if (row.refund) 0 else 1,
                prev.second + if (row.refund) 1 else 0,
                prev.third
            )
            val s = sums[row.day] ?: Triple(0.0, 0.0, 0.0)
            sums[row.day] = Triple(s.first + row.qty, s.second + row.amount, s.third + row.commission)
        }
        map.keys.sortedDescending().map { d ->
            val m = map[d]!!
            val s = sums[d]!!
            DayAggRow(
                day = d,
                invoices = m.first,
                refunds = m.second,
                customersCount = m.third.size,
                qty = s.first,
                amount = s.second,
                commission = s.third
            )
        }
    }

    val count = when (currentView) {
        "products" -> products.size
        "invoices" -> invoices.size
        "customers" -> customers.size
        else -> days.size
    }

    // Modern Header & Expandable Search Section
    val viewIcon = when (currentView) {
        "products" -> LucideIcons.Package
        "invoices" -> LucideIcons.ReceiptText
        "customers" -> LucideIcons.Users
        else -> LucideIcons.CalendarDays
    }
    val modernTitle = when (currentView) {
        "products" -> tr("حسب المنتج", "By Product")
        "invoices" -> tr("حسب الفاتورة", "By Invoice")
        "customers" -> tr("حسب العميل", "By Customer")
        else -> tr("حسب اليوم", "By Day")
    }
    val modernSubtitle = when (currentView) {
        "products" -> tr("المنتجات المباعة وتفاصيل عمولة كل صنف", "Products sold and line commission details")
        "invoices" -> tr("فواتير المبيعات وإشعارات الدائن", "Sales invoices and credit notes")
        "customers" -> tr("إجمالي المبيعات والعمولة لكل عميل", "Total sales and commission per customer")
        else -> tr("ملخص المبيعات والعمولة اليومية", "Daily sales and commission summary")
    }
    val countBadgeLabel = when (currentView) {
        "products" -> tr("$count منتج", "$count items")
        "invoices" -> tr("$count فاتورة", "$count invoices")
        "customers" -> tr("$count عميل", "$count customers")
        else -> tr("$count يوم", "$count days")
    }
    val searchPlaceholder = when (currentView) {
        "products" -> tr("ابحث عن منتج أو لون أو فاتورة...", "Search product, colour or invoice...")
        "invoices" -> tr("ابحث برقم الفاتورة أو العميل...", "Search invoice number or customer...")
        "customers" -> tr("ابحث عن اسم العميل...", "Search customer name...")
        else -> tr("ابحث برقم الفاتورة أو العميل أو التاريخ...", "Search invoice, customer or date...")
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top back link row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Surface(
                shape = CircleShape,
                color = c.accent.copy(alpha = 0.7f),
                border = BorderStroke(1.dp, c.border),
                modifier = Modifier
                    .clip(CircleShape)
                    .clickable {
                        mobileView = null
                        query = ""
                        searchExpanded = false
                    }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = if (isAr) Icons.AutoMirrored.Outlined.KeyboardArrowRight else Icons.AutoMirrored.Outlined.KeyboardArrowLeft,
                        contentDescription = null,
                        tint = c.primary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = tr("طرق العرض", "All views"),
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.primary
                    )
                }
            }

            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(c.accent)
                    .border(1.dp, c.primary.copy(alpha = 0.18f), CircleShape)
                    .padding(horizontal = 12.dp, vertical = 5.dp)
            ) {
                Text(
                    text = countBadgeLabel,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.primary
                )
            }
        }

        // Modern Title Header Card complementing the overall design
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = c.accent.copy(alpha = if (c.isDark) 0.55f else 0.48f),
            border = BorderStroke(1.dp, c.primary.copy(alpha = 0.16f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp, vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(c.card)
                        .border(1.dp, c.primary.copy(alpha = 0.22f), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = viewIcon,
                        contentDescription = null,
                        tint = c.primary,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = modernTitle,
                    fontSize = 19.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = c.foreground,
                    textAlign = TextAlign.Center
                )
                Text(
                    text = modernSubtitle,
                    fontSize = 12.5.sp,
                    color = c.mutedForeground,
                    textAlign = TextAlign.Center
                )
                // Decorative modern accent pill bar
                Box(
                    modifier = Modifier
                        .padding(top = 2.dp)
                        .width(36.dp)
                        .height(3.dp)
                        .clip(CircleShape)
                        .background(c.primary.copy(alpha = 0.55f))
                )
            }
        }

        // Below the title: Modern Expandable Search Bar (Search icon that expands into an input box when clicked)
        val isSearchOpen = searchExpanded || query.isNotEmpty()
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .animateContentSize(animationSpec = tween(durationMillis = 320, easing = FastOutSlowInEasing)),
            contentAlignment = Alignment.Center
        ) {
            AnimatedContent(
                targetState = isSearchOpen,
                transitionSpec = {
                    (fadeIn(tween(240)) + scaleIn(initialScale = 0.88f, animationSpec = tween(260, easing = FastOutSlowInEasing)))
                        .togetherWith(fadeOut(tween(180)) + scaleOut(targetScale = 0.88f, animationSpec = tween(180)))
                },
                label = "expandableSearch"
            ) { expanded ->
                if (!expanded) {
                    // Collapsed state: sleek modern circular Search icon button
                    Surface(
                        shape = CircleShape,
                        color = c.card,
                        border = BorderStroke(1.2.dp, c.primary.copy(alpha = 0.28f)),
                        shadowElevation = 2.dp,
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .clickable { searchExpanded = true }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = LucideIcons.Search,
                                contentDescription = tr("بحث", "Search"),
                                tint = c.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                } else {
                    // Expanded state: full-width modern pill input box
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        placeholder = {
                            Text(
                                text = searchPlaceholder,
                                fontSize = 13.sp,
                                color = c.mutedForeground
                            )
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = LucideIcons.Search,
                                contentDescription = null,
                                tint = c.primary,
                                modifier = Modifier.size(18.dp)
                            )
                        },
                        trailingIcon = {
                            IconButton(
                                onClick = {
                                    if (query.isNotEmpty()) {
                                        query = ""
                                    } else {
                                        searchExpanded = false
                                    }
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Clear,
                                    contentDescription = tr("إغلاق البحث", "Close search"),
                                    tint = c.mutedForeground,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = c.card,
                            unfocusedContainerColor = c.card,
                            focusedBorderColor = c.primary,
                            unfocusedBorderColor = c.primary.copy(alpha = 0.35f)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(searchFocusRequester)
                    )
                }
            }
        }
    }

    NsGroupCard(title = null) {
        if (count == 0) {
            Text(
                text = tr("لا توجد مبيعات هذا الشهر بعد.", "No sales yet this month."),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 28.dp),
                textAlign = TextAlign.Center,
                fontSize = 13.5.sp,
                color = c.mutedForeground
            )
        } else {
            val limit = if (showAll) Int.MAX_VALUE else 20
            when (currentView) {
                "days" -> {
                    days.take(limit).forEachIndexed { idx, row ->
                        if (idx > 0) NsDivider()
                        val dayNum = row.day.takeLast(2).toIntOrNull()?.toString() ?: row.day
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(c.accent),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = dayNum,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = c.primary
                                )
                            }
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Text(
                                    text = Format.weekdayDayLabel(row.day, isAr),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = c.foreground
                                )
                                val invSub = buildString {
                                    append(tr("${row.invoices} فاتورة", "${row.invoices} invoices"))
                                    if (row.refunds > 0) {
                                        append(" · ")
                                        append(tr("${row.refunds} إشعار دائن", "${row.refunds} credit notes"))
                                    }
                                    append(" · ")
                                    append(tr("${row.customersCount} عميل", "${row.customersCount} customers"))
                                }
                                Text(text = invSub, fontSize = 11.5.sp, color = c.mutedForeground)
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    DayFigurePill(
                                        icon = Icons.Outlined.Straighten,
                                        label = tr("الأمتار", "Meters"),
                                        value = Format.number(row.qty),
                                        unit = tr("م", "m")
                                    )
                                    DayFigurePill(
                                        icon = LucideIcons.Banknote,
                                        label = tr("المبيعات", "Sales"),
                                        value = Format.number(row.amount),
                                        unit = tr("ج.م", "EGP")
                                    )
                                }
                            }
                            LtrText(
                                text = "${if (row.commission >= 0) "+" else ""}${Format.number(row.commission)}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (row.commission < 0) c.destructive else c.success
                            )
                        }
                    }
                }
                "customers" -> {
                    customers.take(limit).forEachIndexed { idx, row ->
                        if (idx > 0) NsDivider()
                        NsListRow(
                            iconBadgeText = "${idx + 1}",
                            label = row.name,
                            sub = "${tr("${row.invoices} فاتورة", "${row.invoices} invoices")} · ${Format.number(row.amount)}",
                            value = "${if (row.commission >= 0) "+" else ""}${Format.number(row.commission)}",
                            tone = if (row.commission < 0) "bad" else "good"
                        )
                    }
                }
                "invoices" -> {
                    invoices.take(limit).forEachIndexed { idx, row ->
                        if (idx > 0) NsDivider()
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (row.refund) c.destructiveSoft else c.accent),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = LucideIcons.ReceiptText,
                                    contentDescription = null,
                                    tint = if (row.refund) c.destructive else c.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    LtrText(
                                        text = row.name,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = c.foreground
                                    )
                                    if (row.refund) {
                                        Box(
                                            modifier = Modifier
                                                .clip(CircleShape)
                                                .background(c.destructiveSoft)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = tr("إشعار دائن", "Credit note"),
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = c.destructive
                                            )
                                        }
                                    }
                                }
                                Text(
                                    text = row.customer,
                                    fontSize = 12.5.sp,
                                    color = c.mutedForeground,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${Format.shortDayLabel(row.day, isAr)} · ${tr("${row.lines} بند", "${row.lines} lines")} · ${Format.number(row.amount)}",
                                    fontSize = 11.5.sp,
                                    color = c.mutedForeground
                                )
                            }
                            LtrText(
                                text = "${if (row.commission >= 0) "+" else ""}${Format.number(row.commission)}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (row.commission < 0) c.destructive else c.success
                            )
                        }
                    }
                }
                "products" -> {
                    products.take(limit).forEachIndexed { idx, row ->
                        if (idx > 0) NsDivider()
                        val bucketLabel = when (row.bucket) {
                            "slow" -> tr("الراكد", "Slow-moving")
                            "digital" -> tr("الديجيتال", "Digital")
                            "none" -> tr("بدون شريحة", "No range")
                            else -> tr("الشريحة ${row.bucket}", "Range ${row.bucket}")
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(c.accent),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = LucideIcons.Package,
                                    contentDescription = null,
                                    tint = c.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Text(
                                    text = row.productName + (row.color?.let { " · $it" } ?: ""),
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = c.foreground
                                )
                                LtrText(
                                    text = "${Format.number(row.qty)} ${row.uom ?: ""} × ${if (row.avgPrice == null) "—" else Format.number(row.avgPrice)} = ${Format.number(row.amount)}",
                                    fontSize = 12.sp,
                                    color = c.mutedForeground
                                )
                                if (row.invoices.isNotEmpty()) {
                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        row.invoices.take(3).forEach { inv ->
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(c.muted)
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                LtrText(
                                                    text = inv,
                                                    fontSize = 10.sp,
                                                    color = c.mutedForeground
                                                )
                                            }
                                        }
                                        if (row.invoices.size > 3) {
                                            Text(
                                                text = "+${row.invoices.size - 3}",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = c.primary
                                            )
                                        }
                                    }
                                }
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                LtrText(
                                    text = "+${Format.number(row.commission)}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = c.success
                                )
                                Text(
                                    text = "$bucketLabel · ${Format.rate(row.rate)}",
                                    fontSize = 11.sp,
                                    color = c.mutedForeground
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (count > 20) {
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            TextButton(onClick = { showAll = !showAll }) {
                Text(
                    text = if (showAll) tr("عرض أقل", "Show fewer") else tr("عرض ${count - 20} أخرى", "Show ${count - 20} more"),
                    color = c.primary,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }

    val totalLineCommission = remember(detail.invoiceRows) {
        detail.invoiceRows.sumOf { it.commission }
    }
    Text(
        text = tr(
            "المبالغ هي عمولة البنود (الإجمالي ${Format.number(totalLineCommission)}) قبل تعديل التحصيل والحوافز. الشركات الشقيقة غير محتسبة.",
            "Amounts are line commission (${Format.number(totalLineCommission)} in total), before the collections adjustment and bonuses. Group companies are not counted."
        ),
        fontSize = 12.sp,
        color = c.mutedForeground,
        modifier = Modifier.padding(horizontal = 4.dp)
    )
}

@Composable
private fun DayFigurePill(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    unit: String
) {
    val c = LocalNsColors.current
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(c.muted)
            .padding(horizontal = 6.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(icon, contentDescription = null, tint = c.mutedForeground, modifier = Modifier.size(13.dp))
        Text(text = label, fontSize = 11.sp, color = c.mutedForeground)
        LtrText(text = value, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = c.foreground)
        Text(text = unit, fontSize = 11.sp, color = c.mutedForeground)
    }
}

// ============================================================================
// TAB 3: COLLECTIONS (Matches Screenshot 1)
// ============================================================================
@Composable
private fun CollectionsSection(
    detail: RepDetailModel,
    clock: MonthClock
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val r = detail.rep.result
    val col = detail.collections

    // Collections Hero Card (Screenshot 1)
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(c.collectionsStart, c.collectionsMid, c.collectionsEnd)
                )
            )
            .padding(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.10f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = LucideIcons.HandCoins,
                            contentDescription = null,
                            tint = Color(0xFFFEF3C7),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Text(
                        text = tr("المحصّل هذا الشهر", "Collected this month"),
                        color = Color.White.copy(alpha = 0.92f),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color(0xBF3B2414))
                        .border(1.dp, Color(0xCC3B2414), CircleShape)
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    LtrText(
                        text = Format.percent(r.collectionRatio),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                LtrText(
                    text = Format.number(r.collections),
                    color = Color.White,
                    fontSize = 34.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    text = if (isAr) "ج.م" else "EGP",
                    color = Color.White.copy(alpha = 0.80f),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }
        }
    }

    NsGroupCard(title = tr("حسب المصدر", "By source")) {
        NsListRow(
            icon = LucideIcons.Wallet,
            label = tr("مدفوعات", "Payments"),
            value = Format.number(col.payment)
        )
        NsDivider()
        NsListRow(
            icon = LucideIcons.ReceiptText,
            label = tr("شيكات محصلة", "Cheques collected"),
            value = Format.number(col.cheque)
        )
        NsDivider()
        NsListRow(
            icon = LucideIcons.Banknote,
            label = tr("مقبوضات خزينة", "Treasury receipts"),
            value = Format.number(col.manual)
        )
        if (col.refund != 0.0) {
            NsDivider()
            NsListRow(
                icon = Icons.Outlined.RemoveCircleOutline,
                label = tr("مردودات", "Refunds"),
                value = Format.number(col.refund),
                tone = "bad"
            )
        }
    }

    NsGroupCard(title = tr("عملائي", "My customers")) {
        NsListRow(
            icon = LucideIcons.Users,
            label = tr("المستحق عليهم اليوم", "They owe today"),
            sub = if (clock.closed) tr("تظهر للشهر الحالي فقط", "Shown for the current month only")
            else tr("إجمالي مديونية عملائك المفتوحة", "Total open debt of your customers"),
            value = if (detail.rep.receivables == null) "—" else Format.currency(detail.rep.receivables, isAr)
        )
    }
}

// ============================================================================
// TAB 4: STATEMENT (Matches Screenshot 3)
// ============================================================================
private data class StatementBucketLine(
    val key: String,
    val label: String,
    val sub: String,
    val amount: Double,
    val rate: String,
    val commission: Double
)

@Composable
private fun StatementSection(
    detail: RepDetailModel,
    settings: CommissionSettingsModel
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val r = detail.rep.result
    val rules = settings.rules

    val replaced = r.regime == "low"
    val useOldSystemTiers = r.regime == "old"
    val activeTiers = if (useOldSystemTiers) rules.oldSystemTiers else settings.tiers

    val lines = buildList {
        if (useOldSystemTiers) {
            r.oldTiers.forEachIndexed { idx, b ->
                val tier = activeTiers.getOrNull(idx)
                val sub = if (tier?.to == null) {
                    tr("سعر ${Format.number(tier?.from ?: 0.0)} فأكثر", "price ${Format.number(tier?.from ?: 0.0)}+")
                } else {
                    tr("سعر ${Format.number(tier.from)}–${Format.number(tier.to)}", "price ${Format.number(tier.from)}–${Format.number(tier.to)}")
                }
                add(StatementBucketLine(b.key, tr("الشريحة ${b.key}", "Range ${b.key}"), sub, b.amount, Format.rate(b.rate), b.commission))
            }
        } else {
            r.tiers.forEachIndexed { idx, b ->
                val tier = activeTiers.getOrNull(idx)
                val sub = if (tier?.to == null) {
                    tr("سعر ${Format.number(tier?.from ?: 0.0)} فأكثر", "price ${Format.number(tier?.from ?: 0.0)}+")
                } else {
                    tr("سعر ${Format.number(tier.from)}–${Format.number(tier.to)}", "price ${Format.number(tier.from)}–${Format.number(tier.to)}")
                }
                add(StatementBucketLine(b.key, tr("الشريحة ${b.key}", "Range ${b.key}"), sub, b.amount, Format.rate(b.rate), b.commission))
            }
        }
        add(
            StatementBucketLine(
                key = "ns",
                label = "NS",
                sub = tr("متوسط نسبة المنتجات", "weighted product rate"),
                amount = r.ns.amount,
                rate = Format.rate(r.ns.rate),
                commission = r.ns.commission
            )
        )
        add(
            StatementBucketLine(
                key = "slow",
                label = tr("الراكد", "Slow-moving"),
                sub = tr("نسبة الفئة", "category rate"),
                amount = r.slowCategory.amount,
                rate = Format.rate(r.slowCategory.rate),
                commission = r.slowCategory.commission
            )
        )
        add(
            StatementBucketLine(
                key = "digital",
                label = tr("الديجيتال", "Digital"),
                sub = tr("نسبة الفئة", "category rate"),
                amount = r.digitalCategory.amount,
                rate = Format.rate(r.digitalCategory.rate),
                commission = r.digitalCategory.commission
            )
        )
    }.filter { it.amount != 0.0 || it.commission != 0.0 }

    var openKey by rememberSaveable { mutableStateOf<String?>(null) }
    val canOpen = { key: String ->
        rules.statementDetails[key] != false && detail.products.any { it.bucket == key }
    }

    val adjustments = r.adjustments.filter {
        it.key != "lowRate" && it.key != "oldTiers" && it.key != "collectionShare"
    }
    val collectionShare = r.adjustments.find { it.key == "collectionShare" }

    val regimeShortLabel = when (r.regime) {
        "full" -> tr("النظام الكامل", "Full system")
        "old" -> tr("النظام القديم", "Old system")
        "low" -> tr("نسبة منخفضة + Product Category", "Low rate + Product Category")
        else -> tr("بدون هدف", "No target")
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = c.card,
        border = BorderStroke(1.dp, c.border),
        shadowElevation = 1.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.AutoAwesome,
                        contentDescription = null,
                        tint = c.primary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = tr("كشف العمولة", "Commission statement"),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.foreground
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(c.successSoft)
                        .border(1.dp, c.success.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = regimeShortLabel,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.success
                    )
                }
            }

            DashedHorizontalLine(color = c.border)

            // Buckets list
            Column(
                modifier = Modifier
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                lines.forEach { line ->
                    val openable = canOpen(line.key)
                    val isOpen = openable && openKey == line.key
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .alpha(if (r.regime == "low" && line.key != "slow" && line.key != "digital") 0.5f else 1f)
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .then(
                                    if (openable) Modifier.clickable { openKey = if (isOpen) null else line.key }
                                    else Modifier
                                )
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.Bottom,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Column(modifier = Modifier.weight(1f, fill = false)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = line.label,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = c.foreground
                                    )
                                    if (openable) {
                                        Icon(
                                            imageVector = if (isOpen) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                                            contentDescription = null,
                                            tint = c.mutedForeground,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                                LtrText(
                                    text = "${Format.number(line.amount)} × ${line.rate} · ${line.sub}",
                                    fontSize = 11.sp,
                                    color = c.mutedForeground
                                )
                            }
                            DottedLeader(
                                color = c.border,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(bottom = 5.dp)
                            )
                            LtrText(
                                text = Format.number(line.commission),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = c.foreground
                            )
                        }
                        if (isOpen) {
                            BucketProductsTable(
                                rows = detail.products.filter { it.bucket == line.key }
                            )
                        }
                    }
                }

                // Base line commission total
                val baseVal = if (useOldSystemTiers) {
                    r.adjustments.find { it.key == "oldTiers" }?.amount ?: r.base
                } else r.base

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(c.accent.copy(alpha = 0.6f))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = tr("عمولة البنود", "Line commission"),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.foreground
                    )
                    DottedLeader(
                        color = c.border,
                        modifier = Modifier
                            .weight(1f)
                            .padding(bottom = 5.dp)
                    )
                    LtrText(
                        text = Format.number(baseVal),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.foreground
                    )
                }
            }

            DashedHorizontalLine(color = c.border)

            // Adjustments
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (collectionShare != null) {
                    StatementAdjustmentRow(
                        item = collectionShare,
                        rules = rules,
                        replaced = false,
                        isAr = isAr
                    )
                }
                adjustments.forEach { item ->
                    StatementAdjustmentRow(
                        item = item,
                        rules = rules,
                        replaced = replaced,
                        isAr = isAr
                    )
                }
                if (r.regime == "low") {
                    val replaceText = tr(
                        "أقل من 50%: ${Format.rate(rules.lowRate)} على المبيعات العادية، مع استمرار عمولة أصناف Product Category.",
                        "Below 50%: ${Format.rate(rules.lowRate)} on other products; Product Category commissions still apply."
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(c.warningSoft)
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = replaceText,
                            fontSize = 13.sp,
                            color = c.warning,
                            modifier = Modifier.weight(1f)
                        )
                        LtrText(
                            text = Format.number(r.beforeCollection),
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.warning
                        )
                    }
                }
            }

            DashedHorizontalLine(color = c.border)

            // Final You Earn
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = tr("تستحق", "You earn"),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground
                )
                LtrText(
                    text = Format.currency(r.total, isAr),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = c.success
                )
            }

            if (r.regime == "old") {
                Text(
                    text = tr(
                        "تُحسب المنتجات العادية بشرائح النظام القديم، وتُصرف عمولة Product Category بشكل مستقل عن تحقيق التارجت.",
                        "Other products use the old-system tiers; Product Category commission remains independent of target achievement."
                    ),
                    fontSize = 12.sp,
                    color = c.mutedForeground
                )
            }
        }
    }
}

@Composable
private fun DashedHorizontalLine(color: Color, modifier: Modifier = Modifier) {
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(1.dp)
    ) {
        drawLine(
            color = color,
            start = Offset(0f, 0f),
            end = Offset(size.width, 0f),
            strokeWidth = 1.dp.toPx(),
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(6.dp.toPx(), 4.dp.toPx()), 0f)
        )
    }
}

@Composable
private fun DottedLeader(color: Color, modifier: Modifier = Modifier) {
    Canvas(
        modifier = modifier.height(1.dp)
    ) {
        drawLine(
            color = color,
            start = Offset(0f, 0f),
            end = Offset(size.width, 0f),
            strokeWidth = 1.dp.toPx(),
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(2.dp.toPx(), 3.dp.toPx()), 0f)
        )
    }
}

@Composable
private fun BucketProductsTable(rows: List<ProductSoldRow>) {
    val c = LocalNsColors.current
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 6.dp, bottom = 8.dp),
        shape = RoundedCornerShape(12.dp),
        color = c.muted.copy(alpha = 0.45f),
        border = BorderStroke(1.dp, c.border)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(c.muted)
                    .padding(horizontal = 10.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tr("المنتج", "Product"),
                    modifier = Modifier.weight(1.6f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.mutedForeground
                )
                Text(
                    text = tr("السعر بعد الخصم", "Price net"),
                    modifier = Modifier.weight(1f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.mutedForeground,
                    textAlign = TextAlign.End
                )
                Text(
                    text = tr("الكمية (م)", "Qty (m)"),
                    modifier = Modifier.weight(0.9f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.mutedForeground,
                    textAlign = TextAlign.End
                )
                Text(
                    text = tr("العمولة", "Commission"),
                    modifier = Modifier.weight(1f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.mutedForeground,
                    textAlign = TextAlign.End
                )
            }

            rows.forEach { row ->
                NsDivider()
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = Format.plainProductName(row.productName) + (row.color?.let { " · $it" } ?: ""),
                        modifier = Modifier.weight(1.6f),
                        fontSize = 11.5.sp,
                        color = c.foreground
                    )
                    LtrText(
                        text = if (row.avgPrice == null) "—" else Format.number(row.avgPrice),
                        modifier = Modifier.weight(1f),
                        fontSize = 11.5.sp,
                        color = c.foreground,
                        textAlign = TextAlign.End
                    )
                    LtrText(
                        text = Format.number(row.qty),
                        modifier = Modifier.weight(0.9f),
                        fontSize = 11.5.sp,
                        color = c.foreground,
                        textAlign = TextAlign.End
                    )
                    LtrText(
                        text = Format.number(row.commission),
                        modifier = Modifier.weight(1f),
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (row.commission < 0) c.destructive else c.success,
                        textAlign = TextAlign.End
                    )
                }
            }

            NsDivider()
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(c.muted)
                    .padding(horizontal = 10.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tr("الإجمالي", "Total"),
                    modifier = Modifier.weight(2.6f),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground
                )
                LtrText(
                    text = Format.number(rows.sumOf { it.qty }),
                    modifier = Modifier.weight(0.9f),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground,
                    textAlign = TextAlign.End
                )
                LtrText(
                    text = Format.number(rows.sumOf { it.commission }),
                    modifier = Modifier.weight(1f),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground,
                    textAlign = TextAlign.End
                )
            }
        }
    }
}

@Composable
private fun StatementAdjustmentRow(
    item: AdjustmentModel,
    rules: RulesModel,
    replaced: Boolean,
    isAr: Boolean
) {
    val c = LocalNsColors.current
    val independent = item.key == "cash" || item.key == "collection" || item.key == "slowDeduction"
    val earned = if (item.key == "collectionShare") item.applies else (item.met && item.applies && (independent || !replaced))

    val icon = when {
        !earned -> Icons.Outlined.RadioButtonUnchecked
        item.amount < 0 -> Icons.Outlined.RemoveCircleOutline
        else -> Icons.Outlined.CheckCircle
    }
    val iconTint = when {
        !earned -> c.mutedForeground
        item.amount < 0 -> c.destructive
        else -> c.success
    }

    val label = when (item.key) {
        "allTargets" -> tr("تحقيق كل الأهداف: +${Format.integer(rules.allTargetsBonusPct)}% من عمولة البنود", "All targets met: +${Format.integer(rules.allTargetsBonusPct)}% of the line commission")
        "slowDeduction" -> tr("الراكد أقل من ${Format.integer(rules.slowMinPct)}% من هدفه: خصم ${Format.integer(rules.slowDeductionPct)}%", "Slow-moving under ${Format.integer(rules.slowMinPct)}% of target: −${Format.integer(rules.slowDeductionPct)}%")
        "cash" -> tr("المبيعات المسددة ≥ ${Format.integer(rules.cashSharePct)}% من المبيعات", "Paid invoice sales ≥ ${Format.integer(rules.cashSharePct)}% of sales")
        "collection" -> tr("التحصيلات أكثر من ${Format.integer(rules.collectionPct)}% من المبيعات", "Collections above ${Format.integer(rules.collectionPct)}% of sales")
        "salesLadder" -> tr("حافز المبيعات الشهرية", "Monthly sales bonus")
        "collectionShare" -> tr("تعديل العمولة حسب نسبة التحصيل", "Commission adjusted by collections")
        else -> item.key
    }

    val statusText = when {
        item.met && !item.applies && !replaced -> tr("تحقق، لكنه لا يُصرف في النظام الحالي", "Met, but not paid under the current system")
        item.key == "salesLadder" -> when {
            item.met -> tr("مستحق عند مبيعات ${Format.compactCurrency(item.current, isAr)}", "Earned at ${Format.compactCurrency(item.current, isAr)} of sales")
            item.threshold != null -> tr("الحافز التالي عند ${Format.compactCurrency(item.threshold, isAr)}", "Next bonus at ${Format.compactCurrency(item.threshold, isAr)}")
            else -> tr("لم يتحقق بعد", "Not reached yet")
        }
        item.current == null -> tr("لا توجد بيانات بعد", "No data yet")
        else -> tr("الآن ${Format.percent(item.current)} · المطلوب ${Format.percent(item.threshold)}", "Now ${Format.percent(item.current)} · needs ${Format.percent(item.threshold)}")
    }

    val gateText = item.gate?.let { g ->
        val base = if (g.met) {
            tr("تحقيق الهدف ${Format.percent(g.achievement)} · المطلوب ${Format.percent(g.required)} ✓", "Target achievement ${Format.percent(g.achievement)} · needs ${Format.percent(g.required)} ✓")
        } else {
            tr("يحتاج أيضًا ${Format.percent(g.required)} من الهدف · الآن ${Format.percent(g.achievement)}", "Also needs ${Format.percent(g.required)} of target · now ${Format.percent(g.achievement)}")
        }
        if (g.preset) base else "$base ${tr("(لا يوجد حد أدنى محفوظ لهذا الشهر ← 100%)", "(no minimum saved for this month → 100%)")}"
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = iconTint,
            modifier = Modifier
                .padding(top = 2.dp)
                .size(16.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                fontSize = 13.5.sp,
                fontWeight = if (earned) FontWeight.Medium else FontWeight.Normal,
                color = if (earned) c.foreground else c.mutedForeground
            )
            Text(
                text = statusText,
                fontSize = 11.sp,
                color = c.mutedForeground
            )
            if (gateText != null) {
                Text(
                    text = gateText,
                    fontSize = 11.sp,
                    color = if (item.gate?.met == true) c.mutedForeground else c.warning
                )
            }
        }
        LtrText(
            text = if (earned) "${if (item.amount > 0) "+" else ""}${Format.number(item.amount)}" else "—",
            fontSize = 13.5.sp,
            fontWeight = FontWeight.SemiBold,
            color = when {
                !earned -> c.mutedForeground
                item.amount < 0 -> c.destructive
                else -> c.success
            }
        )
    }
}
