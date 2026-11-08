package com.naguibselim.commissionsapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.naguibselim.commissionsapp.data.ApiException

@Composable
internal fun AdminNumberField(
    id: String,
    label: String,
    value: Double?,
    onValueChange: (Double?) -> Unit,
    modifier: Modifier = Modifier,
    optional: Boolean = false,
    suffix: String? = null,
) {
    var text by rememberSaveable(id) { mutableStateOf(value?.toString().orEmpty()) }
    LaunchedEffect(value) {
        val parsed = adminNumber(text)
        if (parsed != value && !(value == null && text.isBlank())) text = value?.toString().orEmpty()
    }
    OutlinedTextField(
        value = text,
        onValueChange = { next ->
            text = next
            if (next.isBlank()) {
                if (optional) onValueChange(null) else onValueChange(0.0)
            } else {
                adminNumber(next)?.let(onValueChange)
            }
        },
        label = { Text(label) },
        trailingIcon = { suffix?.let { Text(it, modifier = Modifier.padding(end = 8.dp), color = MaterialTheme.colorScheme.onSurfaceVariant) } },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        modifier = modifier,
    )
}

@Composable
internal fun AdminTextField(
    id: String,
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    supporting: String? = null,
) {
    var text by rememberSaveable(id) { mutableStateOf(value) }
    LaunchedEffect(value) {
        if (text != value) text = value
    }
    OutlinedTextField(
        value = text,
        onValueChange = {
            text = it
            onValueChange(it)
        },
        label = { Text(label) },
        supportingText = supporting?.let { { Text(it) } },
        singleLine = true,
        modifier = modifier,
    )
}

@Composable
internal fun AdminSelectField(
    label: String,
    selected: String,
    options: List<Pair<String, String>>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by rememberSaveable(label) { mutableStateOf(false) }
    Column(modifier) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        androidx.compose.foundation.layout.Box {
            TextButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth()) {
                Text(options.firstOrNull { it.first == selected }?.second ?: selected, modifier = Modifier.weight(1f))
                Icon(Icons.Filled.ArrowDropDown, contentDescription = null)
            }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                options.forEach { (value, title) ->
                    DropdownMenuItem(
                        text = { Text(title) },
                        onClick = {
                            onSelect(value)
                            expanded = false
                        },
                    )
                }
            }
        }
    }
}

@Composable
internal fun AdminFieldRow(content: @Composable RowScope.() -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { content() }
}

private fun adminNumber(raw: String): Double? {
    val normalized = raw
        .replace(",", "")
        .replace("٬", "")
        .replace("٫", ".")
        .map { char ->
            when (char) {
                in '٠'..'٩' -> ('0'.code + (char.code - '٠'.code)).toChar()
                in '۰'..'۹' -> ('0'.code + (char.code - '۰'.code)).toChar()
                else -> char
            }
        }.joinToString("")
        .replace(" ", "")
    return normalized.toDoubleOrNull()?.takeIf { it.isFinite() }
}

internal fun adminErrorMessage(error: Exception, fallback: String): String =
    when (error) {
        is ApiException.Server -> error.detail ?: error.code
        else -> error.message ?: fallback
    }
