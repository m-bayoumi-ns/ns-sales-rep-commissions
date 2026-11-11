package com.naguibselim.commissionsapp.util

import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToLong

object Format {
    private val usLocale = Locale.US

    fun number(value: Double?): String {
        if (value == null || value.isNaN()) return "—"
        val rounded = (value * 10.0).roundToLong() / 10.0
        val fmt = NumberFormat.getNumberInstance(usLocale).apply {
            maximumFractionDigits = if (rounded % 1.0 == 0.0) 0 else 1
            minimumFractionDigits = 0
        }
        return fmt.format(rounded)
    }

    fun integer(value: Number?): String {
        if (value == null) return "—"
        return NumberFormat.getIntegerInstance(usLocale).format(value.toDouble().roundToLong())
    }

    fun currency(value: Double?, isAr: Boolean): String {
        if (value == null || value.isNaN()) return "—"
        val num = integer(value)
        return if (isAr) "$num ج.م" else "$num EGP"
    }

    fun compactCurrency(value: Double?, isAr: Boolean): String {
        if (value == null || value.isNaN()) return "—"
        val absVal = abs(value)
        val sign = if (value < 0) "-" else ""
        val formatted = when {
            absVal >= 1_000_000 -> {
                val m = absVal / 1_000_000.0
                val str = String.format(usLocale, if (m >= 10) "%.1f" else "%.2f", m).trimEnd('0').trimEnd('.')
                if (isAr) "$sign$str مليون" else "$sign${str}M"
            }
            absVal >= 10_000 -> {
                val k = absVal / 1_000.0
                val str = String.format(usLocale, if (k >= 100) "%.0f" else "%.1f", k).trimEnd('0').trimEnd('.')
                if (isAr) "$sign$str ألف" else "$sign${str}K"
            }
            else -> integer(value)
        }
        return formatted
    }

    fun percent(value: Double?): String {
        if (value == null || value.isNaN()) return "—"
        val rounded = (value * 10.0).roundToLong() / 10.0
        val str = if (rounded % 1.0 == 0.0) {
            rounded.toLong().toString()
        } else {
            String.format(usLocale, "%.1f", rounded)
        }
        return "$str%"
    }

    fun rate(value: Double?): String {
        if (value == null || value.isNaN()) return "—"
        val str = String.format(usLocale, "%.2f", value).trimEnd('0').trimEnd('.')
        return "$str%"
    }

    fun monthLabel(month: String, isAr: Boolean): String {
        return try {
            val ym = YearMonth.parse(month)
            val arMonths = arrayOf(
                "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
            )
            val enMonths = arrayOf(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            )
            val idx = ym.monthValue - 1
            if (isAr) "${arMonths[idx]} ${ym.year}" else "${enMonths[idx]} ${ym.year}"
        } catch (_: Throwable) {
            month
        }
    }

    fun shortDayLabel(dayIso: String, isAr: Boolean): String {
        return try {
            val d = LocalDate.parse(dayIso)
            val loc = if (isAr) Locale("ar", "EG") else Locale.UK
            d.format(DateTimeFormatter.ofPattern("d MMM", loc))
        } catch (_: Throwable) {
            dayIso
        }
    }

    fun weekdayDayLabel(dayIso: String, isAr: Boolean): String {
        return try {
            val d = LocalDate.parse(dayIso)
            val loc = if (isAr) Locale("ar", "EG") else Locale.UK
            d.format(DateTimeFormatter.ofPattern("EEEE، d MMMM", loc))
        } catch (_: Throwable) {
            dayIso
        }
    }

    fun dateTimeLabel(iso: String?, isAr: Boolean): String {
        if (iso.isNullOrBlank()) return "—"
        return try {
            val instant = Instant.parse(iso)
            val zone = ZoneId.of("Africa/Cairo")
            val loc = if (isAr) Locale("ar", "EG") else Locale.UK
            DateTimeFormatter.ofPattern("d MMM yyyy · hh:mm a", loc).withZone(zone).format(instant)
        } catch (_: Throwable) {
            iso.take(16).replace('T', ' ')
        }
    }

    fun plainProductName(name: String): String {
        return name.replace(Regex("^\\s*\\[[^\\]]*]\\s*"), "").ifBlank { name }
    }
}
