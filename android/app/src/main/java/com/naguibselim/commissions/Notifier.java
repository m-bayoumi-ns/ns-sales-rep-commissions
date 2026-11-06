package com.naguibselim.commissions;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Notification channels and posting, shared by the background worker. */
final class Notifier {
    static final String CHANNEL_COMMISSION = "commission";
    static final String CHANNEL_SECURITY = "security";

    private static final String PREFS = "ns_notifier";
    private static final String KEY_POSTED = "posted_ids";
    private static final int KEEP_IDS = 150;

    private Notifier() {
    }

    static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel commission = new NotificationChannel(CHANNEL_COMMISSION,
                context.getString(R.string.channel_commission), NotificationManager.IMPORTANCE_DEFAULT);
        commission.setDescription(context.getString(R.string.channel_commission_desc));
        NotificationChannel security = new NotificationChannel(CHANNEL_SECURITY,
                context.getString(R.string.channel_security), NotificationManager.IMPORTANCE_HIGH);
        security.setDescription(context.getString(R.string.channel_security_desc));
        nm.createNotificationChannel(commission);
        nm.createNotificationChannel(security);
    }

    /** Posts one notification unless this id was already shown on this phone. */
    static void post(Context context, String id, String channel, String title, String body, String path) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        List<String> posted = new ArrayList<>(Arrays.asList(prefs.getString(KEY_POSTED, "").split("\n")));
        if (posted.contains(id)) return;

        String base = BuildConfig.START_URL.endsWith("/") ? BuildConfig.START_URL : BuildConfig.START_URL + "/";
        String target = base + (path.startsWith("/") ? path.substring(1) : path);
        Intent open = new Intent(context, MainActivity.class)
                .setAction(Intent.ACTION_VIEW)
                .setData(Uri.parse(target))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap = PendingIntent.getActivity(context, id.hashCode(), open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        boolean security = CHANNEL_SECURITY.equals(channel);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, security ? CHANNEL_SECURITY : CHANNEL_COMMISSION)
                .setSmallIcon(R.drawable.ic_stat_ns)
                .setColor(context.getColor(R.color.ic_launcher_background))
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setContentIntent(tap)
                .setAutoCancel(true)
                .setCategory(security ? NotificationCompat.CATEGORY_ALARM : NotificationCompat.CATEGORY_STATUS)
                .setPriority(security ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_DEFAULT);

        try {
            NotificationManagerCompat.from(context).notify(id.hashCode(), builder.build());
        } catch (SecurityException e) {
            return; // Notifications not allowed on this phone.
        }

        posted.add(0, id);
        if (posted.size() > KEEP_IDS) posted = posted.subList(0, KEEP_IDS);
        prefs.edit().putString(KEY_POSTED, String.join("\n", posted)).apply();
    }
}
