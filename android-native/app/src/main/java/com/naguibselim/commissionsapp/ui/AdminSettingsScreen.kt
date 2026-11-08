package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.data.ApiException
import com.naguibselim.commissionsapp.data.AdminNotify
import com.naguibselim.commissionsapp.data.AdminSettingsResponse
import com.naguibselim.commissionsapp.data.AdminSettingsUpdate
import com.naguibselim.commissionsapp.data.BonusStep
import com.naguibselim.commissionsapp.data.CommissionEditSettings
import com.naguibselim.commissionsapp.data.ProductRule
import com.naguibselim.commissionsapp.data.ProductVariant
import com.naguibselim.commissionsapp.data.Tier
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun AdminSettingsScreen(viewModel: AppViewModel, initialMonth: String?, onDirtyChanged: (Boolean) -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var month by rememberSaveable(initialMonth) { mutableStateOf(initialMonth.orEmpty()) }
    var loadKey by remember { mutableIntStateOf(0) }
    var response by remember { mutableStateOf<AdminSettingsResponse?>(null) }
    var settings by remember { mutableStateOf<CommissionEditSettings?>(null) }
    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var dirty by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    var statusIsError by remember { mutableStateOf(false) }
    var notifyMode by rememberSaveable { mutableStateOf("all") }
    var notifyUsers by rememberSaveable { mutableStateOf(emptyList<String>()) }
    var notifyNote by rememberSaveable { mutableStateOf("") }
    var pendingMonth by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(dirty) { onDirtyChanged(dirty) }

    LaunchedEffect(loadKey) {
        loading = true
        try {
            val loaded = viewModel.adminSettings(month.ifBlank { null })
            response = loaded
            settings = loaded.settings
            month = loaded.month
            dirty = loaded.source != "saved"
            notifyUsers = emptyList()
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

    val update: ((CommissionEditSettings) -> CommissionEditSettings) -> Unit = { transform ->
        settings = settings?.let(transform)
        dirty = true
        status = null
    }
    val save: () -> Unit = {
        val current = settings
        if (current != null && !saving) {
            saving = true
            status = null
            scope.launch {
                try {
                    val clean = current.copy(
                        products = current.products.filter { it.templateId > 0 },
                        rules = current.rules.copy(salesBonuses = current.rules.salesBonuses.filter { it.amount > 0 }),
                    )
                    val saved = viewModel.saveAdminSettings(
                        AdminSettingsUpdate(clean, AdminNotify(notifyMode, if (notifyMode == "users") notifyUsers else emptyList(), notifyNote.takeIf { notifyMode != "none" && it.isNotBlank() })),
                    )
                    dirty = false
                    status = context.getString(R.string.admin_saved, if (saved.notified == -1) context.getString(R.string.admin_notified_all) else if (saved.notified > 0) context.getString(R.string.admin_notified_some, saved.notified) else "")
                    statusIsError = false
                    notifyNote = ""
                    loadKey++
                } catch (error: ApiException.SignedOut) {
                    viewModel.signOut()
                } catch (error: CancellationException) {
                    throw error
                } catch (error: Exception) {
                    status = adminErrorMessage(error, context.getString(R.string.admin_error))
                    statusIsError = true
                } finally {
                    saving = false
                }
            }
        }
    }

    Column(Modifier.fillMaxSize()) {
        response?.let { data ->
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(stringResource(R.string.month), style = MaterialTheme.typography.labelLarge)
                MonthSelect(month, data.months) {
                    if (dirty) pendingMonth = it
                    else {
                        status = null
                        statusIsError = false
                        month = it
                        loadKey++
                    }
                }
            }

            pendingMonth?.let { next ->
                AlertDialog(
                    onDismissRequest = { pendingMonth = null },
                    title = { Text(stringResource(R.string.admin_discard_title)) },
                    text = { Text(stringResource(R.string.admin_discard_body)) },
                    confirmButton = {
                        TextButton(onClick = {
                            status = null
                            statusIsError = false
                            month = next
                            pendingMonth = null
                            loadKey++
                        }) { Text(stringResource(R.string.admin_discard)) }
                    },
                    dismissButton = { TextButton(onClick = { pendingMonth = null }) { Text(stringResource(R.string.cancel)) } },
                )
            }
        }
        status?.let {
            Text(it, color = if (statusIsError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
        }
        when {
            loading && response == null -> Column(Modifier.fillMaxWidth().weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                CircularProgressIndicator()
            }
            response == null || settings == null -> Column(Modifier.fillMaxWidth().weight(1f).padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(stringResource(R.string.admin_error), color = MaterialTheme.colorScheme.error)
                OutlinedButton(onClick = {
                    status = null
                    statusIsError = false
                    loadKey++
                }) { Text(stringResource(R.string.retry)) }
            }
            else -> {
                val data = response!!
                val current = settings!!
                LazyColumn(
                    Modifier.weight(1f),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item { SourceCard(data) }
                    item {
                        PriceRangesCard(
                            settings = current,
                            update = update,
                        )
                    }
                    item {
                        ProductsAdminCard(
                            settings = current,
                            viewModel = viewModel,
                            update = update,
                        )
                    }
                    item { RulesAdminCard(current, update) }
                    item {
                        SectionCard(stringResource(R.string.admin_targets), stringResource(R.string.admin_targets_hint)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                AdminSelectField(
                                    stringResource(R.string.admin_range_unit),
                                    current.rules.rangeUnit,
                                    listOf("amount" to stringResource(R.string.admin_egp), "qty" to stringResource(R.string.admin_units)),
                                    { value -> update { it.copy(rules = it.rules.copy(rangeUnit = value)) } },
                                    Modifier.weight(1f),
                                )
                                AdminSelectField(
                                    stringResource(R.string.admin_digital_unit),
                                    current.rules.categoryUnits.digital,
                                    listOf("amount" to stringResource(R.string.admin_egp), "qty" to stringResource(R.string.admin_units)),
                                    { value -> update { it.copy(rules = it.rules.copy(categoryUnits = it.rules.categoryUnits.copy(digital = value))) } },
                                    Modifier.weight(1f),
                                )
                            }
                            Spacer(Modifier.height(8.dp))
                            current.reps.forEachIndexed { index, rep ->
                                key(rep.name) { RepTargetsCard(rep, index, data, update) }
                            }
                            if (current.reps.isEmpty()) Text(stringResource(R.string.admin_no_reps), color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    item {
                        NotifyAdminCard(
                            accounts = data.accounts,
                            mode = notifyMode,
                            selected = notifyUsers,
                            note = notifyNote,
                            onMode = { notifyMode = it },
                            onSelected = { id -> notifyUsers = if (id in notifyUsers) notifyUsers - id else notifyUsers + id },
                            onNote = { notifyNote = it },
                        )
                    }
                }
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Button(onClick = save, enabled = dirty && !saving && current.products.none { it.templateId <= 0 }) {
                        if (saving) CircularProgressIndicator(Modifier.height(18.dp), strokeWidth = 2.dp)
                        else Text(stringResource(R.string.admin_save))
                    }
                    if (dirty && !saving) Text(stringResource(R.string.admin_unsaved), color = MaterialTheme.colorScheme.tertiary, style = MaterialTheme.typography.bodySmall)
                    if (loading) CircularProgressIndicator(Modifier.height(18.dp), strokeWidth = 2.dp)
                }
            }
        }
    }
}

@Composable
private fun MonthSelect(month: String, months: List<String>, onSelect: (String) -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    androidx.compose.foundation.layout.Box {
        TextButton(onClick = { expanded = true }) { Text(month) }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            months.forEach { option ->
                DropdownMenuItem(text = { Text(option) }, onClick = { expanded = false; onSelect(option) })
            }
        }
    }
}

@Composable
private fun SourceCard(data: AdminSettingsResponse) {
    SectionCard(stringResource(R.string.admin_month_status)) {
        val source = when (data.source) {
            "saved" -> stringResource(R.string.admin_source_saved)
            "inherited" -> stringResource(R.string.admin_source_inherited, data.inheritedFrom ?: "—")
            else -> stringResource(R.string.admin_source_default)
        }
        Text(source, style = MaterialTheme.typography.bodyMedium)
        Text(
            if (data.sheet.found) stringResource(R.string.admin_sheet_found, data.sheet.count, data.sheet.path) else stringResource(R.string.admin_sheet_missing, data.sheet.path),
            style = MaterialTheme.typography.bodySmall,
            color = if (data.sheet.found) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.error,
        )
        data.settings.updatedAt?.let { Text(stringResource(R.string.admin_last_saved, it, data.settings.updatedBy ?: "—"), style = MaterialTheme.typography.bodySmall) }
    }
}

@Composable
private fun PriceRangesCard(settings: CommissionEditSettings, update: ((CommissionEditSettings) -> CommissionEditSettings) -> Unit) {
    SectionCard(stringResource(R.string.admin_ranges), stringResource(R.string.admin_ranges_hint)) {
        settings.tiers.forEachIndexed { index, tier ->
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(stringResource(R.string.admin_range_name, ('A'.code + index).toChar()), fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                AdminFieldRow {
                    AdminNumberField("tier-$index-from", stringResource(R.string.admin_from), tier.from, { value ->
                        update { it.copy(tiers = it.tiers.mapIndexed { i, old -> if (i == index) old.copy(from = value ?: 0.0) else old }) }
                    }, Modifier.weight(1f), suffix = stringResource(R.string.admin_egp))
                    AdminNumberField("tier-$index-to", stringResource(R.string.admin_to), tier.to, { value ->
                        update { it.copy(tiers = it.tiers.mapIndexed { i, old -> if (i == index) old.copy(to = value) else old }) }
                    }, Modifier.weight(1f), optional = true, suffix = stringResource(R.string.admin_egp))
                    AdminNumberField("tier-$index-rate", stringResource(R.string.admin_rate), tier.rate, { value ->
                        update { it.copy(tiers = it.tiers.mapIndexed { i, old -> if (i == index) old.copy(rate = value ?: 0.0) else old }) }
                    }, Modifier.weight(1f), suffix = "%")
                }
                if (index < settings.tiers.lastIndex) HorizontalDivider(Modifier.padding(vertical = 5.dp))
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                onClick = { update { it.copy(tiers = it.tiers + Tier(0.0, null, 0.0)) } },
                enabled = settings.tiers.size < 6,
            ) { Text(stringResource(R.string.admin_add_range)) }
            if (settings.tiers.size > 1) OutlinedButton(onClick = { update { it.copy(tiers = it.tiers.dropLast(1)) } }) { Text(stringResource(R.string.admin_remove_range)) }
        }
    }
}

@Composable
private fun ProductsAdminCard(settings: CommissionEditSettings, viewModel: AppViewModel, update: ((CommissionEditSettings) -> CommissionEditSettings) -> Unit) {
    SectionCard(stringResource(R.string.admin_products), stringResource(R.string.admin_products_hint)) {
        AdminFieldRow {
            AdminNumberField("category-rate-slow", stringResource(R.string.admin_slow_rate), settings.categoryRates.slow, { value ->
                update { it.copy(categoryRates = it.categoryRates.copy(slow = value ?: 0.0)) }
            }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("category-rate-digital", stringResource(R.string.admin_digital_rate), settings.categoryRates.digital, { value ->
                update { it.copy(categoryRates = it.categoryRates.copy(digital = value ?: 0.0)) }
            }, Modifier.weight(1f), suffix = "%")
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = { update { it.copy(products = it.products + ProductRule("native-${System.nanoTime()}", 0, "", category = "slow")) } }) {
                Text(stringResource(R.string.admin_add_slow))
            }
            OutlinedButton(onClick = { update { it.copy(products = it.products + ProductRule("native-${System.nanoTime()}", 0, "", category = "digital")) } }) {
                Text(stringResource(R.string.admin_add_digital))
            }
        }
        settings.products.forEachIndexed { index, product ->
            key(product.key) {
                AdminProductRow(
                    product = product,
                    viewModel = viewModel,
                    onChange = { patched -> update { it.copy(products = it.products.mapIndexed { i, old -> if (i == index) old.copy(
                        templateId = patched.templateId,
                        templateName = patched.templateName,
                        code = patched.code,
                        variantId = patched.variantId,
                        color = patched.color,
                        category = patched.category,
                    ) else old }) } },
                    onRemove = { update { it.copy(products = it.products.filterIndexed { i, _ -> i != index }) } },
                )
            }
        }
        if (settings.products.isEmpty()) Text(stringResource(R.string.admin_no_products), color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun AdminProductRow(product: ProductRule, viewModel: AppViewModel, onChange: (ProductRule) -> Unit, onRemove: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current
    var query by rememberSaveable(product.key) { mutableStateOf(product.templateName) }
    var results by remember { mutableStateOf(emptyList<com.naguibselim.commissionsapp.data.ProductSearchResult>()) }
    var variants by remember(product.key) { mutableStateOf(emptyList<ProductVariant>()) }
    var loading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var shouldSearch by remember(product.key) { mutableStateOf(false) }
    LaunchedEffect(query, shouldSearch) {
        if (!shouldSearch) return@LaunchedEffect
        if (query.trim().length < 2) {
            results = emptyList()
        } else {
            delay(350)
            loading = true
            errorMessage = null
            try {
                results = viewModel.searchAdminProducts(query)
            } catch (error: ApiException.SignedOut) {
                viewModel.signOut()
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                results = emptyList()
                errorMessage = adminErrorMessage(error, context.getString(R.string.admin_error))
            } finally {
                loading = false
            }
        }
    }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        androidx.compose.foundation.layout.Box {
            AdminTextField(
                id = "product-${product.key}",
                label = stringResource(R.string.admin_product),
                value = query,
                onValueChange = { query = it; shouldSearch = true },
                modifier = Modifier.fillMaxWidth(),
                supporting = if (loading) stringResource(R.string.admin_searching) else null,
            )
            DropdownMenu(expanded = results.isNotEmpty(), onDismissRequest = { results = emptyList() }) {
                results.forEach { result ->
                    DropdownMenuItem(
                        text = { Text(result.name) },
                        onClick = {
                            query = result.name
                            shouldSearch = false
                            results = emptyList()
                            variants = result.variants
                            errorMessage = null
                            onChange(product.copy(templateId = result.templateId, templateName = result.name, code = result.code, variantId = null, color = null))
                        },
                    )
                }
            }
        }
        AdminFieldRow {
            val colorOptions = listOf("" to stringResource(R.string.admin_all_colors)) +
                variants.map { it.id.toString() to (it.color ?: "#${it.id}") } +
                product.variantId?.let { listOf(it.toString() to (product.color ?: "#$it")) }.orEmpty()
            AdminSelectField(
                stringResource(R.string.admin_color),
                product.variantId?.toString() ?: "",
                colorOptions.distinctBy { it.first },
                { value ->
                    val variant = value.toLongOrNull()
                    onChange(product.copy(variantId = variant, color = variants.firstOrNull { it.id == variant }?.color ?: if (variant == null) null else product.color))
                },
                Modifier.weight(1f),
            )
            AdminSelectField(
                stringResource(R.string.admin_category),
                product.category,
                listOf("slow" to stringResource(R.string.cat_slow), "digital" to stringResource(R.string.cat_digital)),
                { onChange(product.copy(category = it)) },
                Modifier.weight(1f),
            )
            TextButton(onClick = onRemove) { Text(stringResource(R.string.admin_remove), color = MaterialTheme.colorScheme.error) }
        }
        if (product.templateId > 0 && variants.isEmpty()) {
            TextButton(
                onClick = {
                    if (!loading) {
                        loading = true
                        // Existing rules need an explicit lookup to avoid loading every product's variants at once.
                        scope.launch {
                            try {
                                variants = viewModel.searchAdminProducts(product.code ?: product.templateName)
                                    .firstOrNull { it.templateId == product.templateId }?.variants.orEmpty()
                            } catch (error: ApiException.SignedOut) {
                                viewModel.signOut()
                            } catch (error: CancellationException) {
                                throw error
                            } catch (error: Exception) {
                                errorMessage = adminErrorMessage(error, context.getString(R.string.admin_error))
                            } finally {
                                loading = false
                            }
                        }
                    }
                },
            ) { Text(stringResource(if (loading) R.string.admin_searching else R.string.admin_load_colors)) }
        }
        errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
        if (product.templateId == 0L) Text(stringResource(R.string.admin_choose_product), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun RulesAdminCard(settings: CommissionEditSettings, update: ((CommissionEditSettings) -> CommissionEditSettings) -> Unit) {
    val rules = settings.rules
    fun changeRule(transform: (com.naguibselim.commissionsapp.data.Rules) -> com.naguibselim.commissionsapp.data.Rules) = update { it.copy(rules = transform(it.rules)) }
    SectionCard(stringResource(R.string.admin_rules), stringResource(R.string.admin_rules_hint)) {
        AdminFieldRow {
            AdminNumberField("rule-all-targets", stringResource(R.string.admin_all_targets_bonus), rules.allTargetsBonusPct, { value -> changeRule { it.copy(allTargetsBonusPct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-slow-min", stringResource(R.string.admin_slow_min), rules.slowMinPct, { value -> changeRule { it.copy(slowMinPct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-slow-deduction", stringResource(R.string.admin_slow_deduction), rules.slowDeductionPct, { value -> changeRule { it.copy(slowDeductionPct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
        }
        AdminFieldRow {
            AdminNumberField("rule-cash-share", stringResource(R.string.admin_cash_share), rules.cashSharePct, { value -> changeRule { it.copy(cashSharePct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-cash-bonus", stringResource(R.string.admin_cash_bonus), rules.cashBonus, { value -> changeRule { it.copy(cashBonus = value ?: 0.0) } }, Modifier.weight(1f), suffix = stringResource(R.string.admin_egp))
            AdminNumberField("rule-cash-min", stringResource(R.string.admin_cash_min), rules.cashMinAchievementPct, { value -> changeRule { it.copy(cashMinAchievementPct = value) } }, Modifier.weight(1f), optional = true, suffix = "%")
        }
        AdminFieldRow {
            AdminNumberField("rule-collection-pct", stringResource(R.string.admin_collection_threshold), rules.collectionPct, { value -> changeRule { it.copy(collectionPct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-collection-bonus", stringResource(R.string.admin_collection_bonus), rules.collectionBonus, { value -> changeRule { it.copy(collectionBonus = value ?: 0.0) } }, Modifier.weight(1f), suffix = stringResource(R.string.admin_egp))
            AdminNumberField("rule-collection-min", stringResource(R.string.admin_collection_min), rules.collectionMinAchievementPct, { value -> changeRule { it.copy(collectionMinAchievementPct = value) } }, Modifier.weight(1f), optional = true, suffix = "%")
        }
        AdminFieldRow {
            AdminNumberField("rule-low-pct", stringResource(R.string.admin_low_threshold), rules.lowAchievementPct, { value -> changeRule { it.copy(lowAchievementPct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-low-rate", stringResource(R.string.admin_low_rate), rules.lowRate, { value -> changeRule { it.copy(lowRate = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-old-until", stringResource(R.string.admin_old_until), rules.oldSystemUntilPct, { value -> changeRule { it.copy(oldSystemUntilPct = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
        }
        AdminFieldRow {
            AdminSelectField(
                stringResource(R.string.admin_old_mode),
                rules.oldSystemMode,
                listOf("base" to stringResource(R.string.admin_old_base), "rate" to stringResource(R.string.admin_old_rate_mode)),
                { value -> changeRule { it.copy(oldSystemMode = value) } },
                Modifier.weight(1f),
            )
            if (rules.oldSystemMode == "rate") AdminNumberField("rule-old-rate", stringResource(R.string.admin_old_rate), rules.oldRate, { value -> changeRule { it.copy(oldRate = value ?: 0.0) } }, Modifier.weight(1f), suffix = "%")
            AdminNumberField("rule-minimum-sales", stringResource(R.string.admin_minimum_sales), rules.minimumSales, { value -> changeRule { it.copy(minimumSales = value ?: 0.0) } }, Modifier.weight(1f), suffix = stringResource(R.string.admin_egp))
        }
        Spacer(Modifier.height(4.dp))
        Text(stringResource(R.string.admin_details), style = MaterialTheme.typography.titleSmall)
        listOf(
            "A" to stringResource(R.string.admin_range_name, 'A'),
            "B" to stringResource(R.string.admin_range_name, 'B'),
            "C" to stringResource(R.string.admin_range_name, 'C'),
            "slow" to stringResource(R.string.cat_slow),
            "digital" to stringResource(R.string.cat_digital),
        ).forEach { (key, label) ->
            val checked = when (key) {
                "A" -> rules.statementDetails.A
                "B" -> rules.statementDetails.B
                "C" -> rules.statementDetails.C
                "slow" -> rules.statementDetails.slow
                else -> rules.statementDetails.digital
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked, onCheckedChange = { value ->
                    changeRule {
                        val old = it.statementDetails
                        it.copy(statementDetails = when (key) {
                            "A" -> old.copy(A = value)
                            "B" -> old.copy(B = value)
                            "C" -> old.copy(C = value)
                            "slow" -> old.copy(slow = value)
                            else -> old.copy(digital = value)
                        })
                    }
                })
                Text(label)
            }
        }
        HorizontalDivider(Modifier.padding(vertical = 8.dp))
        Text(stringResource(R.string.admin_sales_ladder), style = MaterialTheme.typography.titleSmall)
        settings.rules.salesBonuses.forEachIndexed { index, step ->
            AdminFieldRow {
                AdminNumberField("bonus-$index-from", stringResource(R.string.admin_from), step.from, { value ->
                    changeRule { it.copy(salesBonuses = it.salesBonuses.mapIndexed { i, old -> if (i == index) old.copy(from = value ?: 0.0) else old }) }
                }, Modifier.weight(1f), suffix = stringResource(R.string.admin_egp))
                AdminNumberField("bonus-$index-to", stringResource(R.string.admin_to), step.to, { value ->
                    changeRule { it.copy(salesBonuses = it.salesBonuses.mapIndexed { i, old -> if (i == index) old.copy(to = value) else old }) }
                }, Modifier.weight(1f), optional = true, suffix = stringResource(R.string.admin_egp))
                AdminNumberField("bonus-$index-amount", stringResource(R.string.admin_bonus), step.amount, { value ->
                    changeRule { it.copy(salesBonuses = it.salesBonuses.mapIndexed { i, old -> if (i == index) old.copy(amount = value ?: 0.0) else old }) }
                }, Modifier.weight(1f), suffix = stringResource(R.string.admin_egp))
                TextButton(onClick = { changeRule { it.copy(salesBonuses = it.salesBonuses.filterIndexed { i, _ -> i != index }) } }) {
                    Text(stringResource(R.string.admin_remove), color = MaterialTheme.colorScheme.error)
                }
            }
        }
        OutlinedButton(onClick = { changeRule { it.copy(salesBonuses = it.salesBonuses + BonusStep(0.0, null, 0.0)) } }, enabled = settings.rules.salesBonuses.size < 20) {
            Text(stringResource(R.string.admin_add_bonus))
        }
    }
}

@Composable
private fun RepTargetsCard(rep: RepSetting, index: Int, data: AdminSettingsResponse, update: ((CommissionEditSettings) -> CommissionEditSettings) -> Unit) {
    SectionCard(rep.name) {
        val candidates = data.candidates.map { it.id.toString() to it.name }
        val odooOptions = listOf("" to stringResource(R.string.admin_not_linked)) + rep.odooUserId?.let { id ->
            if (candidates.none { it.first == id.toString() }) listOf(id.toString() to "#$id") else emptyList()
        }.orEmpty() + candidates
        AdminSelectField(
            stringResource(R.string.admin_odoo_user),
            rep.odooUserId?.toString() ?: "",
            odooOptions.distinctBy { it.first },
            { selected -> update { it.copy(reps = it.reps.mapIndexed { i, old -> if (i == index) old.copy(odooUserId = selected.toLongOrNull()) else old }) } },
        )
        AdminFieldRow {
            AdminNumberField("rep-$index-total", stringResource(R.string.admin_total_target), rep.totalTarget, { value -> update { it.copy(reps = it.reps.mapIndexed { i, old -> if (i == index) old.copy(totalTarget = value) else old }) } }, Modifier.weight(1f), optional = true, suffix = stringResource(R.string.admin_egp))
            AdminNumberField("rep-$index-slow", stringResource(R.string.admin_slow_target), rep.slowTarget, { value -> update { it.copy(reps = it.reps.mapIndexed { i, old -> if (i == index) old.copy(slowTarget = value) else old }) } }, Modifier.weight(1f), optional = true, suffix = stringResource(R.string.admin_egp))
            AdminNumberField("rep-$index-digital", stringResource(R.string.admin_digital_target), rep.digitalTarget, { value -> update { it.copy(reps = it.reps.mapIndexed { i, old -> if (i == index) old.copy(digitalTarget = value) else old }) } }, Modifier.weight(1f), optional = true, suffix = stringResource(if (data.settings.rules.categoryUnits.digital == "qty") R.string.admin_units else R.string.admin_egp))
        }
        rep.rangeTargets.forEachIndexed { range, target ->
            AdminNumberField("rep-$index-range-$range", stringResource(R.string.admin_range_target, ('A'.code + range).toChar()), target, { value ->
                update {
                    it.copy(reps = it.reps.mapIndexed { i, old ->
                        if (i != index) old else old.copy(rangeTargets = old.rangeTargets.toMutableList().apply { this[range] = value })
                    })
                }
            }, optional = true, suffix = if (data.settings.rules.rangeUnit == "qty") stringResource(R.string.admin_units) else stringResource(R.string.admin_egp))
        }
    }
}

@Composable
private fun NotifyAdminCard(
    accounts: List<com.naguibselim.commissionsapp.data.AdminAccountOption>,
    mode: String,
    selected: List<String>,
    note: String,
    onMode: (String) -> Unit,
    onSelected: (String) -> Unit,
    onNote: (String) -> Unit,
) {
    SectionCard(stringResource(R.string.admin_notify_title), stringResource(R.string.admin_notify_hint)) {
        listOf("all" to stringResource(R.string.admin_notify_all), "users" to stringResource(R.string.admin_notify_selected), "none" to stringResource(R.string.admin_notify_none)).forEach { (value, label) ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = mode == value, onClick = { onMode(value) })
                Text(label)
            }
        }
        if (mode == "users") {
            accounts.forEach { account ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = account.id in selected, onCheckedChange = { onSelected(account.id) })
                    Column {
                        Text(account.name)
                        Text(account.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        if (mode != "none") {
            androidx.compose.material3.OutlinedTextField(
                value = note,
                onValueChange = onNote,
                label = { Text(stringResource(R.string.admin_notify_note)) },
                maxLines = 3,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
