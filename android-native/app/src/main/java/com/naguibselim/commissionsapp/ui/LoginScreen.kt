package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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

@Composable
fun LoginScreen(
    signingIn: Boolean,
    errorCode: String?,
    themeMode: String,
    onToggleLanguage: () -> Unit,
    onToggleTheme: () -> Unit,
    onSignIn: (String, String) -> Unit
) {
    val c = LocalNsColors.current
    var identifier by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background)
            .statusBarsPadding()
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Top controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onToggleLanguage,
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, c.border),
                    modifier = Modifier.height(38.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Language,
                        contentDescription = null,
                        tint = c.foreground,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.size(6.dp))
                    Text(
                        text = tr("English", "العربية"),
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = c.foreground
                    )
                }
                Spacer(modifier = Modifier.size(8.dp))
                IconButton(
                    onClick = onToggleTheme,
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(c.card)
                ) {
                    Icon(
                        imageVector = if (c.isDark) Icons.Outlined.LightMode else Icons.Outlined.DarkMode,
                        contentDescription = null,
                        tint = c.foreground,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Brand Header Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(28.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(c.heroStart, c.heroMid, c.heroEnd)
                        )
                    )
                    .padding(horizontal = 24.dp, vertical = 28.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color.White.copy(alpha = 0.14f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.25f)),
                        modifier = Modifier.size(68.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Image(
                                painter = painterResource(id = R.drawable.splash_mark),
                                contentDescription = null,
                                modifier = Modifier.size(44.dp)
                            )
                        }
                    }
                    Text(
                        text = tr("نجيب سليم", "NAGUIB SELIM"),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFDE68A),
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = tr("عمولات المندوبين", "Sales Rep Commissions"),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = tr(
                            "متابعة لحظية للمبيعات والأهداف والتحصيلات وكشف العمولة",
                            "Live sales, targets, collections & commission statement"
                        ),
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.78f),
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Sign-In Form Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                shadowElevation = 2.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = tr("تسجيل الدخول", "Sign in to your account"),
                        style = MaterialTheme.typography.titleLarge,
                        color = c.foreground
                    )

                    if (errorMessage != null) {
                        StatusBanner(
                            text = errorMessage,
                            tone = "error",
                            icon = Icons.Outlined.ErrorOutline
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = tr("البريد أو اسم المستخدم", "Email or username"),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
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
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Outlined.Person,
                                    contentDescription = null,
                                    tint = c.mutedForeground
                                )
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border,
                                focusedContainerColor = c.card,
                                unfocusedContainerColor = c.card
                            )
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = tr("كلمة المرور", "Password"),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = c.foreground
                        )
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            modifier = Modifier.fillMaxWidth(),
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Outlined.Lock,
                                    contentDescription = null,
                                    tint = c.mutedForeground
                                )
                            },
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
                            shape = RoundedCornerShape(14.dp),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    if (!signingIn) onSignIn(identifier, password)
                                }
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = c.primary,
                                unfocusedBorderColor = c.border,
                                focusedContainerColor = c.card,
                                unfocusedContainerColor = c.card
                            )
                        )
                    }

                    Button(
                        onClick = { onSignIn(identifier, password) },
                        enabled = !signingIn,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = c.primary,
                            contentColor = c.primaryForeground
                        )
                    ) {
                        if (signingIn) {
                            CircularProgressIndicator(
                                color = c.primaryForeground,
                                strokeWidth = 2.5.dp,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.size(10.dp))
                            Text(
                                text = tr("جارٍ تسجيل الدخول…", "Signing in…"),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        } else {
                            Text(
                                text = tr("تسجيل الدخول", "Sign in"),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Text(
                        text = tr(
                            "تتم إدارة الصلاحيات وكلمات المرور من قِبل المسؤول. تحتاج حسابًا؟ تواصل مع الدعم الفني.",
                            "Permissions and passwords are managed by administrators. Need an account? Contact IT support."
                        ),
                        fontSize = 12.sp,
                        color = c.mutedForeground,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = tr("إعداد: محمود بيومي", "Prepared by: Mahmoud Bayoumi"),
                fontSize = 11.5.sp,
                color = c.mutedForeground
            )
        }
    }
}
