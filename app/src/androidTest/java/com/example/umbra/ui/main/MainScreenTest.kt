package com.example.umbra.ui.main

import androidx.activity.ComponentActivity
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import org.junit.Rule
import org.junit.Test

class MainScreenTest {

  @get:Rule val composeTestRule = createAndroidComposeRule<ComponentActivity>()

  @Test
  fun mainScreen_displaysTitle() {
    composeTestRule.setContent { MainScreen(onItemClick = {}, modifier = Modifier) }
    composeTestRule.onNodeWithText("Capitã Caos").assertExists()
  }
}
