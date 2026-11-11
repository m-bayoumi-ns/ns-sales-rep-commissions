package com.naguibselim.commissionsapp.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.R

/**
 * Matches `app/[locale]/login/page.tsx` + `html[data-app] .login-shell / .login-card` in `app/globals.css`:
 * - Clean warm gradient background (`#F8F6F2 -> #EFE9E1` in light mode)
 * - Top action bar with circular Lightbulb Day/Night switcher and Language toggle
 * - Centered white `rounded-[28dp]` card containing:
 *   - Top brand header (`ns_mark` + `ns_wordmark` tinted in `c.primary`, `عمولات المندوبين`)
 *   - `تسجيل الدخول` title + subtitle
 *   - Email/Username & Password inputs (`rounded-xl`)
 *   - "Remember Me" (`تذكرني`) option
 *   - Primary sign-in button
 *   - Biometric (fingerprint) login button
 *   - Dedicated WhatsApp contact support for admin (+20 1277909022)
 *   - Expandable `هل نسيت كلمة المرور؟` help box
 */
@Composable
fun LoginScreen(
    signingIn: Boolean,
    errorCode: String?,
    themeMode: String,
    initialIdentifier: String = "",
    initialRememberMe: Boolean = true,
    hasSavedCredentials: Boolean = false,
    biometricAvailable: Boolean = false,
    onToggleLanguage: () -> Unit,
    onToggleTheme: () -> Unit,
    onSignIn: (String, String, Boolean) -> Unit,
    onBiometricSignIn: (() -> Unit)? = null
) {
    val c = LocalNsColors.current
    val context = LocalContext.current
    var identifier by rememberSaveable { mutableStateOf(initialIdentifier) }
    var password by rememberSaveable { mutableStateOf("") }
    var rememberMe by rememberSaveable { mutableStateOf(initialRememberMe) }
    var showPassword by rememberSaveable { mutableStateOf(false) }

    val errorMessage = when (errorCode) {
        "invalid_input" -> tr("أدخل البريد أو اسم المستخدم وكلمة المرور.", "Enter your email/username and password.")
        "unknown_user" -> tr("هذا اليوزر غير متاح بالنظام. راجع اسم المستخدم أو اطلب حسابك من المسؤول.", "This user is not registered. Check your username or ask the administrator.")
        "invalid_credentials" -> tr("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Incorrect username/email or password.")
        "locked" -> tr("محاولات تسجيل دخول كثيرة. تم إيقاف تسجيل الدخول لمدة 10 دقائق.", "Too many attempts. Sign-in is paused for 10 minutes.")
        "not_configured" -> tr("اتصال الخادم غير مُعد حاليًا.", "Server authentication is not configured.")
        "network_error" -> tr("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.", "Could not reach the server. Check your internet connection.")
        null -> null
        else -> tr("تعذّر تسجيل الدخول. حاول مرة أخرى.", "Could not sign in. Please try again.")
    }

    val shellBrush = if (c.isDark) {
        Brush.verticalGradient(listOf(Color(0xFF14110E), Color(0xFF191511)))
    } else {
        Brush.verticalGradient(listOf(Color(0xFFF8F6F2), Color(0xFFEFE9E1)))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(shellBrush)
            .statusBarsPadding()
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Top Header: Language switcher & Circular Lightbulb theme toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = c.card,
                    border = BorderStroke(1.dp, c.border),
                    shadowElevation = 0.5.dp,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(onClick = onToggleLanguage)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Language,
                            contentDescription = null,
                            tint = c.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = tr("English", "العربية"),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                    }
                }

                // Circular Lightbulb Theme Toggle button with animated transition
                LightbulbThemeToggle(onToggleTheme = onToggleTheme)
            }

            Spacer(modifier = Modifier.height(6.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                shadowElevation = 6.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 26.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Brand Logos (`ns_mark` + `ns_wordmark` tinted in `c.primary`)
                    Image(
                        painter = painterResource(id = R.drawable.ns_mark),
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        colorFilter = ColorFilter.tint(c.primary),
                        modifier = Modifier.size(62.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Image(
                        painter = painterResource(id = R.drawable.ns_wordmark),
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        colorFilter = ColorFilter.tint(c.primary),
                        modifier = Modifier
                            .width(176.dp)
                            .height(28.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = tr("عمولات المندوبين", "Sales Rep Commissions"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = c.mutedForeground
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Title & Subtitle
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = tr("تسجيل الدخول", "Sign in to your account"),
                            fontSize = 21.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                        Text(
                            text = tr(
                                "أدخل البريد الإلكتروني أو اسم المستخدم وكلمة المرور للوصول إلى لوحة العمولات.",
                                "Enter your email or username and password to access your commission dashboard."
                            ),
                            fontSize = 13.sp,
                            color = c.mutedForeground,
                            lineHeight = 18.5.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    if (errorMessage != null) {
                        StatusBanner(
                            text = errorMessage,
                            tone = "error",
                            icon = Icons.Outlined.ErrorOutline
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                    }

                    // Identifier field
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = tr("البريد أو اسم المستخدم", "Email or username"),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = c.foreground
                        )
                        OutlinedTextField(
                            value = identifier,
                            onValueChange = { identifier = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = {
                                Text(
                                    text = tr("name@naguibselim.com أو nsr305", "name@naguibselim.com or nsr305"),
                                    fontSize = 13.5.sp,
                                    color = c.mutedForeground.copy(alpha = 0.7f)
                                )
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border,
                                focusedContainerColor = c.background,
                                unfocusedContainerColor = c.background
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Password field
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = tr("كلمة المرور", "Password"),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = c.foreground
                        )
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            modifier = Modifier.fillMaxWidth(),
                            trailingIcon = {
                                IconButton(onClick = { showPassword = !showPassword }) {
                                    Icon(
                                        imageVector = if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                        contentDescription = null,
                                        tint = c.mutedForeground
                                    )
                                }
                            },
                            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    if (!signingIn) onSignIn(identifier, password, rememberMe)
                                }
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border,
                                focusedContainerColor = c.background,
                                unfocusedContainerColor = c.background
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // "Remember Me" Option
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { rememberMe = !rememberMe }
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Checkbox(
                            checked = rememberMe,
                            onCheckedChange = { rememberMe = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = c.primary,
                                checkmarkColor = c.primaryForeground,
                                uncheckedColor = c.mutedForeground
                            )
                        )
                        Text(
                            text = tr("تذكرني على هذا الجهاز", "Remember me on this device"),
                            fontSize = 13.sp,
                            color = c.foreground,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Primary Sign-in Row (with square fingerprint button placed next to it)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { onSignIn(identifier, password, rememberMe) },
                            enabled = !signingIn,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = c.primary,
                                contentColor = c.primaryForeground
                            )
                        ) {
                            if (signingIn) {
                                CircularProgressIndicator(
                                    color = c.primaryForeground,
                                    strokeWidth = 2.2.dp,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.size(8.dp))
                                Text(
                                    text = tr("جارٍ تسجيل الدخول…", "Signing in…"),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            } else {
                                Text(
                                    text = tr("تسجيل الدخول", "Sign in"),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        // Square Biometric (Fingerprint) Button placed next to the Login Button
                        if (biometricAvailable && onBiometricSignIn != null) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = c.muted.copy(alpha = 0.7f),
                                border = BorderStroke(1.2.dp, c.border),
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable(enabled = !signingIn) { onBiometricSignIn() }
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = LucideIcons.Fingerprint,
                                        contentDescription = tr("تسجيل الدخول بالبصمة", "Sign in with Fingerprint"),
                                        tint = c.primary,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // WhatsApp Admin Support Card with aligned icon and text
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = c.muted.copy(alpha = 0.55f),
                        border = BorderStroke(1.dp, c.border)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val url = "https://wa.me/201277909022?text=" + Uri.encode(
                                        "السلام عليكم، أحتاج مساعدة في تسجيل الدخول لتطبيق عمولات نجيب سليم."
                                    )
                                    try {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                        context.startActivity(intent)
                                    } catch (_: Exception) {
                                        try {
                                            val webIntent = Intent(
                                                Intent.ACTION_VIEW,
                                                Uri.parse("https://api.whatsapp.com/send?phone=201277909022")
                                            )
                                            context.startActivity(webIntent)
                                        } catch (_: Exception) {}
                                    }
                                }
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Circular WhatsApp Logo Button
                            Surface(
                                shape = CircleShape,
                                color = Color(0xFF25D366),
                                shadowElevation = 2.dp,
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = LucideIcons.WhatsApp,
                                        contentDescription = tr("تواصل عبر واتساب", "WhatsApp"),
                                        tint = Color.White,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                            }

                            // Text aligned alongside the WhatsApp icon
                            Text(
                                text = tr(
                                    "إذا واجهتك أي مشكلة في تسجيل الدخول أو حسابك، يرجى التواصل مع المسؤول مباشرة عبر واتساب.",
                                    "If you experience issues logging in or with your account, please contact the administrator via WhatsApp."
                                ),
                                fontSize = 12.sp,
                                color = c.mutedForeground,
                                lineHeight = 17.5.sp,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
