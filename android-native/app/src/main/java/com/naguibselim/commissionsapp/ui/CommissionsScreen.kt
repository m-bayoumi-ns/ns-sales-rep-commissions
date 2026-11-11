package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LinkOff
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.data.CommissionsViewPayload
import com.naguibselim.commissionsapp.data.NotificationsPayload
import com.naguibselim.commissionsapp.data.RateChangeModel
import com.naguibselim.commissionsapp.data.RepOptionItem
import com.naguibselim.commissionsapp.data.RepSummaryModel
import com.naguibselim.commissionsapp.util.Format

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommissionsScreen(
    loading: Boolean,
    refreshing: Boolean,
    errorCode: String?,
    errorEmail: String?,
    payload: CommissionsViewPayload?,
    section: SellerSection,
    notifications: NotificationsPayload,
    showNotificationsSheet: Boolean,
    onSelectSection: (SellerSection) -> Unit,
    onSelectMonth: (String) -> Unit,
    onSelectRep: (String) -> Unit,
    onRefresh: () -> Unit,
    onOpenNotifications: (Boolean) -> Unit,
    onOpenAdminSettings: () -> Unit,
    onSignOut: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current

    var showMonthSheet by rememberSaveable { mutableStateOf(false) }
    var showRepSheet by rememberSaveable { mutableStateOf(false) }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = onRefresh,
        modifier = Modifier
            .fillMaxSize()
            .background(c.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            when {
                loading && payload == null -> {
                    NsLoadingCard()
                }
                errorCode != null && payload == null -> {
                    val (title, body) = when (errorCode) {
                        "inactive" -> tr("الحساب غير مفعل", "Account inactive") to
                            tr("حسابك (${errorEmail ?: ""}) غير مفعل حاليًا. تواصل مع المسؤول.", "Your account (${errorEmail ?: ""}) is currently inactive. Contact the administrator.")
                        "no_access" -> tr("لا توجد صلاحية", "No access") to
                            tr("حسابك غير مصرح له بفتح صفحة عمولات المندوبين.", "Your account does not have permission to open Sales Rep Commissions.")
                        "not_connected" -> tr("اتصال البيانات غير مُعد", "Data connection not configured") to
                            tr("إعدادات اتصال البيانات على الخادم غير موجودة. تواصل مع الدعم الفني.", "Server data connection is not configured.")
                        else -> tr("تعذر تحميل الصفحة", "Could not load page") to
                            tr("تعذرت قراءة البيانات في الوقت المحدد. تحقق من اتصال الإنترنت وحاول مرة أخرى.", "Could not load commission figures. Check your connection and try again.")
                    }
                    NsStateCard(
                        title = title,
                        body = body,
                        icon = if (errorCode == "inactive" || errorCode == "no_access") Icons.Outlined.Lock else Icons.Outlined.ErrorOutline,
                        isError = true,
                        retryLabel = if (errorCode == "inactive" || errorCode == "no_access") tr("تسجيل الخروج", "Sign out") else tr("إعادة المحاولة", "Try again"),
                        onRetry = if (errorCode == "inactive" || errorCode == "no_access") onSignOut else onRefresh
                    )
                }
                payload != null -> {
                    val isAdmin = payload.user.role == "admin"
                    val monthName = Format.monthLabel(payload.clock.month, isAr)

                    // Top Filter & Action Bar
                    FilterActionRow(
                        payload = payload,
                        unreadCount = notifications.unread,
                        refreshing = refreshing,
                        onOpenMonthPicker = { showMonthSheet = true },
                        onOpenRepPicker = { showRepSheet = true },
                        onRefresh = onRefresh,
                        onOpenNotifications = { onOpenNotifications(true) }
                    )

                    // Offline cache banner if showing cached copy
                    if (payload.isOfflineCache) {
                        StatusBanner(
                            text = tr(
                                "أنت غير متصل بالإنترنت — يتم عرض آخر نسخة محفوظة على الهاتف.",
                                "You're offline — showing the last cached figures on this phone."
                            ),
                            tone = "warn",
                            icon = Icons.Outlined.CloudOff,
                            actionLabel = tr("تحديث", "Retry"),
                            onAction = onRefresh
                        )
                    }

                    // Admin / Month Notices
                    if (payload.source == "default" || !payload.hasRates) {
                        StatusBanner(
                            text = tr(
                                "لم تُحدد نسب العمولة لشهر $monthName بعد، لذلك تظهر العمولات صفرًا.",
                                "Commission rates for $monthName have not been set yet, so commissions are 0."
                            ),
                            tone = "warn",
                            icon = Icons.Outlined.Settings,
                            actionLabel = if (isAdmin) tr("فتح الإعدادات", "Open settings") else null,
                            onAction = if (isAdmin) onOpenAdminSettings else null
                        )
                    } else if (payload.source == "inherited" && payload.inheritedFrom != null) {
                        val fromLabel = Format.monthLabel(payload.inheritedFrom, isAr)
                        StatusBanner(
                            text = tr(
                                "يستخدم هذا الشهر النسب والشروط المحفوظة لشهر $fromLabel حتى تُحفظ إعداداته.",
                                "Using the rates and rules saved for $fromLabel until this month's settings are saved."
                            ),
                            tone = "info",
                            icon = Icons.Outlined.Info,
                            actionLabel = if (isAdmin) tr("فتح الإعدادات", "Open settings") else null,
                            onAction = if (isAdmin) onOpenAdminSettings else null
                        )
                    }

                    if (!payload.sheetFound && isAdmin) {
                        StatusBanner(
                            text = tr(
                                "لم يُعثر على ملف أهداف $monthName في التخزين (Wholesales_Target).",
                                "No target sheet found for $monthName in storage (Wholesales_Target)."
                            ),
                            tone = "warn",
                            icon = Icons.Outlined.WarningAmber
                        )
                    }

                    if (payload.unlinked.isNotEmpty() && isAdmin) {
                        StatusBanner(
                            text = tr(
                                "غير مربوطين بمستخدم أودو: ${payload.unlinked.joinToString("، ")}",
                                "Not linked to an Odoo user: ${payload.unlinked.joinToString(", ")}"
                            ),
                            tone = "warn",
                            icon = Icons.Outlined.LinkOff,
                            actionLabel = tr("فتح الإعدادات", "Open settings"),
                            onAction = onOpenAdminSettings
                        )
                    }

                    // Main View: Empty, RepDetail, or TeamList
                    if (payload.reps.isEmpty()) {
                        NsStateCard(
                            title = tr("لا يوجد مندوبون للعرض", "No sellers to show"),
                            body = if (payload.user.role == "seller") {
                                tr("حسابك غير مربوط بمندوب في قائمة $monthName.", "Your account is not linked to a seller in $monthName.")
                            } else {
                                tr("لا يوجد مندوبون في قائمة $monthName.", "No sellers listed for $monthName.")
                            },
                            icon = Icons.Outlined.Groups
                        )
                    } else if (payload.detail != null) {
                        RepDetailView(
                            detail = payload.detail,
                            settings = payload.settings,
                            clock = payload.clock,
                            section = section,
                            onSelectSection = onSelectSection,
                            showTeamBackLink = payload.reps.size > 1,
                            onBackToTeam = { onSelectRep("all") }
                        )
                    } else {
                        TeamSummaryView(
                            payload = payload,
                            onSelectRep = onSelectRep
                        )
                    }
                }
            }
        }
    }

    // Month Picker Bottom Sheet
    if (showMonthSheet && payload != null) {
        MonthPickerSheet(
            months = payload.months,
            selectedMonth = payload.clock.month,
            onSelect = { m ->
                showMonthSheet = false
                onSelectMonth(m)
            },
            onDismiss = { showMonthSheet = false }
        )
    }

    // Seller Picker Bottom Sheet
    if (showRepSheet && payload != null) {
        RepPickerSheet(
            options = payload.repOptions,
            selectedRep = payload.selectedRep,
            allowAll = payload.repOptions.size > 1,
            onSelect = { r ->
                showRepSheet = false
                onSelectRep(r)
            },
            onDismiss = { showRepSheet = false }
        )
    }

    // Notifications Bottom Sheet
    if (showNotificationsSheet) {
        NotificationsBottomSheet(
            notifications = notifications,
            onDismiss = { onOpenNotifications(false) }
        )
    }
}

@Composable
private fun FilterActionRow(
    payload: CommissionsViewPayload,
    unreadCount: Int,
    refreshing: Boolean,
    onOpenMonthPicker: () -> Unit,
    onOpenRepPicker: () -> Unit,
    onRefresh: () -> Unit,
    onOpenNotifications: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Month Chip Button
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                modifier = Modifier
                    .weight(1f)
                    .height(42.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable(onClick = onOpenMonthPicker)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.CalendarMonth,
                        contentDescription = null,
                        tint = c.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = Format.monthLabel(payload.clock.month, isAr),
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.foreground,
                        modifier = Modifier.weight(1f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    // Live / Closed dot
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (payload.clock.closed) c.mutedForeground else c.success)
                    )
                    Icon(
                        imageVector = Icons.Outlined.ExpandMore,
                        contentDescription = null,
                        tint = c.mutedForeground,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // Refresh Button
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                modifier = Modifier.size(42.dp)
            ) {
                IconButton(onClick = onRefresh, enabled = !refreshing) {
                    if (refreshing) {
                        CircularProgressIndicator(
                            color = c.primary,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(18.dp)
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Outlined.Refresh,
                            contentDescription = tr("تحديث الآن", "Refresh now"),
                            tint = c.foreground,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
            }

            // Notifications Bell Button
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                modifier = Modifier.size(42.dp)
            ) {
                IconButton(onClick = onOpenNotifications) {
                    BadgedBox(
                        badge = {
                            if (unreadCount > 0) {
                                Badge(
                                    containerColor = c.destructive,
                                    contentColor = Color.White
                                ) {
                                    Text(text = if (unreadCount > 9) "9+" else "$unreadCount", fontSize = 10.sp)
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Notifications,
                            contentDescription = tr("الإشعارات", "Notifications"),
                            tint = c.foreground,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
            }
        }

        // Seller Picker Row (for Managers & Admins with multiple reps)
        if (payload.repOptions.size > 1) {
            val selectedLabel = if (payload.selectedRep == "all") {
                tr("كل المندوبين — ملخص الفريق (${payload.repOptions.size})", "All sellers — Team summary (${payload.repOptions.size})")
            } else {
                payload.repOptions.find { it.key == payload.selectedRep }?.name
                    ?: payload.detail?.rep?.name
                    ?: payload.selectedRep
            }
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(42.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .clickable(onClick = onOpenRepPicker)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = if (payload.selectedRep == "all") Icons.Outlined.Groups else Icons.Outlined.Person,
                        contentDescription = null,
                        tint = c.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = selectedLabel,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.foreground,
                        modifier = Modifier.weight(1f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Icon(
                        imageVector = Icons.Outlined.ExpandMore,
                        contentDescription = null,
                        tint = c.mutedForeground,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// TEAM SUMMARY VIEW (Managers / Admins)
// ---------------------------------------------------------------------------
@Composable
private fun TeamSummaryView(
    payload: CommissionsViewPayload,
    onSelectRep: (String) -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val totals = payload.totals
    val clock = payload.clock
    val target = if (clock.closed) totals.target else totals.targetToDate
    val achievement = if (target > 0) (totals.sales / target) * 100.0 else null
    val progress = ((achievement ?: 0.0).coerceIn(0.0, 100.0) / 100.0).toFloat()

    // Team Hero Card
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(c.heroStart, c.heroMid, c.heroEnd)
                )
            )
            .padding(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color.White.copy(alpha = 0.12f))
                        .border(1.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Payments,
                        contentDescription = null,
                        tint = Color(0xFFFEF3C7),
                        modifier = Modifier.size(22.dp)
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = tr("عمولة الفريق", "Team commission"),
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.78f)
                    )
                    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                        Row(
                            verticalAlignment = Alignment.Bottom,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = Format.integer(totals.commission),
                                fontSize = 34.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Text(
                                text = if (isAr) "ج.م" else "EGP",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White.copy(alpha = 0.7f),
                                modifier = Modifier.padding(bottom = 4.dp)
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.15f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = tr("المبيعات", "Sales"), fontSize = 11.5.sp, color = Color.White.copy(alpha = 0.68f))
                    LtrText(
                        text = Format.compactCurrency(totals.sales, isAr),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (clock.closed) tr("الهدف", "Target") else tr("الهدف حتى اليوم", "Target to date"),
                        fontSize = 11.5.sp,
                        color = Color.White.copy(alpha = 0.68f)
                    )
                    LtrText(
                        text = if (target > 0) Format.compactCurrency(target, isAr) else "—",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = tr("نسبة التحقيق", "Achievement"), fontSize = 11.5.sp, color = Color.White.copy(alpha = 0.68f))
                    LtrText(
                        text = Format.percent(achievement),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.16f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress)
                            .fillMaxHeight()
                            .clip(CircleShape)
                            .background(Color(0xFF6EE7B7))
                    )
                }
            }
        }
    }

    // Ranked Seller List
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = c.card,
        border = BorderStroke(1.dp, c.border),
        shadowElevation = 1.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            payload.reps.forEachIndexed { idx, rep ->
                if (idx > 0) NsDivider()
                TeamRepRow(
                    rep = rep,
                    closed = clock.closed,
                    displayName = payload.repOptions.find { it.key == rep.key }?.name ?: rep.name,
                    onClick = { onSelectRep(rep.key) }
                )
            }
        }
    }
}

@Composable
private fun TeamRepRow(
    rep: RepSummaryModel,
    closed: Boolean,
    displayName: String,
    onClick: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val r = rep.result
    val flagged = r.belowMinimum || rep.minimumRisk
    val pct = r.achievement

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(c.accent),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Outlined.Person,
                contentDescription = null,
                tint = c.primary,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = displayName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.foreground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                if (rep.odooUserId == null) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(c.warningSoft)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(text = tr("غير مربوط", "Unlinked"), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = c.warning)
                    }
                }
                if (flagged) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(c.destructiveSoft)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                            Icon(imageVector = Icons.Outlined.Flag, contentDescription = null, tint = c.destructive, modifier = Modifier.size(10.dp))
                            Text(text = tr("أقل من الحد الأدنى", "Below min"), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = c.destructive)
                        }
                    }
                }
            }

            val salesSub = if (closed) {
                tr(
                    "المبيعات ${Format.compactCurrency(r.sales, isAr)} من ${r.totalTarget?.let { Format.compactCurrency(it, isAr) } ?: "—"}",
                    "Sales ${Format.compactCurrency(r.sales, isAr)} of ${r.totalTarget?.let { Format.compactCurrency(it, isAr) } ?: "—"}"
                )
            } else {
                tr(
                    "المبيعات ${Format.compactCurrency(r.sales, isAr)} من الهدف حتى اليوم ${r.totalTargetToDate?.let { Format.compactCurrency(it, isAr) } ?: "—"}",
                    "Sales ${Format.compactCurrency(r.sales, isAr)} of target to date ${r.totalTargetToDate?.let { Format.compactCurrency(it, isAr) } ?: "—"}"
                )
            }
            Text(text = salesSub, fontSize = 12.sp, color = c.mutedForeground)

            if (pct != null) {
                AnimatedProgressBar(progress = pct, heightDp = 5)
            }
        }

        Column(
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            LtrText(
                text = Format.integer(r.total),
                fontSize = 15.sp,
                fontWeight = FontWeight.ExtraBold,
                color = c.foreground
            )
            LtrText(
                text = Format.percent(pct),
                fontSize = 11.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = when {
                    pct == null -> c.mutedForeground
                    pct >= 100.0 -> c.success
                    pct >= 70.0 -> c.warning
                    else -> c.destructive
                }
            )
        }

        Icon(
            imageVector = if (isAr) Icons.AutoMirrored.Outlined.KeyboardArrowLeft else Icons.AutoMirrored.Outlined.KeyboardArrowRight,
            contentDescription = null,
            tint = c.mutedForeground,
            modifier = Modifier.size(18.dp)
        )
    }
}

// ---------------------------------------------------------------------------
// BOTTOM SHEETS: Month Picker, Seller Picker, Notifications
// ---------------------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MonthPickerSheet(
    months: List<String>,
    selectedMonth: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = c.card,
        contentColor = c.foreground
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = tr("اختر الشهر", "Select month"),
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = c.foreground,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp)
            )
            HorizontalDivider(color = c.border)
            LazyColumn(
                modifier = Modifier.heightIn(max = 400.dp),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                items(months) { m ->
                    val isSelected = m == selectedMonth
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(m) }
                            .background(if (isSelected) c.accent else Color.Transparent)
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = Format.monthLabel(m, isAr),
                            fontSize = 15.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) c.primary else c.foreground
                        )
                        if (isSelected) {
                            Icon(imageVector = Icons.Outlined.Check, contentDescription = null, tint = c.primary, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RepPickerSheet(
    options: List<RepOptionItem>,
    selectedRep: String,
    allowAll: Boolean,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val c = LocalNsColors.current
    var search by rememberSaveable { mutableStateOf("") }
    val filtered = remember(options, search) {
        val q = search.trim().lowercase()
        if (q.isEmpty()) options else options.filter { it.name.lowercase().contains(q) }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = c.card,
        contentColor = c.foreground
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = tr("اختر المندوب", "Select seller"),
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = c.foreground,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
            )
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                placeholder = { Text(text = tr("ابحث عن مندوب…", "Search seller…"), fontSize = 13.5.sp) },
                leadingIcon = { Icon(imageVector = Icons.Outlined.Search, contentDescription = null, modifier = Modifier.size(18.dp)) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = c.primary,
                    unfocusedBorderColor = c.border
                )
            )
            HorizontalDivider(color = c.border, modifier = Modifier.padding(top = 6.dp))
            LazyColumn(
                modifier = Modifier.heightIn(max = 420.dp),
                contentPadding = PaddingValues(vertical = 6.dp)
            ) {
                if (allowAll && search.isBlank()) {
                    item {
                        val isAll = selectedRep == "all"
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect("all") }
                                .background(if (isAll) c.accent else Color.Transparent)
                                .padding(horizontal = 20.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Icon(imageVector = Icons.Outlined.Groups, contentDescription = null, tint = c.primary, modifier = Modifier.size(20.dp))
                                Text(
                                    text = tr("كل المندوبين — ملخص الفريق (${options.size})", "All sellers — Team summary (${options.size})"),
                                    fontSize = 14.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isAll) c.primary else c.foreground
                                )
                            }
                            if (isAll) {
                                Icon(imageVector = Icons.Outlined.Check, contentDescription = null, tint = c.primary, modifier = Modifier.size(20.dp))
                            }
                        }
                        HorizontalDivider(color = c.border)
                    }
                }
                items(filtered) { opt ->
                    val isSelected = opt.key == selectedRep
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(opt.key) }
                            .background(if (isSelected) c.accent else Color.Transparent)
                            .padding(horizontal = 20.dp, vertical = 13.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = opt.name,
                                fontSize = 14.5.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) c.primary else c.foreground
                            )
                            if (!opt.linked) {
                                Text(
                                    text = tr("غير مربوط", "Unlinked"),
                                    fontSize = 11.sp,
                                    color = c.warning
                                )
                            }
                        }
                        if (isSelected) {
                            Icon(imageVector = Icons.Outlined.Check, contentDescription = null, tint = c.primary, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationsBottomSheet(
    notifications: NotificationsPayload,
    onDismiss: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = c.card,
        contentColor = c.foreground
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 28.dp)
        ) {
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text(
                    text = tr("الإشعارات", "Notifications"),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground
                )
                Text(
                    text = tr("تغييرات نسب العمولة والتنبيهات", "Commission rate changes & updates"),
                    fontSize = 12.5.sp,
                    color = c.mutedForeground
                )
            }
            HorizontalDivider(color = c.border)

            if (notifications.items.isEmpty()) {
                Text(
                    text = tr("لا توجد إشعارات.", "No notifications yet."),
                    fontSize = 14.sp,
                    color = c.mutedForeground,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 36.dp, horizontal = 20.dp)
                )
            } else {
                LazyColumn(
                    modifier = Modifier.heightIn(max = 460.dp)
                ) {
                    items(notifications.items) { item ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = tr(
                                        "تحديث نسب العمولة · ${Format.monthLabel(item.month, isAr)}",
                                        "Commission rate update · ${Format.monthLabel(item.month, isAr)}"
                                    ),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = c.foreground
                                )
                                Text(
                                    text = Format.dateTimeLabel(item.at, isAr),
                                    fontSize = 11.sp,
                                    color = c.mutedForeground
                                )
                            }
                            if (!item.note.isNullOrBlank()) {
                                Text(
                                    text = item.note,
                                    fontSize = 13.5.sp,
                                    color = c.foreground
                                )
                            }
                            item.changes.take(8).forEach { ch ->
                                Text(
                                    text = "• ${formatRateChangeText(ch, isAr)}",
                                    fontSize = 12.sp,
                                    color = c.mutedForeground
                                )
                            }
                            if (item.changes.size > 8) {
                                Text(
                                    text = tr("+${item.changes.size - 8} أخرى", "+${item.changes.size - 8} more"),
                                    fontSize = 11.5.sp,
                                    color = c.primary
                                )
                            }
                            Text(
                                text = buildString {
                                    append(tr("بواسطة ${item.by}", "By ${item.by}"))
                                    if (item.recipientCount != null) {
                                        append(" · " + tr("إلى ${item.recipientCount} مندوب", "to ${item.recipientCount} sellers"))
                                    }
                                },
                                fontSize = 11.sp,
                                color = c.mutedForeground
                            )
                        }
                        HorizontalDivider(color = c.border)
                    }
                }
            }
        }
    }
}

private fun formatRateChangeText(change: RateChangeModel, isAr: Boolean): String {
    val catLabel = { k: String? ->
        when (k) {
            "slow" -> trLang(isAr, "نسبة الراكد", "Slow-moving rate")
            "digital" -> trLang(isAr, "نسبة الديجيتال", "Digital rate")
            else -> k ?: ""
        }
    }
    return when (change.kind) {
        "tier" -> trLang(isAr, "الشريحة ${change.key}: ${change.from} ← ${change.to}", "Range ${change.key}: ${change.from} → ${change.to}")
        "oldTier" -> trLang(isAr, "شريحة النظام القديم ${change.key}: ${change.from} ← ${change.to}", "Old system range ${change.key}: ${change.from} → ${change.to}")
        "categoryRate" -> "${catLabel(change.key)}: ${change.from}% → ${change.to}%"
        "productAdded" -> trLang(isAr, "أُضيف إلى ${catLabel(change.category)}: ${change.name}", "Added to ${catLabel(change.category)}: ${change.name}")
        "productRemoved" -> trLang(isAr, "أُزيل من ${catLabel(change.category)}: ${change.name}", "Removed from ${catLabel(change.category)}: ${change.name}")
        "productMoved" -> "${change.name}: ${catLabel(change.from)} → ${catLabel(change.to)}"
        "ladder" -> trLang(isAr, "حوافز المبيعات: ${change.from} ← ${change.to}", "Sales bonuses: ${change.from} → ${change.to}")
        else -> "${change.key ?: change.kind}: ${change.from ?: ""} → ${change.to ?: ""}"
    }
}
