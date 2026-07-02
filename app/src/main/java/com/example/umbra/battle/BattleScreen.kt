package com.example.umbra.battle

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.umbra.theme.*

private val goldFrameBrush = Brush.linearGradient(
    colors = listOf(
        Color(0xFF6B5A30),
        Color(0xFFB89A40),
        Color(0xFFD4B860),
        Color(0xFFB89A40),
        Color(0xFF6B5A30),
    ),
    start = Offset(0f, 0f),
    end = Offset(Float.MAX_VALUE, Float.MAX_VALUE)
)

@Composable
fun BattleScreen(
    viewModel: BattleViewModel,
    modifier: Modifier = Modifier
) {
    val enemyHp by viewModel.enemyHp.collectAsState()
    val playerHp by viewModel.playerHp.collectAsState()
    val isHit by viewModel.isHit.collectAsState()

    // Flash red on hit — muted blood red, not neon
    val backgroundColor by animateColorAsState(
        targetValue = if (isHit) Color(0xAA661810) else BgDeepBlack,
        animationSpec = tween(durationMillis = 200)
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        // Vignette overlay for atmosphere
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color(0xCC0A0806)
                        ),
                        radius = 800f
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ── Top: Enemy ──
            BattleCharacterBlock(
                name = "Oponente",
                subtitle = "Alvo",
                hp = enemyHp,
                maxHp = 100,
                isEnemy = true
            )

            // ── Center: Instruction ──
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                if (playerHp > 0 && enemyHp > 0) {
                    Text(
                        text = "BALANCE O CELULAR",
                        fontFamily = FontFamily.Serif,
                        fontSize = 16.sp,
                        color = TextMuted,
                        style = TextStyle(
                            shadow = Shadow(
                                color = BgDeepBlack,
                                offset = Offset(1f, 1f),
                                blurRadius = 3f
                            )
                        )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "PARA ATACAR",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 36.sp,
                        color = TorchFlame,
                        style = TextStyle(
                            shadow = Shadow(
                                color = TorchDeep,
                                offset = Offset(2f, 2f),
                                blurRadius = 4f
                            )
                        )
                    )
                } else if (playerHp <= 0) {
                    Text(
                        text = "MORTESTE",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 42.sp,
                        color = HealthRed,
                        style = TextStyle(
                            shadow = Shadow(
                                color = BgDeepBlack,
                                offset = Offset(3f, 3f),
                                blurRadius = 6f
                            )
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "A escuridão o consumiu",
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                        fontSize = 14.sp,
                        color = TextMuted
                    )
                } else if (enemyHp <= 0) {
                    Text(
                        text = "VITÓRIA",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 42.sp,
                        color = GoldAged,
                        style = TextStyle(
                            shadow = Shadow(
                                color = TorchDeep,
                                offset = Offset(3f, 3f),
                                blurRadius = 6f
                            )
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "O inimigo sucumbiu",
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                        fontSize = 14.sp,
                        color = TextSecondary
                    )
                }
            }

            // ── Bottom: Player ──
            BattleCharacterBlock(
                name = "Capitã Caos",
                subtitle = "Corsários das Ruas",
                hp = playerHp,
                maxHp = 100,
                isEnemy = false
            )
        }
    }
}

@Composable
private fun BattleCharacterBlock(
    name: String,
    subtitle: String,
    hp: Int,
    maxHp: Int,
    isEnemy: Boolean
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        // Portrait frame
        Box(contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .shadow(4.dp, CircleShape)
                    .background(goldFrameBrush, CircleShape)
                    .padding(3.dp)
                    .background(BgDeepBlack, CircleShape)
                    .border(1.dp, BorderGold, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isEnemy) "?" else "CC",
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    color = if (isEnemy) HostileRed else GoldAged,
                    style = TextStyle(
                        shadow = Shadow(
                            color = BgDeepBlack,
                            offset = Offset(1f, 1f),
                            blurRadius = 2f
                        )
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Name
        Text(
            text = name,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp,
            color = if (isEnemy) HostileRed else TextGold,
            style = TextStyle(
                shadow = Shadow(
                    color = BgDeepBlack,
                    offset = Offset(1f, 1f),
                    blurRadius = 3f
                )
            )
        )
        Text(
            text = subtitle,
            fontFamily = FontFamily.Serif,
            fontStyle = FontStyle.Italic,
            fontSize = 12.sp,
            color = TextMuted
        )

        Spacer(modifier = Modifier.height(12.dp))

        // HP Bar — ornamental frame
        Column(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .shadow(2.dp, RoundedCornerShape(4.dp))
                .background(goldFrameBrush, RoundedCornerShape(4.dp))
                .padding(2.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(24.dp)
                    .background(BgDeepBlack, RoundedCornerShape(2.dp))
            ) {
                // HP fill
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fraction = (hp.toFloat() / maxHp).coerceIn(0f, 1f))
                        .background(
                            Brush.horizontalGradient(
                                colors = if (isEnemy) listOf(HostileRed, HealthRedLight)
                                else listOf(HealthRed, HealthRedLight)
                            ),
                            RoundedCornerShape(2.dp)
                        )
                )
                // HP text
                Text(
                    text = "HP  $hp / $maxHp",
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = Color.White,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().align(Alignment.Center),
                    style = TextStyle(
                        shadow = Shadow(
                            color = BgDeepBlack,
                            offset = Offset(0.5f, 0.5f),
                            blurRadius = 2f
                        )
                    )
                )
            }
        }
    }
}
