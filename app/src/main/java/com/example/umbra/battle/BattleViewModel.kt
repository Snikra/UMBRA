package com.example.umbra.battle

import android.app.Application
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.lifecycle.AndroidViewModel
import com.example.umbra.BattleManager
import com.example.umbra.UmbraLogger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.sqrt

data class DiscoveredOpponent(val endpointId: String, val name: String)

class BattleViewModel(application: Application) : AndroidViewModel(application), SensorEventListener {

    private val TAG = "BattleViewModel"
    private val battleManager = BattleManager(application)
    
    // Hardware
    private val sensorManager = application.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = application.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vibratorManager.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        application.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    // State
    private val _discoveredOpponents = MutableStateFlow<List<DiscoveredOpponent>>(emptyList())
    val discoveredOpponents: StateFlow<List<DiscoveredOpponent>> = _discoveredOpponents.asStateFlow()

    private val _isSearching = MutableStateFlow(false)
    val isSearching: StateFlow<Boolean> = _isSearching.asStateFlow()

    private val _connectedOpponentId = MutableStateFlow<String?>(null)
    val connectedOpponentId: StateFlow<String?> = _connectedOpponentId.asStateFlow()

    private val _playerHp = MutableStateFlow(100)
    val playerHp: StateFlow<Int> = _playerHp.asStateFlow()

    private val _enemyHp = MutableStateFlow(100)
    val enemyHp: StateFlow<Int> = _enemyHp.asStateFlow()

    private val _isHit = MutableStateFlow(false)
    val isHit: StateFlow<Boolean> = _isHit.asStateFlow()

    private val SHAKE_THRESHOLD = 25f
    private var lastShakeTime: Long = 0

    init {
        UmbraLogger.i(TAG, "BattleViewModel initialized")

        battleManager.onOpponentFound = { id, name ->
            UmbraLogger.d(TAG, "Oponente encontrado: %s (%s)", name, id)
            val list = _discoveredOpponents.value.toMutableList()
            if (list.none { it.endpointId == id }) {
                list.add(DiscoveredOpponent(id, name))
                _discoveredOpponents.value = list
                _isSearching.value = false
            }
        }

        battleManager.onConnected = { id ->
            UmbraLogger.i(TAG, "Conectado ao oponente: %s", id)
            _connectedOpponentId.value = id
            _playerHp.value = 100
            _enemyHp.value = 100
            startSensors()
        }

        battleManager.onPayloadReceived = { _, payload ->
            UmbraLogger.d(TAG, "Payload recebido: %s", payload)
            if (payload == "ATTACK") {
                takeDamage()
            }
        }
    }

    fun hostFenda(playerName: String) {
        UmbraLogger.i(TAG, "Hosteando Fenda como: %s", playerName)
        battleManager.startAdvertising(playerName)
    }

    fun searchOponente() {
        UmbraLogger.i(TAG, "Iniciando busca por oponentes...")
        _isSearching.value = true
        battleManager.startDiscovery()
    }

    fun connectToOpponent(playerName: String, endpointId: String) {
        UmbraLogger.i(TAG, "Conectando a %s como %s", endpointId, playerName)
        battleManager.requestConnection(playerName, endpointId)
    }

    fun stopFenda() {
        UmbraLogger.i(TAG, "Parando Fenda")
        battleManager.stopAdvertising()
        battleManager.stopDiscovery()
        _isSearching.value = false
        _discoveredOpponents.value = emptyList()
    }

    private fun startSensors() {
        UmbraLogger.d(TAG, "Registrando listener do acelerômetro")
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        } ?: UmbraLogger.w(TAG, "Acelerômetro não disponível neste dispositivo")
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            val x = it.values[0]
            val y = it.values[1]
            val z = it.values[2]

            val acceleration = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
            
            if (acceleration > SHAKE_THRESHOLD) {
                val now = System.currentTimeMillis()
                if (now - lastShakeTime > 1000) {
                    lastShakeTime = now
                    UmbraLogger.d(TAG, "Shake detectado! Aceleração: %.2f", acceleration)
                    performAttack()
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        UmbraLogger.v(TAG, "Precisão do sensor alterada: %d", accuracy)
    }

    private fun performAttack() {
        val opponentId = _connectedOpponentId.value ?: run {
            UmbraLogger.w(TAG, "Tentativa de ataque sem oponente conectado")
            return
        }
        
        _enemyHp.value = (_enemyHp.value - 10).coerceAtLeast(0)
        UmbraLogger.d(TAG, "Ataque realizado! HP inimigo: %d", _enemyHp.value)
        battleManager.sendAttack(opponentId, "ATTACK")
    }

    private fun takeDamage() {
        _playerHp.value = (_playerHp.value - 10).coerceAtLeast(0)
        _isHit.value = true
        UmbraLogger.d(TAG, "Dano recebido! HP: %d", _playerHp.value)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(300)
        }
        
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            _isHit.value = false
        }, 300)
    }

    override fun onCleared() {
        UmbraLogger.i(TAG, "BattleViewModel cleared - desregistrando sensores")
        super.onCleared()
        sensorManager.unregisterListener(this)
        battleManager.stopAll()
    }
}
