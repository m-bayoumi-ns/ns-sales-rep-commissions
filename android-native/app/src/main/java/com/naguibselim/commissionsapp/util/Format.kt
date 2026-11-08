package com.naguibselim.commissionsapp.util

import java.text.NumberFormat
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToLong

/** Number and date formatting in the phone's language (Arabic → ar-EG, like the website). */
class Format(locale: Locale) {
    val isArabic = locale.language == "ar"
    private val locale: Locale = if (isArabic) Locale("ar", "EG") else Locale.US

    private val whole = NumberFormat.getNumberInstance(this.locale).apply { maximumFractionDigits = 0 }
    private val oneDecimal = NumberFormat.getNumberInstance(this.locale).apply { maximumFractionDigits = 1; minimumFractionDigits = 0 }
    private val twoDecimals = NumberFormat.getNumberInstance(this.locale).apply { maximumFractionDigits = 2; minimumFractionDigits = 0 }

    /** 1,234,567 */
    fun number(value: Double): String = whole.format(value.roundToLong())

    /** Quantities keep one decimal (meters). */
    fun qty(value: Double): String = oneDecimal.format(value)

    /** 1,234,567 EGP / ١٬٢٣٤٬٥٦٧ ج.م */
    fun money(value: Double): String = "${number(value)} ${if (isArabic) "ج.م" else "EGP"}"

    /** Short money for chart axes: 1.2M, 350K. */
    fun compact(value: Double): String {
        val a = abs(value)
        return when {
            a >= 1_000_000 -> oneDecimal.format(value / 1_000_000) + (if (isArabic) " مليون" else "M")
            a >= 1_000 -> whole.format(value / 1_000) + (if (isArabic) " ألف" else "K")
            else -> whole.format(value)
        }
    }

    fun compactMoney(value: Double): String = "${compact(value)} ${if (isArabic) "ج.م" else "EGP"}"

    /** 87.5% */
    fun pct(value: Double?): String = if (value == null) "—" else oneDecimal.format(value) + "%"

    /** Rates like 0.75% keep two decimals. */
    fun rate(value: Double?): String = if (value == null) "—" else twoDecimals.format(value) + "%"

    /** "2026-11" → "November 2026" / "نوفمبر 2026" */
    fun month(value: String): String = runCatching {
        YearMonth.parse(value).format(DateTimeFormatter.ofPattern("LLLL yyyy", locale))
    }.getOrDefault(value)

    /** "2026-11-06" → "6 Nov" */
    fun day(value: String): String = runCatching {
        LocalDate.parse(value.take(10)).format(DateTimeFormatter.ofPattern("d MMM", locale))
    }.getOrDefault(value)

    /** Day of month digit for chart labels. */
    fun dayOfMonth(value: String): String = runCatching { whole.format(LocalDate.parse(value.take(10)).dayOfMonth.toLong()) }.getOrDefault("")
}
