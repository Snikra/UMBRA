package com.example.umbra.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation3.runtime.NavKey
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.style.MapStyle

import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.umbra.battle.BattleViewModel
import com.example.umbra.battle.BattleScreen
import androidx.compose.runtime.collectAsState
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.mapbox.maps.extension.compose.annotation.generated.PointAnnotation
import com.mapbox.geojson.Point

@Composable
fun MainScreen(
  onItemClick: (NavKey) -> Unit,
  modifier: Modifier = Modifier
) {
  var showBattleDialog by remember { mutableStateOf(false) }
  val context = LocalContext.current
  val battleViewModel: BattleViewModel = viewModel()
  val discoveredOpponents by battleViewModel.discoveredOpponents.collectAsState()
  val connectedOpponent by battleViewModel.connectedOpponentId.collectAsState()

  if (connectedOpponent != null) {
      BattleScreen(viewModel = battleViewModel)
      return
  }

  // GPS State
  var userLoc by remember { mutableStateOf(Pair(-46.6333, -23.5505)) }
  val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
  val mapViewportState = remember { MapViewportState().apply {
      setCameraOptions {
          center(Point.fromLngLat(-46.6333, -23.5505))
          pitch(60.0)
          zoom(15.0)
      }
  }}

  val locationPermissionLauncher = rememberLauncherForActivityResult(
      contract = ActivityResultContracts.RequestPermission()
  ) { isGranted ->
      if (isGranted) {
          // Permissão concedida
      }
  }

  LaunchedEffect(Unit) {
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
          locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
      }
  }

  DisposableEffect(Unit) {
      var locationCallback: LocationCallback? = null
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
          val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000).build()
          locationCallback = object : LocationCallback() {
              override fun onLocationResult(result: LocationResult) {
                  result.lastLocation?.let { loc ->
                      userLoc = Pair(loc.longitude, loc.latitude)
                      mapViewportState.setCameraOptions {
                          center(Point.fromLngLat(loc.longitude, loc.latitude))
                      }
                  }
              }
          }
          fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, android.os.Looper.getMainLooper())
      }
      onDispose {
          locationCallback?.let { fusedLocationClient.removeLocationUpdates(it) }
      }
  }

  Box(modifier = Modifier.fillMaxSize()) {
    // Camada 1: Mapa Base (Mapbox)
    MapboxMap(
      modifier = Modifier.fillMaxSize(),
      mapViewportState = mapViewportState,
      style = {
        MapStyle(style = com.mapbox.maps.Style.DARK)
      }
    ) {
        PointAnnotation(
            point = Point.fromLngLat(userLoc.first, userLoc.second),
            iconImage = "",
            textField = "👩🏻‍🎤",
            textSize = 40.0
        )
    }

    // Camada 2: HUD
    Column(
      modifier = Modifier.fillMaxSize()
    ) {
      TopStatusRow()
      Spacer(modifier = Modifier.weight(1f))
      SearchBarRow()
      BottomNavBar()
    }

    // Floating Action Buttons na Direita
    RightActionPanel(
      onBattleClick = { showBattleDialog = true },
      modifier = Modifier
        .align(Alignment.CenterEnd)
        .padding(end = 16.dp)
    )

    if (showBattleDialog) {
      AlertDialog(
        onDismissRequest = { showBattleDialog = false },
        title = { Text("Fenda de Duelo ⚔️") },
        text = { 
          Column {
            Text("Escolha sua estratégia de combate local:")
            Spacer(modifier = Modifier.height(16.dp))
            if (discoveredOpponents.isNotEmpty()) {
                Text("Oponentes Encontrados:", color = Color.White, fontWeight = FontWeight.Bold)
                discoveredOpponents.forEach { opponent ->
                    Button(
                        onClick = {
                            battleViewModel.connectToOpponent("Capitã Caos", opponent.endpointId)
                            showBattleDialog = false
                        },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray)
                    ) {
                        Text("Atacar: ${opponent.name}")
                    }
                }
            } else if (showBattleDialog) {
                // Se a janela estiver aberta e não achou ninguém ainda, mostra um texto
                Text("Procurando sinais nas redondezas...", color = Color.Gray, fontSize = 12.sp)
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), color = Color(0xFF00BCD4), trackColor = Color.DarkGray)
            }
          }
        },
        confirmButton = {
          Button(
            onClick = {
              battleViewModel.hostFenda("Capitã Caos")
              showBattleDialog = false
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B0000))
          ) {
            Text("Hospedar Fenda (Aguardar)")
          }
        },
        dismissButton = {
          OutlinedButton(
            onClick = {
              battleViewModel.searchOponente()
            }
          ) {
            Text("Procurar Oponente")
          }
        },
        containerColor = Color(0xFF1E1E1E),
        titleContentColor = Color.White,
        textContentColor = Color.LightGray
      )
    }
  }
}

@Composable
fun TopStatusRow() {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .padding(16.dp)
      .statusBarsPadding(),
    horizontalArrangement = Arrangement.SpaceBetween
  ) {
    // Esquerda: Perfil e Barras
    Row(verticalAlignment = Alignment.CenterVertically) {
      Box(
        modifier = Modifier
          .size(60.dp)
          .clip(CircleShape)
          .background(Color.DarkGray)
      ) {
         Text("👩🏻‍🎤", modifier = Modifier.align(Alignment.Center), fontSize = 32.sp)
      }
      Spacer(modifier = Modifier.width(8.dp))
      Column {
        Text("Capitã Caos", color = Color.White, fontWeight = FontWeight.Bold)
        Text("Corsários das Ruas", color = Color.Gray, fontSize = 12.sp)
        LinearProgressIndicator(
          progress = { 1f },
          modifier = Modifier.width(100.dp).padding(vertical = 2.dp),
          color = Color(0xFF4CAF50),
          trackColor = Color.DarkGray
        )
        LinearProgressIndicator(
          progress = { 1f },
          modifier = Modifier.width(100.dp),
          color = Color(0xFF2196F3),
          trackColor = Color.DarkGray
        )
      }
    }
    
    // Direita: Moedas
    Row(verticalAlignment = Alignment.CenterVertically) {
      Text("🪙 87.650", color = Color(0xFFFFD700), modifier = Modifier.padding(end = 8.dp))
      Text("💎 2.340", color = Color(0xFF00BCD4), modifier = Modifier.padding(end = 8.dp))
    }
  }
}

@Composable
fun SearchBarRow() {
  OutlinedTextField(
    value = "",
    onValueChange = {},
    placeholder = { Text("Buscar destino...", color = Color.Gray) },
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 32.dp, vertical = 16.dp)
      .background(Color(0xAA000000), RoundedCornerShape(24.dp)),
    shape = RoundedCornerShape(24.dp),
    colors = OutlinedTextFieldDefaults.colors(
      focusedBorderColor = Color.Transparent,
      unfocusedBorderColor = Color.Transparent
    )
  )
}

@Composable
fun BottomNavBar() {
  Surface(
    color = Color(0xFF121212),
    modifier = Modifier.fillMaxWidth()
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 12.dp, horizontal = 16.dp)
        .navigationBarsPadding()
    ) {
      // Itens da Esquerda
      Row(
        modifier = Modifier.align(Alignment.CenterStart),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        Text("PERSONAGEM", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text("INVENTÁRIO", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
      }
      
      // Ícone do Mapa EXATAMENTE no Centro
      Box(
        modifier = Modifier
          .size(60.dp)
          .align(Alignment.Center)
          .clip(CircleShape)
          .background(Color(0xFFB8860B)) // Dourado escuro
      ) {
         Text("🗺️", modifier = Modifier.align(Alignment.Center), fontSize = 24.sp)
      }

      // Itens da Direita
      Row(
        modifier = Modifier.align(Alignment.CenterEnd),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        Text("MISSÕES", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text("CLÃ", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
      }
    }
  }
}

@Composable
fun RightActionPanel(onBattleClick: () -> Unit, modifier: Modifier = Modifier) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    FloatingActionButton(onClick = {}, containerColor = Color(0xFF1E1E1E), contentColor = Color.White) { Text("☀️") }
    FloatingActionButton(onClick = {}, containerColor = Color(0xFF1E1E1E), contentColor = Color.White) { Text("🎒") }
    FloatingActionButton(onClick = onBattleClick, containerColor = Color(0xFF8B0000), contentColor = Color.White) { Text("⚔️") }
  }
}
