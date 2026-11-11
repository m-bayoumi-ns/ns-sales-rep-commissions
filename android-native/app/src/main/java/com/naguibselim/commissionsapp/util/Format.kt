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
        if (value == null || value.isNaN() || value.isInfinite()) return "—"
        val fmt = NumberFormat.getIntegerInstance(usLocale)
        return fmt.format(value.roundToLong())
    }

    fun integer(value: Number?): String {
        if (value == null) return "—"
        return NumberFormat.getIntegerInstance(usLocale).format(value.toDouble().roundToLong())
    }

    fun currency(value: Double?, isAr: Boolean): String {
        if (value == null || value.isNaN() || value.isInfinite()) return "—"
        val num = number(value)
        return if (isAr) "$num ج.م" else "$num EGP"
    }

    private fun twoDecimalsMax(value: Double): String {
        val fmt = NumberFormat.getNumberInstance(usLocale).apply {
            maximumFractionDigits = 2
            minimumFractionDigits = 0
        }
        return fmt.format(value)
    }

    fun compactCurrency(value: Double?, isAr: Boolean): String {
        if (value == null || value.isNaN() || value.isInfinite()) return "—"
        val absVal = abs(value)
        val sign = if (value < 0) "-" else ""
        return if (isAr) {
            when {
                absVal >= 1_000_000.0 -> "$sign${twoDecimalsMax(absVal / 1_000_000.0)} مليون ج.م"
                absVal >= 1_000.0 -> "$sign${twoDecimalsMax(absVal / 1_000.0)} ألف ج.م"
                else -> currency(value, true)
            }
        } else {
            when {
                absVal >= 1_000_000.0 -> "$sign${twoDecimalsMax(absVal / 1_000_000.0)}M EGP"
                absVal >= 1_000.0 -> "$sign${twoDecimalsMax(absVal / 1_000.0)}K EGP"
                else -> currency(value, false)
            }
        }
    }

    fun percent(value: Double?): String {
        if (value == null || value.isNaN() || value.isInfinite()) return "—"
        val fmt = NumberFormat.getNumberInstance(usLocale).apply {
            minimumFractionDigits = 1
            maximumFractionDigits = 1
        }
        return "${fmt.format(value)}%"
    }

    fun rate(value: Double?): String {
        if (value == null || value.isNaN() || value.isInfinite()) return "—"
        val fmt = NumberFormat.getNumberInstance(usLocale).apply {
            minimumFractionDigits = 0
            maximumFractionDigits = 3
        }
        return "${fmt.format(value)}%"
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
            val arMonths = arrayOf(
                "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
            )
            val enMonths = arrayOf(
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            )
            val idx = d.monthValue - 1
            if (isAr) "${d.dayOfMonth} ${arMonths[idx]}" else "${d.dayOfMonth} ${enMonths[idx]}"
        } catch (_: Throwable) {
            dayIso
        }
    }

    fun weekdayDayLabel(dayIso: String, isAr: Boolean): String {
        return try {
            val d = LocalDate.parse(dayIso)
            val arWeekdays = arrayOf(
                "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"
            )
            val arMonths = arrayOf(
                "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
            )
            if (isAr) {
                val w = arWeekdays[d.dayOfWeek.value - 1]
                val m = arMonths[d.monthValue - 1]
                "$w، ${d.dayOfMonth} $m"
            } else {
                d.format(DateTimeFormatter.ofPattern("EEEE, d MMMM", Locale.UK))
            }
        } catch (_: Throwable) {
            dayIso
        }
    }

    fun dateTimeLabel(iso: String?, isAr: Boolean): String {
        if (iso.isNullOrBlank()) return "—"
        return try {
            val instant = Instant.parse(iso)
            val zone = ZoneId.of("Africa/Cairo")
            val loc = if (isAr) Locale.forLanguageTag("ar-EG-u-nu-latn") else Locale.UK
            DateTimeFormatter.ofPattern("d MMM yyyy · HH:mm", loc).withZone(zone).format(instant)
        } catch (_: Throwable) {
            iso.take(16).replace('T', ' ')
        }
    }

    fun plainProductName(name: String): String {
        return name.replace(Regex("^\\s*\\[[^\\]]*]\\s*"), "").ifBlank { name }
    }
}
