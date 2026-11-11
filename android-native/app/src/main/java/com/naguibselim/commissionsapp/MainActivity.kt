package com.naguibselim.commissionsapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.naguibselim.commissionsapp.notify.Notifier
import com.naguibselim.commissionsapp.ui.AccountScreen
import com.naguibselim.commissionsapp.ui.AdminAccountsScreen
import com.naguibselim.commissionsapp.ui.AdminSettingsScreen
import com.naguibselim.commissionsapp.ui.AppUiState
import com.naguibselim.commissionsapp.ui.AppViewModel
import com.naguibselim.commissionsapp.ui.CommissionsScreen
import com.naguibselim.commissionsapp.ui.LocalNsColors
import com.naguibselim.commissionsapp.ui.LoginScreen
import com.naguibselim.commissionsapp.ui.MainNavDestination
import com.naguibselim.commissionsapp.ui.NsTheme
import com.naguibselim.commissionsapp.ui.SellerSection
import com.naguibselim.commissionsapp.ui.tr

class MainActivity : ComponentActivity() {
    private val viewModel: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        Notifier.ensureChannels(this)
        handleIncomingIntent(intent)

        setContent {
            val state by viewModel.state.collectAsState()
            val context = LocalContext.current

            val notifPermissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission()
            ) { _ -> }

            LaunchedEffect(state.signedIn) {
                if (state.signedIn && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    val granted = ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.POST_NOTIFICATIONS
                    ) == PackageManager.PERMISSION_GRANTED
                    if (!granted) {
                        notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }

            NsTheme(
                themeMode = state.themeMode,
                language = state.language
            ) {
                if (!state.signedIn) {
                    LoginScreen(
                        signingIn = state.signingIn,
                        errorCode = state.signInError,
                        themeMode = state.themeMode,
                        onToggleLanguage = { viewModel.toggleLanguage() },
                        onToggleTheme = {
                            val next = when (state.themeMode) {
                                "dark" -> "light"
                                "light" -> "dark"
                                else -> "dark"
                            }
                            viewModel.setThemeMode(next)
                        },
                        onSignIn = { id, pass -> viewModel.signIn(id, pass) }
                    )
                } else {
                    MainAuthenticatedShell(
                        state = state,
                        viewModel = viewModel
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return
        val extraPath = intent.getStringExtra("ns_path")
        viewModel.handleDeepLink(intent.data, extraPath)
    }
}

@Composable
private fun MainAuthenticatedShell(
    state: AppUiState,
    viewModel: AppViewModel
) {
    val c = LocalNsColors.current
    val currentUser = state.commissionsData?.user
        ?: state.accountData?.user
        ?: state.forcedPasswordUser
    val isAdmin = currentUser?.role == "admin"
    val isForcedPassword = state.forcedPasswordUser != null

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = c.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            NsTopAppBar(
                userName = currentUser?.displayName ?: currentUser?.name,
                role = currentUser?.role,
                themeMode = state.themeMode,
                onToggleLanguage = { viewModel.toggleLanguage() },
                onToggleTheme = {
                    val next = when (state.themeMode) {
                        "dark" -> "light"
                        "light" -> "dark"
                        else -> "dark"
                    }
                    viewModel.setThemeMode(next)
                }
            )
        },
        bottomBar = {
            if (!isForcedPassword) {
                NsBottomBar(
                    isAdmin = isAdmin,
                    hasSingleSellerDetail = state.commissionsData?.detail != null && !isAdmin,
                    navDestination = state.navDestination,
                    sellerSection = state.sellerSection,
                    onSelectDestination = { viewModel.navigateTo(it) },
                    onSelectSellerSection = { viewModel.selectSellerSection(it) }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (isForcedPassword) {
                AccountScreen(
                    loading = state.loadingAccount,
                    accountData = state.accountData,
                    fallbackUser = state.forcedPasswordUser,
                    passwordSaving = state.passwordSaving,
                    passwordStatus = state.passwordStatus,
                    testNotifStatus = state.testNotifStatus,
                    themeMode = state.themeMode,
                    language = state.language,
                    onChangePassword = { cur, nxt, cfm -> viewModel.changePassword(cur, nxt, cfm) },
                    onSendTestNotification = { viewModel.sendTestNotification() },
                    onSetThemeMode = { viewModel.setThemeMode(it) },
                    onSetLanguage = { viewModel.setLanguage(it) },
                    onSignOut = { viewModel.signOut() }
                )
            } else {
                when (state.navDestination) {
                    MainNavDestination.COMMISSIONS -> {
                        CommissionsScreen(
                            loading = state.loadingCommissions,
                            refreshing = state.refreshingCommissions,
                            errorCode = state.commissionsError,
                            errorEmail = state.commissionsEmail,
                            payload = state.commissionsData,
                            section = state.sellerSection,
                            notifications = state.notifications,
                            showNotificationsSheet = state.showNotificationsSheet,
                            onSelectSection = { viewModel.selectSellerSection(it) },
                            onSelectMonth = { viewModel.selectMonth(it) },
                            onSelectRep = { viewModel.selectRep(it) },
                            onRefresh = { viewModel.loadCommissions(isRefresh = true) },
                            onOpenNotifications = { viewModel.openNotifications(it) },
                            onOpenAdminSettings = {
                                viewModel.navigateTo(MainNavDestination.ADMIN_SETTINGS)
                            },
                            onSignOut = { viewModel.signOut() }
                        )
                    }

                    MainNavDestination.ACCOUNT -> {
                        AccountScreen(
                            loading = state.loadingAccount,
                            accountData = state.accountData,
                            fallbackUser = currentUser,
                            passwordSaving = state.passwordSaving,
                            passwordStatus = state.passwordStatus,
                            testNotifStatus = state.testNotifStatus,
                            themeMode = state.themeMode,
                            language = state.language,
                            onChangePassword = { cur, nxt, cfm -> viewModel.changePassword(cur, nxt, cfm) },
                            onSendTestNotification = { viewModel.sendTestNotification() },
                            onSetThemeMode = { viewModel.setThemeMode(it) },
                            onSetLanguage = { viewModel.setLanguage(it) },
                            onSignOut = { viewModel.signOut() }
                        )
                    }

                    MainNavDestination.ADMIN_SETTINGS -> {
                        AdminSettingsScreen(
                            loading = state.loadingAdminSettings,
                            saving = state.savingAdminSettings,
                            status = state.adminSettingsStatus,
                            payload = state.adminSettingsData,
                            onSelectMonth = { m -> viewModel.loadAdminSettings(m) },
                            onSearchProducts = { q -> viewModel.searchProducts(q) },
                            onSave = { settings, mode, userIds, note ->
                                viewModel.saveAdminSettings(settings, mode, userIds, note)
                            }
                        )
                    }

                    MainNavDestination.ADMIN_ACCOUNTS -> {
                        AdminAccountsScreen(
                            payload = state.adminAccountsData,
                            loading = state.loadingAdminAccounts,
                            busy = state.adminAccountsBusy,
                            toast = state.adminAccountsToast,
                            onRefresh = { viewModel.loadAdminAccounts() },
                            onExecutePatch = { body, ar, en ->
                                viewModel.executeAccountPatch(body, ar, en)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NsTopAppBar(
    userName: String?,
    role: String?,
    themeMode: String,
    onToggleLanguage: () -> Unit,
    onToggleTheme: () -> Unit
) {
    val c = LocalNsColors.current
    Surface(
        color = c.card,
        shadowElevation = 1.dp
    ) {
        Column(modifier = Modifier.statusBarsPadding()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.splash_mark),
                        contentDescription = null,
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(9.dp))
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = tr("عمولات المندوبين", "Sales Rep Commissions"),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = c.foreground,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (!userName.isNullOrBlank()) {
                            val roleLabel = when (role) {
                                "admin" -> tr("مسؤول", "Admin")
                                "manager" -> tr("مدير", "Manager")
                                else -> tr("مندوب مبيعات", "Sales Rep")
                            }
                            Text(
                                text = "$userName · $roleLabel",
                                fontSize = 11.5.sp,
                                color = c.mutedForeground,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = c.muted,
                        border = BorderStroke(1.dp, c.border),
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .clickable(onClick = onToggleLanguage)
                    ) {
                        Text(
                            text = tr("EN", "عربي"),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }

                    IconButton(
                        onClick = onToggleTheme,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = if (c.isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode,
                            contentDescription = null,
                            tint = c.mutedForeground,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
            }
            HorizontalDivider(thickness = 1.dp, color = c.border)
        }
    }
}

private data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val active: Boolean,
    val onClick: () -> Unit
)

@Composable
private fun NsBottomBar(
    isAdmin: Boolean,
    hasSingleSellerDetail: Boolean,
    navDestination: MainNavDestination,
    sellerSection: SellerSection,
    onSelectDestination: (MainNavDestination) -> Unit,
    onSelectSellerSection: (SellerSection) -> Unit
) {
    val c = LocalNsColors.current

    val items = if (isAdmin) {
        listOf(
            BottomNavItem(
                label = tr("العمولات", "Commissions"),
                icon = Icons.Outlined.Payments,
                active = navDestination == MainNavDestination.COMMISSIONS,
                onClick = { onSelectDestination(MainNavDestination.COMMISSIONS) }
            ),
            BottomNavItem(
                label = tr("الإعدادات", "Settings"),
                icon = Icons.Outlined.Settings,
                active = navDestination == MainNavDestination.ADMIN_SETTINGS,
                onClick = { onSelectDestination(MainNavDestination.ADMIN_SETTINGS) }
            ),
            BottomNavItem(
                label = tr("الحسابات", "Accounts"),
                icon = Icons.Outlined.Groups,
                active = navDestination == MainNavDestination.ADMIN_ACCOUNTS,
                onClick = { onSelectDestination(MainNavDestination.ADMIN_ACCOUNTS) }
            ),
            BottomNavItem(
                label = tr("حسابي", "My Account"),
                icon = Icons.Outlined.Person,
                active = navDestination == MainNavDestination.ACCOUNT,
                onClick = { onSelectDestination(MainNavDestination.ACCOUNT) }
            )
        )
    } else if (hasSingleSellerDetail) {
        listOf(
            BottomNavItem(
                label = tr("الملخص", "Summary"),
                icon = Icons.Outlined.Dashboard,
                active = navDestination == MainNavDestination.COMMISSIONS && sellerSection == SellerSection.SUMMARY,
                onClick = { onSelectSellerSection(SellerSection.SUMMARY) }
            ),
            BottomNavItem(
                label = tr("المبيعات", "Sales"),
                icon = Icons.Outlined.Analytics,
                active = navDestination == MainNavDestination.COMMISSIONS && sellerSection == SellerSection.SALES,
                onClick = { onSelectSellerSection(SellerSection.SALES) }
            ),
            BottomNavItem(
                label = tr("التحصيل", "Collections"),
                icon = Icons.Outlined.AccountBalanceWallet,
                active = navDestination == MainNavDestination.COMMISSIONS && sellerSection == SellerSection.COLLECTIONS,
                onClick = { onSelectSellerSection(SellerSection.COLLECTIONS) }
            ),
            BottomNavItem(
                label = tr("كشف العمولة", "Statement"),
                icon = Icons.Outlined.ReceiptLong,
                active = navDestination == MainNavDestination.COMMISSIONS && sellerSection == SellerSection.STATEMENT,
                onClick = { onSelectSellerSection(SellerSection.STATEMENT) }
            ),
            BottomNavItem(
                label = tr("حسابي", "Account"),
                icon = Icons.Outlined.Person,
                active = navDestination == MainNavDestination.ACCOUNT,
                onClick = { onSelectDestination(MainNavDestination.ACCOUNT) }
            )
        )
    } else {
        listOf(
            BottomNavItem(
                label = tr("العمولات", "Commissions"),
                icon = Icons.Outlined.Payments,
                active = navDestination == MainNavDestination.COMMISSIONS,
                onClick = { onSelectDestination(MainNavDestination.COMMISSIONS) }
            ),
            BottomNavItem(
                label = tr("حسابي", "My Account"),
                icon = Icons.Outlined.Person,
                active = navDestination == MainNavDestination.ACCOUNT,
                onClick = { onSelectDestination(MainNavDestination.ACCOUNT) }
            )
        )
    }

    Surface(
        color = c.card,
        shadowElevation = 8.dp
    ) {
        Column(modifier = Modifier.navigationBarsPadding()) {
            HorizontalDivider(thickness = 1.dp, color = c.border)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 6.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEach { item ->
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .clickable(onClick = item.onClick)
                            .padding(vertical = 6.dp, horizontal = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (item.active) c.accent else androidx.compose.ui.graphics.Color.Transparent)
                                .padding(horizontal = 14.dp, vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label,
                                tint = if (item.active) c.primary else c.mutedForeground,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Text(
                            text = item.label,
                            fontSize = 10.5.sp,
                            fontWeight = if (item.active) FontWeight.Bold else FontWeight.Medium,
                            color = if (item.active) c.primary else c.mutedForeground,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}
