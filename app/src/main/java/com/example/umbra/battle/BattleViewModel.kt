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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.sqrt

data class DiscoveredOpponent(val endpointId: String, val name: String)

class BattleViewModel(application: Application) : AndroidViewModel(application), SensorEventListener {

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

    private val _connectedOpponentId = MutableStateFlow<String?>(null)
    val connectedOpponentId: StateFlow<String?> = _connectedOpponentId.asStateFlow()

    private val _playerHp = MutableStateFlow(100)
    val playerHp: StateFlow<Int> = _playerHp.asStateFlow()

    private val _enemyHp = MutableStateFlow(100)
    val enemyHp: StateFlow<Int> = _enemyHp.asStateFlow()

    private val _isHit = MutableStateFlow(false)
    val isHit: StateFlow<Boolean> = _isHit.asStateFlow()

    // Configurações de Golpe (Threshold)
    private val SHAKE_THRESHOLD = 25f
    private var lastShakeTime: Long = 0

    init {
        battleManager.onOpponentFound = { id, name ->
            val list = _discoveredOpponents.value.toMutableList()
            if (list.none { it.endpointId == id }) {
                list.add(DiscoveredOpponent(id, name))
                _discoveredOpponents.value = list
            }
        }

        battleManager.onConnected = { id ->
            _connectedOpponentId.value = id
            _playerHp.value = 100
            _enemyHp.value = 100
            startSensors()
        }

        battleManager.onPayloadReceived = { _, payload ->
            if (payload == "ATTACK") {
                takeDamage()
            }
        }
    }

    fun hostFenda(playerName: String) {
        battleManager.startAdvertising(playerName)
    }

    fun searchOponente() {
        battleManager.startDiscovery()
    }

    fun connectToOpponent(playerName: String, endpointId: String) {
        battleManager.requestConnection(playerName, endpointId)
    }

    // --- SISTEMA FÍSICO (ACELERÔMETRO) ---
    private fun startSensors() {
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            val x = it.values[0]
            val y = it.values[1]
            val z = it.values[2]

            val acceleration = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
            
            // Se o solavanco for maior que o limiar e passou 1 seg do último golpe
            if (acceleration > SHAKE_THRESHOLD) {
                val now = System.currentTimeMillis()
                if (now - lastShakeTime > 1000) { // Cooldown de 1 segundo
                    lastShakeTime = now
                    performAttack()
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun performAttack() {
        val opponentId = _connectedOpponentId.value ?: return
        
        // Desconta a vida do inimigo localmente pra dar sensação instantânea
        _enemyHp.value = (_enemyHp.value - 10).coerceAtLeast(0)
        
        // Envia o payload via rádio pro oponente
        battleManager.sendAttack(opponentId, "ATTACK")
    }

    private fun takeDamage() {
        _playerHp.value = (_playerHp.value - 10).coerceAtLeast(0)
        _isHit.value = true // Pra piscar a tela
        
        // Dá o tranco na mão (Vibração)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(300)
        }
        
        // Reseta o flash vermelho da tela depois de 300ms
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            _isHit.value = false
        }, 300)
    }

    override fun onCleared() {
        super.onCleared()
        sensorManager.unregisterListener(this)
    }
}
