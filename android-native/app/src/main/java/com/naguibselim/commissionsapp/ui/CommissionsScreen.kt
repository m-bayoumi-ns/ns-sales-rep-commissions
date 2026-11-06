package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import com.naguibselim.commissionsapp.BuildConfig
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.data.CommissionsResponse
import com.naguibselim.commissionsapp.data.RepSummary
import com.naguibselim.commissionsapp.util.Format
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommissionsScreen(viewModel: AppViewModel) {
    val state by viewModel.commissions.collectAsStateWithLifecycle()
    val locale = LocalConfiguration.current.locales[0]
    val format = remember(locale) { Format(locale) }
    val uri = LocalUriHandler.current
    val website = "${BuildConfig.API_BASE_URL}/${langSegment()}"
    val lifecycle = LocalLifecycleOwner.current.lifecycle

    // First load, then every 5 minutes while the screen is visible (the website does the same).
    LaunchedEffect(Unit) { if (state.data == null && !state.loading) viewModel.load() }
    LaunchedEffect(lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (true) {
                delay(5 * 60 * 1000L)
                viewModel.refresh()
            }
        }
    }

    CompositionLocalProvider(LocalFormat provides format) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(stringResource(R.string.cm_title), fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            state.data?.user?.let { user ->
                                Text(user.name, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.refresh() }, enabled = !state.loading && !state.refreshing) {
                            Icon(Icons.Filled.Refresh, contentDescription = stringResource(R.string.refresh))
                        }
                        var menu by remember { mutableStateOf(false) }
                        Box {
                            IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, contentDescription = stringResource(R.string.more)) }
                            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                DropdownMenuItem(text = { Text(stringResource(R.string.open_website)) }, onClick = { menu = false; uri.openUri("$website/commissions") })
                                DropdownMenuItem(text = { Text(stringResource(R.string.my_account)) }, onClick = { menu = false; uri.openUri("$website/account") })
                                HorizontalDivider()
                                DropdownMenuItem(text = { Text(stringResource(R.string.sign_out)) }, onClick = { menu = false; viewModel.signOut() })
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
                )
            },
        ) { padding ->
            PullToRefreshBox(
                isRefreshing = state.refreshing,
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize().padding(padding),
            ) {
                val data = state.data
                when {
                    data == null && state.problem != null -> ProblemState(
                        problem = state.problem!!,
                        onRetry = { viewModel.load() },
                        onOpenWebsite = { uri.openUri("$website/account") },
                        onSignOut = { viewModel.signOut() },
                    )
                    data == null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator()
                            Spacer(Modifier.height(14.dp))
                            Text(stringResource(R.string.loading), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(stringResource(R.string.loading_hint), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 32.dp, vertical = 4.dp))
                        }
                    }
                    else -> LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 32.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        item(key = "filters") {
                            Filters(
                                data = data,
                                loading = state.loading,
                                onMonth = viewModel::selectMonth,
                                onRep = viewModel::selectRep,
                            )
                        }
                        if (state.loading) item(key = "loading") { LinearLoading() }
                        state.problem?.let { problem -> item(key = "problem") { NoticeBanner(problemText(problem), warn = true) } }
                        noticeItems(data, format)
                        when {
                            data.reps.isEmpty() -> item(key = "empty") {
                                SectionCard(stringResource(R.string.empty_title)) {
                                    Text(
                                        stringResource(if (data.user.salesRepLimited) R.string.empty_not_listed else R.string.empty_body, format.month(data.clock.month)),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                            data.detail != null -> repDetailItems(
                                data = data,
                                detail = data.detail,
                                onBackToTeam = if (data.repOptions.size > 1) ({ viewModel.selectRep(data.allReps) }) else null,
                            )
                            else -> teamItems(data, format, onOpen = { viewModel.selectRep(it.key) })
                        }
                        item(key = "updated") { UpdatedLine(data, format) }
                    }
                }
            }
        }
    }
}

@Composable
private fun LinearLoading() {
    androidx.compose.material3.LinearProgressIndicator(Modifier.fillMaxWidth())
}

@Composable
private fun ProblemState(problem: Problem, onRetry: () -> Unit, onOpenWebsite: () -> Unit, onSignOut: () -> Unit) {
    // Scrollable so pull-to-refresh also works here.
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        item {
            Column(Modifier.widthIn(max = 420.dp).padding(top = 80.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    stringResource(if (problem == Problem.Offline) R.string.offline_title else R.string.error_title),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(8.dp))
                Text(problemText(problem), color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                Spacer(Modifier.height(20.dp))
                when (problem) {
                    Problem.MustChangePassword -> Button(onClick = onOpenWebsite) { Text(stringResource(R.string.change_password)) }
                    Problem.NoAccess, Problem.Inactive -> OutlinedButton(onClick = onSignOut) { Text(stringResource(R.string.sign_out)) }
                    else -> Button(onClick = onRetry) { Text(stringResource(R.string.retry)) }
                }
                if (problem == Problem.MustChangePassword) {
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(onClick = onRetry) { Text(stringResource(R.string.retry)) }
                }
            }
        }
    }
}

@Composable
private fun Filters(data: CommissionsResponse, loading: Boolean, onMonth: (String) -> Unit, onRep: (String) -> Unit) {
    val format = LocalFormat.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            Picker(
                label = stringResource(R.string.month),
                value = format.month(data.clock.month),
                options = data.months.map { it to format.month(it) },
                enabled = !loading,
                onSelect = onMonth,
                modifier = Modifier.weight(1f),
            )
            if (data.repOptions.size > 1) {
                val all = data.allReps to stringResource(R.string.all_sellers)
                val current = data.detail?.rep?.key ?: data.allReps
                val options = listOf(all) + data.repOptions.map { it.key to it.name }
                Picker(
                    label = stringResource(R.string.seller),
                    value = options.firstOrNull { it.first == current }?.second ?: all.second,
                    options = options,
                    enabled = !loading,
                    onSelect = onRep,
                    modifier = Modifier.weight(1.3f),
                )
            }
        }
        val clock = data.clock
        val status = LocalStatus.current
        if (clock.closed) {
            Pill(stringResource(R.string.month_closed), MaterialTheme.colorScheme.onSurfaceVariant, MaterialTheme.colorScheme.surfaceVariant)
        } else {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Pill(stringResource(R.string.live), status.success, status.successSoft)
                Text(
                    stringResource(R.string.day_of, clock.elapsedDays, clock.monthDays) + " · " +
                        pluralStringResource(R.plurals.days_left, clock.remainingDays, clock.remainingDays),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun Picker(label: String, value: String, options: List<Pair<String, String>>, enabled: Boolean, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    var open by remember { mutableStateOf(false) }
    Box(modifier) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.5.dp),
            modifier = Modifier.fillMaxWidth().clickable(enabled = enabled && options.size > 1) { open = true },
        ) {
            Row(Modifier.padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }, modifier = Modifier.heightIn(max = 420.dp)) {
            options.forEach { (key, text) ->
                DropdownMenuItem(
                    text = { Text(text, fontWeight = if (text == value) FontWeight.Bold else FontWeight.Normal) },
                    onClick = { open = false; if (text != value) onSelect(key) },
                )
            }
        }
    }
}

private fun LazyListScope.noticeItems(data: CommissionsResponse, format: Format) {
    items(data.notices, key = { "notice-${it.key}" }) { notice ->
        val month = format.month(data.clock.month)
        val text = when (notice.key) {
            "noRates" -> stringResource(R.string.notice_no_rates, month)
            "inherited" -> stringResource(R.string.notice_inherited, format.month(notice.from ?: ""))
            "noSheet" -> stringResource(R.string.notice_no_sheet, month)
            "unlinked" -> stringResource(R.string.notice_unlinked, notice.names.joinToString("، "))
            else -> notice.key
        }
        NoticeBanner(text, warn = notice.tone == "warn")
    }
}

// ---------------------------------------------------------------- team summary

private fun LazyListScope.teamItems(data: CommissionsResponse, format: Format, onOpen: (RepSummary) -> Unit) {
    item(key = "kpis") {
        val totals = data.totals
        val closed = data.clock.closed
        val target = if (closed) totals.target else totals.targetToDate
        val achievement = if (target > 0) 100 * totals.sales / target else null
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.kpi_label), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(
                    label = stringResource(R.string.kpi_sales),
                    value = format.compact(totals.sales),
                    caption = if (achievement != null) stringResource(if (closed) R.string.of_target else R.string.of_target_to_date, format.pct(achievement), format.compact(target)) else stringResource(R.string.kpi_no_target),
                    modifier = Modifier.weight(1f),
                    accent = achievementColor(achievement),
                )
                StatTile(
                    label = stringResource(R.string.kpi_commission),
                    value = format.number(totals.commission),
                    caption = stringResource(if (closed) R.string.kpi_final else R.string.kpi_so_far),
                    modifier = Modifier.weight(1f),
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(
                    label = stringResource(R.string.kpi_collections),
                    value = format.compact(totals.collections),
                    caption = if (totals.sales > 0) stringResource(R.string.of_sales, format.pct(100 * totals.collections / totals.sales)) else null,
                    modifier = Modifier.weight(1f),
                )
                StatTile(
                    label = stringResource(R.string.kpi_on_track),
                    value = "${format.number(totals.onTrack.toDouble())} / ${format.number(data.reps.size.toDouble())}",
                    caption = stringResource(R.string.kpi_on_track_sub),
                    modifier = Modifier.weight(1f),
                    accent = LocalStatus.current.success,
                )
            }
            if (totals.flagged > 0) {
                StatTile(
                    label = stringResource(R.string.kpi_flagged),
                    value = format.number(totals.flagged.toDouble()),
                    caption = stringResource(R.string.kpi_flagged_sub, format.money(data.settings.rules.minimumSales)),
                    modifier = Modifier.fillMaxWidth(),
                    accent = LocalStatus.current.danger,
                )
            }
            Spacer(Modifier.height(4.dp))
            Text(stringResource(R.string.board_title), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(stringResource(R.string.board_description), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
    items(data.reps, key = { "rep-${it.key}" }) { rep -> RepCard(rep, data.clock.closed, format, onClick = { onOpen(rep) }) }
}

@Composable
private fun RepCard(rep: RepSummary, closed: Boolean, format: Format, onClick: () -> Unit) {
    val r = rep.result
    val status = LocalStatus.current
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.5.dp),
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Column(Modifier.weight(1f)) {
                    Text(rep.name, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    if (rep.odooUserId == null) {
                        Text(stringResource(R.string.not_linked), style = MaterialTheme.typography.bodySmall, color = status.warning)
                    }
                }
                Spacer(Modifier.width(8.dp))
                Text(format.pct(r.achievement), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = achievementColor(r.achievement))
            }
            ProgressBar(r.achievement, projected = if (closed) null else rep.projectedAchievement)
            val targetNow = if (closed) r.totalTarget else r.totalTargetToDate
            Text(
                "${stringResource(R.string.sales)}: ${format.money(r.sales)} " +
                    if (targetNow != null) stringResource(if (closed) R.string.of_amount else R.string.of_amount_to_date, format.money(targetNow)) else "· " + stringResource(R.string.no_target),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(stringResource(if (closed) R.string.commission else R.string.commission_so_far), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(format.money(r.total), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                RegimePill(r.regime)
            }
            r.collectionRatio?.let {
                Text(stringResource(R.string.collected_pct, format.pct(it)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            rep.perDayToTarget?.let {
                Text(stringResource(R.string.per_day_needed, format.money(it)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (r.belowMinimum) Pill(stringResource(R.string.flag_below_minimum), status.danger, status.dangerSoft)
            else if (rep.minimumRisk) Pill(stringResource(R.string.flag_minimum_risk), status.warning, status.warningSoft)
        }
    }
}

@Composable
private fun UpdatedLine(data: CommissionsResponse, format: Format) {
    val time = runCatching {
        Instant.parse(data.fetchedAt).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm", if (format.isArabic) java.util.Locale("ar", "EG") else java.util.Locale.US))
    }.getOrDefault("")
    Text(
        stringResource(R.string.updated_at, time),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
    )
    Spacer(Modifier.size(1.dp))
}
