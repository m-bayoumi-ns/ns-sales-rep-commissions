package com.naguibselim.commissionsapp.notify

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.naguibselim.commissionsapp.data.Api
import com.naguibselim.commissionsapp.data.ApiException
import com.naguibselim.commissionsapp.data.SessionStore
import java.util.concurrent.TimeUnit

/**
 * Phone notifications: asks the website's GET /api/app/feed what is new for this phone (commission up or down,
 * bonuses earned or lost, rate changes, sign-ins from other devices, test notifications) and shows each item.
 * Runs every 15 minutes (Android's minimum) while signed in, and shortly after the app is opened.
 */
class FeedWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val store = SessionStore(applicationContext)
        if (store.tokens == null) return Result.success()
        val lang = if (applicationContext.resources.configuration.locales[0].language == "ar") "ar" else "en"
        return try {
            val items = Api(store).feed(store.installId, lang)
            Notifier.show(applicationContext, items)
            Result.success()
        } catch (error: ApiException.SignedOut) {
            Result.success()
        } catch (error: ApiException.Offline) {
            Result.retry()
        } catch (error: ApiException.Server) {
            if (error.status >= 500) Result.retry() else Result.success()
        } catch (error: Exception) {
            Result.retry()
        }
    }

    companion object {
        private const val PERIODIC = "ns-feed-periodic"
        private const val NOW = "ns-feed-now"
        private val online = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()

        /** Every 15 minutes while signed in (kept if already scheduled). */
        fun schedule(context: Context) {
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<FeedWorker>(15, TimeUnit.MINUTES).setConstraints(online).build(),
            )
        }

        /** One check a few seconds from now (app opened, just signed in). */
        fun checkSoon(context: Context) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                NOW,
                ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<FeedWorker>().setConstraints(online).setInitialDelay(5, TimeUnit.SECONDS).build(),
            )
        }

        /** Signed out: no more checks. */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).apply {
                cancelUniqueWork(PERIODIC)
                cancelUniqueWork(NOW)
            }
        }
    }
}
