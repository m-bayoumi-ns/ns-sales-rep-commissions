package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.data.ApiException
import com.naguibselim.commissionsapp.data.AdminAccount
import com.naguibselim.commissionsapp.data.AdminAccountAction
import com.naguibselim.commissionsapp.data.AdminAccountsResponse
import com.naguibselim.commissionsapp.data.AdminSheetRep
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.coroutines.launch
import kotlinx.coroutines.CancellationException

@Composable
fun AdminAccountsScreen(viewModel: AppViewModel) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var data by remember { mutableStateOf<AdminAccountsResponse?>(null) }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    var statusIsError by remember { mutableStateOf(false) }
    var loadKey by remember { mutableIntStateOf(0) }
    var confirmBulk by remember { mutableStateOf(false) }
    var creationResults by remember { mutableStateOf<List<com.naguibselim.commissionsapp.data.AdminCreateResult>>(emptyList()) }

    LaunchedEffect(loadKey) {
        loading = true
        try {
            data = viewModel.adminAccounts()
        } catch (error: ApiException.SignedOut) {
            viewModel.signOut()
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            status = adminErrorMessage(error, context.getString(R.string.admin_error))
            statusIsError = true
        } finally {
            loading = false
        }
    }

    val perform: (AdminAccountAction) -> Unit = { action ->
        if (!busy) {
            busy = true
            status = null
            statusIsError = false
            scope.launch {
                try {
                    val result = viewModel.adminAccountAction(action)
                    if (!result.ok) {
                        status = result.reason ?: result.error ?: context.getString(R.string.admin_error)
                        statusIsError = true
                    } else {
                        if (result.results.isNotEmpty()) creationResults = result.results
                        status = if (result.results.any { it.status == "error" }) {
                            context.getString(R.string.admin_creation_failed_count, result.results.count { it.status == "error" })
                        } else context.getString(R.string.admin_action_saved)
                        statusIsError = result.results.any { it.status == "error" }
                        loadKey++
                    }
                } catch (error: ApiException.SignedOut) {
                    viewModel.signOut()
                } catch (error: CancellationException) {
                    throw error
                } catch (error: Exception) {
                    status = adminErrorMessage(error, context.getString(R.string.admin_error))
                    statusIsError = true
                } finally {
                    busy = false
                }
            }
        }
    }

    val sheet = data?.sheet
    val missing = sheet?.reps?.filter { it.account == null }.orEmpty()
    Column(Modifier.fillMaxSize()) {
        status?.let {
            Text(it, color = if (statusIsError) androidx.compose.material3.MaterialTheme.colorScheme.error else androidx.compose.material3.MaterialTheme.colorScheme.primary, modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp))
        }
        when {
            loading && data == null -> Column(Modifier.fillMaxWidth().weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                CircularProgressIndicator()
            }
            data == null -> Column(Modifier.fillMaxWidth().weight(1f).padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(stringResource(R.string.admin_error), color = androidx.compose.material3.MaterialTheme.colorScheme.error)
                OutlinedButton(onClick = {
                    status = null
                    statusIsError = false
                    loadKey++
                }) { Text(stringResource(R.string.retry)) }
            }
            else -> {
                val current = data!!
                LazyColumn(
                    Modifier.weight(1f),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item {
                        SectionCard(stringResource(R.string.admin_registration)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(stringResource(R.string.admin_auto_approve), fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                                    Text(stringResource(R.string.admin_auto_approve_hint), style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
                                }
                                Switch(
                                    checked = current.autoApprove,
                                    onCheckedChange = { perform(AdminAccountAction("autoApprove", value = JsonPrimitive(it))) },
                                    enabled = !busy,
                                )
                            }
                            Spacer(Modifier.height(8.dp))
                            AdminSelectField(
                                stringResource(R.string.admin_android_download),
                                current.androidDownload,
                                listOf("native" to stringResource(R.string.admin_native_app), "web" to stringResource(R.string.admin_web_app)),
                                { perform(AdminAccountAction("androidDownload", value = JsonPrimitive(it))) },
                            )
                        }
                    }
                    if (sheet != null) {
                        item {
                            SectionCard(
                                stringResource(R.string.admin_sheet_reps, sheet.month),
                                stringResource(R.string.admin_sheet_accounts_hint, current.defaultPassword),
                            ) {
                                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(stringResource(R.string.admin_missing_count, missing.size), modifier = Modifier.weight(1f))
                                    Button(onClick = { confirmBulk = true }, enabled = missing.isNotEmpty() && !busy) {
                                        Text(stringResource(R.string.admin_create_all))
                                    }
                                }
                            }
                        }
                        items(sheet.reps, key = { "sheet-${it.name}" }) { rep ->
                            SheetRepAdminCard(
                                rep = rep,
                                defaultPassword = current.defaultPassword,
                                busy = busy,
                                onAction = perform,
                            )
                        }
                    } else {
                        item { SectionCard(stringResource(R.string.admin_sheet_missing_title)) { Text(stringResource(R.string.admin_sheet_missing_body)) } }
                    }
                    item {
                        SectionCard(stringResource(R.string.admin_other_accounts)) {
                            if (current.accounts.isEmpty()) Text(stringResource(R.string.admin_no_other_accounts))
                            else Text(stringResource(R.string.admin_other_accounts_hint), style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
                        }
                    }
                    items(current.accounts, key = { "account-${it.id}" }) { account ->
                        AccountAdminCard(account, busy, perform)
                    }
                    if (creationResults.isNotEmpty()) {
                        item {
                            SectionCard(stringResource(R.string.admin_created_accounts)) {
                                creationResults.forEach { account ->
                                    Text(
                                        when (account.status) {
                                            "created" -> stringResource(R.string.admin_created_credential, account.name, account.username, current.defaultPassword)
                                            "exists" -> stringResource(R.string.admin_account_exists, account.name)
                                            else -> stringResource(R.string.admin_creation_error, account.name, account.detail ?: "")
                                        },
                                        color = if (account.status == "error") androidx.compose.material3.MaterialTheme.colorScheme.error else androidx.compose.material3.MaterialTheme.colorScheme.onSurface,
                                    )
                                }
                                Text(stringResource(R.string.admin_created_hint), style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
                if (loading) CircularProgressIndicator(Modifier.padding(10.dp))
            }
        }
    }

    if (confirmBulk) {
        AlertDialog(
            onDismissRequest = { confirmBulk = false },
            title = { Text(stringResource(R.string.admin_create_all_title)) },
            text = { Text(stringResource(R.string.admin_create_all_confirm, missing.size, data?.defaultPassword.orEmpty())) },
            confirmButton = {
                TextButton(onClick = {
                    confirmBulk = false
                    perform(AdminAccountAction("createSheetAccounts", names = emptyList()))
                }) { Text(stringResource(R.string.admin_create)) }
            },
            dismissButton = { TextButton(onClick = { confirmBulk = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }
}

@Composable
private fun SheetRepAdminCard(rep: AdminSheetRep, defaultPassword: String, busy: Boolean, onAction: (AdminAccountAction) -> Unit) {
    var username by remember(rep.name, rep.username) { mutableStateOf(rep.username) }
    var displayName by remember(rep.name, rep.displayName) { mutableStateOf(rep.displayName) }
    SectionCard(rep.name) {
        rep.account?.lastSignIn?.let {
            Text(stringResource(R.string.admin_last_sign_in, it), style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
        }
        AdminTextField(
            id = "display-name-${rep.name}",
            label = stringResource(R.string.admin_display_name),
            value = displayName,
            onValueChange = { displayName = it },
            modifier = Modifier.fillMaxWidth(),
            supporting = stringResource(R.string.admin_display_name_hint),
        )
        OutlinedButton(
            onClick = {
                if (displayName.length <= 120) {
                        onAction(AdminAccountAction("displayName", repName = rep.name, value = JsonPrimitive(displayName)))
                }
            },
            enabled = !busy,
        ) { Text(stringResource(R.string.admin_save_display_name)) }
        AdminTextField(
            id = "rep-username-${rep.name}",
            label = stringResource(R.string.admin_username),
            value = username,
            onValueChange = { username = it },
            modifier = Modifier.fillMaxWidth(),
            supporting = rep.account?.email ?: stringResource(R.string.admin_username_hint),
        )
        OutlinedButton(
            onClick = {
                onAction(AdminAccountAction("username", userId = rep.account?.id, repName = rep.name, username = username))
            },
            enabled = !busy,
        ) { Text(stringResource(R.string.admin_save_username)) }
        if (rep.account == null) {
            Button(
                onClick = { onAction(AdminAccountAction("createSheetAccounts", names = listOf(rep.name))) },
                enabled = !busy,
            ) { Text(stringResource(R.string.admin_create_account, defaultPassword)) }
        } else {
            AccountSwitches(rep.account, busy, onAction)
        }
    }
}

@Composable
private fun AccountAdminCard(account: AdminAccount, busy: Boolean, onAction: (AdminAccountAction) -> Unit) {
    SectionCard(account.name, account.username?.let { "$it · ${account.email}" } ?: account.email) {
        account.lastSignIn?.let { Text(stringResource(R.string.admin_last_sign_in, it), style = androidx.compose.material3.MaterialTheme.typography.bodySmall) }
        AccountSwitches(account, busy, onAction)
    }
}

@Composable
private fun AccountSwitches(account: AdminAccount, busy: Boolean, onAction: (AdminAccountAction) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(stringResource(if (account.active) R.string.admin_active else R.string.admin_pending))
            Text(stringResource(R.string.admin_active_hint), style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
        }
        Switch(
            checked = account.active,
            onCheckedChange = { onAction(AdminAccountAction("active", userId = account.id, value = JsonPrimitive(it))) },
            enabled = !busy,
        )
    }
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(stringResource(R.string.admin_force_password))
            Text(stringResource(R.string.admin_force_password_hint), style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
        }
        Switch(
            checked = account.mustChangePassword,
            onCheckedChange = { onAction(AdminAccountAction("forcePassword", userId = account.id, value = JsonPrimitive(it))) },
            enabled = !busy,
        )
    }
}
