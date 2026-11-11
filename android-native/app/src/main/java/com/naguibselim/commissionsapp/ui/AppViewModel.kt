package com.naguibselim.commissionsapp.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.naguibselim.commissionsapp.data.AccountPayload
import com.naguibselim.commissionsapp.data.AdminAccountsPayload
import com.naguibselim.commissionsapp.data.AdminSettingsPayload
import com.naguibselim.commissionsapp.data.ApiClient
import com.naguibselim.commissionsapp.data.ApiResult
import com.naguibselim.commissionsapp.data.CommissionsViewPayload
import com.naguibselim.commissionsapp.data.CommissionSettingsModel
import com.naguibselim.commissionsapp.data.NotificationsPayload
import com.naguibselim.commissionsapp.data.ProductSearchResultModel
import com.naguibselim.commissionsapp.data.SessionStore
import com.naguibselim.commissionsapp.data.UserProfile
import com.naguibselim.commissionsapp.notify.FeedWorker
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONObject

enum class MainNavDestination {
    COMMISSIONS,
    ACCOUNT,
    ADMIN_SETTINGS,
    ADMIN_ACCOUNTS
}

enum class SellerSection(val key: String) {
    SUMMARY("summary"),
    SALES("sales"),
    COLLECTIONS("collections"),
    STATEMENT("statement")
}

data class AppUiState(
    val signedIn: Boolean = false,
    val signingIn: Boolean = false,
    val signInError: String? = null,
    val language: String = "ar",
    val themeMode: String = "system",
    val navDestination: MainNavDestination = MainNavDestination.COMMISSIONS,
    val sellerSection: SellerSection = SellerSection.SUMMARY,
    val salesResetTick: Int = 0,
    // Commissions
    val selectedMonth: String? = null,
    val selectedRep: String? = null,
    val loadingCommissions: Boolean = false,
    val refreshingCommissions: Boolean = false,
    val commissionsError: String? = null,
    val commissionsEmail: String? = null,
    val commissionsData: CommissionsViewPayload? = null,
    val forcedPasswordUser: UserProfile? = null,
    // Notifications
    val notifications: NotificationsPayload = NotificationsPayload(emptyList(), 0, ""),
    val showNotificationsSheet: Boolean = false,
    // Account
    val accountData: AccountPayload? = null,
    val loadingAccount: Boolean = false,
    val passwordSaving: Boolean = false,
    val passwordStatus: String? = null, // "saved" | error code
    val testNotifStatus: String? = null, // "sent" | "error"
    // Admin Settings
    val adminSettingsMonth: String? = null,
    val adminSettingsData: AdminSettingsPayload? = null,
    val loadingAdminSettings: Boolean = false,
    val savingAdminSettings: Boolean = false,
    val adminSettingsStatus: Pair<Boolean, String>? = null,
    // Admin Accounts
    val adminAccountsData: AdminAccountsPayload? = null,
    val loadingAdminAccounts: Boolean = false,
    val adminAccountsBusy: Boolean = false,
    val adminAccountsToast: Pair<Boolean, String>? = null
)

class AppViewModel(application: Application) : AndroidViewModel(application) {
    val store = SessionStore(application)
    val api = ApiClient(store)

    private val _state = MutableStateFlow(
        AppUiState(
            signedIn = store.readSession() != null,
            language = store.language(),
            themeMode = store.themeMode()
        )
    )
    val state: StateFlow<AppUiState> = _state.asStateFlow()

    init {
        if (_state.value.signedIn) {
            loadCommissions(initial = true)
            refreshNotifications()
            FeedWorker.schedule(getApplication())
            FeedWorker.checkNow(getApplication(), 4L)
        }
    }

    fun setLanguage(lang: String) {
        val next = if (lang == "en") "en" else "ar"
        store.setLanguage(next)
        _state.update { it.copy(language = next) }
    }

    fun toggleLanguage() {
        setLanguage(if (_state.value.language == "ar") "en" else "ar")
    }

    fun setThemeMode(mode: String) {
        store.setThemeMode(mode)
        _state.update { it.copy(themeMode = mode) }
    }

    fun navigateTo(dest: MainNavDestination) {
        _state.update { it.copy(navDestination = dest) }
        when (dest) {
            MainNavDestination.COMMISSIONS -> {
                if (_state.value.commissionsData == null && !_state.value.loadingCommissions) {
                    loadCommissions(initial = true)
                }
            }
            MainNavDestination.ACCOUNT -> loadAccount()
            MainNavDestination.ADMIN_SETTINGS -> {
                if (_state.value.adminSettingsData == null && !_state.value.loadingAdminSettings) {
                    loadAdminSettings(_state.value.selectedMonth)
                }
            }
            MainNavDestination.ADMIN_ACCOUNTS -> {
                if (_state.value.adminAccountsData == null && !_state.value.loadingAdminAccounts) {
                    loadAdminAccounts()
                }
            }
        }
    }

    fun selectSellerSection(section: SellerSection) {
        _state.update {
            it.copy(
                navDestination = MainNavDestination.COMMISSIONS,
                sellerSection = section,
                salesResetTick = if (section == SellerSection.SALES) it.salesResetTick + 1 else it.salesResetTick
            )
        }
    }

    fun handleDeepLink(uri: Uri?, extraPath: String?) {
        val path = uri?.path ?: extraPath ?: return
        val monthParam = uri?.getQueryParameter("month")
        val repParam = uri?.getQueryParameter("rep")
        val sectionParam = uri?.getQueryParameter("section")

        when {
            path.contains("/settings") -> {
                if (monthParam != null) _state.update { it.copy(adminSettingsMonth = monthParam) }
                navigateTo(MainNavDestination.ADMIN_SETTINGS)
                if (monthParam != null) loadAdminSettings(monthParam)
            }
            path.contains("/accounts") -> navigateTo(MainNavDestination.ADMIN_ACCOUNTS)
            path.contains("/account") -> navigateTo(MainNavDestination.ACCOUNT)
            else -> {
                val sec = SellerSection.entries.find { it.key == sectionParam } ?: _state.value.sellerSection
                _state.update {
                    it.copy(
                        navDestination = MainNavDestination.COMMISSIONS,
                        sellerSection = sec,
                        selectedMonth = monthParam ?: it.selectedMonth,
                        selectedRep = repParam ?: it.selectedRep
                    )
                }
                if (_state.value.signedIn && (monthParam != null || repParam != null)) {
                    loadCommissions(month = monthParam ?: _state.value.selectedMonth, rep = repParam ?: _state.value.selectedRep)
                }
            }
        }
    }

    fun signIn(identifier: String, password: String) {
        if (identifier.isBlank() || password.isBlank()) {
            _state.update { it.copy(signInError = "invalid_input") }
            return
        }
        _state.update { it.copy(signingIn = true, signInError = null) }
        viewModelScope.launch {
            when (val res = api.signIn(identifier, password)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            signedIn = true,
                            signingIn = false,
                            signInError = null,
                            navDestination = MainNavDestination.COMMISSIONS
                        )
                    }
                    FeedWorker.schedule(getApplication())
                    FeedWorker.checkNow(getApplication(), 2L)
                    loadCommissions(initial = true)
                    refreshNotifications()
                }
                is ApiResult.Error -> {
                    _state.update { it.copy(signingIn = false, signInError = res.code) }
                }
            }
        }
    }

    fun signOut() {
        store.clearSession()
        _state.update {
            AppUiState(
                signedIn = false,
                language = store.language(),
                themeMode = store.themeMode()
            )
        }
    }

    fun selectMonth(month: String) {
        val currentRep = _state.value.selectedRep ?: _state.value.commissionsData?.selectedRep
        _state.update { it.copy(selectedMonth = month) }
        loadCommissions(month = month, rep = currentRep)
    }

    fun selectRep(repKey: String) {
        val currentMonth = _state.value.selectedMonth ?: _state.value.commissionsData?.clock?.month
        _state.update { it.copy(selectedRep = repKey) }
        loadCommissions(month = currentMonth, rep = repKey)
    }

    fun loadCommissions(
        month: String? = _state.value.selectedMonth,
        rep: String? = _state.value.selectedRep,
        initial: Boolean = false,
        isRefresh: Boolean = false
    ) {
        if (!_state.value.signedIn) return
        _state.update {
            it.copy(
                loadingCommissions = initial || (it.commissionsData == null && !isRefresh),
                refreshingCommissions = isRefresh || (it.commissionsData != null && !initial),
                commissionsError = null
            )
        }
        viewModelScope.launch {
            when (val res = api.fetchCommissions(month, rep)) {
                is ApiResult.Success -> {
                    val payload = res.data
                    _state.update {
                        it.copy(
                            loadingCommissions = false,
                            refreshingCommissions = false,
                            commissionsError = null,
                            commissionsData = payload,
                            selectedMonth = payload.clock.month,
                            selectedRep = payload.selectedRep,
                            forcedPasswordUser = if (payload.user.mustChangePassword) payload.user else null
                        )
                    }
                }
                is ApiResult.Error -> {
                    if (res.code == "signed_out") {
                        signOut()
                        return@launch
                    }
                    if (res.code == "must_change_password") {
                        _state.update {
                            it.copy(
                                loadingCommissions = false,
                                refreshingCommissions = false,
                                forcedPasswordUser = res.user,
                                navDestination = MainNavDestination.ACCOUNT
                            )
                        }
                        loadAccount()
                        return@launch
                    }
                    _state.update {
                        it.copy(
                            loadingCommissions = false,
                            refreshingCommissions = false,
                            commissionsError = res.code,
                            commissionsEmail = res.detail
                        )
                    }
                }
            }
        }
    }

    fun refreshNotifications() {
        if (!_state.value.signedIn) return
        viewModelScope.launch {
            val res = api.fetchNotifications()
            if (res is ApiResult.Success) {
                _state.update { it.copy(notifications = res.data) }
            }
        }
    }

    fun openNotifications(open: Boolean) {
        _state.update { it.copy(showNotificationsSheet = open) }
        if (open && _state.value.notifications.unread > 0) {
            _state.update { it.copy(notifications = it.notifications.copy(unread = 0)) }
            viewModelScope.launch {
                api.markNotificationsRead()
                refreshNotifications()
            }
        }
    }

    fun loadAccount() {
        if (!_state.value.signedIn) return
        _state.update { it.copy(loadingAccount = it.accountData == null, passwordStatus = null, testNotifStatus = null) }
        viewModelScope.launch {
            when (val res = api.fetchAccount()) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            loadingAccount = false,
                            accountData = res.data,
                            forcedPasswordUser = if (res.data.user.mustChangePassword) res.data.user else null
                        )
                    }
                }
                is ApiResult.Error -> {
                    if (res.code == "signed_out") signOut()
                    else _state.update { it.copy(loadingAccount = false) }
                }
            }
        }
    }

    fun changePassword(current: String, next: String, confirm: String) {
        if (current.isBlank() || next.length < 8) {
            _state.update { it.copy(passwordStatus = "invalid") }
            return
        }
        if (next != confirm) {
            _state.update { it.copy(passwordStatus = "mismatch") }
            return
        }
        if (next == current) {
            _state.update { it.copy(passwordStatus = "same") }
            return
        }
        _state.update { it.copy(passwordSaving = true, passwordStatus = null) }
        viewModelScope.launch {
            val wasForced = _state.value.forcedPasswordUser != null || _state.value.accountData?.user?.mustChangePassword == true
            when (val res = api.changePassword(current, next, confirm)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            passwordSaving = false,
                            passwordStatus = "saved",
                            forcedPasswordUser = null,
                            accountData = it.accountData?.copy(user = it.accountData.user.copy(mustChangePassword = false))
                        )
                    }
                    if (wasForced) {
                        _state.update { it.copy(navDestination = MainNavDestination.COMMISSIONS) }
                        loadCommissions(initial = true)
                    }
                }
                is ApiResult.Error -> {
                    _state.update { it.copy(passwordSaving = false, passwordStatus = res.code) }
                }
            }
        }
    }

    fun sendTestNotification() {
        _state.update { it.copy(testNotifStatus = "sending") }
        viewModelScope.launch {
            val ok = api.sendTestNotification()
            _state.update { it.copy(testNotifStatus = if (ok) "sent" else "error") }
            if (ok) {
                FeedWorker.checkNow(getApplication(), 1L)
            }
        }
    }

    // Admin Settings
    fun loadAdminSettings(month: String? = _state.value.adminSettingsMonth) {
        _state.update { it.copy(loadingAdminSettings = true, adminSettingsStatus = null) }
        viewModelScope.launch {
            when (val res = api.fetchAdminSettings(month)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            loadingAdminSettings = false,
                            adminSettingsMonth = res.data.month,
                            adminSettingsData = res.data
                        )
                    }
                }
                is ApiResult.Error -> {
                    val isAr = _state.value.language != "en"
                    _state.update {
                        it.copy(
                            loadingAdminSettings = false,
                            adminSettingsStatus = false to trLang(isAr, "تعذر تحميل إعدادات العمولة", "Could not load commission settings")
                        )
                    }
                }
            }
        }
    }

    fun saveAdminSettings(
        settings: CommissionSettingsModel,
        notifyMode: String,
        notifyUserIds: List<String>,
        notifyNote: String
    ) {
        _state.update { it.copy(savingAdminSettings = true, adminSettingsStatus = null) }
        viewModelScope.launch {
            val isAr = _state.value.language != "en"
            when (val res = api.saveAdminSettings(settings, notifyMode, notifyUserIds, notifyNote)) {
                is ApiResult.Success -> {
                    val (_, notified) = res.data
                    val msg = buildString {
                        append(trLang(isAr, "تم حفظ الإعدادات بنجاح", "Settings saved"))
                        if (notified != 0) {
                            append(" · ")
                            append(
                                if (notified < 0) trLang(isAr, "تم إشعار كل المندوبين", "All sellers notified")
                                else trLang(isAr, "تم إشعار $notified مندوب", "$notified sellers notified")
                            )
                        }
                    }
                    _state.update {
                        it.copy(
                            savingAdminSettings = false,
                            adminSettingsStatus = true to msg,
                            adminSettingsData = it.adminSettingsData?.copy(settings = settings, source = "saved")
                        )
                    }
                    // Reload commissions if same month
                    if (_state.value.selectedMonth == settings.month) {
                        loadCommissions(isRefresh = true)
                    }
                    refreshNotifications()
                }
                is ApiResult.Error -> {
                    val errText = trLang(isAr, "تعذر حفظ الإعدادات", "Could not save settings") +
                        (res.detail?.takeIf { it.isNotBlank() }?.let { " ($it)" } ?: "")
                    _state.update {
                        it.copy(
                            savingAdminSettings = false,
                            adminSettingsStatus = false to errText
                        )
                    }
                }
            }
        }
    }

    suspend fun searchProducts(query: String): List<ProductSearchResultModel> = api.searchOdooProducts(query)

    // Admin Accounts
    fun loadAdminAccounts() {
        _state.update { it.copy(loadingAdminAccounts = _state.value.adminAccountsData == null) }
        viewModelScope.launch {
            when (val res = api.fetchAdminAccounts()) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            loadingAdminAccounts = false,
                            adminAccountsData = res.data
                        )
                    }
                }
                is ApiResult.Error -> {
                    _state.update { it.copy(loadingAdminAccounts = false) }
                }
            }
        }
    }

    fun executeAccountPatch(body: JSONObject, successAr: String, successEn: String) {
        _state.update { it.copy(adminAccountsBusy = true, adminAccountsToast = null) }
        viewModelScope.launch {
            val isAr = _state.value.language != "en"
            when (val res = api.patchAdminAccounts(body)) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            adminAccountsBusy = false,
                            adminAccountsToast = true to trLang(isAr, successAr, successEn)
                        )
                    }
                    loadAdminAccounts()
                }
                is ApiResult.Error -> {
                    val msg = when (res.code) {
                        "taken" -> trLang(isAr, "اسم المستخدم مستخدم بالفعل.", "That username is already taken.")
                        "invalid" -> trLang(isAr, "البيانات المدخلة غير صالحة.", "Invalid input.")
                        else -> trLang(isAr, "تعذر حفظ التغيير.", "Could not save change.")
                    }
                    _state.update {
                        it.copy(
                            adminAccountsBusy = false,
                            adminAccountsToast = false to msg
                        )
                    }
                }
            }
        }
    }

    fun clearAdminAccountsToast() {
        _state.update { it.copy(adminAccountsToast = null) }
    }
}
