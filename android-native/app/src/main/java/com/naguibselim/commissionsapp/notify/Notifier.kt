package com.naguibselim.commissionsapp.notify

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.naguibselim.commissionsapp.MainActivity
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.data.FeedItem

/** Shows feed items as notifications, on two channels the user can switch separately in system settings. */
object Notifier {
    private const val CHANNEL_COMMISSION = "commission"
    private const val CHANNEL_SECURITY = "security"

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_COMMISSION, context.getString(R.string.channel_commission), NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = context.getString(R.string.channel_commission_desc)
            },
        )
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_SECURITY, context.getString(R.string.channel_security), NotificationManager.IMPORTANCE_HIGH).apply {
                description = context.getString(R.string.channel_security_desc)
            },
        )
    }

    fun canNotify(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return false
        return NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    fun show(context: Context, items: List<FeedItem>) {
        if (items.isEmpty() || !canNotify(context)) return
        createChannels(context)
        val manager = NotificationManagerCompat.from(context)
        val open = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        for (item in items) {
            val security = item.channel == "security"
            val notification = NotificationCompat.Builder(context, if (security) CHANNEL_SECURITY else CHANNEL_COMMISSION)
                .setSmallIcon(R.drawable.ic_stat_ns)
                .setColor(ContextCompat.getColor(context, R.color.brand))
                .setContentTitle(item.title)
                .setContentText(item.body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(item.body))
                .setPriority(if (security) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
                .setCategory(if (security) NotificationCompat.CATEGORY_STATUS else NotificationCompat.CATEGORY_MESSAGE)
                .setContentIntent(open)
                .setAutoCancel(true)
                .build()
            try {
                manager.notify(item.id.hashCode(), notification)
            } catch (error: SecurityException) {
                // Permission withdrawn between the check and here.
                return
            }
        }
    }
}
