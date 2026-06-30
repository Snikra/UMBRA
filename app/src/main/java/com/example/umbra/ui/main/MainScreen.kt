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
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import com.mapbox.maps.extension.compose.MapEffect
import com.mapbox.maps.plugin.locationcomponent.location
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable

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

  val isSearching by battleViewModel.isSearching.collectAsState()

  LaunchedEffect(discoveredOpponents) {
      if (discoveredOpponents.isNotEmpty()) {
          showBattleDialog = true
      }
  }

  // GPS State
  var userLoc by remember { mutableStateOf(Pair(-46.6333, -23.5505)) }
  val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
  var is3DView by remember { mutableStateOf(true) }
  val mapPitch by animateFloatAsState(targetValue = if (is3DView) 60f else 0f, label = "pitch")

  val mapViewportState = remember { MapViewportState().apply {
      setCameraOptions {
          center(Point.fromLngLat(-46.6333, -23.5505))
          pitch(60.0)
          zoom(15.0)
      }
  }}

  LaunchedEffect(mapPitch) {
      mapViewportState.setCameraOptions {
          pitch(mapPitch.toDouble())
      }
  }

  val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  val bluetoothAdapter = bluetoothManager.adapter
  val enableBluetoothLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      if (result.resultCode == android.app.Activity.RESULT_OK) {
          showBattleDialog = true
      }
  }

  var hasLocationPermission by remember { 
      mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) 
  }

  val locationPermissionLauncher = rememberLauncherForActivityResult(
      contract = ActivityResultContracts.RequestPermission()
  ) { isGranted ->
      hasLocationPermission = isGranted
  }

  LaunchedEffect(Unit) {
      if (!hasLocationPermission) {
          locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
      }
  }

  DisposableEffect(hasLocationPermission) {
      var locationCallback: LocationCallback? = null
      if (hasLocationPermission) {
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
          try {
              fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, android.os.Looper.getMainLooper())
          } catch (e: SecurityException) {
              // Permission was revoked
          }
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
        MapEffect { mapView ->
            mapView.location.updateSettings {
                enabled = true
                pulsingEnabled = true
            }
        }
    }

    // Camada 2: HUD
    Column(
      modifier = Modifier.fillMaxSize()
    ) {
      TopStatusRow()
      Spacer(modifier = Modifier.weight(1f))
      SearchBarRow()
      BottomNavBar(onMapToggle = { is3DView = !is3DView })
    }

    // Floating Action Buttons na Direita
    RightActionPanel(
      onBattleClick = { 
          if (bluetoothAdapter?.isEnabled == true) {
              showBattleDialog = true 
          } else {
              enableBluetoothLauncher.launch(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE))
          }
      },
      modifier = Modifier
        .align(Alignment.CenterEnd)
        .padding(end = 16.dp)
    )

    if (isSearching) {
        val infiniteTransition = rememberInfiniteTransition(label = "radar")
        val radius by infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 800f,
            animationSpec = infiniteRepeatable(
                animation = tween(2000, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "radius"
        )
        val alpha by infiniteTransition.animateFloat(
            initialValue = 1f,
            targetValue = 0f,
            animationSpec = infiniteRepeatable(
                animation = tween(2000, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "alpha"
        )
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCircle(
                    color = Color(0xFF00BCD4).copy(alpha = alpha),
                    radius = radius,
                    center = center
                )
                drawCircle(
                    color = Color.Red.copy(alpha = alpha),
                    radius = radius * 0.7f,
                    center = center
                )
            }
        }
    }

    if (showBattleDialog && !isSearching) {
      AlertDialog(
        onDismissRequest = { 
            showBattleDialog = false
            battleViewModel.stopFenda()
        },
        title = { 
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Fenda de Duelo ⚔️")
                IconButton(onClick = {
                    showBattleDialog = false
                    battleViewModel.stopFenda()
                }) {
                    Text("X", fontSize = 18.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                }
            }
        },
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
              showBattleDialog = false
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
fun BottomNavBar(onMapToggle: () -> Unit) {
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
          .clickable { onMapToggle() }
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
