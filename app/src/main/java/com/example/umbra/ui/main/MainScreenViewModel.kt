package com.example.umbra.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.umbra.UmbraLogger
import com.example.umbra.data.DataRepository
import com.example.umbra.ui.main.MainScreenUiState.Success
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

class MainScreenViewModel(dataRepository: DataRepository) : ViewModel() {
  private val TAG = "MainScreenViewModel"

  init {
    UmbraLogger.i(TAG, "ViewModel inicializado")
  }

  val uiState: StateFlow<MainScreenUiState> =
    dataRepository.data
      .map<List<String>, MainScreenUiState> { data ->
        UmbraLogger.d(TAG, "Dados carregados: %d itens", data.size)
        Success(data)
      }
      .catch { e ->
        UmbraLogger.e(TAG, "Erro ao carregar dados", e)
        emit(MainScreenUiState.Error(e))
      }
      .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), MainScreenUiState.Loading)

  override fun onCleared() {
    super.onCleared()
    UmbraLogger.d(TAG, "ViewModel cleared")
  }
}

sealed interface MainScreenUiState {
  object Loading : MainScreenUiState

  data class Error(val throwable: Throwable) : MainScreenUiState

  data class Success(val data: List<String>) : MainScreenUiState
}
