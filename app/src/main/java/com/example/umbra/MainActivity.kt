package com.example.umbra

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.umbra.theme.UmbraTheme
import com.mapbox.maps.MapboxOptions

class MainActivity : ComponentActivity() {
  private val TAG = "MainActivity"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    UmbraLogger.init()
    UmbraLogger.i(TAG, "onCreate: inicializando aplicação")

    MapboxOptions.accessToken = BuildConfig.MAPBOX_ACCESS_TOKEN
    UmbraLogger.d(TAG, "Mapbox access token configurado")

    enableEdgeToEdge()
    setContent {
      UmbraTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = MaterialTheme.colorScheme.background
        ) {
          MainNavigation()
        }
      }
    }
  }

  override fun onStart() {
    super.onStart()
    UmbraLogger.d(TAG, "onStart")
  }

  override fun onResume() {
    super.onResume()
    UmbraLogger.d(TAG, "onResume")
  }

  override fun onPause() {
    super.onPause()
    UmbraLogger.d(TAG, "onPause")
  }

  override fun onStop() {
    super.onStop()
    UmbraLogger.d(TAG, "onStop")
  }

  override fun onDestroy() {
    UmbraLogger.i(TAG, "onDestroy: finalizando aplicação")
    UmbraLogger.flush()
    super.onDestroy()
  }
}
