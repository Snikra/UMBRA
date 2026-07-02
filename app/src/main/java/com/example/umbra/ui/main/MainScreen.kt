package com.example.umbra.ui.main

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.TextFieldDefaults.colors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.umbra.battle.BattleViewModel
import com.example.umbra.battle.BattleScreen
import com.example.umbra.theme.*
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
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.style.MapStyle
import com.mapbox.maps.extension.compose.annotation.generated.PointAnnotation
import com.mapbox.geojson.Point
import androidx.navigation3.runtime.NavKey

// ── Data structures ──
private data class Quest(val title: String, val description: String, val isActive: Boolean, val progress: Float)

private data class PoiMarker(
    val id: String,
    val name: String,
    val lng: Double,
    val lat: Double,
    val type: PoiType,
    val isDanger: Boolean = false,
    val isDiscovered: Boolean = true,
)

private enum class PoiType { VILLAGE, DUNGEON, RUIN, SHRINE, SHOP, FAST_TRAVEL }

// ── Sample POI data (around São Paulo) ──
private val samplePois = listOf(
    PoiMarker("v1", "Aldeia dos Corvos", -46.6300, -23.5480, PoiType.VILLAGE),
    PoiMarker("d1", "Masmorra Sombria", -46.6350, -23.5520, PoiType.DUNGEON, isDanger = true),
    PoiMarker("r1", "Ruínas de Arcana", -46.6280, -23.5470, PoiType.RUIN),
    PoiMarker("s1", "Santuário da Lua", -46.6310, -23.5510, PoiType.SHRINE),
    PoiMarker("ft1", "Círculo de Teletransporte", -46.6330, -23.5495, PoiType.FAST_TRAVEL),
)

// ── Ornamental frame brush for portrait ──
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
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier
) {
    var showBattleDialog by remember { mutableStateOf(false) }
    var isSearchingOpponents by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val battleViewModel: BattleViewModel = viewModel()
    val discoveredOpponents by battleViewModel.discoveredOpponents.collectAsState()
    val connectedOpponent by battleViewModel.connectedOpponentId.collectAsState()

    if (connectedOpponent != null) {
        BattleScreen(viewModel = battleViewModel)
        return
    }

    // ── New feature states ──
    var showMiniMap by remember { mutableStateOf(false) }
    var showQuestLog by remember { mutableStateOf(false) }
    var selectedLocation by remember { mutableStateOf<String?>(null) }
    var showContextMenu by remember { mutableStateOf(false) }
    val inGameTime = "14:32"
    val currentWeather = "\u2601" // cloud
    val currentLocationName = "Floresta Sombria"
    val currentRegion = "Vale dos Corvos"

    val quests = remember {
        listOf(
            Quest("Sangue dos Corvos", "Derrote 5 corvos sombrios na floresta", true, 0.6f),
            Quest("Ruínas Esquecidas", "Explore as catacumbas antigas", true, 0.2f),
            Quest("O Ferreiro Perdido", "Encontre as ferramentas do mestre ferreiro", true, 0.0f),
            Quest("Selos da Noite", "Colete 3 selos ancestrais", false, 1.0f),
            Quest("A Coroa de Obsidiana", "Recupere a coroa do rei das trevas", false, 1.0f),
        )
    }

    // GPS State
    var userLoc by remember { mutableStateOf(Pair(-46.6333, -23.5505)) }
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    val mapViewportState = remember {
        MapViewportState().apply {
            setCameraOptions {
                center(Point.fromLngLat(-46.6333, -23.5505))
                pitch(60.0)
                zoom(15.0)
            }
        }
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { /* granted or not */ }

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    DisposableEffect(Unit) {
        var locationCallback: LocationCallback? = null
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED
        ) {
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
            fusedLocationClient.requestLocationUpdates(
                locationRequest, locationCallback, android.os.Looper.getMainLooper()
            )
        }
        onDispose {
            locationCallback?.let { fusedLocationClient.removeLocationUpdates(it) }
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(BgDeepBlack)) {
        // ── Layer 1: Map with annotations ──
        MapboxMap(
            modifier = Modifier.fillMaxSize(),
            mapViewportState = mapViewportState,
            style = { MapStyle(style = com.mapbox.maps.Style.DARK) }
        ) {
            // User position with sword icon
            PointAnnotation(
                point = Point.fromLngLat(userLoc.first, userLoc.second),
                iconImage = "",
                textField = "\u2694",
                textSize = 32.0,
                textColor = "#B89A40",
                textHaloColor = "#000000",
                textHaloWidth = 2.0,
            )
            // Quest marker: active quest POI
            PointAnnotation(
                point = Point.fromLngLat(-46.6340, -23.5505),
                iconImage = "",
                textField = "\u2605",
                textSize = 24.0,
                textColor = "#FFD700",
                textHaloColor = "#000000",
                textHaloWidth = 2.0,
            )
            // Danger zone marker (dungeon)
            PointAnnotation(
                point = Point.fromLngLat(-46.6350, -23.5520),
                iconImage = "",
                textField = "\u2620",
                textSize = 28.0,
                textColor = "#CC3333",
                textHaloColor = "#000000",
                textHaloWidth = 2.0,
            )
            // Fast travel point
            PointAnnotation(
                point = Point.fromLngLat(-46.6330, -23.5495),
                iconImage = "",
                textField = "\u2316",
                textSize = 22.0,
                textColor = "#4A90D9",
                textHaloColor = "#000000",
                textHaloWidth = 2.0,
            )
            // Village POI
            PointAnnotation(
                point = Point.fromLngLat(-46.6300, -23.5480),
                iconImage = "",
                textField = "\u2302",
                textSize = 22.0,
                textColor = "#D4C8B0",
                textHaloColor = "#000000",
                textHaloWidth = 2.0,
            )
            // Mystical shrine
            PointAnnotation(
                point = Point.fromLngLat(-46.6280, -23.5470),
                iconImage = "",
                textField = "\u2726",
                textSize = 22.0,
                textColor = "#B89A40",
                textHaloColor = "#000000",
                textHaloWidth = 2.0,
            )
        }

        // ── Layer 2: Location Header Bar (very top) ──
        LocationHeaderBar(
            locationName = currentLocationName,
            region = currentRegion,
            weatherIcon = currentWeather,
            time = inGameTime,
            modifier = Modifier.align(Alignment.TopCenter)
        )

        // ── Layer 3: Top HUD ──
        TopMedievalHud(
            modifier = Modifier.align(Alignment.TopCenter),
            onMiniMapToggle = { showMiniMap = !showMiniMap },
            onQuestLogToggle = { showQuestLog = !showQuestLog }
        )

        // ── Layer 4: Mini-Map overlay (top-left) ──
        if (showMiniMap) {
            MiniMapOverlay(
                userLoc = userLoc,
                onDismiss = { showMiniMap = false },
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(start = 8.dp, top = 140.dp)
            )
        }

        // ── Layer 5: Sidebar (right) ──
        MedievalSidebar(
            onBattleClick = { showBattleDialog = true },
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 8.dp, top = 160.dp)
        )

        // ── Layer 6: Zoom controls (bottom-right) ──
        ZoomControls(
            onZoomIn = {
                mapViewportState.setCameraOptions { zoom(mapViewportState.cameraOptions.zoom!! + 1.0) }
            },
            onZoomOut = {
                mapViewportState.setCameraOptions { zoom(mapViewportState.cameraOptions.zoom!! - 1.0) }
            },
            onReset = {
                mapViewportState.setCameraOptions {
                    zoom(15.0)
                    center(Point.fromLngLat(userLoc.first, userLoc.second))
                }
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 12.dp, bottom = 140.dp)
        )

        // ── Layer 7: Bottom area (search + nav) ──
        Column(modifier = Modifier.align(Alignment.BottomCenter)) {
            MedievalSearchBar()
            MedievalBottomNav()
        }

        // ── Layer 8: Long-press context menu ──
        if (showContextMenu && selectedLocation != null) {
            MapContextMenu(
                locationName = selectedLocation!!,
                onDismiss = {
                    showContextMenu = false
                    selectedLocation = null
                },
                onTravelHere = {
                    showContextMenu = false
                    selectedLocation = null
                },
                onSetWaypoint = {
                    showContextMenu = false
                    selectedLocation = null
                },
                onViewDetails = {
                    showContextMenu = false
                    selectedLocation = null
                },
                modifier = Modifier.align(Alignment.Center)
            )
        }

        // ── Layer 9: Quest Log Dialog ──
        if (showQuestLog) {
            QuestLogDialog(
                quests = quests,
                onDismiss = { showQuestLog = false }
            )
        }

        // ── Layer 10: Battle Dialog ──
        if (showBattleDialog) {
            MedievalBattleDialog(
                onDismiss = {
                    showBattleDialog = false
                    isSearchingOpponents = false
                },
                onHost = {
                    battleViewModel.hostFenda("Capitã Caos")
                    showBattleDialog = false
                    isSearchingOpponents = false
                },
                onSearch = {
                    battleViewModel.searchOponente()
                    isSearchingOpponents = true
                },
                onAttack = { endpointId ->
                    battleViewModel.connectToOpponent("Capitã Caos", endpointId)
                    showBattleDialog = false
                    isSearchingOpponents = false
                },
                opponents = discoveredOpponents,
                isSearching = isSearchingOpponents && discoveredOpponents.isEmpty()
            )
        }
    }
}

// ════════════════════════════════════════════
// TOP HUD — Portrait + Resources + Compass
// ════════════════════════════════════════════

@Composable
private fun TopMedievalHud(
    modifier: Modifier = Modifier,
    onMiniMapToggle: () -> Unit = {},
    onQuestLogToggle: () -> Unit = {}
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .statusBarsPadding(),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // ── Left: Portrait + Name + Bars ──
        PortraitWithBars()

        // ── Center: Resources ──
        ResourcePills()

        // ── Right: Action buttons (mini-map, quest log, compass) ──
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            MiniMapButton(onClick = onMiniMapToggle)
            QuestLogButton(onClick = onQuestLogToggle)
            CompassWidget()
        }
    }
}

@Composable
private fun PortraitWithBars() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        // Portrait with ornamental frame
        Box(contentAlignment = Alignment.Center) {
            // Outer gold frame
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .shadow(4.dp, CircleShape)
                    .background(goldFrameBrush, CircleShape)
            ) {
                // Inner dark border
                Box(
                    modifier = Modifier
                        .padding(3.dp)
                        .fillMaxSize()
                        .background(BgDeepBlack, CircleShape)
                        .border(1.dp, BorderGold, CircleShape)
                ) {
                    // Portrait content — stylized face
                    Box(
                        modifier = Modifier
                            .padding(4.dp)
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(SurfaceStone, BgDarkStone)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "CC",
                            style = TextStyle(
                                fontFamily = FontFamily.Serif,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = GoldAged,
                                shadow = Shadow(
                                    color = BgDeepBlack,
                                    offset = Offset(1f, 1f),
                                    blurRadius = 2f
                                )
                            )
                        )
                    }
                }
            }
            // Level badge at bottom-right of portrait
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .offset(x = 2.dp, y = 2.dp)
                    .size(18.dp)
                    .background(BgDeepBlack, CircleShape)
                    .border(1.5.dp, GoldDark, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "45",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = GoldAged
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Name, guild, and bars
        Column(modifier = Modifier.width(100.dp)) {
            Text(
                text = "Capitã Caos",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = TextGold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = TextStyle(
                    shadow = Shadow(
                        color = BgDeepBlack,
                        offset = Offset(1f, 1f),
                        blurRadius = 3f
                    )
                )
            )
            Text(
                text = "Corsários das Ruas",
                fontSize = 9.sp,
                color = TextMuted,
                fontFamily = FontFamily.Serif,
                fontStyle = FontStyle.Italic,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = TextStyle(
                    shadow = Shadow(
                        color = BgDeepBlack,
                        offset = Offset(0.5f, 0.5f),
                        blurRadius = 2f
                    )
                )
            )
            Spacer(modifier = Modifier.height(3.dp))
            // HP Bar
            HealthBar(hp = 1250, maxHp = 1250, widthDp = 95.dp)
            Spacer(modifier = Modifier.height(2.dp))
            // MP Bar
            ManaBar(mp = 520, maxMp = 520, widthDp = 95.dp)
        }
    }
}

@Composable
private fun HealthBar(hp: Int, maxHp: Int, widthDp: Modifier = Modifier) {
    Column {
        Box(
            modifier = Modifier
                .width(widthDp)
                .height(10.dp)
                .background(BgDeepBlack, RoundedCornerShape(2.dp))
                .border(1.dp, BorderAged, RoundedCornerShape(2.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(fraction = (hp.toFloat() / maxHp).coerceIn(0f, 1f))
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(HealthRed, HealthRedLight)
                        ),
                        RoundedCornerShape(1.dp)
                    )
            )
            Text(
                text = "$hp/$maxHp",
                fontSize = 7.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ManaBar(mp: Int, maxMp: Int, widthDp: Modifier = Modifier) {
    Column {
        Box(
            modifier = Modifier
                .width(widthDp)
                .height(10.dp)
                .background(BgDeepBlack, RoundedCornerShape(2.dp))
                .border(1.dp, BorderAged, RoundedCornerShape(2.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(fraction = (mp.toFloat() / maxMp).coerceIn(0f, 1f))
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(ManaBlue, ManaBlueLight)
                        ),
                        RoundedCornerShape(1.dp)
                    )
            )
            Text(
                text = "$mp/$maxMp",
                fontSize = 7.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ResourcePills() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ResourcePill(icon = "\u2B50", value = "87.650", color = CoinGold)   // star as coin proxy
        ResourcePill(icon = "\u25C6", value = "2.340", color = GemCyan)    // diamond shape
        ResourcePill(icon = "\u2665", value = "120", color = EnergyRed)    // heart shape
    }
}

@Composable
private fun ResourcePill(icon: String, value: String, color: Color) {
    Box(
        modifier = Modifier
            .background(
                Brush.verticalGradient(
                    colors = listOf(SurfaceStone, BgDarkStone)
                ),
                RoundedCornerShape(4.dp)
            )
            .border(0.5.dp, BorderGold, RoundedCornerShape(4.dp))
            .padding(horizontal = 6.dp, vertical = 3.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = icon,
                fontSize = 11.sp,
                color = color
            )
            Spacer(modifier = Modifier.width(3.dp))
            Text(
                text = value,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = TextPrimary
            )
        }
    }
}

@Composable
private fun CompassWidget() {
    Box(
        modifier = Modifier
            .size(44.dp)
            .shadow(3.dp, CircleShape)
            .background(goldFrameBrush, CircleShape)
            .padding(2.dp)
            .background(BgDeepBlack, CircleShape)
            .border(1.dp, BorderGold, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        // Compass needle
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "\u25B2", // triangle up = North
                fontSize = 10.sp,
                color = HealthRed
            )
            Text(
                text = "N",
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = TextMuted
            )
        }
    }
}

// ════════════════════════════════════════════
// SIDEBAR — Stone-textured buttons
// ════════════════════════════════════════════

@Composable
private fun MedievalSidebar(
    onBattleClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SidebarButton(icon = "\u2694", onClick = {}) // swords
        SidebarButton(icon = "\u2697", onClick = {}) // alembic
        SidebarButton(icon = "\u2620", onClick = onBattleClick) // skull (battle)
        SidebarButton(icon = "\u2606", onClick = {}) // star
        SidebarButton(
            icon = "\u2630",
            onClick = {},
            isLarger = true,
            label = "MISSÕES"
        )
    }
}

@Composable
private fun SidebarButton(
    icon: String,
    onClick: () -> Unit,
    isLarger: Boolean = false,
    label: String? = null
) {
    val size = if (isLarger) 42.dp else 36.dp
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(size)
                .shadow(2.dp, CircleShape)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(SurfaceStone, BgPanel)
                    ),
                    CircleShape
                )
                .border(1.dp, BorderAged, CircleShape)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = icon,
                fontSize = if (isLarger) 18.sp else 15.sp,
                color = TextSecondary
            )
        }
        if (label != null) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                fontSize = 7.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = TextMuted,
                letterSpacing = 0.5.sp
            )
        }
    }
}

// ════════════════════════════════════════════
// SEARCH BAR
// ════════════════════════════════════════════

@Composable
private fun MedievalSearchBar() {
    OutlinedTextField(
        value = "",
        onValueChange = {},
        placeholder = {
            Text(
                "Buscar destino...",
                color = TextMuted,
                fontFamily = FontFamily.Serif,
                fontSize = 13.sp
            )
        },
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 40.dp, vertical = 6.dp)
            .background(BgPanel, RoundedCornerShape(20.dp))
            .border(1.dp, BorderAged, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        singleLine = true,
        colors = colors(
            focusedBorderColor = BorderGold,
            unfocusedBorderColor = BorderAged,
            cursorColor = GoldAged,
            focusedContainerColor = BgPanel,
            unfocusedContainerColor = BgPanel
        ),
        textStyle = TextStyle(
            fontFamily = FontFamily.Serif,
            color = TextPrimary,
            fontSize = 13.sp
        )
    )
}

// ════════════════════════════════════════════
// BOTTOM NAV — 5 items with ornamental frames
// ════════════════════════════════════════════

@Composable
private fun MedievalBottomNav() {
    Surface(
        color = BgPanel,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp)
                .navigationBarsPadding(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNavItem(icon = "\u265A", label = "HEROI", isActive = false)      // chess king
            BottomNavItem(icon = "\u265E", label = "ARMAZEM", isActive = false)    // chess knight
            BottomNavItem(icon = "\u2316", label = "MAPA", isActive = true)        // position indicator
            BottomNavItem(icon = "\u2605", label = "TAREFAS", isActive = false)    // star
            BottomNavItem(icon = "\u2694", label = "CLÃ", isActive = false)        // swords
        }
    }
}

@Composable
private fun BottomNavItem(icon: String, label: String, isActive: Boolean) {
    val bgColor = if (isActive) GoldDark else Color.Transparent
    val borderColor = if (isActive) GoldAged else BorderAged
    val textColor = if (isActive) TextGold else TextMuted
    val iconColor = if (isActive) TextGold else TextSecondary

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(56.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .border(0.5.dp, borderColor, RoundedCornerShape(8.dp))
            .padding(vertical = 4.dp)
    ) {
        Text(
            text = icon,
            fontSize = 20.sp,
            color = iconColor
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            letterSpacing = 0.5.sp,
            color = textColor
        )
    }
}

// ════════════════════════════════════════════
// BATTLE DIALOG — Medieval styled
// ════════════════════════════════════════════

@Composable
private fun MedievalBattleDialog(
    onDismiss: () -> Unit,
    onHost: () -> Unit,
    onSearch: () -> Unit,
    onAttack: (String) -> Unit,
    opponents: List<com.example.umbra.battle.DiscoveredOpponent>,
    isSearching: Boolean
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Fenda de Duelo",
                fontFamily = FontFamily.Serif,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                color = TextGold,
                style = TextStyle(
                    shadow = Shadow(
                        color = BgDeepBlack,
                        offset = Offset(1f, 1f),
                        blurRadius = 3f
                    )
                )
            )
        },
        text = {
            Column {
                Text(
                    text = "Escolha sua estratégia de combate local:",
                    fontFamily = FontFamily.Serif,
                    fontSize = 14.sp,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(16.dp))
                if (opponents.isNotEmpty()) {
                    Text(
                        text = "Oponentes Encontrados:",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    opponents.forEach { opponent ->
                        Button(
                            onClick = { onAttack(opponent.endpointId) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SurfaceStone
                            ),
                            shape = RoundedCornerShape(6.dp),
                            border = ButtonDefaults.outlinedButtonBorder(enabled = true)
                        ) {
                            Text(
                                text = "Atacar: ${opponent.name}",
                                fontFamily = FontFamily.Serif,
                                color = HealthRedLight
                            )
                        }
                    }
                } else if (isSearching) {
                    Text(
                        text = "Procurando sinais nas redondezas...",
                        fontFamily = FontFamily.Serif,
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(3.dp),
                        color = TorchFlame,
                        trackColor = SurfaceStone
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onHost,
                colors = ButtonDefaults.buttonColors(containerColor = HostileRed),
                shape = RoundedCornerShape(6.dp),
                border = ButtonDefaults.outlinedButtonBorder(enabled = true)
            ) {
                Text(
                    text = "Hospedar Fenda",
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onSearch,
                shape = RoundedCornerShape(6.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = TextSecondary
                )
            ) {
                Text(
                    text = "Procurar Oponente",
                    fontFamily = FontFamily.Serif
                )
            }
        },
        containerColor = BgPanel,
        titleContentColor = TextGold,
        textContentColor = TextSecondary,
        shape = RoundedCornerShape(12.dp)
    )
}

// ════════════════════════════════════════════
// LOCATION HEADER BAR
// ════════════════════════════════════════════

@Composable
private fun LocationHeaderBar(
    locationName: String,
    region: String,
    weatherIcon: String,
    time: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(BgDeepBlack.copy(alpha = 0.9f), BgDeepBlack.copy(alpha = 0.6f))
                )
            )
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left: Location
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "\u2302",
                    fontSize = 12.sp,
                    color = TextGold
                )
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = locationName,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        color = TextPrimary,
                        style = TextStyle(
                            shadow = Shadow(color = BgDeepBlack, offset = Offset(1f, 1f), blurRadius = 2f)
                        )
                    )
                    Text(
                        text = region,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Serif,
                        fontStyle = FontStyle.Italic,
                        color = TextMuted
                    )
                }
            }

            // Right: Weather + Time
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Weather
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = weatherIcon, fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "Nublado",
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Serif,
                        color = TextMuted
                    )
                }
                // Time
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "\u2609",
                        fontSize = 12.sp,
                        color = TorchFlame
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = time,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        color = TextPrimary
                    )
                }
            }
        }
    }
}

// ════════════════════════════════════════════
// MINI-MAP BUTTON (replaces old compass area)
// ════════════════════════════════════════════

@Composable
private fun MiniMapButton(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .shadow(2.dp, CircleShape)
            .background(goldFrameBrush, CircleShape)
            .padding(2.dp)
            .background(BgDeepBlack, CircleShape)
            .border(1.dp, BorderGold, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "\u25A3", // filled square with center
            fontSize = 14.sp,
            color = TextGold
        )
    }
}

// ════════════════════════════════════════════
// QUEST LOG BUTTON
// ════════════════════════════════════════════

@Composable
private fun QuestLogButton(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .shadow(2.dp, CircleShape)
            .background(goldFrameBrush, CircleShape)
            .padding(2.dp)
            .background(BgDeepBlack, CircleShape)
            .border(1.dp, BorderGold, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "\u2630", // trigram for heaven (quest log icon)
            fontSize = 14.sp,
            color = TextGold
        )
    }
}

// ════════════════════════════════════════════
// MINI-MAP OVERLAY
// ════════════════════════════════════════════

@Composable
private fun MiniMapOverlay(
    userLoc: Pair<Double, Double>,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val miniMapSize = 140.dp
    Box(
        modifier = modifier
            .size(miniMapSize)
            .shadow(6.dp, RoundedCornerShape(8.dp))
            .border(1.5.dp, BorderGold, RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp))
    ) {
        // Mini-map background with terrain simulation
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BgDarkStone)
        ) {
            // Simulated terrain features using simple shapes
            // Forest area (top-right)
            Box(
                modifier = Modifier
                    .size(60.dp, 40.dp)
                    .align(Alignment.TopEnd)
                    .padding(2.dp)
                    .background(NatureGreen.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
            )
            // Water area (bottom-left)
            Box(
                modifier = Modifier
                    .size(50.dp, 30.dp)
                    .align(Alignment.BottomStart)
                    .padding(2.dp)
                    .background(ManaBlue.copy(alpha = 0.3f), RoundedCornerShape(2.dp))
            )
            // Ruins (top-left)
            Box(
                modifier = Modifier
                    .size(30.dp, 20.dp)
                    .align(Alignment.TopStart)
                    .padding(2.dp)
                    .background(SurfaceStone.copy(alpha = 0.5f), RoundedCornerShape(2.dp))
            )
            // Danger zone (bottom-right)
            Box(
                modifier = Modifier
                    .size(35.dp, 25.dp)
                    .align(Alignment.BottomEnd)
                    .padding(2.dp)
                    .background(HostileRed.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
            )
            // Border frame
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .border(0.5.dp, BorderAged, RoundedCornerShape(8.dp))
            )
        }

        // Player position indicator
        Box(
            modifier = Modifier
                .size(8.dp)
                .align(Alignment.Center)
                .shadow(2.dp, CircleShape)
                .background(GoldAged, CircleShape)
                .border(1.dp, BgDeepBlack, CircleShape)
        )

        // Close button
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(4.dp)
                .size(18.dp)
                .background(BgDeepBlack.copy(alpha = 0.85f), CircleShape)
                .border(1.dp, BorderGold, CircleShape)
                .clickable(onClick = onDismiss),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "\u2715",
                fontSize = 8.sp,
                color = TextGold
            )
        }
    }
}

// ════════════════════════════════════════════
// ZOOM CONTROLS
// ════════════════════════════════════════════

@Composable
private fun ZoomControls(
    onZoomIn: () -> Unit,
    onZoomOut: () -> Unit,
    onReset: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        // Zoom In
        Box(
            modifier = Modifier
                .size(36.dp)
                .shadow(3.dp, RoundedCornerShape(4.dp))
                .background(BgPanel, RoundedCornerShape(4.dp))
                .border(1.dp, BorderAged, RoundedCornerShape(4.dp))
                .clickable(onClick = onZoomIn),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "+",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = TextPrimary
            )
        }

        // Reset
        Box(
            modifier = Modifier
                .size(36.dp)
                .shadow(2.dp, RoundedCornerShape(4.dp))
                .background(BgPanel, RoundedCornerShape(4.dp))
                .border(1.dp, BorderAged, RoundedCornerShape(4.dp))
                .clickable(onClick = onReset),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "\u25C9",
                fontSize = 14.sp,
                color = TextGold
            )
        }

        // Zoom Out
        Box(
            modifier = Modifier
                .size(36.dp)
                .shadow(3.dp, RoundedCornerShape(4.dp))
                .background(BgPanel, RoundedCornerShape(4.dp))
                .border(1.dp, BorderAged, RoundedCornerShape(4.dp))
                .clickable(onClick = onZoomOut),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "\u2212",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = TextPrimary
            )
        }
    }
}

// ════════════════════════════════════════════
// QUEST LOG DIALOG
// ════════════════════════════════════════════

@Composable
private fun QuestLogDialog(
    quests: List<Quest>,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "\u2630",
                    fontSize = 18.sp,
                    color = TextGold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Diário de Missões",
                    fontFamily = FontFamily.Serif,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = TextGold,
                    style = TextStyle(
                        shadow = Shadow(color = BgDeepBlack, offset = Offset(1f, 1f), blurRadius = 3f)
                    )
                )
            }
        },
        text = {
            Column {
                // Active quests
                Text(
                    text = "ATIVAS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                    color = TextGold,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                quests.filter { it.isActive }.forEach { quest ->
                    QuestItem(quest = quest)
                    Spacer(modifier = Modifier.height(8.dp))
                }

                // Completed quests
                val completed = quests.filter { !it.isActive }
                if (completed.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "CONCLUÍDAS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        color = TextMuted,
                        letterSpacing = 2.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    completed.forEach { quest ->
                        QuestItem(quest = quest)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        },
        confirmButton = {
            OutlinedButton(
                onClick = onDismiss,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
            ) {
                Text("Fechar", fontFamily = FontFamily.Serif)
            }
        },
        containerColor = BgPanel,
        titleContentColor = TextGold,
        textContentColor = TextSecondary,
        shape = RoundedCornerShape(12.dp)
    )
}

@Composable
private fun QuestItem(quest: Quest) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceStone, RoundedCornerShape(6.dp))
            .border(0.5.dp, BorderAged, RoundedCornerShape(6.dp))
            .padding(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = quest.title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = if (quest.isActive) TextPrimary else TextMuted
            )
            Text(
                text = if (quest.isActive) "EM ANDAMENTO" else "CONCLUÍDA",
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = if (quest.isActive) TorchFlame else SuccessDark,
                letterSpacing = 1.sp
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = quest.description,
            fontSize = 11.sp,
            fontFamily = FontFamily.Serif,
            color = if (quest.isActive) TextSecondary else TextMuted
        )
        if (quest.isActive) {
            Spacer(modifier = Modifier.height(6.dp))
            // Progress bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .background(BgDeepBlack, RoundedCornerShape(2.dp))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fraction = quest.progress.coerceIn(0f, 1f))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(GoldDark, GoldAged)
                            ),
                            RoundedCornerShape(2.dp)
                        )
                )
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${(quest.progress * 100).toInt()}%",
                fontSize = 8.sp,
                fontFamily = FontFamily.Serif,
                color = TextMuted,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}

// ════════════════════════════════════════════
// CONTEXT MENU
// ════════════════════════════════════════════

@Composable
private fun MapContextMenu(
    locationName: String,
    onDismiss: () -> Unit,
    onTravelHere: () -> Unit,
    onSetWaypoint: () -> Unit,
    onViewDetails: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Semi-transparent overlay
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDeepBlack.copy(alpha = 0.4f))
            .clickable(onClick = onDismiss)
    ) {
        Box(
            modifier = modifier
                .width(220.dp)
                .shadow(8.dp, RoundedCornerShape(8.dp))
                .background(BgPanel, RoundedCornerShape(8.dp))
                .border(1.dp, BorderGold, RoundedCornerShape(8.dp))
                .clickable(enabled = false, onClick = {})
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                // Title
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "\u2316",
                        fontSize = 14.sp,
                        color = TextGold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = locationName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        color = TextPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Menu items
                ContextMenuItem(icon = "\u25B6", label = "Viajar até aqui", onClick = onTravelHere)
                ContextMenuItem(icon = "\u2691", label = "Marcar waypoint", onClick = onSetWaypoint)
                ContextMenuItem(icon = "\u2139", label = "Ver detalhes", onClick = onViewDetails)

                Spacer(modifier = Modifier.height(4.dp))
                HorizontalDivider(color = BorderAged, thickness = 0.5.dp)
                Spacer(modifier = Modifier.height(4.dp))

                ContextMenuItem(icon = "\u2715", label = "Fechar", onClick = onDismiss)
            }
        }
    }
}

@Composable
private fun ContextMenuItem(
    icon: String,
    label: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(4.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 4.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = icon,
            fontSize = 14.sp,
            color = TextGold,
            modifier = Modifier.width(24.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = label,
            fontSize = 13.sp,
            fontFamily = FontFamily.Serif,
            color = TextSecondary
        )
    }
}
