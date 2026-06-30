package com.example.umbra.battle

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun BattleScreen(
    viewModel: BattleViewModel,
    modifier: Modifier = Modifier
) {
    val enemyHp by viewModel.enemyHp.collectAsState()
    val playerHp by viewModel.playerHp.collectAsState()
    val isHit by viewModel.isHit.collectAsState()

    // Fundo pisca vermelho se tomar dano
    val backgroundColor by animateColorAsState(
        targetValue = if (isHit) Color(0xAAFF0000) else Color(0xFF121212),
        animationSpec = tween(durationMillis = 150)
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Topo: Inimigo
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Oponente (Alvo)",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
                Text("HP: $enemyHp / 100", color = Color.Gray)
                LinearProgressIndicator(
                    progress = { enemyHp / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(20.dp)
                        .padding(top = 8.dp),
                    color = Color.Red,
                    trackColor = Color.DarkGray
                )
            }

            // Centro: Instrução Visceral
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                if (playerHp > 0 && enemyHp > 0) {
                    Text("BALANCE O CELULAR PARA", color = Color.Gray, fontSize = 16.sp)
                    Text("ATACAR!", color = Color.Red, fontSize = 48.sp, fontWeight = FontWeight.Black)
                } else if (playerHp <= 0) {
                    Text("VOCÊ MORREU", color = Color.Red, fontSize = 48.sp, fontWeight = FontWeight.Black)
                } else if (enemyHp <= 0) {
                    Text("VITÓRIA!", color = Color(0xFFFFD700), fontSize = 48.sp, fontWeight = FontWeight.Black)
                }
            }

            // Base: Jogador Local
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                LinearProgressIndicator(
                    progress = { playerHp / 100f },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(20.dp)
                        .padding(bottom = 8.dp),
                    color = Color(0xFF4CAF50),
                    trackColor = Color.DarkGray
                )
                Text("HP: $playerHp / 100", color = Color.Gray)
                Text(
                    text = "Você",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
