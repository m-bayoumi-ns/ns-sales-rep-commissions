package com.naguibselim.commissionsapp.ui

import android.Manifest
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.ShoppingCart
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
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
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
import com.naguibselim.commissionsapp.notify.Notifier
import com.naguibselim.commissionsapp.util.Format
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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
    val context = LocalContext.current
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    var adminPage by rememberSaveable { mutableStateOf<AdminPage?>(null) }
    var detailSection by rememberSaveable(state.data?.detail?.rep?.key) { mutableStateOf(RepSection.Summary) }
    val selectedDetail = state.data?.detail
    val canReturnToTeam = (state.data?.repOptions?.size ?: 0) > 1

    BackHandler(enabled = adminPage == null && selectedDetail != null && (detailSection != RepSection.Summary || canReturnToTeam)) {
        if (detailSection != RepSection.Summary) detailSection = RepSection.Summary
        else viewModel.selectRep(state.data?.allReps ?: "all")
    }

    // Notifications: ask once on Android 13+, then show a banner while they are off.
    var notificationsOn by remember { mutableStateOf(Notifier.canNotify(context)) }
    val askPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        notificationsOn = Notifier.canNotify(context)
    }
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !Notifier.canNotify(context)) {
            askPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
    val openNotificationSettings = {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.fromParts("package", context.packageName, null))
        }
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // First load, then every 5 minutes while the screen is visible (the website does the same).
    LaunchedEffect(Unit) { if (state.data == null && !state.loading) viewModel.load() }
    LaunchedEffect(lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            // Back from the system settings: pick up the new state.
            notificationsOn = Notifier.canNotify(context)
            while (true) {
                delay(5 * 60 * 1000L)
                viewModel.refresh()
            }
        }
    }

    if (adminPage != null) {
        AdminScreens(viewModel, adminPage!!, state.data?.clock?.month) { adminPage = null }
        return
    }

    CompositionLocalProvider(LocalFormat provides format) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            bottomBar = {
                if (selectedDetail != null) {
                    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                        NavigationBarItem(
                            selected = false,
                            onClick = { uri.openUri("$website/account") },
                            icon = { Icon(Icons.Filled.Person, contentDescription = null) },
                            label = { Text(stringResource(R.string.my_account), maxLines = 1) },
                            alwaysShowLabel = true,
                        )
                        listOf(
                            RepSection.Sales to R.string.tab_sales,
                            RepSection.Summary to R.string.tab_summary,
                            RepSection.Collections to R.string.tab_collections,
                            RepSection.Statement to R.string.tab_statement,
                        ).forEach { (section, label) ->
                            val icon = when (section) {
                                RepSection.Sales -> Icons.Filled.ShoppingCart
                                RepSection.Summary -> Icons.Filled.Home
                                RepSection.Collections -> Icons.Filled.AccountBalanceWallet
                                RepSection.Statement -> Icons.Filled.ReceiptLong
                            }
                            NavigationBarItem(
                                selected = detailSection == section,
                                onClick = {
                                    detailSection = section
                                    scope.launch { listState.animateScrollToItem(0) }
                                },
                                icon = { Icon(icon, contentDescription = null) },
                                label = { Text(stringResource(label), maxLines = 1) },
                                alwaysShowLabel = true,
                            )
                        }
                    }
                }
            },
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
                        if (selectedDetail == null || detailSection == RepSection.Summary) {
                            IconButton(onClick = { viewModel.refresh() }, enabled = !state.loading && !state.refreshing) {
                                Icon(Icons.Filled.Refresh, contentDescription = stringResource(R.string.refresh))
                            }
                        }
                        var menu by remember { mutableStateOf(false) }
                        Box {
                            IconButton(onClick = { menu = true }) { Icon(Icons.Filled.MoreVert, contentDescription = stringResource(R.string.more)) }
                            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                DropdownMenuItem(text = { Text(stringResource(R.string.open_website)) }, onClick = { menu = false; uri.openUri("$website/commissions") })
                                if (state.data?.user?.admin == true) {
                                    DropdownMenuItem(
                                        text = { Text(stringResource(R.string.commission_settings)) },
                                        onClick = {
                                            menu = false
                                            adminPage = AdminPage.Settings
                                        },
                                    )
                                    DropdownMenuItem(text = { Text(stringResource(R.string.manage_accounts)) }, onClick = { menu = false; adminPage = AdminPage.Accounts })
                                }
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
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 32.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        item(key = "filters") {
                            Filters(
                                data = data,
                                loading = state.loading,
                                showStatus = selectedDetail == null || detailSection == RepSection.Summary,
                                onMonth = viewModel::selectMonth,
                                onRep = viewModel::selectRep,
                            )
                        }
                        if (!notificationsOn) item(key = "notifications-off") { NotificationsOffCard(onTurnOn = openNotificationSettings) }
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
                                section = detailSection,
                                onBackToTeam = if (data.repOptions.size > 1) ({ viewModel.selectRep(data.allReps) }) else null,
                            )
                            else -> teamItems(data, format, onOpen = { viewModel.selectRep(it.key) })
                        }
                        if (selectedDetail == null || detailSection == RepSection.Summary) {
                            item(key = "updated") { UpdatedLine(data, format) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationsOffCard(onTurnOn: () -> Unit) {
    val status = LocalStatus.current
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = status.warningSoft),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(Modifier.padding(start = 14.dp, end = 6.dp, top = 10.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(stringResource(R.string.notif_off_title), fontWeight = FontWeight.SemiBold, color = status.warning)
                Text(stringResource(R.string.notif_off_body), style = MaterialTheme.typography.bodySmall, color = status.warning)
            }
            androidx.compose.material3.TextButton(onClick = onTurnOn) {
                Text(stringResource(R.string.notif_off_open), fontWeight = FontWeight.Bold, color = status.warning)
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
private fun Filters(data: CommissionsResponse, loading: Boolean, showStatus: Boolean, onMonth: (String) -> Unit, onRep: (String) -> Unit) {
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
        if (showStatus) {
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
        Column(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(stringResource(R.string.kpi_label), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(format.money(totals.commission), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSurface)
            Text(
                stringResource(if (closed) R.string.team_sales_total else R.string.team_sales_to_date, format.compactMoney(totals.sales), if (target > 0) format.compactMoney(target) else "—"),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
    item(key = "reps") {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        ) {
            Column {
                data.reps.forEachIndexed { index, rep ->
                    if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    RepRow(rep, data.clock.closed, format, onClick = { onOpen(rep) })
                }
            }
        }
    }
}

@Composable
private fun RepRow(rep: RepSummary, closed: Boolean, format: Format, onClick: () -> Unit) {
    val r = rep.result
    val status = LocalStatus.current
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                rep.name.split(Regex("\\s+")).filter(String::isNotBlank).take(2).joinToString("") { it.take(1) },
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
            )
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(rep.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, fill = false))
                if (rep.odooUserId == null) {
                    Text(stringResource(R.string.not_linked), style = MaterialTheme.typography.labelSmall, color = status.warning, maxLines = 1)
                }
                if (r.belowMinimum || rep.minimumRisk) {
                    Text(
                        stringResource(if (r.belowMinimum) R.string.flag_below_minimum else R.string.flag_minimum_risk),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (r.belowMinimum) status.danger else status.warning,
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                ProgressBar(r.achievement, projected = if (closed) null else rep.projectedAchievement, modifier = Modifier.weight(1f), height = 6)
                Text(format.pct(r.achievement), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            }
        }
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(format.number(r.total), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = status.success, maxLines = 1)
            Text(format.compactMoney(r.sales), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
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
