package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Save
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.naguibselim.commissionsapp.data.AdminSettingsPayload
import com.naguibselim.commissionsapp.data.BonusStepModel
import com.naguibselim.commissionsapp.data.CommissionSettingsModel
import com.naguibselim.commissionsapp.data.OdooCandidate
import com.naguibselim.commissionsapp.data.ProductRuleModel
import com.naguibselim.commissionsapp.data.ProductSearchResultModel
import com.naguibselim.commissionsapp.data.TierRule
import com.naguibselim.commissionsapp.util.Format
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AdminSettingsScreen(
    loading: Boolean,
    saving: Boolean,
    status: Pair<Boolean, String>?,
    payload: AdminSettingsPayload?,
    onSelectMonth: (String) -> Unit,
    onSearchProducts: suspend (String) -> List<ProductSearchResultModel>,
    onSave: (CommissionSettingsModel, String, List<String>, String) -> Unit
) {
    val c = LocalNsColors.current
    val isAr = LocalIsArabic.current

    var draft by remember(payload?.month, payload?.settings?.updatedAt) {
        mutableStateOf(payload?.settings)
    }
    var notifyMode by rememberSaveable { mutableStateOf("all") } // "all" | "users" | "none"
    var notifyUsers by remember { mutableStateOf(setOf<String>()) }
    var notifyNote by rememberSaveable { mutableStateOf("") }

    var showMonthSheet by rememberSaveable { mutableStateOf(false) }
    var showAddProductCategory by rememberSaveable { mutableStateOf<String?>(null) } // "slow" | "digital"
    var pickingOdooRepIndex by remember { mutableIntStateOf(-1) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(c.background)
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = tr("إعدادات العمولة", "Commission settings"),
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = c.foreground
            )

            if (loading && payload == null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 400.dp),
                    contentAlignment = Alignment.Center
                ) {
                    NsLoadingCard()
                }
            } else if (payload != null && draft != null) {
                val currentDraft = draft!!
                val monthName = Format.monthLabel(payload.month, isAr)

                // Month Picker Bar
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = c.card,
                    border = BorderStroke(1.dp, c.border),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .clickable { showMonthSheet = true }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(imageVector = Icons.Outlined.CalendarMonth, contentDescription = null, tint = c.primary, modifier = Modifier.size(18.dp))
                        Text(
                            text = monthName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground,
                            modifier = Modifier.weight(1f)
                        )
                        Icon(imageVector = Icons.Outlined.ExpandMore, contentDescription = null, tint = c.mutedForeground)
                    }
                }

                // Source Banner
                if (payload.source == "inherited" && payload.inheritedFrom != null) {
                    StatusBanner(
                        text = tr(
                            "منسوخة من إعدادات ${Format.monthLabel(payload.inheritedFrom, isAr)} — احفظ لتثبيتها لشهر $monthName.",
                            "Inherited from ${Format.monthLabel(payload.inheritedFrom, isAr)} — save to store for $monthName."
                        ),
                        tone = "info",
                        icon = Icons.Outlined.Info
                    )
                } else if (payload.source == "default") {
                    StatusBanner(
                        text = tr("لم تُحفظ إعدادات لشهر $monthName بعد.", "No saved settings for $monthName yet."),
                        tone = "warn",
                        icon = Icons.Outlined.WarningAmber
                    )
                } else if (currentDraft.updatedAt != null) {
                    Text(
                        text = tr(
                            "آخر حفظ: ${Format.dateTimeLabel(currentDraft.updatedAt, isAr)} بواسطة ${currentDraft.updatedBy ?: "—"}",
                            "Last saved: ${Format.dateTimeLabel(currentDraft.updatedAt, isAr)} by ${currentDraft.updatedBy ?: "—"}"
                        ),
                        fontSize = 11.5.sp,
                        color = c.mutedForeground
                    )
                }

                if (status != null) {
                    StatusBanner(
                        text = status.second,
                        tone = if (status.first) "success" else "error",
                        icon = if (status.first) Icons.Outlined.CheckCircle else Icons.Outlined.WarningAmber
                    )
                }

                // 1. Price Tiers A / B / C
                NsGroupCard(title = tr("1. شرائح سعر الوحدة (A / B / C)", "1. Unit price ranges (A / B / C)")) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        currentDraft.tiers.forEachIndexed { idx, tier ->
                            val key = ('A' + idx).toString()
                            if (idx > 0) HorizontalDivider(color = c.border)
                            TierEditorBlock(
                                badge = key,
                                title = tr("الشريحة $key", "Range $key"),
                                tier = tier,
                                onChange = { updated ->
                                    val next = currentDraft.tiers.toMutableList().also { it[idx] = updated }
                                    draft = currentDraft.copy(tiers = next)
                                }
                            )
                        }
                    }
                }

                // 2. Old-system tiers
                NsGroupCard(
                    title = tr(
                        "2. النظام القديم (${Format.number(currentDraft.rules.lowAchievementPct)}%–${Format.number(currentDraft.rules.oldSystemUntilPct)}%)",
                        "2. Old system (${Format.number(currentDraft.rules.lowAchievementPct)}%–${Format.number(currentDraft.rules.oldSystemUntilPct)}%)"
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        currentDraft.rules.oldSystemTiers.forEachIndexed { idx, tier ->
                            val key = ('A' + idx).toString()
                            if (idx > 0) HorizontalDivider(color = c.border)
                            TierEditorBlock(
                                badge = key,
                                title = tr("شريحة قديمة $key", "Old range $key"),
                                tier = tier,
                                canRemove = currentDraft.rules.oldSystemTiers.size > 1,
                                onRemove = {
                                    val next = currentDraft.rules.oldSystemTiers.filterIndexed { i, _ -> i != idx }
                                    draft = currentDraft.copy(rules = currentDraft.rules.copy(oldSystemTiers = next))
                                },
                                onChange = { updated ->
                                    val next = currentDraft.rules.oldSystemTiers.toMutableList().also { it[idx] = updated }
                                    draft = currentDraft.copy(rules = currentDraft.rules.copy(oldSystemTiers = next))
                                }
                            )
                        }
                        if (currentDraft.rules.oldSystemTiers.size < 6) {
                            OutlinedButton(
                                onClick = {
                                    val next = currentDraft.rules.oldSystemTiers + TierRule(0.0, null, 0.0)
                                    draft = currentDraft.copy(rules = currentDraft.rules.copy(oldSystemTiers = next))
                                },
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(imageVector = Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.size(6.dp))
                                Text(text = tr("إضافة شريحة", "Add range"))
                            }
                        }
                    }
                }

                // 3. Classified Products (Slow-moving & Digital)
                NsGroupCard(title = tr("3. أصناف الراكد والديجيتال", "3. Slow-moving & digital products")) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            DecimalInputField(
                                label = tr("نسبة الراكد %", "Slow-moving %"),
                                value = currentDraft.slowRate,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(slowRate = v ?: 0.0) }
                            )
                            DecimalInputField(
                                label = tr("نسبة الديجيتال %", "Digital %"),
                                value = currentDraft.digitalRate,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(digitalRate = v ?: 0.0) }
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { showAddProductCategory = "slow" },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(imageVector = Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.size(4.dp))
                                Text(text = tr("إضافة راكد", "Add slow"), fontSize = 12.5.sp)
                            }
                            OutlinedButton(
                                onClick = { showAddProductCategory = "digital" },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(imageVector = Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.size(4.dp))
                                Text(text = tr("إضافة ديجيتال", "Add digital"), fontSize = 12.5.sp)
                            }
                        }

                        if (currentDraft.products.isEmpty()) {
                            Text(
                                text = tr("لا توجد أصناف مصنفة بعد.", "No classified products added yet."),
                                fontSize = 13.sp,
                                color = c.mutedForeground
                            )
                        } else {
                            currentDraft.products.forEachIndexed { idx, prod ->
                                if (idx > 0) HorizontalDivider(color = c.border)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = prod.templateName,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = c.foreground
                                        )
                                        Text(
                                            text = buildString {
                                                append(if (prod.category == "slow") tr("راكد", "Slow-moving") else tr("ديجيتال", "Digital"))
                                                append(" · ")
                                                append(prod.color ?: tr("كل الألوان", "All colors"))
                                            },
                                            fontSize = 11.5.sp,
                                            color = c.mutedForeground
                                        )
                                    }
                                    IconButton(
                                        onClick = {
                                            draft = currentDraft.copy(
                                                products = currentDraft.products.filter { it.key != prod.key }
                                            )
                                        }
                                    ) {
                                        Icon(imageVector = Icons.Outlined.DeleteOutline, contentDescription = null, tint = c.destructive, modifier = Modifier.size(18.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                // 4. Rules & Bonuses
                val r = currentDraft.rules
                NsGroupCard(title = tr("4. الشروط والحوافز والخصومات", "4. Conditions, bonuses & deductions")) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            DecimalInputField(
                                label = tr("حافز كل الأهداف %", "All targets bonus %"),
                                value = r.allTargetsBonusPct,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(allTargetsBonusPct = v ?: 0.0)) }
                            )
                            DecimalInputField(
                                label = tr("الحد الأدنى الشهري", "Minimum monthly sales"),
                                value = r.minimumSales,
                                suffix = tr("ج.م", "EGP"),
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(minimumSales = v ?: 0.0)) }
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            DecimalInputField(
                                label = tr("حد الراكد الأدنى %", "Slow-moving min %"),
                                value = r.slowMinPct,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(slowMinPct = v ?: 0.0)) }
                            )
                            DecimalInputField(
                                label = tr("خصم الراكد %", "Slow deduction %"),
                                value = r.slowDeductionPct,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(slowDeductionPct = v ?: 0.0)) }
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            DecimalInputField(
                                label = tr("نسبة المسدد %", "Paid invoice share %"),
                                value = r.cashSharePct,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(cashSharePct = v ?: 0.0)) }
                            )
                            DecimalInputField(
                                label = tr("حافز المسدد", "Paid sales bonus"),
                                value = r.cashBonus,
                                suffix = tr("ج.م", "EGP"),
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(cashBonus = v ?: 0.0)) }
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            DecimalInputField(
                                label = tr("نسبة التحصيل > %", "Collections > %"),
                                value = r.collectionPct,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(collectionPct = v ?: 0.0)) }
                            )
                            DecimalInputField(
                                label = tr("حافز التحصيل", "Collections bonus"),
                                value = r.collectionBonus,
                                suffix = tr("ج.م", "EGP"),
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(collectionBonus = v ?: 0.0)) }
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            DecimalInputField(
                                label = tr("النظام المنخفض تحت %", "Low system below %"),
                                value = r.lowAchievementPct,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(lowAchievementPct = v ?: 0.0)) }
                            )
                            DecimalInputField(
                                label = tr("نسبة النظام المنخفض %", "Low system rate %"),
                                value = r.lowRate,
                                suffix = "%",
                                modifier = Modifier.weight(1f),
                                onChange = { v -> draft = currentDraft.copy(rules = r.copy(lowRate = v ?: 0.0)) }
                            )
                        }
                        DecimalInputField(
                            label = tr("النظام القديم حتى %", "Old system until %"),
                            value = r.oldSystemUntilPct,
                            suffix = "%",
                            onChange = { v -> draft = currentDraft.copy(rules = r.copy(oldSystemUntilPct = v ?: 0.0)) }
                        )

                        HorizontalDivider(color = c.border)
                        Text(
                            text = tr("سلم حوافز المبيعات الشهرية", "Monthly sales bonus ladder"),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground
                        )
                        r.salesBonuses.forEachIndexed { idx, step ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                DecimalInputField(
                                    label = tr("من", "From"),
                                    value = step.from,
                                    modifier = Modifier.weight(1f),
                                    onChange = { v ->
                                        val next = r.salesBonuses.toMutableList().also { it[idx] = step.copy(from = v ?: 0.0) }
                                        draft = currentDraft.copy(rules = r.copy(salesBonuses = next))
                                    }
                                )
                                DecimalInputField(
                                    label = tr("إلى", "To"),
                                    value = step.to,
                                    allowNull = true,
                                    placeholder = "∞",
                                    modifier = Modifier.weight(1f),
                                    onChange = { v ->
                                        val next = r.salesBonuses.toMutableList().also { it[idx] = step.copy(to = v) }
                                        draft = currentDraft.copy(rules = r.copy(salesBonuses = next))
                                    }
                                )
                                DecimalInputField(
                                    label = tr("الحافز", "Bonus"),
                                    value = step.amount,
                                    modifier = Modifier.weight(1f),
                                    onChange = { v ->
                                        val next = r.salesBonuses.toMutableList().also { it[idx] = step.copy(amount = v ?: 0.0) }
                                        draft = currentDraft.copy(rules = r.copy(salesBonuses = next))
                                    }
                                )
                                IconButton(
                                    onClick = {
                                        val next = r.salesBonuses.filterIndexed { i, _ -> i != idx }
                                        draft = currentDraft.copy(rules = r.copy(salesBonuses = next))
                                    }
                                ) {
                                    Icon(imageVector = Icons.Outlined.DeleteOutline, contentDescription = null, tint = c.destructive, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                        OutlinedButton(
                            onClick = {
                                val next = r.salesBonuses + BonusStepModel(1_000_000.0, null, 1000.0)
                                draft = currentDraft.copy(rules = r.copy(salesBonuses = next))
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(imageVector = Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.size(6.dp))
                            Text(text = tr("إضافة درجة سلم", "Add ladder step"))
                        }

                        HorizontalDivider(color = c.border)
                        Text(
                            text = tr("تفاصيل الأصناف المسموح بفتحها في الكشف", "Buckets expandable in statement"),
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = c.foreground
                        )
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("A", "B", "C", "ns", "slow", "digital").forEach { key ->
                                val active = r.statementDetails[key] != false
                                val chipLabel = when (key) {
                                    "ns" -> "NS"
                                    "slow" -> tr("الراكد", "Slow-moving")
                                    "digital" -> tr("الديجيتال", "Digital")
                                    else -> tr("الشريحة $key", "Range $key")
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(if (active) c.accent else c.card)
                                        .border(1.dp, if (active) c.primary else c.border, CircleShape)
                                        .clickable {
                                            val nextMap = r.statementDetails.toMutableMap().also { it[key] = !active }
                                            draft = currentDraft.copy(rules = r.copy(statementDetails = nextMap))
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = (if (active) "✓ " else "") + chipLabel,
                                        fontSize = 12.sp,
                                        fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                                        color = if (active) c.primary else c.mutedForeground
                                    )
                                }
                            }
                        }
                    }
                }

                // 5. Reps & Odoo Links (Targets from Excel)
                NsGroupCard(
                    title = tr("5. المندوبون والربط بأودو (${currentDraft.reps.size})", "5. Sellers & Odoo links (${currentDraft.reps.size})"),
                    footer = tr("الأهداف تُقرأ تلقائيًا من ملف الإكسيل (Wholesales_Target).", "Targets are read-only from the monthly Excel target sheet.")
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatusBanner(
                            text = if (payload.sheet.found) {
                                tr("ملف الأهداف موجود (${payload.sheet.count} مندوب) · ${payload.sheet.path}", "Target sheet found (${payload.sheet.count} sellers) · ${payload.sheet.path}")
                            } else {
                                tr("ملف الأهداف غير موجود: ${payload.sheet.path}", "Target sheet missing: ${payload.sheet.path}")
                            },
                            tone = if (payload.sheet.found) "success" else "warn"
                        )

                        currentDraft.reps.forEachIndexed { idx, rep ->
                            if (idx > 0) HorizontalDivider(color = c.border)
                            val linkedUser = payload.candidates.find { it.id == rep.odooUserId }
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = rep.name,
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = c.foreground,
                                        modifier = Modifier.weight(1f)
                                    )
                                    LtrText(
                                        text = Format.compactCurrency(rep.totalTarget, isAr),
                                        fontSize = 12.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = c.primary
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = c.muted.copy(alpha = 0.5f),
                                    border = BorderStroke(1.dp, if (rep.odooUserId == null) c.destructive.copy(alpha = 0.5f) else c.border),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .clickable { pickingOdooRepIndex = idx }
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = linkedUser?.name ?: rep.odooUserId?.let { "#$it" } ?: tr("غير مربوط بمستخدم أودو", "Not linked to Odoo user"),
                                            fontSize = 12.5.sp,
                                            color = if (rep.odooUserId == null) c.destructive else c.foreground
                                        )
                                        Icon(imageVector = Icons.Outlined.ExpandMore, contentDescription = null, tint = c.mutedForeground, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                // 6. Notify Sellers on Save
                NsGroupCard(title = tr("6. إشعار المندوبين عند الحفظ", "6. Notify sellers on save")) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Outlined.NotificationsActive, contentDescription = null, tint = c.primary, modifier = Modifier.size(18.dp))
                            Text(
                                text = tr("اختر من يصله إشعار بالتغييرات", "Choose who receives a rate-change notification"),
                                fontSize = 13.sp,
                                color = c.foreground
                            )
                        }
                        SegmentedPills(
                            options = listOf(
                                "all" to tr("الكل (${payload.accounts.size})", "All (${payload.accounts.size})"),
                                "users" to tr("مندوبون محددون", "Selected"),
                                "none" to tr("بدون إشعار", "No notification")
                            ),
                            selected = notifyMode,
                            onSelect = { notifyMode = it }
                        )

                        if (notifyMode == "users") {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(1.dp, c.border, RoundedCornerShape(12.dp))
                                    .padding(8.dp)
                            ) {
                                payload.accounts.forEach { acc ->
                                    val checked = notifyUsers.contains(acc.id)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                notifyUsers = if (checked) notifyUsers - acc.id else notifyUsers + acc.id
                                            }
                                            .padding(vertical = 4.dp, horizontal = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = checked,
                                            onCheckedChange = {
                                                notifyUsers = if (checked) notifyUsers - acc.id else notifyUsers + acc.id
                                            },
                                            colors = CheckboxDefaults.colors(checkedColor = c.primary)
                                        )
                                        Column {
                                            Text(text = acc.name, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = c.foreground)
                                            LtrText(text = acc.email, fontSize = 11.sp, color = c.mutedForeground)
                                        }
                                    }
                                }
                            }
                        }

                        if (notifyMode != "none") {
                            OutlinedTextField(
                                value = notifyNote,
                                onValueChange = { notifyNote = it },
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text(text = tr("ملاحظة مع الإشعار (اختياري)", "Notification note (optional)"), fontSize = 12.sp) },
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = c.primary,
                                    unfocusedBorderColor = c.border
                                )
                            )
                        }
                    }
                }
            }
        }

        // Sticky Bottom Save Bar
        if (payload != null && draft != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = c.card,
                border = BorderStroke(1.dp, c.border),
                shadowElevation = 6.dp
            ) {
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                    Button(
                        onClick = {
                            onSave(draft!!, notifyMode, notifyUsers.toList(), notifyNote)
                        },
                        enabled = !saving,
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = c.primary,
                            contentColor = c.primaryForeground
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        if (saving) {
                            CircularProgressIndicator(
                                color = c.primaryForeground,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.size(8.dp))
                            Text(text = tr("جارٍ الحفظ…", "Saving…"), fontWeight = FontWeight.Bold)
                        } else {
                            Icon(imageVector = Icons.Outlined.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.size(8.dp))
                            Text(
                                text = tr("حفظ إعدادات ${Format.monthLabel(payload.month, isAr)}", "Save ${Format.monthLabel(payload.month, isAr)} settings"),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }

    // Month Picker Sheet
    if (showMonthSheet && payload != null) {
        ModalBottomSheet(
            onDismissRequest = { showMonthSheet = false },
            containerColor = c.card
        ) {
            Column(modifier = Modifier.padding(bottom = 24.dp)) {
                Text(
                    text = tr("اختر شهر الإعدادات", "Select settings month"),
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = c.foreground,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp)
                )
                HorizontalDivider(color = c.border)
                LazyColumn(modifier = Modifier.heightIn(max = 380.dp)) {
                    items(payload.months) { m ->
                        val selected = m == payload.month
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showMonthSheet = false
                                    onSelectMonth(m)
                                }
                                .background(if (selected) c.accent else Color.Transparent)
                                .padding(horizontal = 20.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = Format.monthLabel(m, isAr),
                                fontSize = 15.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                color = if (selected) c.primary else c.foreground
                            )
                            if (selected) {
                                Icon(imageVector = Icons.Outlined.Check, contentDescription = null, tint = c.primary)
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Classified Product Sheet
    if (showAddProductCategory != null && draft != null) {
        val cat = showAddProductCategory!!
        ProductSearchBottomSheet(
            category = cat,
            onSearch = onSearchProducts,
            onAdd = { item, variantId, color ->
                val current = draft!!
                val rule = ProductRuleModel(
                    key = UUID.randomUUID().toString().take(8),
                    templateId = item.templateId,
                    templateName = item.name,
                    code = item.code,
                    variantId = variantId,
                    color = color,
                    category = cat
                )
                draft = current.copy(products = current.products + rule)
                showAddProductCategory = null
            },
            onDismiss = { showAddProductCategory = null }
        )
    }

    // Odoo User Link Picker Sheet
    if (pickingOdooRepIndex >= 0 && payload != null && draft != null) {
        val rep = draft!!.reps.getOrNull(pickingOdooRepIndex)
        if (rep != null) {
            OdooCandidatePickerSheet(
                repName = rep.name,
                currentId = rep.odooUserId,
                candidates = payload.candidates,
                onSelect = { chosenId ->
                    val current = draft!!
                    val nextReps = current.reps.toMutableList().also {
                        it[pickingOdooRepIndex] = rep.copy(odooUserId = chosenId)
                    }
                    draft = current.copy(reps = nextReps)
                    pickingOdooRepIndex = -1
                },
                onDismiss = { pickingOdooRepIndex = -1 }
            )
        }
    }
}

@Composable
private fun TierEditorBlock(
    badge: String,
    title: String,
    tier: TierRule,
    canRemove: Boolean = false,
    onRemove: (() -> Unit)? = null,
    onChange: (TierRule) -> Unit
) {
    val c = LocalNsColors.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(c.primary),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = badge, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = c.primaryForeground)
                }
                Text(text = title, fontSize = 13.5.sp, fontWeight = FontWeight.Bold, color = c.foreground)
            }
            if (canRemove && onRemove != null) {
                IconButton(onClick = onRemove, modifier = Modifier.size(28.dp)) {
                    Icon(imageVector = Icons.Outlined.DeleteOutline, contentDescription = null, tint = c.destructive, modifier = Modifier.size(18.dp))
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            DecimalInputField(
                label = tr("من سعر", "From"),
                value = tier.from,
                modifier = Modifier.weight(1f),
                onChange = { v -> onChange(tier.copy(from = v ?: 0.0)) }
            )
            DecimalInputField(
                label = tr("إلى أقل من", "To (<)"),
                value = tier.to,
                allowNull = true,
                placeholder = "∞",
                modifier = Modifier.weight(1f),
                onChange = { v -> onChange(tier.copy(to = v)) }
            )
            DecimalInputField(
                label = tr("النسبة %", "Rate %"),
                value = tier.rate,
                suffix = "%",
                modifier = Modifier.weight(1f),
                onChange = { v -> onChange(tier.copy(rate = v ?: 0.0)) }
            )
        }
    }
}

@Composable
private fun DecimalInputField(
    label: String,
    value: Double?,
    onChange: (Double?) -> Unit,
    modifier: Modifier = Modifier,
    suffix: String? = null,
    placeholder: String? = null,
    allowNull: Boolean = false
) {
    val c = LocalNsColors.current
    var text by remember(value) {
        mutableStateOf(
            if (value == null) ""
            else if (value % 1.0 == 0.0) value.toLong().toString()
            else value.toString()
        )
    }

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = label,
            fontSize = 11.5.sp,
            fontWeight = FontWeight.Medium,
            color = c.mutedForeground,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            OutlinedTextField(
                value = text,
                onValueChange = { raw ->
                    text = raw
                    val clean = raw.replace(",", "").trim()
                    if (clean.isEmpty()) {
                        onChange(if (allowNull) null else 0.0)
                    } else {
                        clean.toDoubleOrNull()?.let { onChange(it) }
                    }
                },
                singleLine = true,
                placeholder = placeholder?.let { { Text(text = it, fontSize = 12.5.sp) } },
                suffix = suffix?.let { { Text(text = it, fontSize = 11.5.sp, color = c.mutedForeground) } },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = c.primary,
                    unfocusedBorderColor = c.border
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductSearchBottomSheet(
    category: String,
    onSearch: suspend (String) -> List<ProductSearchResultModel>,
    onAdd: (ProductSearchResultModel, Int?, String?) -> Unit,
    onDismiss: () -> Unit
) {
    val c = LocalNsColors.current
    var query by rememberSaveable { mutableStateOf("") }
    var searching by remember { mutableStateOf(false) }
    var results by remember { mutableStateOf<List<ProductSearchResultModel>>(emptyList()) }
    var selectedProduct by remember { mutableStateOf<ProductSearchResultModel?>(null) }

    LaunchedEffect(query) {
        if (query.trim().length < 2) {
            results = emptyList()
            searching = false
            return@LaunchedEffect
        }
        searching = true
        delay(280)
        results = onSearch(query)
        searching = false
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = c.card
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = if (category == "slow") tr("إضافة صنف راكد", "Add slow-moving product") else tr("إضافة صنف ديجيتال", "Add digital product"),
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = c.foreground
            )

            if (selectedProduct == null) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(text = tr("ابحث باسم الصنف أو الكود…", "Search product name or code…"), fontSize = 13.5.sp) },
                    leadingIcon = { Icon(imageVector = Icons.Outlined.Search, contentDescription = null) },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                if (searching) {
                    Box(modifier = Modifier.fillMaxWidth().padding(20.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = c.primary, modifier = Modifier.size(26.dp))
                    }
                } else {
                    LazyColumn(modifier = Modifier.heightIn(max = 360.dp)) {
                        items(results) { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        if (item.variants.size <= 1) {
                                            onAdd(item, null, null)
                                        } else {
                                            selectedProduct = item
                                        }
                                    }
                                    .padding(vertical = 12.dp, horizontal = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = item.name,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = c.foreground,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = tr("${item.variants.size} لون", "${item.variants.size} colors"),
                                    fontSize = 11.5.sp,
                                    color = c.mutedForeground
                                )
                            }
                            HorizontalDivider(color = c.border)
                        }
                    }
                }
            } else {
                val prod = selectedProduct!!
                Text(
                    text = prod.name,
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = c.primary
                )
                Text(
                    text = tr("اختر اللون (أو كل الألوان):", "Choose color (or all colors):"),
                    fontSize = 12.5.sp,
                    color = c.mutedForeground
                )
                LazyColumn(modifier = Modifier.heightIn(max = 340.dp)) {
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onAdd(prod, null, null) }
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = tr("كل الألوان", "All colors"), fontWeight = FontWeight.Bold, color = c.primary)
                        }
                        HorizontalDivider(color = c.border)
                    }
                    items(prod.variants) { v ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onAdd(prod, v.id, v.color) }
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = v.color ?: "#${v.id}", fontSize = 14.sp, color = c.foreground)
                        }
                        HorizontalDivider(color = c.border)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OdooCandidatePickerSheet(
    repName: String,
    currentId: Int?,
    candidates: List<OdooCandidate>,
    onSelect: (Int?) -> Unit,
    onDismiss: () -> Unit
) {
    val c = LocalNsColors.current
    var search by rememberSaveable { mutableStateOf("") }
    val filtered = remember(candidates, search) {
        val q = search.trim().lowercase()
        if (q.isEmpty()) candidates else candidates.filter { it.name.lowercase().contains(q) }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = c.card
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = repName,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = c.foreground,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)
            )
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                placeholder = { Text(text = tr("ابحث في مستخدمي أودو…", "Search Odoo users…"), fontSize = 13.5.sp) },
                leadingIcon = { Icon(imageVector = Icons.Outlined.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            LazyColumn(modifier = Modifier.heightIn(max = 380.dp)) {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(null) }
                            .padding(horizontal = 20.dp, vertical = 13.dp)
                    ) {
                        Text(text = tr("إلغاء الربط (غير مربوط)", "Unlink"), color = c.destructive, fontWeight = FontWeight.SemiBold)
                    }
                    HorizontalDivider(color = c.border)
                }
                items(filtered) { cand ->
                    val selected = cand.id == currentId
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(cand.id) }
                            .background(if (selected) c.accent else Color.Transparent)
                            .padding(horizontal = 20.dp, vertical = 13.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = cand.name,
                            fontSize = 14.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                            color = if (selected) c.primary else c.foreground
                        )
                        if (selected) {
                            Icon(imageVector = Icons.Outlined.Check, contentDescription = null, tint = c.primary)
                        }
                    }
                }
            }
        }
    }
}
