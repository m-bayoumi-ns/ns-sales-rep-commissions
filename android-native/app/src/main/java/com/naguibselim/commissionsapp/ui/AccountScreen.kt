package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
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
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Settings
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.data.AccountPayload
import com.naguibselim.commissionsapp.data.UserProfile
import com.naguibselim.commissionsapp.notify.Notifier

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
    onOpenAdminSettings: (() -> Unit)? = null,
    onOpenAdminAccounts: (() -> Unit)? = null,
    onSignOut: () -> Unit
) {
    val c = LocalNsColors.current
    val context = LocalContext.current
    val user = accountData?.user ?: fallbackUser

    if (loading && user == null) {
        NsLoadingCard()
        return
    }

    val mustChange = user?.mustChangePassword == true
    var passwordExpanded by rememberSaveable(mustChange) { mutableStateOf(mustChange) }
    var appearanceExpanded by rememberSaveable { mutableStateOf(false) }
    var languageExpanded by rememberSaveable { mutableStateOf(false) }

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
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = c.foreground,
            modifier = Modifier.padding(horizontal = 4.dp)
        )

        if (mustChange) {
            StatusBanner(
                text = tr(
                    "طلب المسؤول تغيير كلمة المرور قبل المتابعة.",
                    "An administrator asked you to choose a new password before continuing."
                ),
                tone = "warn",
                icon = Icons.Outlined.WarningAmber
            )
        }

        // 1. Identity + Change Password Card (`rounded-3xl border bg-card shadow-sm`)
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
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(c.accent),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = LucideIcons.UserRound,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = user?.displayName?.ifBlank { user.name } ?: "—",
                                fontSize = 15.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = c.foreground,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false)
                            )
                            val roleLabel = when (user?.role) {
                                "admin" -> tr("مسؤول", "Administrator")
                                "manager" -> tr("مدير", "Manager")
                                else -> tr("مندوب مبيعات", "Sales rep")
                            }
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(Color(0xFF5A3A1D))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = roleLabel,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White
                                )
                            }
                        }
                        if (!user?.email.isNullOrBlank()) {
                            LtrText(
                                text = user?.email ?: "",
                                fontSize = 12.sp,
                                color = c.mutedForeground
                            )
                        }
                    }
                }

                HorizontalDivider(thickness = 1.dp, color = c.border)

                // Expandable Change Password Disclosure (`account-password-disclosure`)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = !mustChange) { passwordExpanded = !passwordExpanded }
                        .padding(horizontal = 20.dp, vertical = 16.dp),
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
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                    }
                    if (!mustChange) {
                        Icon(
                            imageVector = if (passwordExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                            contentDescription = null,
                            tint = c.mutedForeground,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                if (passwordExpanded) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 20.dp, end = 20.dp, bottom = 20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        passwordStatus?.let { code ->
                            val (tone, msg) = when (code) {
                                "saved" -> "success" to tr("تم تغيير كلمة المرور.", "Password changed.")
                                "invalid" -> "error" to tr("أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل.", "Enter your current password and a new one of at least 8 characters.")
                                "mismatch" -> "error" to tr("كلمتا المرور الجديدتان غير متطابقتين.", "The new passwords do not match.")
                                "same" -> "error" to tr("اختر كلمة مرور مختلفة عن الحالية.", "Choose a password different from the current one.")
                                "wrongCurrent" -> "error" to tr("كلمة المرور الحالية غير صحيحة.", "The current password is not correct.")
                                else -> "error" to tr("تعذر تغيير كلمة المرور. حاول مرة أخرى.", "The password could not be changed. Try again.")
                            }
                            StatusBanner(text = msg, tone = tone)
                        }

                        val visual = if (showPass) VisualTransformation.None else PasswordVisualTransformation()

                        OutlinedTextField(
                            value = currentPass,
                            onValueChange = { currentPass = it },
                            label = { Text(tr("كلمة المرور الحالية", "Current password")) },
                            singleLine = true,
                            visualTransformation = visual,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            trailingIcon = {
                                IconButton(onClick = { showPass = !showPass }) {
                                    Icon(
                                        imageVector = if (showPass) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                        contentDescription = null
                                    )
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = nextPass,
                            onValueChange = { nextPass = it },
                            label = { Text(tr("كلمة المرور الجديدة (8 أحرف على الأقل)", "New password (at least 8 characters)")) },
                            singleLine = true,
                            visualTransformation = visual,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = confirmPass,
                            onValueChange = { confirmPass = it },
                            label = { Text(tr("تأكيد كلمة المرور الجديدة", "Confirm new password")) },
                            singleLine = true,
                            visualTransformation = visual,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border
                            ),
                            modifier = Modifier.fillMaxWidth()
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
                            } else {
                                Text(
                                    text = tr("تغيير كلمة المرور", "Change password"),
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        if (!mustChange) {
            // 2. Phone Notifications Card (`phone-notifications-android rounded-3xl border bg-card p-4 shadow-sm`)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                shadowElevation = 1.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = tr("إشعارات الهاتف", "Phone notifications"),
                        fontSize = 15.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.foreground
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.NotificationsActive,
                            contentDescription = null,
                            tint = if (notificationsEnabled) c.success else c.warning,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = if (notificationsEnabled) {
                                tr("إشعارات الهاتف مفعلة وتعمل على هذا الجهاز", "Phone notifications are active on this device")
                            } else {
                                tr("يرجى تفعيل صلاحية الإشعارات لهذا التطبيق", "Please allow notifications for this app")
                            },
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (notificationsEnabled) c.success else c.warning
                        )
                    }

                    OutlinedButton(
                        onClick = onSendTestNotification,
                        enabled = testNotifStatus != "sending",
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, c.border),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (testNotifStatus == "sending") {
                            CircularProgressIndicator(
                                color = c.primary,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(
                            text = when (testNotifStatus) {
                                "sent" -> tr("تم إرسال إشعار تجريبي ✓", "Test notification sent ✓")
                                else -> tr("إرسال إشعار تجريبي", "Send test notification")
                            },
                            color = if (testNotifStatus == "sent") c.success else c.foreground,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Admin Quick Links (only for admins)
            if (user?.role == "admin" && (onOpenAdminSettings != null || onOpenAdminAccounts != null)) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    color = c.card,
                    border = BorderStroke(1.dp, c.border),
                    shadowElevation = 1.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = tr("الإدارة", "Administration"),
                            fontSize = 15.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            if (onOpenAdminSettings != null) {
                                OutlinedButton(
                                    onClick = onOpenAdminSettings,
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, c.border),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                ) {
                                    Icon(Icons.Outlined.Settings, contentDescription = null, tint = c.primary, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(tr("إعدادات العمولات", "Settings"), fontSize = 13.sp, color = c.foreground)
                                }
                            }
                            if (onOpenAdminAccounts != null) {
                                OutlinedButton(
                                    onClick = onOpenAdminAccounts,
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, c.border),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                ) {
                                    Icon(Icons.Outlined.Groups, contentDescription = null, tint = c.primary, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(tr("حسابات المندوبين", "Accounts"), fontSize = 13.sp, color = c.foreground)
                                }
                            }
                        }
                    }
                }
            }

            // 3. App Preferences Card (`AccountControls` in `account-controls.tsx`)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                shadowElevation = 1.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = tr("إعدادات التطبيق", "App preferences"),
                        fontSize = 15.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.foreground
                    )

                    // Change Appearance expandable box
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, c.border, RoundedCornerShape(12.dp))
                            .clickable { appearanceExpanded = !appearanceExpanded }
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
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
                                    imageVector = Icons.Outlined.LightMode,
                                    contentDescription = null,
                                    tint = c.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = tr("تغيير الوضع", "Change appearance"),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = c.foreground
                                )
                            }
                            Icon(
                                imageVector = if (appearanceExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                                contentDescription = null,
                                tint = c.mutedForeground,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        if (appearanceExpanded) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                PreferenceChoiceButton(
                                    label = tr("فاتح", "Light"),
                                    icon = Icons.Outlined.LightMode,
                                    selected = !c.isDark,
                                    onClick = { onSetThemeMode("light") },
                                    modifier = Modifier.weight(1f)
                                )
                                PreferenceChoiceButton(
                                    label = tr("داكن", "Dark"),
                                    icon = Icons.Outlined.DarkMode,
                                    selected = c.isDark,
                                    onClick = { onSetThemeMode("dark") },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Change Language expandable box
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, c.border, RoundedCornerShape(12.dp))
                            .clickable { languageExpanded = !languageExpanded }
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
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
                                    imageVector = Icons.Outlined.Language,
                                    contentDescription = null,
                                    tint = c.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = tr("تغيير اللغة", "Change language"),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = c.foreground
                                )
                            }
                            Icon(
                                imageVector = if (languageExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                                contentDescription = null,
                                tint = c.mutedForeground,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        if (languageExpanded) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                PreferenceChoiceButton(
                                    label = "العربية",
                                    selected = language != "en",
                                    onClick = { onSetLanguage("ar") },
                                    modifier = Modifier.weight(1f)
                                )
                                PreferenceChoiceButton(
                                    label = "English",
                                    selected = language == "en",
                                    onClick = { onSetLanguage("en") },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Sign Out Button (`h-14 w-full rounded-xl bg-destructive-soft text-base font-semibold text-destructive`)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(c.destructiveSoft)
                            .clickable(onClick = onSignOut),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Outlined.Logout,
                                contentDescription = null,
                                tint = c.destructive,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = tr("تسجيل الخروج", "Sign out"),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = c.destructive
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
private fun PreferenceChoiceButton(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null
) {
    val c = LocalNsColors.current
    Box(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) c.accent else c.card)
            .border(1.dp, if (selected) c.primary else c.border, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (selected) c.primary else c.mutedForeground,
                    modifier = Modifier.size(16.dp)
                )
            }
            Text(
                text = label,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.Medium,
                color = if (selected) c.primary else c.mutedForeground
            )
        }
    }
}
