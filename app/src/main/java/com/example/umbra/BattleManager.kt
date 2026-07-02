package com.example.umbra

import android.content.Context
import android.util.Log
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
            Log.d(TAG, "Conexão iniciada com: ${info.endpointName}")
            // Aceita a conexão automaticamente para testes
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            if (result.status.isSuccess) {
                Log.d(TAG, "Conectado com sucesso ao oponente: $endpointId")
                onConnected?.invoke(endpointId)
            } else {
                Log.e(TAG, "Falha na conexão")
            }
        }

        override fun onDisconnected(endpointId: String) {
            Log.d(TAG, "Desconectado do oponente: $endpointId")
        }
    }

    // Callbacks de Dados (Golpes/Magias)
    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val data = String(payload.asBytes() ?: ByteArray(0))
                Log.d(TAG, "Golpe recebido: $data")
                onPayloadReceived?.invoke(endpointId, data)
            }
        }
        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
    }

    fun startAdvertising(playerName: String) {
        val options = AdvertisingOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()
        connectionsClient.startAdvertising(
            playerName, SERVICE_ID, connectionLifecycleCallback, options
        ).addOnSuccessListener {
            Log.d(TAG, "Aguardando desafiantes (Advertising...)")
        }.addOnFailureListener { e ->
            Log.e(TAG, "Erro ao abrir Fenda (Advertise)", e)
        }
    }

    fun startDiscovery() {
        val options = DiscoveryOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()
        connectionsClient.startDiscovery(
            SERVICE_ID,
            object : EndpointDiscoveryCallback() {
                override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
                    Log.d(TAG, "Desafiante encontrado: ${info.endpointName}")
                    onOpponentFound?.invoke(endpointId, info.endpointName)
                }
                override fun onEndpointLost(endpointId: String) {
                    Log.d(TAG, "Desafiante sumiu: $endpointId")
                }
            },
            options
        ).addOnSuccessListener {
            Log.d(TAG, "Procurando Fendas (Discovering...)")
        }.addOnFailureListener { e ->
            Log.e(TAG, "Erro ao buscar Fenda", e)
        }
    }

    fun requestConnection(playerName: String, endpointId: String) {
        connectionsClient.requestConnection(playerName, endpointId, connectionLifecycleCallback)
    }

    fun sendAttack(endpointId: String, attackName: String) {
        val payload = Payload.fromBytes(attackName.toByteArray())
        connectionsClient.sendPayload(endpointId, payload)
    }

    fun stopAdvertising() {
        connectionsClient.stopAdvertising()
        Log.d(TAG, "Parou de Hospedar (Advertising stopped)")
    }

    fun stopDiscovery() {
        connectionsClient.stopDiscovery()
        Log.d(TAG, "Parou de Procurar (Discovery stopped)")
    }
}
