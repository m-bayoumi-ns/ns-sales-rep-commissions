package com.naguibselim.commissionsapp.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.naguibselim.commissionsapp.data.Api
import com.naguibselim.commissionsapp.data.ApiException
import com.naguibselim.commissionsapp.data.CommissionsResponse
import com.naguibselim.commissionsapp.data.SessionStore
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** What went wrong, as a key the screens turn into a localized message. */
enum class Problem { Offline, InvalidCredentials, Locked, NoAccess, Inactive, MustChangePassword, NotConnected, LoadFailed, Generic }

data class SignInState(val busy: Boolean = false, val problem: Problem? = null)

data class CommissionsState(
    val loading: Boolean = false,
    val refreshing: Boolean = false,
    val data: CommissionsResponse? = null,
    val problem: Problem? = null,
    /** Requested month (null = current). */
    val month: String? = null,
    /** Requested seller key (null = the server's default seller; "all" = team summary). */
    val rep: String? = null,
    /** Millis of the last successful load. */
    val loadedAt: Long = 0L,
)

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val store = SessionStore(application)
    private val api = Api(store)

    private val _signedIn = MutableStateFlow(api.isSignedIn)
    val signedIn: StateFlow<Boolean> = _signedIn.asStateFlow()

    private val _signIn = MutableStateFlow(SignInState())
    val signIn: StateFlow<SignInState> = _signIn.asStateFlow()

    private val _commissions = MutableStateFlow(CommissionsState())
    val commissions: StateFlow<CommissionsState> = _commissions.asStateFlow()

    val lastIdentifier: String get() = store.lastIdentifier

    private var loadJob: Job? = null

    fun signIn(identifier: String, password: String) {
        if (_signIn.value.busy) return
        _signIn.value = SignInState(busy = true)
        viewModelScope.launch {
            try {
                api.signIn(identifier, password)
                _signIn.value = SignInState()
                _commissions.value = CommissionsState()
                _signedIn.value = true
                load()
            } catch (error: Exception) {
                _signIn.value = SignInState(problem = problemOf(error))
            }
        }
    }

    fun signOut() {
        loadJob?.cancel()
        api.signOut()
        _commissions.value = CommissionsState()
        _signedIn.value = false
    }

    fun selectMonth(month: String) {
        _commissions.update { it.copy(month = month) }
        load()
    }

    fun selectRep(rep: String) {
        _commissions.update { it.copy(rep = rep) }
        load()
    }

    /** Pull to refresh / refresh button. */
    fun refresh() = load(pull = true)

    /** Called when the app comes back to the screen: reload when the figures are older than 5 minutes. */
    fun refreshIfStale() {
        val state = _commissions.value
        if (!_signedIn.value || state.loading) return
        if (state.data == null || System.currentTimeMillis() - state.loadedAt > STALE_MS) load(pull = state.data != null)
    }

    fun load(pull: Boolean = false) {
        if (!_signedIn.value) return
        loadJob?.cancel()
        val request = _commissions.value
        _commissions.update { it.copy(loading = !pull, refreshing = pull, problem = null) }
        loadJob = viewModelScope.launch {
            try {
                val data = api.commissions(request.month, request.rep)
                _commissions.update {
                    it.copy(loading = false, refreshing = false, data = data, problem = null, month = data.clock.month, loadedAt = System.currentTimeMillis())
                }
            } catch (error: ApiException.SignedOut) {
                signOut()
            } catch (error: kotlinx.coroutines.CancellationException) {
                throw error
            } catch (error: Exception) {
                _commissions.update { it.copy(loading = false, refreshing = false, problem = problemOf(error)) }
            }
        }
    }

    private fun problemOf(error: Exception): Problem = when (error) {
        is ApiException.Offline -> Problem.Offline
        is ApiException.Server -> when (error.code) {
            "invalid_credentials", "invalid_input" -> Problem.InvalidCredentials
            "locked" -> Problem.Locked
            "no_access" -> Problem.NoAccess
            "inactive" -> Problem.Inactive
            "must_change_password" -> Problem.MustChangePassword
            "not_connected", "not_configured" -> Problem.NotConnected
            "load_failed" -> Problem.LoadFailed
            else -> Problem.Generic
        }
        is ApiException.SignedOut -> Problem.InvalidCredentials
        else -> Problem.Generic
    }

    private companion object {
        const val STALE_MS = 5 * 60 * 1000L
    }
}
