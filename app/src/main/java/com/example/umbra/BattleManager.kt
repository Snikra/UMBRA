package com.example.umbra

import android.content.Context
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*

class BattleManager(private val context: Context) {
    private val connectionsClient = Nearby.getConnectionsClient(context)
    private val SERVICE_ID = "com.example.umbra.BATTLE_SERVICE"
    private val TAG = "BattleManager"

    var onOpponentFound: ((endpointId: String, name: String) -> Unit)? = null
    var onConnected: ((endpointId: String) -> Unit)? = null
    var onPayloadReceived: ((endpointId: String, payload: String) -> Unit)? = null

    // Callbacks de Conexão
    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
            UmbraLogger.d(TAG, "Conexão iniciada com: %s", info.endpointName)
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            if (result.status.isSuccess) {
                UmbraLogger.d(TAG, "Conectado com sucesso ao oponente: %s", endpointId)
                onConnected?.invoke(endpointId)
            } else {
                UmbraLogger.e(TAG, "Falha na conexão com: %s", endpointId)
            }
        }

        override fun onDisconnected(endpointId: String) {
            UmbraLogger.d(TAG, "Desconectado do oponente: %s", endpointId)
        }
    }

    // Callbacks de Dados (Golpes/Magias)
    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val data = String(payload.asBytes() ?: ByteArray(0))
                UmbraLogger.d(TAG, "Golpe recebido de %s: %s", endpointId, data)
                onPayloadReceived?.invoke(endpointId, data)
            }
        }
        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            UmbraLogger.v(TAG, "Payload update from %s: %d/%d", endpointId, update.bytesTransferred, update.totalBytes)
        }
    }

    fun startAdvertising(playerName: String) {
        UmbraLogger.i(TAG, "Iniciando Advertising como: %s", playerName)
        val options = AdvertisingOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()
        connectionsClient.startAdvertising(
            playerName, SERVICE_ID, connectionLifecycleCallback, options
        ).addOnSuccessListener {
            UmbraLogger.d(TAG, "Aguardando desafiantes (Advertising...)")
        }.addOnFailureListener { e ->
            UmbraLogger.e(TAG, "Erro ao abrir Fenda (Advertise)", e)
        }
    }

    fun startDiscovery() {
        UmbraLogger.i(TAG, "Iniciando descoberta de oponentes...")
        val options = DiscoveryOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()
        connectionsClient.startDiscovery(
            SERVICE_ID,
            object : EndpointDiscoveryCallback() {
                override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
                    UmbraLogger.i(TAG, "Desafiante encontrado: %s (id=%s)", info.endpointName, endpointId)
                    onOpponentFound?.invoke(endpointId, info.endpointName)
                }
                override fun onEndpointLost(endpointId: String) {
                    UmbraLogger.w(TAG, "Desafiante perdido: %s", endpointId)
                }
            },
            options
        ).addOnSuccessListener {
            UmbraLogger.d(TAG, "Procurando Fendas (Discovering...)")
        }.addOnFailureListener { e ->
            UmbraLogger.e(TAG, "Erro ao buscar Fenda", e)
        }
    }

    fun requestConnection(playerName: String, endpointId: String) {
        UmbraLogger.i(TAG, "Solicitando conexão com: %s (como %s)", endpointId, playerName)
        connectionsClient.requestConnection(playerName, endpointId, connectionLifecycleCallback)
    }

    fun sendAttack(endpointId: String, attackName: String) {
        UmbraLogger.d(TAG, "Enviando ataque '%s' para: %s", attackName, endpointId)
        val payload = Payload.fromBytes(attackName.toByteArray())
        connectionsClient.sendPayload(endpointId, payload)
    }

    fun stopAdvertising() {
        connectionsClient.stopAdvertising()
        UmbraLogger.d(TAG, "Parou de Hospedar (Advertising stopped)")
    }

    fun stopDiscovery() {
        connectionsClient.stopDiscovery()
        UmbraLogger.d(TAG, "Parou de Procurar (Discovery stopped)")
    }

    fun stopAll() {
        UmbraLogger.i(TAG, "Parando todas as operações de Nearby Connections")
        stopAdvertising()
        stopDiscovery()
    }
}
