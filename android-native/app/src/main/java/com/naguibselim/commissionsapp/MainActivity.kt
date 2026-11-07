package com.naguibselim.commissionsapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.naguibselim.commissionsapp.ui.AppViewModel
import com.naguibselim.commissionsapp.ui.CommissionsScreen
import com.naguibselim.commissionsapp.ui.LoginScreen
import com.naguibselim.commissionsapp.ui.NsTheme
import com.naguibselim.commissionsapp.notify.FeedWorker
import com.naguibselim.commissionsapp.notify.Notifier

class MainActivity : ComponentActivity() {
    private val viewModel: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        viewModel.openCommissionLink(intent?.data)
        Notifier.createChannels(this)
        setContent {
            NsTheme {
                val signedIn by viewModel.signedIn.collectAsStateWithLifecycle()
                if (signedIn) CommissionsScreen(viewModel) else LoginScreen(viewModel)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        viewModel.openCommissionLink(intent.data)
    }

    override fun onResume() {
        super.onResume()
        viewModel.refreshIfStale()
        if (viewModel.signedIn.value) {
            FeedWorker.schedule(this)
            FeedWorker.checkSoon(this)
        }
    }
}
