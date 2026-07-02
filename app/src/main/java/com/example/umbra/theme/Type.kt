package com.example.umbra.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Serif family gives a carved/etched stone feel appropriate for medieval fantasy
private val MedievalDisplay = FontFamily.Serif
private val MedievalBody = FontFamily.Default

val UmbraTypography = Typography(
    // Large titles — names, headers, section titles
    headlineLarge = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 34.sp,
        letterSpacing = 1.sp,
        color = TextGold
    ),
    // Medium titles — dialog titles, screen names
    headlineMedium = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.8.sp,
        color = TextPrimary
    ),
    // Small titles — card headers, subsections
    headlineSmall = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp,
        color = TextPrimary
    ),
    // Title Large — prominent labels
    titleLarge = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 26.sp,
        letterSpacing = 0.5.sp,
        color = TextGold
    ),
    // Title Medium — secondary labels
    titleMedium = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        letterSpacing = 0.3.sp,
        color = TextPrimary
    ),
    // Title Small — small labels
    titleSmall = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.3.sp,
        color = TextSecondary
    ),
    // Body Large — main readable text
    bodyLarge = TextStyle(
        fontFamily = MedievalBody,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.3.sp,
        color = TextPrimary
    ),
    // Body Medium — secondary text
    bodyMedium = TextStyle(
        fontFamily = MedievalBody,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.2.sp,
        color = TextSecondary
    ),
    // Body Small — captions, hints
    bodySmall = TextStyle(
        fontFamily = MedievalBody,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.2.sp,
        color = TextMuted
    ),
    // Label Large — buttons, tabs
    labelLarge = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.Bold,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = 1.sp,
        color = TextPrimary
    ),
    // Label Medium — small buttons, badges
    labelMedium = TextStyle(
        fontFamily = MedievalDisplay,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.8.sp,
        color = TextSecondary
    ),
    // Label Small — tiny labels, counters
    labelSmall = TextStyle(
        fontFamily = MedievalBody,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.5.sp,
        color = TextMuted
    ),
)
