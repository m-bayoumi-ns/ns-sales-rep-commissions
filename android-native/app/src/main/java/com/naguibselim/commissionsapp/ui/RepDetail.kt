package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.data.Adjustment
import com.naguibselim.commissionsapp.data.CommissionsResponse
import com.naguibselim.commissionsapp.data.RepDetail
import com.naguibselim.commissionsapp.data.Rules
import com.naguibselim.commissionsapp.data.TargetBucket
import kotlin.math.max
import kotlin.math.ceil

/** The seller's commission statement: the same sections as the website's rep page. */
enum class RepSection { Summary, Sales, Collections, Statement }

fun LazyListScope.repDetailItems(
    data: CommissionsResponse,
    detail: RepDetail,
    section: RepSection,
    onBackToTeam: (() -> Unit)?,
) {
    val key = detail.rep.key
    if (onBackToTeam != null) {
        item(key = "back-$key") {
            TextButton(onClick = onBackToTeam) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(stringResource(R.string.back_to_team))
            }
        }
    }
    if (section == RepSection.Summary) {
        item(key = "header-$key") { HeaderCard(data, detail, section) }
    }
    when (section) {
        RepSection.Summary -> {
            item(key = "targets-$key") { TargetsCard(data, detail) }
            item(key = "opportunities-$key") { OpportunitiesCard(data, detail) }
        }
        RepSection.Sales -> {
            item(key = "chart-$key") { ChartCard(data, detail) }
            item(key = "tiers-$key") { TiersCard(data, detail) }
            item(key = "products-$key") { ProductsCard(detail) }
            item(key = "invoices-$key") { InvoicesCard(detail) }
            item(key = "customers-$key") { CustomersCard(detail) }
        }
        RepSection.Collections -> item(key = "collections-$key") { CollectionsCard(data, detail) }
        RepSection.Statement -> item(key = "build-$key") { BuildCard(data, detail) }
    }
}

// ---------------------------------------------------------------- header

@Composable
private fun HeaderCard(data: CommissionsResponse, detail: RepDetail, section: RepSection) {
    val f = LocalFormat.current
    val rep = detail.rep
    val r = rep.result
    val rules = data.settings.rules
    val closed = data.clock.closed
    val white = Color.White
    val period = if (closed) stringResource(R.string.month_closed_short) else stringResource(R.string.day_of, data.clock.elapsedDays, data.clock.monthDays)
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF5A3A1D), Color(0xFF2E1D0F))))
            .padding(horizontal = 20.dp, vertical = 22.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            val initials = rep.name.split(Regex("\\s+")).filter(String::isNotBlank).take(2).joinToString("") { it.take(1) }
            Box(
                Modifier.size(44.dp).clip(CircleShape).background(white.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(initials, color = white, fontWeight = FontWeight.Bold)
            }
            Column(Modifier.weight(1f)) {
                Text(rep.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = white, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    "${f.month(data.clock.month)} · $period",
                    style = MaterialTheme.typography.bodySmall,
                    color = white.copy(alpha = 0.72f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Pill(regimeLabel(r.regime), white, white.copy(alpha = 0.16f))
        }

        Column(Modifier.fillMaxWidth().padding(top = 22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(stringResource(if (closed) R.string.commission_final else R.string.commission_now), style = MaterialTheme.typography.bodyMedium, color = white.copy(alpha = 0.75f))
            Text(f.money(r.total), style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.ExtraBold, color = white, maxLines = 1)
            if (section == RepSection.Summary && !closed) {
                Text(stringResource(R.string.updates_live), style = MaterialTheme.typography.bodySmall, color = white.copy(alpha = 0.7f))
            }
        }

        if (r.achievement != null) {
            val achievement = r.achievement.coerceAtLeast(0.0)
            val projected = if (closed) achievement else (rep.projectedAchievement ?: achievement).coerceAtLeast(achievement)
            Box(
                Modifier.fillMaxWidth().padding(top = 20.dp).height(9.dp).clip(RoundedCornerShape(50)).background(white.copy(alpha = 0.16f)),
            ) {
                if (projected > achievement) {
                    Box(Modifier.fillMaxWidth((projected / 100).coerceIn(0.0, 1.0).toFloat()).height(9.dp).background(white.copy(alpha = 0.24f)))
                }
                Box(
                    Modifier
                        .fillMaxWidth((achievement / 100).coerceIn(0.0, 1.0).toFloat())
                        .height(9.dp)
                        .background(Brush.horizontalGradient(listOf(Color(0xFFFCD34D), Color(0xFF6FD39A)))),
                )
            }
        }

        Row(
            Modifier.fillMaxWidth().padding(top = 18.dp).clip(RoundedCornerShape(18.dp)).background(white.copy(alpha = 0.1f)).padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            HeroStat(stringResource(R.string.sales), f.compactMoney(r.sales), Modifier.weight(1f))
            HeroStat(stringResource(if (closed) R.string.total_target else R.string.target_to_date), r.totalTargetToDate?.let(f::compactMoney) ?: "—", Modifier.weight(1f))
            HeroStat(stringResource(R.string.achieved), f.pct(r.achievement), Modifier.weight(1f))
        }

        val low = f.number(rules.lowAchievementPct)
        val old = f.number(rules.oldSystemUntilPct)
        Text(
            when (r.regime) {
                "full" -> stringResource(R.string.regime_help_full, old)
                "old" -> stringResource(R.string.regime_help_old, low, old)
                "low" -> stringResource(R.string.regime_help_low, low, f.rate(rules.lowRate))
                else -> stringResource(R.string.regime_help_no_target)
            },
            Modifier.padding(top = 14.dp),
            style = MaterialTheme.typography.bodySmall,
            color = white.copy(alpha = 0.78f),
        )
        if (section == RepSection.Summary && (r.belowMinimum || rep.minimumRisk)) {
            Spacer(Modifier.height(10.dp))
            NoticeBanner(
                text = if (r.belowMinimum) stringResource(R.string.flag_below_long, f.money(r.sales), f.money(rules.minimumSales))
                else stringResource(R.string.flag_risk_long, f.money(rep.projectedSales), f.money(rules.minimumSales)),
                warn = true,
            )
        }
    }
}

@Composable
private fun HeroStat(label: String, value: String, modifier: Modifier = Modifier) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.68f), maxLines = 1)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1)
    }
}

// ---------------------------------------------------------------- targets

@Composable
private fun TargetsCard(data: CommissionsResponse, detail: RepDetail) {
    val f = LocalFormat.current
    val rep = detail.rep
    val r = rep.result
    val closed = data.clock.closed
    SectionCard(stringResource(R.string.targets_title), stringResource(if (closed) R.string.targets_closed else R.string.targets_description)) {
        if (r.totalTarget == null) {
            Text(stringResource(R.string.no_total_target), color = MaterialTheme.colorScheme.onSurfaceVariant)
            LabelValue(stringResource(R.string.sales), f.money(r.sales), bold = true)
        } else {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(stringResource(R.string.total_target), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Text(f.pct(r.achievement), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = achievementColor(r.achievement))
            }
            Spacer(Modifier.height(6.dp))
            ProgressBar(r.achievement, projected = if (closed) null else rep.projectedAchievement, height = 12)
            Spacer(Modifier.height(8.dp))
            LabelValue(stringResource(R.string.sales), f.money(r.sales), bold = true)
            LabelValue(stringResource(R.string.total_target), f.money(r.totalTarget))
            if (!closed) r.totalTargetToDate?.let { LabelValue(stringResource(R.string.target_to_date), f.money(it)) }
            if (!closed) LabelValue(stringResource(R.string.projected), "${f.money(rep.projectedSales)} · ${f.pct(rep.projectedAchievement)}")
            val left = r.totalTarget - r.sales
            if (left > 0) LabelValue(stringResource(R.string.left_to_target), f.money(left))
            else LabelValue(stringResource(R.string.left_to_target), stringResource(R.string.target_reached), valueColor = LocalStatus.current.success)
            rep.perDayToTarget?.let { LabelValue(stringResource(R.string.per_day), f.money(it)) }
            if (!closed) LabelValue(stringResource(R.string.days_remaining), pluralStringResource(R.plurals.days_left, data.clock.remainingDays, data.clock.remainingDays))
        }
        val extra = mutableListOf<Pair<String, TargetBucket>>()
        val slow = r.categories["slow"]
        if (slow != null && slow.target != null) extra.add(stringResource(R.string.cat_slow) to slow)
        val digital = r.categories["digital"]
        if (digital != null && digital.target != null) extra.add(stringResource(R.string.cat_digital) to digital)
        for (bucket in r.tiers) {
            if (bucket.target != null) extra.add(stringResource(R.string.range_name, bucket.key) to bucket)
        }
        if (extra.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(Modifier.height(10.dp))
            for ((name, bucket) in extra) SubTarget(name, bucket, closed)
        }
    }
}

@Composable
private fun SubTarget(name: String, bucket: TargetBucket, closed: Boolean) {
    val f = LocalFormat.current
    val unit = if (bucket.unit == "qty") " " + stringResource(R.string.unit_m) else ""
    val show = { v: Double -> if (bucket.unit == "qty") f.qty(v) + unit else f.money(v) }
    Column(Modifier.padding(vertical = 6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Text(f.pct(bucket.achievement), fontWeight = FontWeight.Bold, color = achievementColor(bucket.achievement))
        }
        Spacer(Modifier.height(4.dp))
        ProgressBar(bucket.achievement, height = 8)
        Spacer(Modifier.height(2.dp))
        val target = (if (closed) bucket.target else bucket.targetToDate) ?: 0.0
        Text("${show(bucket.achieved)} / ${show(target)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        val remaining = target - bucket.achieved
        Text(
            if (remaining > 0) stringResource(R.string.target_remaining, show(ceil(remaining)))
            else stringResource(R.string.target_reached),
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            color = if (remaining > 0) MaterialTheme.colorScheme.onSurfaceVariant else LocalStatus.current.success,
        )
    }
}

private data class EarningsOpportunity(val reward: String?, val instruction: String, val condition: Boolean = false)

@Composable
private fun OpportunitiesCard(data: CommissionsResponse, detail: RepDetail) {
    val f = LocalFormat.current
    val r = detail.rep.result
    val rules = data.settings.rules
    val status = LocalStatus.current
    val opportunities = mutableListOf<EarningsOpportunity>()
    val target = r.totalTargetToDate
    if (target != null) {
        if (r.regime == "low") {
            val gap = max(0.0, target * rules.lowAchievementPct / 100 - r.sales)
            opportunities.add(EarningsOpportunity(null, stringResource(R.string.earn_to_old, f.money(ceil(gap)), f.number(rules.lowAchievementPct)), condition = true))
        }
        if (r.regime == "low" || r.regime == "old") {
            val gap = max(0.0, target * rules.oldSystemUntilPct / 100 - r.sales)
            opportunities.add(EarningsOpportunity(null, stringResource(R.string.earn_to_full, f.money(ceil(gap)), f.number(rules.oldSystemUntilPct)), condition = true))
        }
        if (!r.allTargetsMet) {
            opportunities.add(EarningsOpportunity(null, stringResource(R.string.earn_all_targets, f.number(rules.allTargetsBonusPct)), condition = true))
        }
    }

    val slow = r.categories["slow"]
    if (slow?.targetToDate != null && slow.achievement != null && slow.achievement < rules.slowMinPct) {
        val gap = max(0.0, slow.targetToDate * rules.slowMinPct / 100 - slow.achieved)
        val gapText = if (slow.unit == "qty") "${f.qty(ceil(gap))} ${stringResource(R.string.unit_m)}" else f.money(ceil(gap))
        val deduction = r.adjustments.firstOrNull { it.key == "slowDeduction" }?.amount ?: 0.0
        opportunities.add(
            EarningsOpportunity(
                reward = deduction.takeIf { it < 0 }?.let { f.money(kotlin.math.abs(it)) },
                instruction = stringResource(R.string.earn_slow_recovery, gapText, f.number(rules.slowMinPct)),
            )
        )
    }

    if (r.sales > 0 && r.collectionFactor < 100) {
        val adjustment = r.adjustments.firstOrNull { it.key == "collectionShare" }
        if (adjustment != null && adjustment.amount < 0) {
            opportunities.add(
                EarningsOpportunity(
                    reward = f.money(kotlin.math.abs(adjustment.amount)),
                    instruction = stringResource(R.string.earn_collection_recovery, f.money(ceil(max(0.0, r.sales - r.collections)))),
                ),
            )
        }
    }

    if ((r.cashShare ?: 0.0) < rules.cashSharePct) {
        opportunities.add(
            EarningsOpportunity(
                reward = f.money(rules.cashBonus),
                instruction = stringResource(R.string.earn_cash, f.pct(r.cashShare), f.number(rules.cashSharePct)),
            ),
        )
    }
    val collectionNeed = r.sales * rules.collectionPct / 100 - r.collections
    if (r.sales > 0 && collectionNeed >= 0) {
        opportunities.add(
            EarningsOpportunity(
                reward = f.money(rules.collectionBonus),
                instruction = stringResource(R.string.earn_collections, f.money(ceil(collectionNeed + 1))),
            ),
        )
    }

    val nextStep = r.adjustments.firstOrNull { it.key == "salesLadder" }?.threshold
    if (nextStep != null && nextStep > r.sales) {
        val bonus = rules.salesBonuses.filter { it.from == nextStep }.maxOfOrNull { it.amount } ?: 0.0
        opportunities.add(
            EarningsOpportunity(
                reward = bonus.takeIf { it > 0 }?.let { f.money(it) },
                instruction = stringResource(R.string.earn_ladder, f.money(ceil(nextStep - r.sales)), f.money(nextStep)),
            ),
        )
    }

    SectionCard(stringResource(R.string.earn_more_title), stringResource(R.string.earn_more_description)) {
        if (opportunities.isEmpty()) {
            Text(stringResource(R.string.earn_more_none), color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            opportunities.forEachIndexed { index, opportunity ->
                if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Column(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (opportunity.condition) status.warningSoft else MaterialTheme.colorScheme.surface)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    opportunity.reward?.let {
                        Text(it, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = status.success)
                    }
                    Text(
                        opportunity.instruction,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = if (opportunity.condition) FontWeight.SemiBold else FontWeight.Normal,
                        color = if (opportunity.condition) status.warning else MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------- how the commission is built

@Composable
private fun BuildCard(data: CommissionsResponse, detail: RepDetail) {
    val f = LocalFormat.current
    val r = detail.rep.result
    val rules = data.settings.rules
    val status = LocalStatus.current
    SectionCard(stringResource(R.string.build_title), stringResource(R.string.build_description)) {
        BuildRow(stringResource(R.string.build_base), null, f.money(r.base), MaterialTheme.colorScheme.onSurface, struck = r.regime == "low" || (r.regime == "old" && rules.oldSystemMode == "rate"))
        if (r.regime == "old" && rules.oldSystemMode != "rate") {
            Text(
                stringResource(R.string.build_old_note, f.number(rules.lowAchievementPct), f.number(rules.oldSystemUntilPct)),
                style = MaterialTheme.typography.bodySmall,
                color = status.warning,
                modifier = Modifier.padding(vertical = 4.dp),
            )
        }
        r.adjustments.forEach { adj ->
            val (sub, color) = adjustmentStatus(adj, rules)
            val amount = when {
                adj.amount != 0.0 -> (if (adj.amount > 0 && adj.key != "lowRate" && adj.key != "oldRate") "+" else "") + f.money(adj.amount)
                else -> "—"
            }
            val amountColor = when {
                adj.amount > 0 -> status.success
                adj.amount < 0 -> status.danger
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            BuildRow(adjustmentLabel(adj, rules), sub, amount, amountColor, subColor = color)
        }
        HorizontalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
        Row(Modifier.fillMaxWidth().padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.build_total), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text(f.money(r.total), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun BuildRow(label: String, sub: String?, amount: String, amountColor: Color, struck: Boolean = false, subColor: Color? = null) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
            if (sub != null) Text(sub, style = MaterialTheme.typography.bodySmall, color = subColor ?: MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.width(10.dp))
        Text(
            amount,
            style = MaterialTheme.typography.bodyMedium.copy(textDecoration = if (struck) androidx.compose.ui.text.style.TextDecoration.LineThrough else null),
            fontWeight = FontWeight.SemiBold,
            color = if (struck) MaterialTheme.colorScheme.onSurfaceVariant else amountColor,
        )
    }
}

@Composable
private fun adjustmentLabel(adj: Adjustment, rules: Rules): String {
    val f = LocalFormat.current
    return when (adj.key) {
        "allTargets" -> stringResource(R.string.build_all_targets, f.number(rules.allTargetsBonusPct))
        "slowDeduction" -> stringResource(R.string.build_slow_deduction, f.number(rules.slowMinPct), f.number(rules.slowDeductionPct))
        "cash" -> stringResource(R.string.build_cash, f.number(rules.cashSharePct))
        "collection" -> stringResource(R.string.build_collection, f.number(rules.collectionPct))
        "salesLadder" -> stringResource(R.string.build_sales_ladder)
        "lowRate" -> stringResource(R.string.build_low_rate, f.rate(rules.lowRate))
        "oldRate" -> stringResource(R.string.build_old_rate, f.rate(rules.oldRate))
        "collectionShare" -> stringResource(R.string.build_collection_share)
        else -> adj.key
    }
}

/** The line under an adjustment: where the rep stands, and its colour. */
@Composable
private fun adjustmentStatus(adj: Adjustment, rules: Rules): Pair<String?, Color?> {
    val f = LocalFormat.current
    val status = LocalStatus.current
    if (adj.key == "lowRate" || adj.key == "oldRate") return null to null
    val money = adj.key == "salesLadder"
    val show = { v: Double? -> if (v == null) "—" else if (money) f.money(v) else f.pct(v) }
    if (adj.key == "collectionShare") {
        return stringResource(R.string.build_collection_rate, f.pct(adj.current)) to null
    }
    val gate = adj.gate
    return when {
        adj.met && adj.applies -> {
            val gateText = if (gate != null && gate.required > 0) " · " + stringResource(R.string.build_gate_met, f.pct(gate.achievement), f.pct(gate.required)) else ""
            val base = if (adj.key == "salesLadder" && adj.threshold != null) stringResource(R.string.build_ladder_next, f.money(adj.threshold)) else stringResource(R.string.build_met)
            (base + gateText) to status.success
        }
        adj.met -> stringResource(R.string.build_not_under_system) to status.warning
        adj.current == null -> stringResource(R.string.build_no_data) to null
        gate != null && !gate.met && (adj.key == "cash" && (adj.current ?: 0.0) >= (adj.threshold ?: 0.0) || adj.key == "collection" && (adj.current ?: 0.0) > (adj.threshold ?: 0.0)) ->
            stringResource(R.string.build_gate_needed, f.pct(gate.required), f.pct(gate.achievement)) to status.warning
        adj.threshold == null -> stringResource(R.string.build_not_met) to null
        else -> stringResource(R.string.build_standing, show(adj.current), show(adj.threshold)) to null
    }
}

// ---------------------------------------------------------------- daily chart

@Composable
private fun ChartCard(data: CommissionsResponse, detail: RepDetail) {
    val f = LocalFormat.current
    val r = detail.rep.result
    val days = detail.daily
    if (days.isEmpty()) return
    val recorded = if (data.clock.closed) days.size else data.clock.elapsedDays.coerceIn(0, days.size)
    val cumulative = days.take(recorded).runningFold(0.0) { acc, d -> acc + d.sales }.drop(1)
    val target = r.totalTarget
    val barColor = MaterialTheme.colorScheme.secondary
    val lineColor = MaterialTheme.colorScheme.primary
    val paceColor = MaterialTheme.colorScheme.onSurfaceVariant
    val gridColor = MaterialTheme.colorScheme.outlineVariant
    SectionCard(stringResource(R.string.chart_title)) {
        val maxBar = max(1.0, days.maxOf { it.sales })
        val maxLine = max(1.0, max(cumulative.maxOrNull() ?: 0.0, target ?: 0.0))
        // The chart reads left to right in both languages, like the website.
        Canvas(Modifier.fillMaxWidth().height(180.dp)) {
            val n = days.size
            val slot = size.width / n
            val barWidth = slot * 0.62f
            for (i in 1..3) {
                val y = size.height * i / 4f
                drawLine(gridColor, Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
            }
            days.forEachIndexed { index, day ->
                if (index >= recorded || day.sales <= 0) return@forEachIndexed
                val h = (day.sales / maxBar * size.height * 0.95).toFloat()
                drawRoundRect(
                    color = barColor.copy(alpha = 0.75f),
                    topLeft = Offset(index * slot + (slot - barWidth) / 2, size.height - h),
                    size = Size(barWidth, h),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(3f, 3f),
                )
            }
            if (target != null) {
                drawLine(
                    paceColor,
                    Offset(0f, size.height),
                    Offset(size.width, (size.height - target / maxLine * size.height * 0.95).toFloat()),
                    strokeWidth = 3f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 10f)),
                )
            }
            if (cumulative.isNotEmpty()) {
                val path = Path()
                path.moveTo(0f, size.height)
                cumulative.forEachIndexed { index, value ->
                    path.lineTo((index + 1) * slot, (size.height - value / maxLine * size.height * 0.95).toFloat())
                }
                drawPath(path, lineColor, style = Stroke(width = 5f))
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(f.dayOfMonth(days.first().day), style = MaterialTheme.typography.labelSmall, color = paceColor)
            Text(f.dayOfMonth(days[days.size / 2].day), style = MaterialTheme.typography.labelSmall, color = paceColor)
            Text(f.dayOfMonth(days.last().day), style = MaterialTheme.typography.labelSmall, color = paceColor)
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Legend(barColor, stringResource(R.string.chart_sales))
            Legend(lineColor, stringResource(R.string.chart_cumulative))
            if (target != null) Legend(paceColor, stringResource(R.string.chart_pace))
        }
        val best = days.take(recorded).maxByOrNull { it.sales }
        if (best != null && best.sales > 0) {
            Spacer(Modifier.height(6.dp))
            Text(stringResource(R.string.chart_best_day, f.day(best.day), f.money(best.sales)), style = MaterialTheme.typography.bodySmall, color = paceColor)
        }
    }
}

@Composable
private fun Legend(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(10.dp).clip(CircleShape).background(color))
        Spacer(Modifier.width(5.dp))
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ---------------------------------------------------------------- price ranges and categories

@Composable
private fun TiersCard(data: CommissionsResponse, detail: RepDetail) {
    val f = LocalFormat.current
    val r = detail.rep.result
    val tiers = data.settings.tiers
    SectionCard(stringResource(R.string.tiers_title), stringResource(R.string.tiers_description)) {
        TierHeader()
        r.tiers.forEachIndexed { index, bucket ->
            val tier = tiers.getOrNull(index)
            val range = when {
                tier == null -> null
                tier.to == null -> stringResource(R.string.tiers_from, f.number(tier.from))
                else -> stringResource(R.string.tiers_between, f.number(tier.from), f.number(tier.to))
            }
            TierRow(stringResource(R.string.range_name, bucket.key), range, bucket.amount, bucket.rate, bucket.commission, r.sales)
        }
        r.categories["slow"]?.let { TierRow(stringResource(R.string.cat_slow), stringResource(R.string.tiers_category_rate), it.amount, data.settings.categoryRates.slow, it.commission, r.sales) }
        r.categories["digital"]?.let { TierRow(stringResource(R.string.cat_digital), stringResource(R.string.tiers_category_rate), it.amount, data.settings.categoryRates.digital, it.commission, r.sales) }
        if (r.unpriced.amount != 0.0) TierRow(stringResource(R.string.tiers_none), stringResource(R.string.tiers_none_sub), r.unpriced.amount, null, 0.0, r.sales)
        HorizontalDivider(thickness = 2.dp, color = MaterialTheme.colorScheme.outline)
        Row(Modifier.fillMaxWidth().padding(top = 8.dp)) {
            Text(stringResource(R.string.tiers_total), fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.4f))
            Text(f.compact(r.sales), fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Spacer(Modifier.weight(0.7f))
            Text(f.number(r.base), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun TierHeader() {
    Row(Modifier.fillMaxWidth().padding(bottom = 4.dp)) {
        val style = MaterialTheme.typography.labelSmall
        val color = MaterialTheme.colorScheme.onSurfaceVariant
        Text(stringResource(R.string.tiers_bucket), style = style, color = color, modifier = Modifier.weight(1.4f))
        Text(stringResource(R.string.tiers_sales), style = style, color = color, modifier = Modifier.weight(1f))
        Text(stringResource(R.string.tiers_rate), style = style, color = color, modifier = Modifier.weight(0.7f))
        Text(stringResource(R.string.tiers_commission), style = style, color = color, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun TierRow(name: String, sub: String?, amount: Double, rate: Double?, commission: Double, total: Double) {
    val f = LocalFormat.current
    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1.4f)) {
            Text(name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            if (sub != null) Text(sub, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Column(Modifier.weight(1f)) {
            Text(f.compact(amount), style = MaterialTheme.typography.bodyMedium)
            if (total > 0) Text(f.pct(100 * amount / total), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(f.rate(rate), style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(0.7f))
        Text(f.number(commission), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
    }
}

// ---------------------------------------------------------------- collections

@Composable
private fun CollectionsCard(data: CommissionsResponse, detail: RepDetail) {
    val f = LocalFormat.current
    val r = detail.rep.result
    val c = detail.collections
    SectionCard(stringResource(R.string.collections_title), stringResource(R.string.collections_description)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatTile(
                stringResource(R.string.collections_total),
                f.compact(r.collections),
                r.collectionRatio?.let { stringResource(R.string.of_sales, f.pct(it)) },
                modifier = Modifier.weight(1f),
            )
            StatTile(
                stringResource(R.string.receivables),
                detail.rep.receivables?.let { f.compact(it) } ?: "—",
                stringResource(if (data.clock.closed) R.string.receivables_closed else R.string.receivables_sub),
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(8.dp))
        LabelValue(stringResource(R.string.coll_payment), f.money(c.payment))
        LabelValue(stringResource(R.string.coll_cheque), f.money(c.cheque))
        LabelValue(stringResource(R.string.coll_manual), f.money(c.manual))
        LabelValue(stringResource(R.string.coll_refund), f.money(c.refund), valueColor = if (c.refund != 0.0) LocalStatus.current.danger else null)
        val collectionDays = detail.daily.filter { it.collections != 0.0 }.asReversed().take(10)
        if (collectionDays.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Text(
                stringResource(R.string.latest_collection_days),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(top = 10.dp),
            )
            collectionDays.forEach { day ->
                LabelValue(f.day(day.day), f.money(day.collections))
            }
        }
    }
}

// ---------------------------------------------------------------- products

@Composable
private fun ProductsCard(detail: RepDetail) {
    val f = LocalFormat.current
    var query by rememberSaveable(detail.rep.key) { mutableStateOf("") }
    var shown by rememberSaveable(detail.rep.key) { mutableIntStateOf(PAGE) }
    val filtered = remember(detail.products, query) {
        val q = query.trim().lowercase()
        if (q.isEmpty()) detail.products
        else detail.products.filter { p -> listOfNotNull(p.productName, p.code, p.color).any { it.lowercase().contains(q) } }
    }
    SectionCard(stringResource(R.string.products_title), stringResource(R.string.products_description)) {
        if (detail.products.isEmpty()) {
            Text(stringResource(R.string.products_none), color = MaterialTheme.colorScheme.onSurfaceVariant)
            return@SectionCard
        }
        OutlinedTextField(
            value = query,
            onValueChange = { query = it; shown = PAGE },
            placeholder = { Text(stringResource(R.string.products_search)) },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(6.dp))
        filtered.take(shown).forEach { p ->
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(p.productName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    val meta = listOfNotNull(p.code, p.color, bucketLabel(p.bucket)).joinToString(" · ")
                    Text(meta, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(
                        "${f.qty(p.qty)}${p.uom?.let { " $it" } ?: ""} × ${p.avgPrice?.let { f.number(it) } ?: "—"} · ${f.rate(p.rate)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(Modifier.width(8.dp))
                Column(horizontalAlignment = Alignment.End) {
                    Text(f.number(p.amount), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                    Text(f.number(p.commission), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        MoreLess(total = filtered.size, shown = shown, onChange = { shown = it })
    }
}

@Composable
private fun bucketLabel(bucket: String): String = when (bucket) {
    "slow" -> stringResource(R.string.cat_slow)
    "digital" -> stringResource(R.string.cat_digital)
    "none" -> stringResource(R.string.tiers_none)
    else -> stringResource(R.string.range_name, bucket)
}

@Composable
private fun MoreLess(total: Int, shown: Int, onChange: (Int) -> Unit) {
    if (total <= PAGE) return
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
        if (shown < total) {
            TextButton(onClick = { onChange(shown + PAGE) }) { Text(stringResource(R.string.show_more, minOf(PAGE, total - shown))) }
        }
        if (shown > PAGE) {
            TextButton(onClick = { onChange(PAGE) }) { Text(stringResource(R.string.show_less)) }
        }
    }
}

// ---------------------------------------------------------------- invoices and customers

@Composable
private fun InvoicesCard(detail: RepDetail) {
    val f = LocalFormat.current
    var shown by rememberSaveable(detail.rep.key) { mutableIntStateOf(PAGE) }
    if (detail.invoiceRows.isEmpty()) return
    val status = LocalStatus.current
    SectionCard(stringResource(R.string.invoices_title), stringResource(R.string.invoices_description)) {
        detail.invoiceRows.take(shown).forEach { inv ->
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(inv.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                        if (inv.refund) {
                            Spacer(Modifier.width(6.dp))
                            Pill(stringResource(R.string.credit_note), status.danger, status.dangerSoft)
                        }
                    }
                    Text("${f.day(inv.day)} · ${inv.customer}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Spacer(Modifier.width(8.dp))
                Column(horizontalAlignment = Alignment.End) {
                    Text(f.number(inv.amount), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = if (inv.amount < 0) status.danger else MaterialTheme.colorScheme.onSurface)
                    Text(f.number(inv.commission), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        MoreLess(total = detail.invoiceRows.size, shown = shown, onChange = { shown = it })
    }
}

@Composable
private fun CustomersCard(detail: RepDetail) {
    val f = LocalFormat.current
    var shown by rememberSaveable(detail.rep.key) { mutableIntStateOf(PAGE) }
    SectionCard(stringResource(R.string.customers_title), stringResource(R.string.customers_note)) {
        if (detail.customerRows.isEmpty()) {
            Text(stringResource(R.string.customers_none), color = MaterialTheme.colorScheme.onSurfaceVariant)
            return@SectionCard
        }
        detail.customerRows.take(shown).forEach { c ->
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(c.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Text(pluralStringResource(R.plurals.invoices, c.invoices, c.invoices), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Spacer(Modifier.width(8.dp))
                Column(horizontalAlignment = Alignment.End) {
                    Text(f.number(c.amount), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                    Text(f.number(c.commission), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        MoreLess(total = detail.customerRows.size, shown = shown, onChange = { shown = it })
    }
}

private const val PAGE = 15
