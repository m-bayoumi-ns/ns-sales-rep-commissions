package com.naguibselim.commissions;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.CookieManager;
import android.webkit.WebSettings;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Asks the site for news about the signed-in user (GET /api/app/feed) and shows each item as a phone notification:
 * sign-ins from other devices, commission going up or down, bonuses earned or lost, rate changes.
 * Runs every ~15 minutes in the background (Android's minimum) and once each time the app opens.
 * It uses the web view's own session cookies, and stores the refreshed ones the site sends back.
 */
public class FeedWorker extends Worker {
    private static final String PERIODIC = "ns-feed-periodic";
    private static final String NOW = "ns-feed-now";

    public FeedWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static void schedule(Context context) {
        Constraints online = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        WorkManager wm = WorkManager.getInstance(context);
        wm.enqueueUniquePeriodicWork(PERIODIC, ExistingPeriodicWorkPolicy.KEEP,
                new PeriodicWorkRequest.Builder(FeedWorker.class, 15, TimeUnit.MINUTES).setConstraints(online).build());
    }

    /** One check shortly after the app opens or a page finishes loading. */
    static void checkSoon(Context context) {
        Constraints online = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        WorkManager.getInstance(context).enqueueUniqueWork(NOW, ExistingWorkPolicy.REPLACE,
                new OneTimeWorkRequest.Builder(FeedWorker.class).setConstraints(online)
                        .setInitialDelay(5, TimeUnit.SECONDS).build());
    }

    static String installId(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("ns_app", Context.MODE_PRIVATE);
        String id = prefs.getString("install_id", null);
        if (id == null) {
            id = UUID.randomUUID().toString();
            prefs.edit().putString("install_id", id).apply();
        }
        return id;
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        String base = BuildConfig.START_URL.endsWith("/") ? BuildConfig.START_URL : BuildConfig.START_URL + "/";
        HttpURLConnection conn = null;
        try {
            CookieManager cookies = CookieManager.getInstance();
            String cookie = cookies.getCookie(base);
            if (cookie == null || !cookie.contains("auth-token")) return Result.success(); // Not signed in.

            String lang = Locale.getDefault().getLanguage().equals("ar") ? "ar" : "en";
            conn = (HttpURLConnection) new URL(base + "api/app/feed?locale=" + lang).openConnection();
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(45000);
            conn.setRequestProperty("Cookie", cookie);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("X-NS-Install", installId(context));
            conn.setRequestProperty("User-Agent",
                    WebSettings.getDefaultUserAgent(context) + " NSCommissionsApp/" + BuildConfig.VERSION_NAME);

            int status = conn.getResponseCode();

            // Keep the refreshed session, exactly as the web view would.
            Map<String, List<String>> headers = conn.getHeaderFields();
            for (Map.Entry<String, List<String>> header : headers.entrySet()) {
                if (header.getKey() != null && header.getKey().equalsIgnoreCase("Set-Cookie")) {
                    for (String value : header.getValue()) cookies.setCookie(base, value);
                }
            }
            cookies.flush();

            if (status == 401 || status == 400) return Result.success();
            if (status != 200) return Result.retry();

            JSONArray items = new JSONObject(read(conn.getInputStream())).optJSONArray("items");
            if (items == null) return Result.success();
            Notifier.ensureChannels(context);
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                Notifier.post(context,
                        item.optString("id"),
                        item.optString("channel", Notifier.CHANNEL_COMMISSION),
                        item.optString("title"),
                        item.optString("body"),
                        item.optString("path", "/commissions"));
            }
            return Result.success();
        } catch (Exception e) {
            return Result.retry();
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String read(InputStream in) throws java.io.IOException {
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = input.read(buf)) > 0) out.write(buf, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }
}
