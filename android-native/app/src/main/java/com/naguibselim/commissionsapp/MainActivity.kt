package com.naguibselim.commissionsapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.SystemUpdate
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.zIndex
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.naguibselim.commissionsapp.data.AppUpdateInfo
import com.naguibselim.commissionsapp.notify.Notifier
import com.naguibselim.commissionsapp.ui.AccountScreen
import com.naguibselim.commissionsapp.ui.AdminAccountsScreen
import com.naguibselim.commissionsapp.ui.AdminSettingsScreen
import com.naguibselim.commissionsapp.ui.AppUiState
import com.naguibselim.commissionsapp.ui.AppViewModel
import com.naguibselim.commissionsapp.ui.CommissionsScreen
import com.naguibselim.commissionsapp.ui.LocalNsColors
import com.naguibselim.commissionsapp.ui.LoginScreen
import com.naguibselim.commissionsapp.ui.LtrText
import com.naguibselim.commissionsapp.ui.LucideIcons
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

                // Mandatory Update Pop-up Box
                state.mandatoryUpdate?.let { updateInfo ->
                    MandatoryUpdateDialog(
                        update = updateInfo,
                        onDownload = {
                            runCatching {
                                val dlIntent = Intent(Intent.ACTION_VIEW, Uri.parse(updateInfo.downloadUrl)).apply {
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                context.startActivity(dlIntent)
                            }
                        },
                        onDismiss = { viewModel.dismissUpdateDialog() },
                        onRecheck = { viewModel.checkAppUpdate() }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.checkAppUpdate()
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
    val isForcedPassword = state.forcedPasswordUser != null

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = c.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            if (!isForcedPassword) {
                NsAndroidBottomNav(
                    navDestination = state.navDestination,
                    sellerSection = state.sellerSection,
                    onSelectAccount = { viewModel.navigateTo(MainNavDestination.ACCOUNT) },
                    onSelectSellerSection = { viewModel.selectSellerSection(it) }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
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
                            salesResetTick = state.salesResetTick,
                            notifications = state.notifications,
                            showNotificationsSheet = state.showNotificationsSheet,
                            onSelectSection = { viewModel.selectSellerSection(it) },
                            onSelectMonth = { viewModel.selectMonth(it) },
                            onSelectRep = { viewModel.selectRep(it) },
                            onRefresh = { viewModel.loadCommissions(isRefresh = true) },
                            onOpenNotifications = { viewModel.openNotifications(it) },
                            onToggleTheme = {
                                val next = if (c.isDark) "light" else "dark"
                                viewModel.setThemeMode(next)
                            },
                            onOpenAdminSettings = {
                                viewModel.navigateTo(MainNavDestination.ADMIN_SETTINGS)
                            },
                            onOpenAdminAccounts = {
                                viewModel.navigateTo(MainNavDestination.ADMIN_ACCOUNTS)
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
                            onOpenAdminSettings = {
                                viewModel.navigateTo(MainNavDestination.ADMIN_SETTINGS)
                            },
                            onOpenAdminAccounts = {
                                viewModel.navigateTo(MainNavDestination.ADMIN_ACCOUNTS)
                            },
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

/**
 * Matches `components/layout/android-bottom-nav.tsx` and Screenshots 1, 2, 3, 4:
 * Fixed `dir="rtl"` 5-column bottom bar:
 * [الحساب (Right)] [المبيعات] [Floating NS Circle: الرئيسية (Center)] [التحصيل] [الكشف (Left)]
 */
@Composable
private fun NsAndroidBottomNav(
    navDestination: MainNavDestination,
    sellerSection: SellerSection,
    onSelectAccount: () -> Unit,
    onSelectSellerSection: (SellerSection) -> Unit
) {
    val c = LocalNsColors.current
    val isCommissions = navDestination == MainNavDestination.COMMISSIONS
    val isAccount = navDestination == MainNavDestination.ACCOUNT
    val isSummary = isCommissions && sellerSection == SellerSection.SUMMARY
    val isSales = isCommissions && sellerSection == SellerSection.SALES
    val isCollections = isCommissions && sellerSection == SellerSection.COLLECTIONS
    val isStatement = isCommissions && sellerSection == SellerSection.STATEMENT

    // Animated warm brown gradient for the center floating NS button (`.android-home-button`)
    val infinite = rememberInfiniteTransition(label = "homeBtnGradient")
    val shift by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 5000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "gradientShift"
    )
    val homeBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFF4A2D16),
            Color(0xFF76502F),
            Color(0xFFA77543),
            Color(0xFF59371E),
            Color(0xFF4A2D16)
        ),
        start = Offset(shift * 80f, 0f),
        end = Offset(160f + shift * 80f, 160f)
    )

    val accountLabel = tr("الحساب", "Account")
    val salesLabel = tr("المبيعات", "Sales")
    val homeLabel = tr("الرئيسية", "Home")
    val collectionsLabel = tr("التحصيل", "Collections")
    val statementLabel = tr("الكشف", "Statement")

    // Always RTL layout order matching `dir="rtl"` in `android-bottom-nav.tsx`
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Transparent)
        ) {
            // Protruding curved arch behind the floating center button (`-top-4 size-[4.5rem] rounded-t-full border-x border-t bg-card`)
            val domeShape = RoundedCornerShape(topStart = 36.dp, topEnd = 36.dp)
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-16).dp)
                    .size(72.dp)
                    .clip(domeShape)
                    .background(c.card)
                    .border(1.dp, c.border, domeShape)
                    .zIndex(0f)
            )

            // Main bar surface (`h-16 border-t bg-card/95`)
            Surface(
                color = c.card,
                shadowElevation = 8.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .zIndex(1f)
            ) {
                Column(modifier = Modifier.navigationBarsPadding()) {
                    HorizontalDivider(thickness = 1.dp, color = c.border)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(64.dp)
                            .padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // 1. Account (Rightmost in RTL)
                        BottomNavSideItem(
                            label = accountLabel,
                            icon = LucideIcons.UserRound,
                            selected = isAccount,
                            onClick = onSelectAccount,
                            modifier = Modifier.weight(1f)
                        )

                        // 2. Sales (Second from right)
                        BottomNavSideItem(
                            label = salesLabel,
                            icon = LucideIcons.ShoppingCart,
                            selected = isSales,
                            onClick = { onSelectSellerSection(SellerSection.SALES) },
                            modifier = Modifier.weight(1f)
                        )

                        // 3. Center slot for Home ("الرئيسية") label below the floating circle
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    onClick = { onSelectSellerSection(SellerSection.SUMMARY) }
                                )
                                .padding(bottom = 8.dp),
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            Text(
                                text = homeLabel,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSummary) c.primary else c.mutedForeground,
                                maxLines = 1
                            )
                        }

                        // 4. Collections (Second from left)
                        BottomNavSideItem(
                            label = collectionsLabel,
                            icon = LucideIcons.HandCoins,
                            selected = isCollections,
                            onClick = { onSelectSellerSection(SellerSection.COLLECTIONS) },
                            modifier = Modifier.weight(1f)
                        )

                        // 5. Statement (Leftmost in RTL)
                        BottomNavSideItem(
                            label = statementLabel,
                            icon = LucideIcons.FileText,
                            selected = isStatement,
                            onClick = { onSelectSellerSection(SellerSection.STATEMENT) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Floating Center NS Circle Button (`-top-7 size-14 rounded-full border-4 border-background shadow-md`)
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-26).dp)
                    .zIndex(2f)
                    .size(56.dp)
                    .shadow(elevation = 6.dp, shape = CircleShape)
                    .clip(CircleShape)
                    .background(homeBrush)
                    .border(4.dp, c.background, CircleShape)
                    .clickable { onSelectSellerSection(SellerSection.SUMMARY) },
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ns_mark),
                    contentDescription = homeLabel,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.size(36.dp)
                )
            }
        }
    }
}

@Composable
private fun BottomNavSideItem(
    label: String,
    icon: ImageVector,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val c = LocalNsColors.current
    val tint = if (selected) c.primary else c.mutedForeground
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = tint,
            modifier = Modifier.size(20.dp)
        )
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            color = tint,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

@Composable
private fun MandatoryUpdateDialog(
    update: AppUpdateInfo,
    onDownload: () -> Unit,
    onDismiss: () -> Unit,
    onRecheck: () -> Unit
) {
    val c = LocalNsColors.current
    val sizeMbStr = if (update.bytes > 0) {
        String.format(java.util.Locale.US, "%.1f MB", update.bytes.toDouble() / (1024.0 * 1024.0))
    } else null

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            shape = RoundedCornerShape(28.dp),
            color = c.card,
            border = BorderStroke(1.dp, c.border),
            shadowElevation = 12.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header Badge with NS Mark & System Update Icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(c.heroStart, c.heroMid, c.heroEnd)
                            )
                        )
                        .border(1.5.dp, c.primary.copy(alpha = 0.35f), RoundedCornerShape(20.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.ns_mark),
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.size(38.dp)
                    )
                }

                Text(
                    text = tr("تحديث جديد متاح للتطبيق", "App Update Available"),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = c.foreground,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = tr(
                        "يتوفر إصدار جديد من تطبيق عمولات المندوبين. يرجى تحميل وتثبيت التحديث الجديد للاستفادة من أحدث الميزات والإصلاحات.",
                        "A new version of the Sales Rep Commissions app is available. Please download and install the new version to get the latest features and fixes."
                    ),
                    fontSize = 13.5.sp,
                    color = c.mutedForeground,
                    textAlign = TextAlign.Center,
                    lineHeight = 20.sp
                )

                // Version pill
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = c.accent,
                    border = BorderStroke(1.dp, c.primary.copy(alpha = 0.2f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.SystemUpdate,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        LtrText(
                            text = "v${update.currentVersion} → v${update.version}" + (sizeMbStr?.let { " · $it" } ?: ""),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.primary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = onDownload,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = c.primary,
                        contentColor = c.primaryForeground
                    )
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Download,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = tr("تحميل التحديث الآن", "Download Update"),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onRecheck) {
                        Text(
                            text = tr("إعادة الفحص", "Check Again"),
                            fontSize = 13.sp,
                            color = c.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    TextButton(onClick = onDismiss) {
                        Text(
                            text = tr("المتابعة للتطبيق", "Continue to App"),
                            fontSize = 13.sp,
                            color = c.mutedForeground,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
