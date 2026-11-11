package com.naguibselim.commissionsapp.notify

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.naguibselim.commissionsapp.BuildConfig
import com.naguibselim.commissionsapp.MainActivity
import com.naguibselim.commissionsapp.R
import com.naguibselim.commissionsapp.data.FeedItemModel

object Notifier {
    const val CHANNEL_COMMISSION = "ns_commission"
    const val CHANNEL_SECURITY = "ns_security"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val commissionChannel = NotificationChannel(
            CHANNEL_COMMISSION,
            context.getString(R.string.channel_commission),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = context.getString(R.string.channel_commission_desc)
            enableVibration(true)
        }
        val securityChannel = NotificationChannel(
            CHANNEL_SECURITY,
            context.getString(R.string.channel_security),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = context.getString(R.string.channel_security_desc)
            enableVibration(true)
        }
        nm.createNotificationChannel(commissionChannel)
        nm.createNotificationChannel(securityChannel)
    }

    fun areNotificationsEnabled(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return false
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled()
    }

    fun showFeedItems(context: Context, items: List<FeedItemModel>) {
        if (!areNotificationsEnabled(context) || items.isEmpty()) return
        ensureChannels(context)
        val nm = NotificationManagerCompat.from(context)
        val baseUrl = BuildConfig.API_BASE_URL.trimEnd('/')

        items.forEach { item ->
            val channelId = if (item.channel == "security") CHANNEL_SECURITY else CHANNEL_COMMISSION
            val path = if (item.path.startsWith("/")) item.path else "/${item.path}"
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("$baseUrl$path")
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("ns_path", path)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                item.id.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val notification = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_stat_ns)
                .setColor(0xFF744C27.toInt())
                .setContentTitle(item.title)
                .setContentText(item.body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(item.body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            runCatching {
                nm.notify(item.id.hashCode(), notification)
            }
        }
    }
}
