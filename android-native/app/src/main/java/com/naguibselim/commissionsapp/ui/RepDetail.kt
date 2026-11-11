package com.naguibselim.commissionsapp.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.material.icons.outlined.AccessTime
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Clear
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.Layers
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.RemoveCircleOutline
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Straighten
import androidx.compose.material.icons.outlined.TrackChanges
import androidx.compose.material.icons.outlined.TrendingUp
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.data.AdjustmentModel
import com.naguibselim.commissionsapp.data.BucketResultModel
import com.naguibselim.commissionsapp.data.CommissionSettingsModel
import com.naguibselim.commissionsapp.data.DailyPoint
import com.naguibselim.commissionsapp.data.MonthClock
import com.naguibselim.commissionsapp.data.ProductSoldRow
import com.naguibselim.commissionsapp.data.RangeResultModel
import com.naguibselim.commissionsapp.data.RepDetailModel
import com.naguibselim.commissionsapp.util.Format
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.max

@Composable
fun RepDetailView(
    detail: RepDetailModel,
    settings: CommissionSettingsModel,
    clock: MonthClock,
    section: SellerSection,
    onSelectSection: (SellerSection) -> Unit,
    showTeamBackLink: Boolean,
    onBackToTeam: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val rep = detail.rep
    val r = rep.result

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (showTeamBackLink) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .clickable(onClick = onBackToTeam)
                    .padding(horizontal = 6.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = if (isAr) Icons.AutoMirrored.Outlined.KeyboardArrowRight else Icons.AutoMirrored.Outlined.KeyboardArrowLeft,
                    contentDescription = null,
                    tint = c.primary,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = tr("كل المندوبين (ملخص الفريق)", "All sellers (team summary)"),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.primary
                )
            }
        }

        // Main Hero + Content Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(26.dp),
            color = c.card,
            border = BorderStroke(1.dp, c.border),
            shadowElevation = 2.dp
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Hero Balance Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                colors = listOf(c.heroStart, c.heroMid, c.heroEnd)
                            )
                        )
                        .padding(horizontal = 20.dp, vertical = 20.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(18.dp)
                    ) {
                        // Top Row: Avatar, Rep Name, Month & Day, Regime Chip
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
                                    .border(1.5.dp, Color.White.copy(alpha = 0.28f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Person,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = rep.name,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                val subText = buildString {
                                    append(Format.monthLabel(clock.month, isAr))
                                    append(" · ")
                                    if (clock.closed) {
                                        append(tr("شهر مغلق", "Closed month"))
                                    } else {
                                        append(
                                            tr(
                                                "اليوم ${clock.elapsedDays} من ${clock.monthDays}",
                                                "Day ${clock.elapsedDays} of ${clock.monthDays}"
                                            )
                                        )
                                    }
                                }
                                Text(
                                    text = subText,
                                    fontSize = 12.sp,
                                    color = Color.White.copy(alpha = 0.72f)
                                )
                            }
                            RegimeBadgeChip(regime = r.regime, onDarkHeader = true)
                        }

                        // Center Earned Commission
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = if (clock.closed) tr("عمولتك هذا الشهر", "Commission this month") else tr("عمولتك حتى الآن", "Earned so far"),
                                fontSize = 13.5.sp,
                                color = Color.White.copy(alpha = 0.78f)
                            )
                            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                                Row(
                                    verticalAlignment = Alignment.Bottom,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = Format.integer(r.total),
                                        fontSize = 44.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White,
                                        letterSpacing = (-1).sp
                                    )
                                    Text(
                                        text = if (isAr) "ج.م" else "EGP",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White.copy(alpha = 0.72f),
                                        modifier = Modifier.padding(bottom = 6.dp)
                                    )
                                }
                            }
                            if (r.regime != "full") {
                                val regimeText = when (r.regime) {
                                    "old" -> tr(
                                        "النظام القديم — حقق ${Format.number(settings.rules.oldSystemUntilPct)}% من الهدف لتفعيل الحوافز",
                                        "Old system — reach ${Format.number(settings.rules.oldSystemUntilPct)}% of target to unlock bonuses"
                                    )
                                    "low" -> tr(
                                        "أقل من ${Format.number(settings.rules.lowAchievementPct)}% من الهدف — ${Format.number(settings.rules.lowRate)}% من المبيعات فقط",
                                        "Below ${Format.number(settings.rules.lowAchievementPct)}% of target — ${Format.number(settings.rules.lowRate)}% of sales only"
                                    )
                                    else -> tr("لم يُحدد هدف هذا الشهر", "No target set for this month")
                                }
                                Text(
                                    text = regimeText,
                                    fontSize = 12.sp,
                                    color = Color.White.copy(alpha = 0.74f),
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Level Road
                        if (r.achievement != null) {
                            LevelRoadBar(
                                achievement = r.achievement,
                                projected = if (clock.closed) null else rep.projectedAchievement,
                                low = settings.rules.lowAchievementPct,
                                old = settings.rules.oldSystemUntilPct
                            )
                        }

                        // 3 Mini KPIs
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White.copy(alpha = 0.11f))
                                .padding(vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HeroMiniStat(
                                label = tr("المبيعات", "Sales"),
                                value = Format.compactCurrency(r.sales, isAr),
                                modifier = Modifier.weight(1f)
                            )
                            Box(
                                modifier = Modifier
                                    .width(1.dp)
                                    .height(28.dp)
                                    .background(Color.White.copy(alpha = 0.16f))
                            )
                            HeroMiniStat(
                                label = if (clock.closed) tr("الهدف الإجمالي", "Total target") else tr("الهدف حتى اليوم", "Target to date"),
                                value = r.totalTargetToDate?.let { Format.compactCurrency(it, isAr) } ?: "—",
                                modifier = Modifier.weight(1f)
                            )
                            Box(
                                modifier = Modifier
                                    .width(1.dp)
                                    .height(28.dp)
                                    .background(Color.White.copy(alpha = 0.16f))
                            )
                            HeroMiniStat(
                                label = tr("المحقق", "Achieved"),
                                value = Format.percent(r.achievement),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Section Tab Bar inside card
                Box(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                    SegmentedPills(
                        options = listOf(
                            SellerSection.SUMMARY.key to tr("الملخص", "Summary"),
                            SellerSection.SALES.key to tr("المبيعات", "Sales"),
                            SellerSection.COLLECTIONS.key to tr("التحصيل", "Collections"),
                            SellerSection.STATEMENT.key to tr("الكشف", "Statement")
                        ),
                        selected = section.key,
                        onSelect = { key ->
                            SellerSection.entries.find { it.key == key }?.let(onSelectSection)
                        }
                    )
                }

                HorizontalDivider(color = c.border)

                // Active Section Content
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    when (section) {
                        SellerSection.SUMMARY -> SummarySectionContent(detail = detail, settings = settings, clock = clock)
                        SellerSection.SALES -> SalesSectionContent(detail = detail, clock = clock)
                        SellerSection.COLLECTIONS -> CollectionsSectionContent(detail = detail, clock = clock)
                        SellerSection.STATEMENT -> StatementSectionContent(detail = detail, settings = settings)
                    }
                }
            }
        }

        Text(
            text = if (clock.closed) {
                tr("أرقام نهائية لشهر مغلق.", "Final figures for a closed month.")
            } else {
                tr("تتحدث تلقائيًا كل بضع دقائق مع ترحيل الفواتير والمدفوعات.", "Updates automatically every few minutes as invoices and payments are posted.")
            },
            fontSize = 11.5.sp,
            color = c.mutedForeground,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        )
    }
}

@Composable
private fun HeroMiniStat(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.68f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        LtrText(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            maxLines = 1
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
    val maxVal = max(110.0, (ceil(max(achievement, projected ?: 0.0) / 10.0) * 10.0 + 10.0).coerceAtMost(160.0))
    var started by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { started = true }

    val achFraction = ((achievement.coerceIn(0.0, maxVal)) / maxVal).toFloat()
    val projFraction = (((projected ?: 0.0).coerceIn(0.0, maxVal)) / maxVal).toFloat()

    val animAch by animateFloatAsState(
        targetValue = if (started) achFraction else 0f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "roadAch"
    )
    val animProj by animateFloatAsState(
        targetValue = if (started) projFraction else 0f,
        animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing),
        label = "roadProj"
    )

    val marks = listOf(
        low to "${Format.integer(low)}%",
        old to "${Format.integer(old)}%",
        100.0 to tr("الهدف", "Target")
    )

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        Column(modifier = Modifier.fillMaxWidth()) {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(20.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                val trackWidth = maxWidth
                // Track
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(10.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.16f))
                )
                // Projected bar
                if (projected != null && projected > achievement) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(animProj)
                            .height(10.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.28f))
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
                marks.forEach { (mVal, _) ->
                    val frac = (mVal / maxVal).toFloat().coerceIn(0f, 1f)
                    val reached = achievement >= mVal
                    Box(
                        modifier = Modifier
                            .offset(x = (trackWidth * frac) - 6.dp)
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(if (reached) Color(0xFF6EE7B7) else Color(0xFF4A2D16))
                            .border(2.dp, if (reached) Color.White else Color.White.copy(alpha = 0.6f), CircleShape)
                    )
                }
                // Current thumb
                Box(
                    modifier = Modifier
                        .offset(x = (trackWidth * animAch) - 9.dp)
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFFCD34D))
                        .border(3.dp, Color.White, CircleShape)
                )
            }
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(16.dp)
            ) {
                val trackWidth = maxWidth
                marks.forEach { (mVal, label) ->
                    val frac = (mVal / maxVal).toFloat().coerceIn(0f, 1f)
                    Text(
                        text = label,
                        fontSize = 10.sp,
                        color = Color.White.copy(alpha = 0.72f),
                        modifier = Modifier.offset(x = (trackWidth * frac) - 18.dp)
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// TAB 1: SUMMARY
// ---------------------------------------------------------------------------
@Composable
private fun SummarySectionContent(
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
        val alertText = if (r.belowMinimum) {
            tr(
                "مبيعاتك في نهاية الشهر أقل من الحد الأدنى ${Format.currency(settings.rules.minimumSales, isAr)}.",
                "Your month-end sales are below the ${Format.currency(settings.rules.minimumSales, isAr)} minimum."
            )
        } else {
            tr(
                "بهذا المعدل سينتهي الشهر عند حوالي ${Format.currency(rep.projectedSales, isAr)}، أقل من الحد الأدنى ${Format.currency(settings.rules.minimumSales, isAr)}.",
                "At this pace the month finishes around ${Format.currency(rep.projectedSales, isAr)}, below the ${Format.currency(settings.rules.minimumSales, isAr)} minimum."
            )
        }
        StatusBanner(
            text = alertText,
            tone = "error",
            icon = Icons.Outlined.Flag
        )
    }

    // Group 1: My Targets
    NsGroupCard(title = tr("أهدافي", "My targets")) {
        NsListRow(
            icon = Icons.Outlined.TrackChanges,
            label = if (clock.closed) tr("الهدف الإجمالي", "Total target") else tr("الهدف حتى اليوم", "Target to date"),
            sub = "${Format.compactCurrency(r.sales, isAr)} / ${r.totalTargetToDate?.let { Format.compactCurrency(it, isAr) } ?: "—"}",
            value = Format.percent(r.achievement),
            progress = r.achievement
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
                cat.achieved >= cat.targetToDate -> tr("تحقق الهدف", "Target met")
                else -> {
                    val rem = cat.targetToDate - cat.achieved
                    val remStr = if (cat.unit == "amount") Format.compactCurrency(rem, isAr) else "${Format.integer(ceil(rem))} $qtyUnit"
                    tr("المتبقي $remStr", "$remStr left")
                }
            }
            NsListRow(
                icon = if (key == "slow") Icons.Outlined.Layers else Icons.Outlined.Bolt,
                label = if (key == "slow") tr("الراكد", "Slow-moving") else tr("الديجيتال", "Digital"),
                sub = "${fmt(cat.achieved)} / ${fmt(cat.targetToDate)}",
                value = if (cat.targetToDate != null) Format.percent(cat.achievement) else "—",
                valueSub = valSub,
                progress = if (cat.targetToDate != null) cat.achievement else null
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
                tr("تحقق الهدف", "Target met")
            } else {
                val rem = target - range.achieved
                val remStr = if (range.unit == "amount") Format.compactCurrency(rem, isAr) else "${Format.integer(ceil(rem))} $qtyUnit"
                tr("المتبقي $remStr", "$remStr left")
            }
            NsListRow(
                iconBadgeText = range.key,
                label = tr("الشريحة ${range.key}", "Range ${range.key}"),
                sub = "${fmt(range.achieved)} / ${fmt(range.targetToDate)}",
                value = Format.percent(range.achievement),
                valueSub = valSub,
                progress = range.achievement
            )
        }

        NsDivider()
        NsListRow(
            icon = Icons.Outlined.Payments,
            label = if (clock.closed) tr("التحصيل مقابل المبيعات", "Collections vs sales") else tr("التحصيل مقابل مبيعات الشهر حتى الآن", "Collections vs sales to date"),
            sub = "${Format.compactCurrency(r.collections, isAr)} / ${Format.compactCurrency(r.sales, isAr)} ${tr("المحصّل / المبيعات", "collected / sales")}",
            value = Format.percent(r.collectionRatio),
            valueSub = tr("المطبق على عمولة البنود: ${Format.percent(r.collectionFactor)}", "Applied to line commission: ${Format.percent(r.collectionFactor)}"),
            progress = r.collectionFactor
        )
    }

    // Group 2: Pace
    if (!clock.closed && r.totalTarget != null) {
        NsGroupCard(title = tr("معدلي", "My pace")) {
            NsListRow(
                icon = Icons.Outlined.TrendingUp,
                label = tr("المتوقع نهاية الشهر", "Projected month-end"),
                sub = Format.percent(rep.projectedAchievement),
                value = Format.compactCurrency(rep.projectedSales, isAr)
            )
            NsDivider()
            NsListRow(
                icon = Icons.Outlined.AccessTime,
                label = tr("المطلوب يوميًا", "Needed per day"),
                sub = tr("متبقٍ ${clock.remainingDays} يوم", "${clock.remainingDays} days remaining"),
                value = rep.perDayToTarget?.let { Format.compactCurrency(it, isAr) } ?: tr("تحقق", "Reached"),
                tone = if (rep.perDayToTarget == null) "good" else null
            )
        }
    }

    // Group 3: Earn More Tips
    val tips = remember(detail, settings, isAr) { buildEarnMoreTips(detail, settings, isAr) }
    NsGroupCard(
        title = tr("كيف تزيد عمولتك", "How to earn more"),
        footer = tr("محسوبة من أرقام اليوم.", "Calculated from today's figures.")
    ) {
        if (tips.isEmpty()) {
            Text(
                text = tr("لا يوجد ما يُفعّل — أحسنت.", "Nothing left to unlock — great work!"),
                fontSize = 13.5.sp,
                color = c.mutedForeground,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 22.dp, horizontal = 16.dp)
            )
        } else {
            tips.forEachIndexed { idx, tip ->
                if (idx > 0) NsDivider()
                val bg = when {
                    tip.highlightWarn -> c.warningSoft
                    else -> Color.Transparent
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(bg)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Lightbulb,
                        contentDescription = null,
                        tint = if (tip.highlightWarn) c.warning else c.primary,
                        modifier = Modifier
                            .padding(top = 2.dp)
                            .size(18.dp)
                    )
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        if (tip.rewardAmount != null) {
                            Text(
                                text = tip.rewardAmount,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = c.success
                            )
                        }
                        Text(
                            text = tip.text,
                            fontSize = 13.sp,
                            fontWeight = if (tip.highlightWarn) FontWeight.SemiBold else FontWeight.Normal,
                            color = if (tip.highlightWarn) c.warning else c.foreground,
                            lineHeight = 18.sp
                        )
                    }
                }
            }
        }
    }

    // Group 4: This Month
    NsGroupCard(title = tr("هذا الشهر", "This month")) {
        NsListRow(
            icon = Icons.Outlined.ReceiptLong,
            label = tr("الفواتير", "Invoices"),
            sub = tr("${rep.customers} عميل", "${rep.customers} customers"),
            value = Format.integer(rep.invoices)
        )
        NsDivider()
        NsListRow(
            icon = Icons.Outlined.Payments,
            label = tr("المبيعات المسددة", "Paid invoice sales"),
            sub = tr("${Format.number(settings.rules.cashSharePct)}% تستحق حافزًا", "${Format.number(settings.rules.cashSharePct)}% earns a bonus"),
            value = Format.percent(r.cashShare),
            tone = if ((r.cashShare ?: 0.0) >= settings.rules.cashSharePct) "good" else null
        )
    }
}

private data class TipItem(
    val key: String,
    val text: String,
    val rewardAmount: String? = null,
    val highlightWarn: Boolean = false
)

private fun buildEarnMoreTips(
    detail: RepDetailModel,
    settings: CommissionSettingsModel,
    isAr: Boolean
): List<TipItem> {
    val r = detail.rep.result
    val rules = settings.rules
    val money = { v: Double -> Format.currency(ceil(v), isAr) }
    val uom = trLang(isAr, "م", "m")
    val tips = mutableListOf<TipItem>()
    val target = r.totalTargetToDate
    var hasUnmetTargets = false

    if (target != null && target > 0) {
        if (r.regime == "low") {
            val gap = money((target * rules.lowAchievementPct) / 100.0 - r.sales)
            tips.add(
                TipItem(
                    key = "low",
                    text = trLang(
                        isAr,
                        "حقق مبيعات إضافية $gap لتتجاوز ${Format.number(rules.lowAchievementPct)}% من الهدف وتخرج من نسبة 0.1%.",
                        "Sell $gap more to pass ${Format.number(rules.lowAchievementPct)}% of target and leave the 0.1% rate."
                    ),
                    highlightWarn = true
                )
            )
        }
        if (r.regime == "low" || r.regime == "old") {
            val gap = money((target * rules.oldSystemUntilPct) / 100.0 - r.sales)
            tips.add(
                TipItem(
                    key = "full",
                    text = trLang(
                        isAr,
                        "حقق مبيعات إضافية $gap لتصل إلى ${Format.number(rules.oldSystemUntilPct)}% من الهدف وتفعّل الحوافز.",
                        "Sell $gap more to reach ${Format.number(rules.oldSystemUntilPct)}% of target and unlock bonuses."
                    ),
                    highlightWarn = true
                )
            )
        }
        if (r.sales < target) hasUnmetTargets = true
    } else {
        tips.add(
            TipItem(
                key = "noTarget",
                text = trLang(isAr, "لم يُحدد هدف إجمالي لهذا المندوب هذا الشهر.", "No total target is set for this seller this month."),
                highlightWarn = true
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
            TipItem(
                key = "target",
                text = trLang(
                    isAr,
                    "حقق جميع الأهداف للحصول على زيادة ${Format.number(rules.allTargetsBonusPct)}% على العمولة.",
                    "Meet all targets to earn a +${Format.number(rules.allTargetsBonusPct)}% commission bonus."
                ),
                highlightWarn = true
            )
        )
    }

    val slow = r.slowCategory
    if (slow.targetToDate != null && slow.achievement != null && slow.achievement < rules.slowMinPct) {
        val need = (slow.targetToDate * rules.slowMinPct) / 100.0 - slow.achieved
        val gapStr = if (slow.unit == "amount") money(need) else "${Format.integer(ceil(need))} $uom"
        val deduction = r.adjustments.find { it.key == "slowDeduction" }?.amount ?: 0.0
        tips.add(
            TipItem(
                key = "slowMin",
                text = trLang(
                    isAr,
                    "احصل على المبلغ عند زيادة مبيعات الراكد $gapStr وبلوغ ${Format.number(rules.slowMinPct)}% من هدف الراكد، وتجنب الخصم.",
                    "Recover this amount by increasing slow-moving sales by $gapStr to reach ${Format.number(rules.slowMinPct)}% of target."
                ),
                rewardAmount = if (deduction < 0) money(abs(deduction)) else null
            )
        )
    }

    if (r.sales > 0) {
        if (r.collectionFactor < 100.0) {
            val colAdj = r.adjustments.find { it.key == "collectionShare" }
            if (colAdj != null && colAdj.amount < 0) {
                tips.add(
                    TipItem(
                        key = "colFull",
                        text = trLang(
                            isAr,
                            "قيمة الخصم الحالي بسبب فرق نسبة التحصيل. حصّل ${money(r.sales - r.collections)} لتجنب الخصم.",
                            "Current deduction due to collection ratio. Collect ${money(r.sales - r.collections)} more to recover it."
                        ),
                        rewardAmount = money(abs(colAdj.amount))
                    )
                )
            }
        }
        if ((r.cashShare ?: 0.0) < rules.cashSharePct) {
            tips.add(
                TipItem(
                    key = "cash",
                    text = trLang(
                        isAr,
                        "ارفع نسبة المبيعات المسددة الحالية ${Format.percent(r.cashShare)} إلى ${Format.number(rules.cashSharePct)}% لاستحقاق الحافز.",
                        "Raise paid invoice sales from ${Format.percent(r.cashShare)} to ${Format.number(rules.cashSharePct)}% to earn the bonus."
                    ),
                    rewardAmount = money(rules.cashBonus)
                )
            )
        }
        val collectNeed = (r.sales * rules.collectionPct) / 100.0 - r.collections
        if (collectNeed >= 0) {
            tips.add(
                TipItem(
                    key = "collect",
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
            TipItem(
                key = "ladder",
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
            TipItem(
                key = "great",
                text = trLang(
                    isAr,
                    "تحققت كل الأهداف — حافز +${Format.number(rules.allTargetsBonusPct)}% مستحق.",
                    "All targets met — +${Format.number(rules.allTargetsBonusPct)}% bonus earned!"
                )
            )
        )
    }
    return tips
}

// ---------------------------------------------------------------------------
// TAB 2: SALES
// ---------------------------------------------------------------------------
private data class DaySalesAgg(
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
private fun SalesSectionContent(
    detail: RepDetailModel,
    clock: MonthClock
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    var selectedView by rememberSaveable { mutableStateOf("days") } // "days" | "customers" | "invoices" | "products"
    var query by rememberSaveable { mutableStateOf("") }
    var showAll by rememberSaveable { mutableStateOf(false) }

    val q = query.trim().lowercase()
    val matches = { text: String -> q.isEmpty() || text.lowercase().contains(q) }

    val products = remember(detail.products, q) {
        detail.products.filter { matches("${it.productName} ${it.code ?: ""} ${it.color ?: ""} ${it.invoices.joinToString(" ")}") }
    }
    val invoices = remember(detail.invoiceRows, q) {
        detail.invoiceRows.filter { matches("${it.name} ${it.customer}") }
    }
    val customers = remember(detail.customerRows, q) {
        detail.customerRows.filter { matches(it.name) }
    }
    val days = remember(detail.invoiceRows, q) {
        val map = linkedMapOf<String, Triple<Int, Int, MutableSet<String>>>()
        val sums = linkedMapOf<String, Pair<Double, Pair<Double, Double>>>()
        for (row in detail.invoiceRows) {
            if (!matches("${row.name} ${row.customer} ${row.day}")) continue
            val cur = map.getOrPut(row.day) { Triple(0, 0, mutableSetOf()) }
            val nextInv = if (row.refund) cur.first else cur.first + 1
            val nextRef = if (row.refund) cur.second + 1 else cur.second
            cur.third.add(row.customer)
            map[row.day] = Triple(nextInv, nextRef, cur.third)

            val s = sums.getOrPut(row.day) { 0.0 to (0.0 to 0.0) }
            sums[row.day] = (s.first + row.qty) to ((s.second.first + row.amount) to (s.second.second + row.commission))
        }
        map.keys.sortedDescending().map { d ->
            val meta = map[d]!!
            val s = sums[d]!!
            DaySalesAgg(
                day = d,
                invoices = meta.first,
                refunds = meta.second,
                customersCount = meta.third.size,
                qty = s.first,
                amount = s.second.first,
                commission = s.second.second
            )
        }
    }

    val totalLineCommission = remember(detail.invoiceRows) {
        detail.invoiceRows.sumOf { it.commission }
    }

    // Native Daily Chart
    if (detail.daily.isNotEmpty()) {
        DailySalesChartCard(
            points = detail.daily,
            target = detail.rep.result.totalTarget,
            asOf = clock.asOf
        )
    }

    // View Selector
    SegmentedPills(
        options = listOf(
            "days" to tr("حسب اليوم", "By day"),
            "customers" to tr("حسب العميل", "By customer"),
            "invoices" to tr("حسب الفاتورة", "By invoice"),
            "products" to tr("حسب المنتج", "By product")
        ),
        selected = selectedView,
        onSelect = {
            selectedView = it
            showAll = false
        }
    )

    val count = when (selectedView) {
        "products" -> products.size
        "invoices" -> invoices.size
        "customers" -> customers.size
        else -> days.size
    }

    val searchPlaceholder = when (selectedView) {
        "products" -> tr("ابحث عن منتج أو لون أو فاتورة", "Search product, color or invoice")
        "customers" -> tr("ابحث عن عميل", "Search customer")
        else -> tr("ابحث برقم الفاتورة أو العميل", "Search invoice number or customer")
    }

    OutlinedTextField(
        value = query,
        onValueChange = { query = it },
        modifier = Modifier.fillMaxWidth(),
        placeholder = {
            Text(text = searchPlaceholder, fontSize = 13.sp, color = c.mutedForeground)
        },
        leadingIcon = {
            Icon(imageVector = Icons.Outlined.Search, contentDescription = null, tint = c.mutedForeground, modifier = Modifier.size(18.dp))
        },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { query = "" }) {
                    Icon(imageVector = Icons.Outlined.Clear, contentDescription = null, tint = c.mutedForeground, modifier = Modifier.size(18.dp))
                }
            }
        },
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = c.primary,
            unfocusedBorderColor = c.border,
            focusedContainerColor = c.card,
            unfocusedContainerColor = c.card
        )
    )

    val titleLabel = when (selectedView) {
        "products" -> tr("المنتجات المباعة ($count)", "Products sold ($count)")
        "invoices" -> tr("الفواتير ($count)", "Invoices ($count)")
        "customers" -> tr("العملاء ($count)", "Customers ($count)")
        else -> tr("الأيام ($count)", "Days ($count)")
    }

    NsGroupCard(
        title = titleLabel,
        footer = tr(
            "المبالغ هي عمولة البنود (الإجمالي ${Format.number(totalLineCommission)}) قبل تعديل التحصيل والحوافز. الشركات الشقيقة غير محتسبة.",
            "Amounts are line commissions (total ${Format.number(totalLineCommission)}) before collection scaling and bonuses. Sister companies excluded."
        )
    ) {
        if (count == 0) {
            Text(
                text = tr("لا توجد مبيعات مطابقة.", "No matching sales."),
                fontSize = 13.5.sp,
                color = c.mutedForeground,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 26.dp)
            )
        } else {
            val limit = if (showAll) Int.MAX_VALUE else 20
            when (selectedView) {
                "days" -> {
                    days.take(limit).forEachIndexed { idx, row ->
                        if (idx > 0) NsDivider()
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(c.accent),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = row.day.takeLast(2).toIntOrNull()?.toString() ?: row.day.takeLast(2),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = c.primary
                                )
                            }
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = Format.weekdayDayLabel(row.day, isAr),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = c.foreground
                                )
                                val sub = buildString {
                                    append(tr("${row.invoices} فاتورة", "${row.invoices} invoices"))
                                    if (row.refunds > 0) append(" · " + tr("${row.refunds} إشعار دائن", "${row.refunds} credit notes"))
                                    append(" · " + tr("${row.customersCount} عميل", "${row.customersCount} customers"))
                                }
                                Text(text = sub, fontSize = 11.5.sp, color = c.mutedForeground)
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    SmallFigurePill(
                                        icon = Icons.Outlined.Straighten,
                                        text = "${tr("الأمتار", "Meters")}: ${Format.number(row.qty)} ${tr("م", "m")}"
                                    )
                                    SmallFigurePill(
                                        icon = Icons.Outlined.Payments,
                                        text = "${tr("المبيعات", "Sales")}: ${Format.number(row.amount)} ${tr("ج.م", "EGP")}"
                                    )
                                }
                            }
                            LtrText(
                                text = (if (row.commission >= 0) "+" else "") + Format.number(row.commission),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
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
                            sub = tr("${row.invoices} فاتورة", "${row.invoices} invoices") + " · " + Format.currency(row.amount, isAr),
                            value = (if (row.commission >= 0) "+" else "") + Format.number(row.commission),
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
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (row.refund) c.destructiveSoft else c.accent),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.ReceiptLong,
                                    contentDescription = null,
                                    tint = if (row.refund) c.destructive else c.primary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    LtrText(
                                        text = row.name,
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.Bold,
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
                                    text = "${Format.shortDayLabel(row.day, isAr)} · ${tr("${row.lines} بند", "${row.lines} lines")} · ${Format.currency(row.amount, isAr)}",
                                    fontSize = 11.5.sp,
                                    color = c.mutedForeground
                                )
                            }
                            LtrText(
                                text = (if (row.commission >= 0) "+" else "") + Format.number(row.commission),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
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
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(c.accent),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Inventory2,
                                    contentDescription = null,
                                    tint = c.primary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(
                                    text = buildString {
                                        append(row.productName)
                                        if (!row.color.isNullOrBlank()) append(" · ${row.color}")
                                    },
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = c.foreground
                                )
                                LtrText(
                                    text = "${Format.number(row.qty)} ${row.uom ?: ""} × ${Format.number(row.avgPrice)} = ${Format.number(row.amount)}",
                                    fontSize = 11.5.sp,
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
                                                fontSize = 10.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = c.primary
                                            )
                                        }
                                    }
                                }
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                LtrText(
                                    text = (if (row.commission >= 0) "+" else "") + Format.number(row.commission),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (row.commission < 0) c.destructive else c.success
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

            if (count > 20) {
                NsDivider()
                TextButton(
                    onClick = { showAll = !showAll },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = if (showAll) tr("عرض أقل", "Show less") else tr("عرض ${count - 20} أخرى", "Show ${count - 20} more"),
                        fontWeight = FontWeight.Bold,
                        color = c.primary
                    )
                }
            }
        }
    }
}

@Composable
private fun SmallFigurePill(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    val c = LocalNsColors.current
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(c.muted)
            .padding(horizontal = 6.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = c.mutedForeground, modifier = Modifier.size(12.dp))
        Text(text = text, fontSize = 11.sp, color = c.foreground, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun DailySalesChartCard(
    points: List<DailyPoint>,
    target: Double?,
    asOf: String
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    var selectedIdx by remember { mutableIntStateOf(-1) }

    val recordedPoints = remember(points, asOf) {
        points.filter { it.day <= asOf }
    }
    val maxDaily = remember(points) {
        points.maxOfOrNull { max(0.0, it.sales) }?.coerceAtLeast(1.0) ?: 1.0
    }
    val cumulativeList = remember(points, asOf) {
        var sum = 0.0
        points.map { pt ->
            if (pt.day <= asOf) {
                sum += pt.sales
                sum
            } else null
        }
    }
    val maxCum = remember(cumulativeList, target) {
        val m = cumulativeList.filterNotNull().maxOrNull() ?: 0.0
        max(m, target ?: 0.0).coerceAtLeast(1.0)
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = c.card,
        border = BorderStroke(1.dp, c.border)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tr("المبيعات اليومية مقابل معدل الهدف", "Daily sales vs target pace"),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground
                )
                if (selectedIdx in points.indices) {
                    val pt = points[selectedIdx]
                    Text(
                        text = "${Format.shortDayLabel(pt.day, isAr)}: ${Format.compactCurrency(pt.sales, isAr)}",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.primary
                    )
                }
            }

            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(145.dp)
                ) {
                    val count = points.size.coerceAtLeast(1)
                    val slotWidth = size.width / count
                    val barWidth = (slotWidth * 0.62f).coerceAtLeast(3f)

                    // Grid lines
                    for (i in 1..3) {
                        val y = size.height * (i / 4f)
                        drawLine(
                            color = c.border,
                            start = Offset(0f, y),
                            end = Offset(size.width, y),
                            strokeWidth = 1f
                        )
                    }

                    // Daily Bars
                    points.forEachIndexed { i, pt ->
                        val v = pt.sales.coerceAtLeast(0.0)
                        val ratio = (v / maxDaily).toFloat().coerceIn(0f, 1f)
                        val h = ratio * (size.height * 0.85f)
                        val x = i * slotWidth + (slotWidth - barWidth) / 2f
                        if (h > 1f) {
                            drawRoundRect(
                                color = c.primary.copy(alpha = if (pt.day <= asOf) 0.78f else 0.2f),
                                topLeft = Offset(x, size.height - h),
                                size = Size(barWidth, h),
                                cornerRadius = CornerRadius(4f, 4f)
                            )
                        }
                    }

                    // Target Pace dashed line
                    if (target != null && target > 0 && count > 1) {
                        val endY = size.height - ((target / maxCum).toFloat().coerceIn(0f, 1f) * (size.height * 0.9f))
                        drawLine(
                            color = c.mutedForeground.copy(alpha = 0.65f),
                            start = Offset(slotWidth / 2f, size.height),
                            end = Offset(size.width - slotWidth / 2f, endY),
                            strokeWidth = 2.5f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f), 0f)
                        )
                    }

                    // Cumulative solid line
                    val cumPath = Path()
                    var startedLine = false
                    cumulativeList.forEachIndexed { i, cum ->
                        if (cum != null) {
                            val x = i * slotWidth + slotWidth / 2f
                            val y = size.height - ((cum / maxCum).toFloat().coerceIn(0f, 1f) * (size.height * 0.9f))
                            if (!startedLine) {
                                cumPath.moveTo(x, y)
                                startedLine = true
                            } else {
                                cumPath.lineTo(x, y)
                            }
                        }
                    }
                    if (startedLine) {
                        drawPath(
                            path = cumPath,
                            color = Color(0xFF2F5DB8),
                            style = Stroke(width = 4.5f)
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                LegendDot(color = c.primary, label = tr("المبيعات اليومية", "Daily sales"))
                LegendDot(color = Color(0xFF2F5DB8), label = tr("الإجمالي التراكمي", "Cumulative"))
                if (target != null && target > 0) {
                    LegendDot(color = c.mutedForeground, label = tr("معدل الهدف", "Target pace"))
                }
            }
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    val c = LocalNsColors.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(text = label, fontSize = 11.sp, color = c.mutedForeground)
    }
}

// ---------------------------------------------------------------------------
// TAB 3: COLLECTIONS
// ---------------------------------------------------------------------------
@Composable
private fun CollectionsSectionContent(
    detail: RepDetailModel,
    clock: MonthClock
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val r = detail.rep.result
    val col = detail.collections

    // Gradient Hero Card for Collections
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
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
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color.White.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Payments,
                            contentDescription = null,
                            tint = Color(0xFFFEF3C7),
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Text(
                        text = tr("المحصَّل هذا الشهر", "Collected this month"),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.92f)
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color(0xBF3B2414))
                        .padding(horizontal = 12.dp, vertical = 5.dp)
                ) {
                    LtrText(
                        text = Format.percent(r.collectionRatio),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                LtrText(
                    text = Format.number(r.collections),
                    fontSize = 34.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
                Text(
                    text = if (isAr) "ج.م" else "EGP",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(alpha = 0.8f),
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }
        }
    }

    // By Source
    NsGroupCard(title = tr("حسب المصدر", "By source")) {
        NsListRow(
            icon = Icons.Outlined.AccountBalanceWallet,
            label = tr("مدفوعات", "Customer payments"),
            value = Format.number(col.payment)
        )
        NsDivider()
        NsListRow(
            icon = Icons.Outlined.ReceiptLong,
            label = tr("شيكات محصلة", "Collected cheques"),
            value = Format.number(col.cheque)
        )
        NsDivider()
        NsListRow(
            icon = Icons.Outlined.Payments,
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

    // Customers Debt Today
    NsGroupCard(title = tr("عملائي", "My customers")) {
        NsListRow(
            icon = Icons.Outlined.Groups,
            label = tr("المستحق عليهم اليوم", "Owed by customers today"),
            sub = if (clock.closed) tr("تظهر للشهر الحالي فقط", "Shown for the open month only") else tr("إجمالي مديونية عملائك المفتوحة", "Total open receivables of your customers"),
            value = detail.rep.receivables?.let { Format.currency(it, isAr) } ?: "—"
        )
    }

    // Latest collection days
    val collectionDays = remember(detail.daily) {
        detail.daily.filter { it.collections != 0.0 }.sortedByDescending { it.day }.take(10)
    }
    if (collectionDays.isNotEmpty()) {
        NsGroupCard(title = tr("آخر أيام التحصيل", "Recent collection days")) {
            collectionDays.forEachIndexed { idx, pt ->
                if (idx > 0) NsDivider()
                NsListRow(
                    icon = Icons.Outlined.CalendarMonth,
                    label = Format.weekdayDayLabel(pt.day, isAr),
                    value = Format.currency(pt.collections, isAr),
                    tone = if (pt.collections > 0) "good" else "bad"
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// TAB 4: STATEMENT
// ---------------------------------------------------------------------------
private data class StatementBucketLine(
    val key: String,
    val label: String,
    val sub: String,
    val amount: Double,
    val rate: String,
    val commission: Double
)

@Composable
private fun StatementSectionContent(
    detail: RepDetailModel,
    settings: CommissionSettingsModel
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val r = detail.rep.result
    val rules = settings.rules
    val replaced = r.regime == "low" || (r.regime == "old" && rules.oldSystemMode != "base")
    val useOldSystemTiers = r.regime == "old" && rules.oldSystemMode == "tiers"
    val activeTiers = if (useOldSystemTiers) rules.oldSystemTiers else settings.tiers
    val activeBuckets: List<BucketResultModel> = if (useOldSystemTiers) {
        r.oldTiers
    } else {
        r.tiers.map { BucketResultModel(it.key, it.qty, it.amount, it.commission, it.rate) }
    }

    val lines = remember(activeBuckets, activeTiers, r.slowCategory, r.digitalCategory, settings, isAr) {
        val list = mutableListOf<StatementBucketLine>()
        activeBuckets.forEachIndexed { index, bucket ->
            val tier = activeTiers.getOrNull(index)
            val sub = if (tier == null || tier.to == null) {
                trLang(isAr, "سعر ${Format.number(tier?.from ?: 0.0)} فأكثر", "Price ${Format.number(tier?.from ?: 0.0)}+")
            } else {
                trLang(isAr, "سعر ${Format.number(tier.from)}–${Format.number(tier.to)}", "Price ${Format.number(tier.from)}–${Format.number(tier.to)}")
            }
            list.add(
                StatementBucketLine(
                    key = bucket.key,
                    label = trLang(isAr, "الشريحة ${bucket.key}", "Range ${bucket.key}"),
                    sub = sub,
                    amount = bucket.amount,
                    rate = Format.rate(bucket.rate),
                    commission = bucket.commission
                )
            )
        }
        listOf("slow" to r.slowCategory, "digital" to r.digitalCategory).forEach { (key, cat) ->
            val rate = if (key == "slow") settings.slowRate else settings.digitalRate
            list.add(
                StatementBucketLine(
                    key = key,
                    label = if (key == "slow") trLang(isAr, "الراكد", "Slow-moving") else trLang(isAr, "الديجيتال", "Digital"),
                    sub = trLang(isAr, "نسبة الفئة", "Category rate"),
                    amount = cat.amount,
                    rate = Format.rate(rate),
                    commission = cat.commission
                )
            )
        }
        list.filter { it.amount != 0.0 || it.commission != 0.0 }
    }

    var openBucketKey by rememberSaveable { mutableStateOf<String?>(null) }
    val canOpen = { key: String ->
        (rules.statementDetails[key] != false) && detail.products.any { it.bucket == key }
    }

    val adjustments = remember(r.adjustments) {
        r.adjustments.filter { it.key != "lowRate" && it.key != "oldRate" && it.key != "oldTiers" && it.key != "collectionShare" }
    }
    val collectionShare = remember(r.adjustments) {
        r.adjustments.find { it.key == "collectionShare" }
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = c.card,
        border = BorderStroke(1.dp, c.border)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Outlined.AutoAwesome, contentDescription = null, tint = c.primary, modifier = Modifier.size(18.dp))
                    Text(
                        text = tr("كشف العمولة", "Commission statement"),
                        fontSize = 14.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.foreground
                    )
                }
                val shortLevel = when (r.regime) {
                    "full" -> tr("النظام الكامل", "Full system")
                    "old" -> tr("النظام القديم", "Old system")
                    "low" -> tr("0.1% من المبيعات", "0.1% of sales")
                    else -> tr("بدون هدف", "No target")
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(c.successSoft)
                        .border(1.dp, c.success.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = shortLevel,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.success
                    )
                }
            }

            HorizontalDivider(color = c.border)

            // Buckets list
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                lines.forEach { line ->
                    val openable = canOpen(line.key)
                    val isOpen = openable && openBucketKey == line.key
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .then(
                                if (openable) Modifier.clickable {
                                    openBucketKey = if (isOpen) null else line.key
                                } else Modifier
                            )
                            .padding(vertical = 4.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = line.label,
                                        fontSize = 13.5.sp,
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
                                    fontSize = 11.5.sp,
                                    color = c.mutedForeground
                                )
                            }
                            LtrText(
                                text = Format.number(line.commission),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = c.foreground
                            )
                        }
                        if (isOpen) {
                            Spacer(modifier = Modifier.height(8.dp))
                            BucketProductsTable(
                                rows = detail.products.filter { it.bucket == line.key }
                            )
                        }
                    }
                }

                // Line Commission Subtotal
                val lineBase = if (useOldSystemTiers) {
                    r.adjustments.find { it.key == "oldTiers" }?.amount ?: r.base
                } else r.base

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(c.accent.copy(alpha = 0.65f))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = tr("عمولة البنود", "Line commission"),
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.foreground
                    )
                    LtrText(
                        text = Format.number(lineBase),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.foreground
                    )
                }
            }

            HorizontalDivider(color = c.border)

            // Adjustments & Collection Scaling
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (collectionShare != null) {
                    StatementAdjustmentItem(
                        item = collectionShare,
                        settings = settings,
                        replaced = false
                    )
                }
                adjustments.forEach { adj ->
                    StatementAdjustmentItem(
                        item = adj,
                        settings = settings,
                        replaced = replaced
                    )
                }
                if (replaced && !(r.regime == "old" && rules.oldSystemMode == "tiers")) {
                    val repLabel = if (r.regime == "low") {
                        tr("أقل من 50%: ${Format.number(rules.lowRate)}% من إجمالي المبيعات بدلًا مما سبق", "Below 50%: ${Format.number(rules.lowRate)}% of total sales instead")
                    } else {
                        tr("النظام القديم: ${Format.number(rules.oldRate)}% من إجمالي المبيعات", "Old system: ${Format.number(rules.oldRate)}% of total sales")
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(c.warningSoft)
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = repLabel,
                            fontSize = 12.5.sp,
                            color = c.warning,
                            modifier = Modifier.weight(1f)
                        )
                        LtrText(
                            text = Format.number(r.beforeCollection),
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.warning
                        )
                    }
                }
            }

            HorizontalDivider(color = c.border)

            // Final You Earn
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
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
        }
    }
}

@Composable
private fun BucketProductsTable(rows: List<ProductSoldRow>) {
    val c = LocalNsColors.current
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = c.muted.copy(alpha = 0.55f),
        border = BorderStroke(1.dp, c.border)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(c.muted)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tr("المنتج", "Product"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.mutedForeground,
                    modifier = Modifier.weight(1.8f)
                )
                Text(
                    text = tr("السعر بعد الخصم", "Net price"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.mutedForeground,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = tr("الكمية (م)", "Qty (m)"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.mutedForeground,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = tr("العمولة", "Commission"),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.mutedForeground,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
            }
            rows.forEach { row ->
                HorizontalDivider(color = c.border.copy(alpha = 0.6f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = buildString {
                            append(Format.plainProductName(row.productName))
                            if (!row.color.isNullOrBlank()) append(" · ${row.color}")
                        },
                        fontSize = 11.5.sp,
                        color = c.foreground,
                        modifier = Modifier.weight(1.8f)
                    )
                    LtrText(
                        text = Format.number(row.avgPrice),
                        fontSize = 11.5.sp,
                        color = c.foreground,
                        textAlign = TextAlign.End,
                        modifier = Modifier.weight(1f)
                    )
                    LtrText(
                        text = Format.number(row.qty),
                        fontSize = 11.5.sp,
                        color = c.foreground,
                        textAlign = TextAlign.End,
                        modifier = Modifier.weight(1f)
                    )
                    LtrText(
                        text = Format.number(row.commission),
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (row.commission < 0) c.destructive else c.success,
                        textAlign = TextAlign.End,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            HorizontalDivider(color = c.border)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(c.muted)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tr("الإجمالي", "Total"),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground,
                    modifier = Modifier.weight(2.8f)
                )
                LtrText(
                    text = Format.number(rows.sumOf { it.qty }),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
                LtrText(
                    text = Format.number(rows.sumOf { it.commission }),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground,
                    textAlign = TextAlign.End,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun StatementAdjustmentItem(
    item: AdjustmentModel,
    settings: CommissionSettingsModel,
    replaced: Boolean
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val rules = settings.rules
    val independent = item.key == "cash" || item.key == "collection" || item.key == "slowDeduction"
    val earned = if (item.key == "collectionShare") item.applies else item.met && item.applies && (independent || !replaced)

    val label = when (item.key) {
        "allTargets" -> tr("تحقيق كل الأهداف: +${Format.number(rules.allTargetsBonusPct)}% من عمولة البنود", "All targets met: +${Format.number(rules.allTargetsBonusPct)}% of line commission")
        "slowDeduction" -> tr("الراكد أقل من ${Format.number(rules.slowMinPct)}% من هدفه: خصم ${Format.number(rules.slowDeductionPct)}%", "Slow-moving below ${Format.number(rules.slowMinPct)}% of target: -${Format.number(rules.slowDeductionPct)}% deduction")
        "cash" -> tr("المبيعات المسددة ≥ ${Format.number(rules.cashSharePct)}% من المبيعات", "Paid invoice sales ≥ ${Format.number(rules.cashSharePct)}% of sales")
        "collection" -> tr("التحصيلات أكثر من ${Format.number(rules.collectionPct)}% من المبيعات", "Collections > ${Format.number(rules.collectionPct)}% of sales")
        "salesLadder" -> tr("حافز المبيعات الشهرية", "Monthly sales ladder bonus")
        "collectionShare" -> tr("تعديل العمولة حسب نسبة التحصيل", "Commission scaling by collection ratio")
        else -> item.key
    }

    val statusText = when {
        item.met && !item.applies && !replaced -> tr("تحقق، لكنه لا يُصرف في النظام الحالي", "Met, but not paid under current system")
        item.key == "salesLadder" -> {
            if (item.met) tr("مستحق عند مبيعات ${Format.compactCurrency(item.current, isAr)}", "Earned at sales ${Format.compactCurrency(item.current, isAr)}")
            else if (item.threshold != null) tr("الحافز التالي عند ${Format.compactCurrency(item.threshold, isAr)}", "Next bonus at ${Format.compactCurrency(item.threshold, isAr)}")
            else tr("لم يتحقق بعد", "Not met yet")
        }
        item.current == null -> tr("لا توجد بيانات بعد", "No data yet")
        else -> tr(
            "الآن ${Format.percent(item.current)} · المطلوب ${Format.percent(item.threshold)}",
            "Now ${Format.percent(item.current)} · Required ${Format.percent(item.threshold)}"
        )
    }

    val gateText = item.gate?.let { g ->
        if (g.met) {
            tr("تحقيق الهدف ${Format.percent(g.achievement)} · المطلوب ${Format.percent(g.required)} ✓", "Target achievement ${Format.percent(g.achievement)} · Required ${Format.percent(g.required)} ✓")
        } else {
            tr("يحتاج أيضًا ${Format.percent(g.required)} من الهدف · الآن ${Format.percent(g.achievement)}", "Also needs ${Format.percent(g.required)} target achievement · Now ${Format.percent(g.achievement)}")
        }
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = if (earned) {
                if (item.amount < 0) Icons.Outlined.RemoveCircleOutline else Icons.Outlined.CheckCircle
            } else Icons.Outlined.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (earned) {
                if (item.amount < 0) c.destructive else c.success
            } else c.mutedForeground,
            modifier = Modifier
                .padding(top = 2.dp)
                .size(16.dp)
        )
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = label,
                fontSize = 13.sp,
                fontWeight = if (earned) FontWeight.SemiBold else FontWeight.Normal,
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
                    color = if (item.gate.met) c.mutedForeground else c.warning
                )
            }
        }
        LtrText(
            text = if (earned) {
                (if (item.amount > 0) "+" else "") + Format.number(item.amount)
            } else "—",
            fontSize = 13.5.sp,
            fontWeight = FontWeight.Bold,
            color = if (earned) {
                if (item.amount < 0) c.destructive else c.success
            } else c.mutedForeground
        )
    }
}
