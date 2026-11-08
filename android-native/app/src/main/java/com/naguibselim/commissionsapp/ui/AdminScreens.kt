package com.naguibselim.commissionsapp.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.naguibselim.commissionsapp.R

enum class AdminPage { Settings, Accounts }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreens(viewModel: AppViewModel, initialPage: AdminPage, initialMonth: String?, onBack: () -> Unit) {
    var page by remember(initialPage) { mutableStateOf(initialPage) }
    var hasUnsavedChanges by remember { mutableStateOf(false) }
    var pendingPage by remember { mutableStateOf<AdminPage?>(null) }
    var confirmExit by remember { mutableStateOf(false) }
    val leave = {
        if (hasUnsavedChanges) confirmExit = true else onBack()
    }
    val selectPage: (AdminPage) -> Unit = { next ->
        if (page != next) {
            if (hasUnsavedChanges) pendingPage = next else page = next
        }
    }
    BackHandler(onBack = leave)
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(if (page == AdminPage.Settings) R.string.admin_settings else R.string.manage_accounts)) },
                navigationIcon = {
                    IconButton(onClick = leave) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            TabRow(selectedTabIndex = if (page == AdminPage.Settings) 0 else 1) {
                Tab(
                    selected = page == AdminPage.Settings,
                    onClick = { selectPage(AdminPage.Settings) },
                    text = { Text(stringResource(R.string.admin_settings)) },
                )
                Tab(
                    selected = page == AdminPage.Accounts,
                    onClick = { selectPage(AdminPage.Accounts) },
                    text = { Text(stringResource(R.string.manage_accounts)) },
                )
            }
            when (page) {
                AdminPage.Settings -> AdminSettingsScreen(viewModel, initialMonth) { hasUnsavedChanges = it }
                AdminPage.Accounts -> AdminAccountsScreen(viewModel)
            }
        }
    }
    pendingPage?.let { next ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { pendingPage = null },
            title = { Text(stringResource(R.string.admin_discard_title)) },
            text = { Text(stringResource(R.string.admin_discard_body)) },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    page = next
                    pendingPage = null
                    hasUnsavedChanges = false
                }) { Text(stringResource(R.string.admin_discard)) }
            },
            dismissButton = { androidx.compose.material3.TextButton(onClick = { pendingPage = null }) { Text(stringResource(R.string.cancel)) } },
        )
    }
    if (confirmExit) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { confirmExit = false },
            title = { Text(stringResource(R.string.admin_discard_title)) },
            text = { Text(stringResource(R.string.admin_discard_body)) },
            confirmButton = {
                androidx.compose.material3.TextButton(onClick = {
                    confirmExit = false
                    hasUnsavedChanges = false
                    onBack()
                }) { Text(stringResource(R.string.admin_discard)) }
            },
            dismissButton = { androidx.compose.material3.TextButton(onClick = { confirmExit = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }
}
