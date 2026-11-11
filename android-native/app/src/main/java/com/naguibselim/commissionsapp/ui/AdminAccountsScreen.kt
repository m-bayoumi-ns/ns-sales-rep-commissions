package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Android
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.data.AdminAccountsPayload
import com.naguibselim.commissionsapp.data.SellerAccountModel
import com.naguibselim.commissionsapp.data.SheetRepAccountModel
import com.naguibselim.commissionsapp.util.Format
import org.json.JSONArray
import org.json.JSONObject

@Composable
fun AdminAccountsScreen(
    payload: AdminAccountsPayload?,
    loading: Boolean,
    busy: Boolean,
    toast: Pair<Boolean, String>?,
    onRefresh: () -> Unit,
    onExecutePatch: (JSONObject, String, String) -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    var searchQuery by remember { mutableStateOf("") }
    var editingDisplayRep by remember { mutableStateOf<SheetRepAccountModel?>(null) }
    var editingUsernameAcc by remember { mutableStateOf<Pair<String, String>?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background)
    ) {
        Surface(
            color = c.card,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = tr("حسابات المندوبين", "Seller Accounts"),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = c.foreground
                    )
                    Text(
                        text = tr(
                            "إنشاء حسابات الدخول من شيت المستهدفات وإدارة الصلاحيات",
                            "Create seller logins from target sheet & manage access"
                        ),
                        fontSize = 12.sp,
                        color = c.mutedForeground
                    )
                }
                IconButton(onClick = onRefresh, enabled = !loading && !busy) {
                    if (busy) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = c.primary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Outlined.Refresh,
                            contentDescription = null,
                            tint = c.mutedForeground
                        )
                    }
                }
            }
        }

        if (loading || payload == null) {
            Box(modifier = Modifier.padding(16.dp)) {
                NsLoadingCard()
            }
            return@Column
        }

        val missingCount = payload.sheetReps.count { it.account == null }
        val filteredSheetReps = remember(payload.sheetReps, searchQuery) {
            val q = searchQuery.trim().lowercase()
            if (q.isEmpty()) payload.sheetReps
            else payload.sheetReps.filter {
                it.name.lowercase().contains(q) ||
                    it.displayName.lowercase().contains(q) ||
                    it.username.lowercase().contains(q) ||
                    (it.account?.email?.lowercase()?.contains(q) == true)
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            toast?.let { (ok, msg) ->
                item {
                    StatusBanner(
                        text = msg,
                        tone = if (ok) "success" else "error"
                    )
                }
            }

            item {
                NsGroupCard(
                    title = tr("نسخة تطبيق أندرويد الافتراضية للتحميل", "Default Android APK Download")
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Android,
                                contentDescription = null,
                                tint = c.primary
                            )
                            Text(
                                text = tr(
                                    "تحديد النسخة التي يتم تحميلها عند الضغط على زر تحميل التطبيق في الموقع:",
                                    "Choose which APK variant users download from the website button:"
                                ),
                                fontSize = 12.sp,
                                color = c.mutedForeground,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        SegmentedPills(
                            options = listOf(
                                "native" to tr("تطبيق أصلي (Native)", "Native App"),
                                "web" to tr("نسخة الويب (WebView)", "WebView App")
                            ),
                            selected = payload.androidDownload,
                            onSelect = { variant ->
                                if (variant != payload.androidDownload) {
                                    onExecutePatch(
                                        JSONObject().apply {
                                            put("action", "setAndroidDownload")
                                            put("variant", variant)
                                        },
                                        "تم تحديث نسخة التحميل الافتراضية",
                                        "Default Android download updated"
                                    )
                                }
                            }
                        )
                    }
                }
            }

            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = c.card,
                    border = BorderStroke(1.dp, c.border),
                    shadowElevation = 1.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = tr("مندوبو شيت المستهدفات", "Target Sheet Sellers") +
                                        (payload.sheetMonth?.let { " · ${Format.monthLabel(it, isAr)}" } ?: ""),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = c.foreground
                                )
                                Text(
                                    text = tr(
                                        "كلمة المرور الافتراضية للحسابات الجديدة: ${payload.defaultPassword}",
                                        "Default password for new accounts: ${payload.defaultPassword}"
                                    ),
                                    fontSize = 11.sp,
                                    color = c.mutedForeground
                                )
                            }
                            if (missingCount > 0) {
                                Button(
                                    onClick = {
                                        onExecutePatch(
                                            JSONObject().apply {
                                                put("action", "createFromSheet")
                                                put("names", JSONArray())
                                            },
                                            "تم إنشاء حسابات المندوبين الجدد",
                                            "Created missing seller accounts"
                                        )
                                    },
                                    enabled = !busy,
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = c.primary,
                                        contentColor = c.primaryForeground
                                    )
                                ) {
                                    Icon(Icons.Outlined.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = tr("إنشاء الكل ($missingCount)", "Create All ($missingCount)"),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = {
                                Text(
                                    tr("ابحث باسم المندوب أو اسم المستخدم...", "Search seller name or username..."),
                                    fontSize = 13.sp
                                )
                            },
                            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            item {
                NsGroupCard(
                    title = tr(
                        "المندوبون في الشيت (${filteredSheetReps.size})",
                        "Sheet Sellers (${filteredSheetReps.size})"
                    )
                ) {
                    if (filteredSheetReps.isEmpty()) {
                        Text(
                            text = tr("لا توجد نتائج مطابقة", "No matching sellers"),
                            fontSize = 13.sp,
                            color = c.mutedForeground,
                            modifier = Modifier.padding(18.dp)
                        )
                    } else {
                        filteredSheetReps.forEachIndexed { idx, rep ->
                            if (idx > 0) HorizontalDivider(color = c.border)
                            SheetRepRow(
                                rep = rep,
                                busy = busy,
                                onEditDisplayName = { editingDisplayRep = rep },
                                onEditUsername = { acc ->
                                    editingUsernameAcc = acc.id to (acc.username ?: rep.username)
                                },
                                onCreateAccount = {
                                    onExecutePatch(
                                        JSONObject().apply {
                                            put("action", "createFromSheet")
                                            put("names", JSONArray().put(rep.name))
                                        },
                                        "تم إنشاء حساب ${rep.displayName}",
                                        "Created account for ${rep.displayName}"
                                    )
                                },
                                onToggleActive = { acc, active ->
                                    onExecutePatch(
                                        JSONObject().apply {
                                            put("action", "setActive")
                                            put("userId", acc.id)
                                            put("active", active)
                                        },
                                        if (active) "تم تفعيل الحساب" else "تم إيقاف الحساب",
                                        if (active) "Account activated" else "Account deactivated"
                                    )
                                },
                                onToggleForcePassword = { acc, force ->
                                    onExecutePatch(
                                        JSONObject().apply {
                                            put("action", "setForcePassword")
                                            put("userId", acc.id)
                                            put("force", force)
                                        },
                                        "تم تحديث إعداد كلمة المرور",
                                        "Password change requirement updated"
                                    )
                                }
                            )
                        }
                    }
                }
            }

            if (payload.otherAccounts.isNotEmpty()) {
                item {
                    NsGroupCard(
                        title = tr(
                            "حسابات أخرى خارج شيت الشهر (${payload.otherAccounts.size})",
                            "Other Seller Accounts (${payload.otherAccounts.size})"
                        )
                    ) {
                        payload.otherAccounts.forEachIndexed { idx, acc ->
                            if (idx > 0) HorizontalDivider(color = c.border)
                            StandaloneAccountRow(
                                account = acc,
                                busy = busy,
                                onEditUsername = {
                                    editingUsernameAcc = acc.id to (acc.username ?: "")
                                },
                                onToggleActive = { active ->
                                    onExecutePatch(
                                        JSONObject().apply {
                                            put("action", "setActive")
                                            put("userId", acc.id)
                                            put("active", active)
                                        },
                                        if (active) "تم تفعيل الحساب" else "تم إيقاف الحساب",
                                        if (active) "Account activated" else "Account deactivated"
                                    )
                                },
                                onToggleForcePassword = { force ->
                                    onExecutePatch(
                                        JSONObject().apply {
                                            put("action", "setForcePassword")
                                            put("userId", acc.id)
                                            put("force", force)
                                        },
                                        "تم تحديث إعداد كلمة المرور",
                                        "Password requirement updated"
                                    )
                                }
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(32.dp)) }
        }
    }

    editingDisplayRep?.let { rep ->
        var text by remember(rep) { mutableStateOf(rep.displayName) }
        AlertDialog(
            onDismissRequest = { editingDisplayRep = null },
            title = {
                Text(
                    tr("تعديل الاسم المعروض", "Edit Display Name"),
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = tr("الاسم في الشيت: ${rep.name}", "Sheet name: ${rep.name}"),
                        fontSize = 12.sp,
                        color = c.mutedForeground
                    )
                    OutlinedTextField(
                        value = text,
                        onValueChange = { text = it },
                        label = { Text(tr("الاسم المعروض (عربي / إنجليزي)", "Display Name")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val nextName = text.trim()
                        editingDisplayRep = null
                        onExecutePatch(
                            JSONObject().apply {
                                put("action", "setDisplayName")
                                put("repName", rep.name)
                                put("displayName", nextName)
                            },
                            "تم حفظ الاسم المعروض",
                            "Display name saved"
                        )
                    }
                ) {
                    Text(tr("حفظ", "Save"))
                }
            },
            dismissButton = {
                TextButton(onClick = { editingDisplayRep = null }) {
                    Text(tr("إلغاء", "Cancel"))
                }
            }
        )
    }

    editingUsernameAcc?.let { (userId, currentUsername) ->
        var text by remember(userId) { mutableStateOf(currentUsername) }
        AlertDialog(
            onDismissRequest = { editingUsernameAcc = null },
            title = {
                Text(
                    tr("تعديل اسم المستخدم", "Edit Username"),
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = tr(
                            "يُستخدم لتسجيل الدخول مباشرة بدون بريد إلكتروني (مثال: nsr305)",
                            "Used to sign in directly without email (e.g. nsr305)"
                        ),
                        fontSize = 12.sp,
                        color = c.mutedForeground
                    )
                    OutlinedTextField(
                        value = text,
                        onValueChange = { text = it },
                        label = { Text(tr("اسم المستخدم", "Username")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val nextUser = text.trim().lowercase()
                        editingUsernameAcc = null
                        if (nextUser.isNotEmpty()) {
                            onExecutePatch(
                                JSONObject().apply {
                                    put("action", "setUsername")
                                    put("userId", userId)
                                    put("username", nextUser)
                                },
                                "تم تحديث اسم المستخدم",
                                "Username updated"
                            )
                        }
                    }
                ) {
                    Text(tr("حفظ", "Save"))
                }
            },
            dismissButton = {
                TextButton(onClick = { editingUsernameAcc = null }) {
                    Text(tr("إلغاء", "Cancel"))
                }
            }
        )
    }
}

@Composable
private fun SheetRepRow(
    rep: SheetRepAccountModel,
    busy: Boolean,
    onEditDisplayName: () -> Unit,
    onEditUsername: (SellerAccountModel) -> Unit,
    onCreateAccount: () -> Unit,
    onToggleActive: (SellerAccountModel, Boolean) -> Unit,
    onToggleForcePassword: (SellerAccountModel, Boolean) -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val acc = rep.account

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = rep.displayName,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = c.foreground
                    )
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = null,
                        tint = c.primary,
                        modifier = Modifier
                            .size(16.dp)
                            .clickable(onClick = onEditDisplayName)
                    )
                }
                if (rep.displayName != rep.name) {
                    Text(
                        text = rep.name,
                        fontSize = 11.sp,
                        color = c.mutedForeground
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    val uname = acc?.username ?: rep.username
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(c.accent)
                            .clickable(enabled = acc != null) { acc?.let(onEditUsername) }
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "@$uname",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = c.primary
                        )
                    }
                    if (rep.odooUserId != null) {
                        Text(
                            text = "Odoo #${rep.odooUserId}",
                            fontSize = 11.sp,
                            color = c.mutedForeground
                        )
                    }
                }
            }

            if (acc == null) {
                OutlinedButton(
                    onClick = onCreateAccount,
                    enabled = !busy,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Outlined.PersonAdd, contentDescription = null, modifier = Modifier.size(15.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(tr("إنشاء حساب", "Create Account"), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            } else {
                val bg = if (acc.active) c.successSoft else c.destructiveSoft
                val fg = if (acc.active) c.success else c.destructive
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(bg)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (acc.active) tr("مفعل", "Active") else tr("موقوف", "Disabled"),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = fg
                    )
                }
            }
        }

        if (acc != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = acc.email,
                    fontSize = 11.sp,
                    color = c.mutedForeground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                acc.lastSignInAt?.let {
                    Text(
                        text = tr("آخر دخول: ", "Last sign-in: ") + Format.dateTimeLabel(it, isAr),
                        fontSize = 10.sp,
                        color = c.mutedForeground
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Switch(
                        checked = acc.active,
                        onCheckedChange = { onToggleActive(acc, it) },
                        enabled = !busy,
                        colors = SwitchDefaults.colors(checkedTrackColor = c.primary)
                    )
                    Text(
                        text = tr("السماح بالدخول", "Allow Sign-in"),
                        fontSize = 12.sp,
                        color = c.foreground
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Switch(
                        checked = acc.mustChangePassword,
                        onCheckedChange = { onToggleForcePassword(acc, it) },
                        enabled = !busy,
                        colors = SwitchDefaults.colors(checkedTrackColor = c.warning)
                    )
                    Text(
                        text = tr("إلزام بتغيير كلمة المرور", "Force password change"),
                        fontSize = 12.sp,
                        color = c.mutedForeground
                    )
                }
            }
        }
    }
}

@Composable
private fun StandaloneAccountRow(
    account: SellerAccountModel,
    busy: Boolean,
    onEditUsername: () -> Unit,
    onToggleActive: (Boolean) -> Unit,
    onToggleForcePassword: (Boolean) -> Unit
) {
    val c = LocalNsColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = account.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground
                )
                Text(
                    text = account.email,
                    fontSize = 11.sp,
                    color = c.mutedForeground
                )
            }
            account.username?.let { uname ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(c.accent)
                        .clickable(onClick = onEditUsername)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "@$uname",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = c.primary
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Switch(
                    checked = account.active,
                    onCheckedChange = onToggleActive,
                    enabled = !busy,
                    colors = SwitchDefaults.colors(checkedTrackColor = c.primary)
                )
                Text(
                    text = tr("السماح بالدخول", "Allow Sign-in"),
                    fontSize = 12.sp,
                    color = c.foreground
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Switch(
                    checked = account.mustChangePassword,
                    onCheckedChange = onToggleForcePassword,
                    enabled = !busy,
                    colors = SwitchDefaults.colors(checkedTrackColor = c.warning)
                )
                Text(
                    text = tr("إلزام بتغيير كلمة المرور", "Force password change"),
                    fontSize = 12.sp,
                    color = c.mutedForeground
                )
            }
        }
    }
}
