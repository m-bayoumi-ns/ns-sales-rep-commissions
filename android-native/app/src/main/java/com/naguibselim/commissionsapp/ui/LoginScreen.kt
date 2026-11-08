package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.naguibselim.commissionsapp.R

@Composable
fun LoginScreen(viewModel: AppViewModel) {
    val state by viewModel.signIn.collectAsStateWithLifecycle()
    var identifier by rememberSaveable { mutableStateOf(viewModel.lastIdentifier) }
    var password by remember { mutableStateOf("") }
    var showPassword by rememberSaveable { mutableStateOf(false) }
    val canSubmit = identifier.trim().length >= 2 && password.isNotEmpty() && !state.busy
    val submit = { if (canSubmit) viewModel.signIn(identifier, password) }

    Surface(color = MaterialTheme.colorScheme.background, modifier = Modifier.fillMaxSize()) {
        Box(
            Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            contentAlignment = Alignment.Center,
        ) {
            Column(Modifier.widthIn(max = 440.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Image(
                    painter = painterResource(R.drawable.splash_mark),
                    contentDescription = null,
                    modifier = Modifier.size(72.dp).clip(CircleShape),
                )
                Spacer(Modifier.height(16.dp))
                Text(stringResource(R.string.login_title), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                Spacer(Modifier.height(6.dp))
                Text(stringResource(R.string.login_subtitle), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                Spacer(Modifier.height(24.dp))

                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                ) {
                    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        OutlinedTextField(
                            value = identifier,
                            onValueChange = { identifier = it },
                            label = { Text(stringResource(R.string.login_identifier)) },
                            placeholder = { Text(stringResource(R.string.login_identifier_hint)) },
                            leadingIcon = { Icon(Icons.Filled.Person, contentDescription = null) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                            modifier = Modifier.fillMaxWidth(),
                        )
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text(stringResource(R.string.login_password)) },
                            leadingIcon = { Icon(Icons.Filled.Lock, contentDescription = null) },
                            trailingIcon = {
                                TextButton(onClick = { showPassword = !showPassword }) {
                                    Text(stringResource(if (showPassword) R.string.login_hide else R.string.login_show))
                                }
                            },
                            singleLine = true,
                            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = { submit() }),
                            modifier = Modifier.fillMaxWidth(),
                        )
                        state.problem?.let { problem ->
                            NoticeBanner(text = problemText(problem), warn = true)
                        }
                        Button(onClick = submit, enabled = canSubmit, modifier = Modifier.fillMaxWidth().height(52.dp), shape = RoundedCornerShape(14.dp)) {
                            if (state.busy) {
                                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                                Spacer(Modifier.size(10.dp))
                                Text(stringResource(R.string.login_submitting))
                            } else {
                                Text(stringResource(R.string.login_submit), fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text(
                    stringResource(R.string.login_help),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
