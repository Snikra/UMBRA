package com.example.umbra.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val UmbraDarkScheme = darkColorScheme(
    primary            = GoldAged,
    onPrimary          = BgDeepBlack,
    primaryContainer   = GoldDark,
    onPrimaryContainer = TextPrimary,

    secondary          = TorchFlame,
    onSecondary        = BgDeepBlack,
    secondaryContainer = TorchEmber,
    onSecondaryContainer = TextPrimary,

    tertiary           = ManaBlue,
    onTertiary         = TextPrimary,
    tertiaryContainer  = ManaBlueLight,
    onTertiaryContainer = TextPrimary,

    background         = BgDeepBlack,
    onBackground       = TextPrimary,

    surface            = BgDarkStone,
    onSurface          = TextPrimary,
    surfaceVariant     = SurfaceStone,
    onSurfaceVariant   = TextSecondary,

    outline            = BorderAged,
    outlineVariant     = BorderGold,

    error              = ErrorDark,
    onError            = TextPrimary,
    errorContainer     = HostileRed,
    onErrorContainer   = TextPrimary,
)

@Composable
fun UmbraTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // Always use dark scheme — UMBRA is a dark fantasy game
    MaterialTheme(
        colorScheme = UmbraDarkScheme,
        typography = UmbraTypography,
        content = content
    )
}
