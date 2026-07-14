package com.example.umbra.data

import com.example.umbra.UmbraLogger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

interface DataRepository {
  val data: Flow<List<String>>
}

class DefaultDataRepository : DataRepository {
  private val TAG = "DataRepository"

  override val data: Flow<List<String>> = flow {
    UmbraLogger.d(TAG, "Iniciando fluxo de dados")
    val items = listOf("Android")
    UmbraLogger.i(TAG, "Emitindo %d item(ns) de dados", items.size)
    emit(items)
  }
}
