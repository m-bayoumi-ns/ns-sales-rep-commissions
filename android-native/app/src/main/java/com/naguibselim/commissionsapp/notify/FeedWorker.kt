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
import com.naguibselim.commissionsapp.data.ApiClient
import com.naguibselim.commissionsapp.data.ApiResult
import com.naguibselim.commissionsapp.data.SessionStore
import java.util.concurrent.TimeUnit

class FeedWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val store = SessionStore(applicationContext)
        if (store.readSession() == null) return Result.success()
        val api = ApiClient(store)
        return when (val res = api.fetchFeed()) {
            is ApiResult.Success -> {
                Notifier.showFeedItems(applicationContext, res.data)
                Result.success()
            }
            is ApiResult.Error -> {
                if (res.status == 401) Result.success() else Result.retry()
            }
        }
    }

    companion object {
        private const val PERIODIC_WORK_NAME = "ns_commissions_feed_periodic"
        private const val IMMEDIATE_WORK_NAME = "ns_commissions_feed_now"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val periodic = PeriodicWorkRequestBuilder<FeedWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                periodic
            )
        }

        fun checkNow(context: Context, delaySeconds: Long = 2L) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<FeedWorker>()
                .setConstraints(constraints)
                .setInitialDelay(delaySeconds, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                IMMEDIATE_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
        }
    }
}
