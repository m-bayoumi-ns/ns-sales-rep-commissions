package com.naguibselim.commissionsapp.ui

import androidx.compose.runtime.Composable

@Composable
fun tr(ar: String, en: String): String = if (LocalIsArabic.current) ar else en

fun trLang(isAr: Boolean, ar: String, en: String): String = if (isAr) ar else en
