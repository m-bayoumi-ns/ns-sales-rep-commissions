package com.naguibselim.commissionsapp.ui

import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Login
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.NotificationsOff
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material.icons.outlined.Send
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.BuildConfig
import com.naguibselim.commissionsapp.data.AccountPayload
import com.naguibselim.commissionsapp.data.UserProfile
import com.naguibselim.commissionsapp.notify.Notifier
import com.naguibselim.commissionsapp.util.Format
import java.time.Instant

@Composable
fun AccountScreen(
    loading: Boolean,
    accountData: AccountPayload?,
    fallbackUser: UserProfile?,
    passwordSaving: Boolean,
    passwordStatus: String?,
    testNotifStatus: String?,
    themeMode: String,
    language: String,
    onChangePassword: (String, String, String) -> Unit,
    onSendTestNotification: () -> Unit,
    onSetThemeMode: (String) -> Unit,
    onSetLanguage: (String) -> Unit,
    onSignOut: () -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current
    val context = LocalContext.current
    val user = accountData?.user ?: fallbackUser
    val mustChange = user?.mustChangePassword == true

    var passwordExpanded by rememberSaveable(mustChange) { mutableStateOf(mustChange) }
    var currentPass by rememberSaveable { mutableStateOf("") }
    var nextPass by rememberSaveable { mutableStateOf("") }
    var confirmPass by rememberSaveable { mutableStateOf("") }
    var showPass by rememberSaveable { mutableStateOf(false) }

    val notificationsEnabled = Notifier.areNotificationsEnabled(context)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = tr("حسابي", "My account"),
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
            color = c.foreground,
            modifier = Modifier.padding(horizontal = 4.dp)
        )

        if (mustChange) {
            StatusBanner(
                text = tr(
                    "طلب المسؤول تغيير كلمة المرور قبل المتابعة.",
                    "The administrator requires you to choose a new password before continuing."
                ),
                tone = "warn",
                icon = Icons.Outlined.WarningAmber
            )
        }

        // User Profile & Password Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = c.card,
            border = BorderStroke(1.dp, c.border),
            shadowElevation = 1.dp
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(c.accent),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Person,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = user?.displayName ?: user?.name ?: "—",
                            fontSize = 15.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground
                        )
                        LtrText(
                            text = user?.email ?: "",
                            fontSize = 12.sp,
                            color = c.mutedForeground
                        )
                    }
                    val roleLabel = when (user?.role) {
                        "admin" -> tr("مسؤول", "Administrator")
                        "manager" -> tr("مدير", "Manager")
                        else -> tr("مندوب مبيعات", "Sales rep")
                    }
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(c.heroStart)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = roleLabel,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }

                if (!user?.linkedRep.isNullOrBlank()) {
                    HorizontalDivider(color = c.border)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 18.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = tr("المندوب المرتبط:", "Linked seller:"),
                            fontSize = 13.sp,
                            color = c.mutedForeground
                        )
                        Text(
                            text = user?.linkedRep ?: "",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                    }
                }

                HorizontalDivider(color = c.border)

                // Change Password Disclosure
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { if (!mustChange) passwordExpanded = !passwordExpanded }
                        .padding(horizontal = 18.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Key,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = tr("تغيير كلمة المرور", "Change password"),
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                    }
                    if (!mustChange) {
                        Icon(
                            imageVector = if (passwordExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                            contentDescription = null,
                            tint = c.mutedForeground
                        )
                    }
                }

                if (passwordExpanded) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 18.dp, end = 18.dp, bottom = 18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        val statusText = when (passwordStatus) {
                            "saved" -> tr("تم تغيير كلمة المرور بنجاح.", "Password changed.")
                            "invalid" -> tr("أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل.", "Enter your current password and a new one of at least 8 characters.")
                            "mismatch" -> tr("كلمتا المرور الجديدتان غير متطابقتين.", "New passwords do not match.")
                            "same" -> tr("اختر كلمة مرور مختلفة عن الحالية.", "Choose a password different from the current one.")
                            "wrongCurrent" -> tr("كلمة المرور الحالية غير صحيحة.", "Current password is incorrect.")
                            null -> null
                            else -> tr("تعذر تغيير كلمة المرور. حاول مرة أخرى.", "Could not change password. Try again.")
                        }
                        if (statusText != null) {
                            StatusBanner(
                                text = statusText,
                                tone = if (passwordStatus == "saved") "success" else "error"
                            )
                        }

                        PasswordFieldItem(
                            label = tr("كلمة المرور الحالية", "Current password"),
                            value = currentPass,
                            onValueChange = { currentPass = it },
                            show = showPass,
                            onToggleShow = { showPass = !showPass }
                        )
                        PasswordFieldItem(
                            label = tr("كلمة المرور الجديدة (8 أحرف على الأقل)", "New password (at least 8 characters)"),
                            value = nextPass,
                            onValueChange = { nextPass = it },
                            show = showPass,
                            onToggleShow = { showPass = !showPass }
                        )
                        PasswordFieldItem(
                            label = tr("تأكيد كلمة المرور الجديدة", "Confirm new password"),
                            value = confirmPass,
                            onValueChange = { confirmPass = it },
                            show = showPass,
                            onToggleShow = { showPass = !showPass }
                        )

                        Button(
                            onClick = { onChangePassword(currentPass, nextPass, confirmPass) },
                            enabled = !passwordSaving,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = c.primary,
                                contentColor = c.primaryForeground
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            if (passwordSaving) {
                                CircularProgressIndicator(
                                    color = c.primaryForeground,
                                    strokeWidth = 2.dp,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.size(8.dp))
                            }
                            Text(
                                text = tr("تغيير كلمة المرور", "Change password"),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        if (!mustChange) {
            // App Appearance & Language Card
            NsGroupCard(title = tr("إعدادات التطبيق", "App preferences")) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (c.isDark) Icons.Outlined.DarkMode else Icons.Outlined.LightMode,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = tr("تغيير الوضع (المظهر)", "Appearance"),
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                    }
                    SegmentedPills(
                        options = listOf(
                            "system" to tr("حسب الجهاز", "System"),
                            "light" to tr("فاتح", "Light"),
                            "dark" to tr("داكن", "Dark")
                        ),
                        selected = themeMode,
                        onSelect = onSetThemeMode
                    )

                    HorizontalDivider(color = c.border)

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Language,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = tr("تغيير اللغة", "Language"),
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                    }
                    SegmentedPills(
                        options = listOf(
                            "ar" to "العربية",
                            "en" to "English"
                        ),
                        selected = language,
                        onSelect = onSetLanguage
                    )
                }
            }

            // Phone Notifications & Devices Card
            NsGroupCard(
                title = tr("إشعارات الموبايل والأمان", "Phone notifications & security")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (notificationsEnabled) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.NotificationsActive,
                                contentDescription = null,
                                tint = c.success,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = tr("الإشعارات مفعلة على هذا الهاتف", "Notifications are turned on for this phone"),
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = c.success
                            )
                        }
                    } else {
                        StatusBanner(
                            text = tr(
                                "الإشعارات متوقفة لهذا التطبيق. فعّلها ليصلك إشعار عند تغير العمولة أو تسجيل الدخول.",
                                "Notifications are off for this app. Turn them on to get commission and security alerts."
                            ),
                            tone = "error",
                            icon = Icons.Outlined.NotificationsOff,
                            actionLabel = tr("تفعيل", "Turn on"),
                            onAction = {
                                val intent = Intent().apply {
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                        action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                    } else {
                                        action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                                        data = android.net.Uri.fromParts("package", context.packageName, null)
                                    }
                                }
                                runCatching { context.startActivity(intent) }
                            }
                        )
                    }

                    // Send test notification button
                    OutlinedButton(
                        onClick = onSendTestNotification,
                        enabled = testNotifStatus != "sending",
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, c.primary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Send,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Text(
                            text = when (testNotifStatus) {
                                "sending" -> tr("جارٍ الإرسال…", "Sending…")
                                "sent" -> tr("تم إرسال إشعار تجريبي ✓", "Test notification sent ✓")
                                else -> tr("إرسال إشعار تجريبي لهاتفي", "Send test notification to my phone")
                            },
                            fontWeight = FontWeight.SemiBold,
                            color = c.primary
                        )
                    }

                    // Connected phones
                    val devices = accountData?.devices ?: emptyList()
                    if (devices.isNotEmpty()) {
                        HorizontalDivider(color = c.border)
                        Text(
                            text = tr("الهواتف المتصلة (${devices.size})", "Connected phones (${devices.size})"),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground
                        )
                        devices.forEach { dev ->
                            val isFresh = runCatching {
                                dev.lastSeenAt != null && (System.currentTimeMillis() - Instant.parse(dev.lastSeenAt).toEpochMilli()) < 45 * 60 * 1000L
                            }.getOrDefault(false)

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.PhoneAndroid,
                                    contentDescription = null,
                                    tint = c.primary,
                                    modifier = Modifier.size(18.dp)
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = buildString {
                                            append(dev.device ?: tr("هاتف أندرويد", "Android phone"))
                                            if (!dev.appVersion.isNullOrBlank()) append(" · v${dev.appVersion}")
                                        },
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = c.foreground
                                    )
                                    Text(
                                        text = dev.lastSeenAt?.let {
                                            tr("آخر اتصال: ${Format.dateTimeLabel(it, isAr)}", "Last check: ${Format.dateTimeLabel(it, isAr)}")
                                        } ?: tr("لم يتصل بعد", "Never checked"),
                                        fontSize = 11.5.sp,
                                        color = c.mutedForeground
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(if (isFresh) c.successSoft else c.warningSoft)
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = if (isFresh) tr("نشط", "Active") else tr("غير نشط", "Stale"),
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isFresh) c.success else c.warning
                                    )
                                }
                            }
                        }
                    }

                    // Recent Sign-ins
                    val logins = accountData?.logins ?: emptyList()
                    if (logins.isNotEmpty()) {
                        HorizontalDivider(color = c.border)
                        Text(
                            text = tr("آخر عمليات تسجيل الدخول", "Recent sign-ins"),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground
                        )
                        logins.take(5).forEach { login ->
                            val isCurrent = accountData?.sessionId != null && login.sessionId == accountData.sessionId
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Login,
                                    contentDescription = null,
                                    tint = c.mutedForeground,
                                    modifier = Modifier.size(16.dp)
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = login.device,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = c.foreground
                                    )
                                    Text(
                                        text = Format.dateTimeLabel(login.at, isAr),
                                        fontSize = 11.sp,
                                        color = c.mutedForeground
                                    )
                                }
                                if (isCurrent) {
                                    Box(
                                        modifier = Modifier
                                            .clip(CircleShape)
                                            .background(c.muted)
                                            .padding(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = tr("هذا الجهاز", "This session"),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = c.mutedForeground
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Sign Out Button
        OutlinedButton(
            onClick = onSignOut,
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, c.destructive.copy(alpha = 0.5f)),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = c.destructive),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            Icon(imageVector = Icons.AutoMirrored.Outlined.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.size(8.dp))
            Text(text = tr("تسجيل الخروج", "Sign out"), fontWeight = FontWeight.Bold)
        }

        Text(
            text = "NS Commissions Native v${BuildConfig.VERSION_NAME}",
            fontSize = 11.sp,
            color = c.mutedForeground,
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .padding(bottom = 12.dp)
        )
    }
}

@Composable
private fun PasswordFieldItem(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    show: Boolean,
    onToggleShow: () -> Unit
) {
    val c = LocalNsColors.current
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(text = label, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = c.foreground)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = if (show) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = onToggleShow) {
                    Icon(
                        imageVector = if (show) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                        contentDescription = null,
                        tint = c.mutedForeground,
                        modifier = Modifier.size(18.dp)
                    )
                }
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = c.primary,
                unfocusedBorderColor = c.border
            )
        )
    }
}
