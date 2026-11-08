package com.naguibselim.commissions;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.splashscreen.SplashScreen;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;

/**
 * NS Commissions: a native shell around the Sales Rep Commissions website.
 *
 * - Brand splash until the first page has rendered (max 4 s).
 * - Session cookies persist, so the rep stays signed in between launches.
 * - Pull to refresh, a thin progress bar, and a native offline / error screen with retry.
 * - Links to other sites, phone numbers, e-mail and WhatsApp open in the right app.
 * - CSV exports (blob downloads) and normal file downloads are saved to Downloads.
 * - Back navigates inside the site; pressing back twice on the first page exits.
 */
public class MainActivity extends Activity {

    private static final int REQ_FILE = 41;
    private static final int REQ_STORAGE = 42;
    private static final int REQ_NOTIFICATIONS = 43;
    private static final long FEED_CHECK_GAP_MS = 2 * 60 * 1000;
    private static final long SPLASH_MAX_MS = 4000;

    private WebView web;
    private SwipeRefreshLayout swipe;
    private ProgressBar progress;
    private View errorView;
    private TextView errorTitle;
    private TextView errorBody;

    private Uri startUri;
    private boolean firstPageShown = false;
    private boolean mainFrameFailed = false;
    private long splashStartedAt;
    private long lastBackAt = 0;
    private long lastFeedCheckAt = 0;

    private ValueCallback<Uri[]> fileCallback;

    /** A CSV waiting for the storage permission (Android 9 and older). */
    private byte[] pendingBytes;
    private String pendingName;
    private String pendingMime;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        applyStatusBarBackground();
        splashStartedAt = System.currentTimeMillis();
        splash.setKeepOnScreenCondition(
                () -> !firstPageShown && System.currentTimeMillis() - splashStartedAt < SPLASH_MAX_MS);

        setContentView(R.layout.activity_main);
        web = findViewById(R.id.web);
        swipe = findViewById(R.id.swipe);
        progress = findViewById(R.id.progress);
        errorView = findViewById(R.id.error_view);
        errorTitle = findViewById(R.id.error_title);
        errorBody = findViewById(R.id.error_body);
        Button retry = findViewById(R.id.retry);

        startUri = Uri.parse(BuildConfig.START_URL);
        Notifier.ensureChannels(this);
        FeedWorker.schedule(this);

        setUpWebView();

        swipe.setColorSchemeColors(getColor(R.color.brand));
        swipe.setProgressBackgroundColorSchemeColor(getColor(R.color.surface));
        swipe.setOnRefreshListener(this::reload);
        retry.setOnClickListener(v -> reload());

        if (savedInstanceState != null && web.restoreState(savedInstanceState) != null) {
            firstPageShown = true;
        } else {
            Uri deepLink = getIntent() != null ? getIntent().getData() : null;
            web.loadUrl(isInternal(deepLink) ? deepLink.toString() : startUri.toString());
        }
    }

    private void applyStatusBarBackground() {
        getWindow().setStatusBarColor(getColor(R.color.background));
        View decor = getWindow().getDecorView();
        int flags = decor.getSystemUiVisibility();
        boolean dark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        decor.setSystemUiVisibility(dark
                ? flags & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                : flags | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setUpWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setSupportMultipleWindows(true);
        s.setUserAgentString(s.getUserAgentString() + " NSCommissionsApp/" + BuildConfig.VERSION_NAME);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "NSApp");
        web.setWebViewClient(new ShellClient());
        web.setWebChromeClient(new ShellChrome());
        web.setDownloadListener(new ShellDownloads());
    }

    // ---------------------------------------------------------------- navigation

    private boolean isInternal(Uri uri) {
        if (uri == null || uri.getHost() == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("https")) return false;
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        String home = startUri.getHost().toLowerCase(Locale.ROOT);
        return host.equals(home) || host.equals("bayoumi.dev") || host.endsWith(".bayoumi.dev");
    }

    /** Opens a link that does not belong to the site in the app the phone uses for it. */
    private void openExternally(Uri uri) {
        try {
            Intent intent;
            if ("intent".equalsIgnoreCase(uri.getScheme())) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                intent.setComponent(null);
                intent.setSelector(null);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
            }
            startActivity(intent);
        } catch (ActivityNotFoundException | java.net.URISyntaxException e) {
            Toast.makeText(this, R.string.no_app_for_link, Toast.LENGTH_SHORT).show();
        }
    }

    private void reload() {
        if (!isOnline()) {
            swipe.setRefreshing(false);
            showError(true);
            return;
        }
        mainFrameFailed = false;
        String current = web.getUrl();
        if (current == null || current.startsWith("data:") || current.equals("about:blank")) {
            web.loadUrl(startUri.toString());
        } else {
            web.reload();
        }
    }

    private void showError(boolean offline) {
        errorTitle.setText(offline ? R.string.offline_title : R.string.error_title);
        errorBody.setText(offline ? R.string.offline_body : R.string.error_body);
        errorView.setVisibility(View.VISIBLE);
        progress.setVisibility(View.GONE);
        swipe.setRefreshing(false);
        firstPageShown = true;
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return true;
        NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    /**
     * Small helpers injected into every page:
     *  - disables pull-to-refresh while the finger is on a scrollable panel (lists, dropdowns),
     *  - remembers the file name of the last <a download> so CSV exports keep their names.
     */
    private static final String PAGE_HELPERS =
            "(function(){if(window.__nsShell)return;window.__nsShell=1;" +
            "function scrollable(n){while(n&&n.nodeType===1&&n!==document.body&&n!==document.documentElement){" +
            "var s=getComputedStyle(n);if((s.overflowY==='auto'||s.overflowY==='scroll')&&n.scrollHeight>n.clientHeight+1)return true;" +
            "n=n.parentElement;}return false;}" +
            "document.addEventListener('touchstart',function(e){NSApp.setRefreshAllowed(!scrollable(e.target));},{passive:true,capture:true});" +
            "document.addEventListener('touchend',function(){NSApp.setRefreshAllowed(true);},{passive:true,capture:true});" +
            "var oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){" +
            "if(this.download)window.__nsDl=this.download;return oc.apply(this,arguments);};" +
            "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');" +
            "if(a&&a.download)window.__nsDl=a.download;},true);})();";

    private class ShellClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isInternal(uri)) return false;
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (scheme.equals("blob") || scheme.equals("data") || scheme.equals("about")) return false;
            openExternally(uri);
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            mainFrameFailed = false;
            progress.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progress.setVisibility(View.GONE);
            swipe.setRefreshing(false);
            if (!mainFrameFailed) {
                errorView.setVisibility(View.GONE);
                view.evaluateJavascript(PAGE_HELPERS, null);
            }
            firstPageShown = true;
            CookieManager.getInstance().flush();
            if (!mainFrameFailed && isSignedInPage(url)) onSignedInPage();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                mainFrameFailed = true;
                showError(!isOnline());
            }
        }
    }

    private static boolean isSignedInPage(String url) {
        if (url == null) return false;
        String path = Uri.parse(url).getPath();
        return path != null && !path.contains("/login") && !path.contains("/register") && !path.contains("/get-app");
    }

    /** After a signed-in page loads: ask once for notification permission, and check for news (at most every 2 min). */
    private void onSignedInPage() {
        android.content.SharedPreferences prefs = getSharedPreferences("ns_app", MODE_PRIVATE);
        boolean enabled = androidx.core.app.NotificationManagerCompat.from(this).areNotificationsEnabled();
        if (!enabled) {
            if (Build.VERSION.SDK_INT >= 33 && !prefs.getBoolean("asked_notifications", false)) {
                // First time: Android's own "Allow notifications?" prompt.
                prefs.edit().putBoolean("asked_notifications", true).apply();
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
            } else {
                offerNotificationSettings(prefs);
            }
        }
        askToRunInBackgroundOnce();
        long now = System.currentTimeMillis();
        if (now - lastFeedCheckAt > FEED_CHECK_GAP_MS) {
            lastFeedCheckAt = now;
            FeedWorker.checkSoon(this);
        }
    }

    /**
     * Notifications are blocked (the prompt was refused, or the phone blocks them by default): explain why they
     * matter and open the app's notification settings. Shown at most once a day.
     */
    private void offerNotificationSettings(android.content.SharedPreferences prefs) {
        long now = System.currentTimeMillis();
        if (now - prefs.getLong("offered_notification_settings_at", 0) < 24L * 60 * 60 * 1000) return;
        prefs.edit().putLong("offered_notification_settings_at", now).apply();
        new android.app.AlertDialog.Builder(this)
                .setTitle(R.string.notif_off_title)
                .setMessage(R.string.notif_off_body)
                .setPositiveButton(R.string.notif_off_open, (d, w) -> openNotificationSettings())
                .setNegativeButton(R.string.notif_off_later, null)
                .show();
    }

    private void openNotificationSettings() {
        Intent intent;
        if (Build.VERSION.SDK_INT >= 26) {
            intent = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
        } else {
            intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + getPackageName()));
        }
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + getPackageName())));
        }
    }

    /**
     * Battery savers (especially on Xiaomi, Oppo, Realme, Huawei, Samsung) can stop the background check,
     * and then notifications only arrive when the app is opened. Ask once to be exempt.
     */
    @SuppressLint("BatteryLife")
    private void askToRunInBackgroundOnce() {
        android.content.SharedPreferences prefs = getSharedPreferences("ns_app", MODE_PRIVATE);
        if (prefs.getBoolean("asked_battery", false)) return;
        // Ask after the notification prompt, on a later page load.
        if (Build.VERSION.SDK_INT >= 33 && !prefs.getBoolean("asked_notifications", false)) return;
        android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null || pm.isIgnoringBatteryOptimizations(getPackageName())) return;
        prefs.edit().putBoolean("asked_battery", true).apply();
        web.postDelayed(() -> {
            try {
                startActivity(new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                        Uri.parse("package:" + getPackageName())));
            } catch (ActivityNotFoundException ignored) {
                // Some phones don't offer this screen.
            }
        }, 1500);
    }

    private class ShellChrome extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progress.setProgress(newProgress);
            if (newProgress >= 100) progress.setVisibility(View.GONE);
        }

        /** target="_blank" and window.open(): site pages stay in the app, others open outside. */
        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView probe = new WebView(MainActivity.this);
            probe.setWebViewClient(new WebViewClient() {
                private boolean handled = false;

                private void route(WebView v, Uri uri) {
                    if (handled || uri == null || "about".equals(uri.getScheme())) return;
                    handled = true;
                    if (isInternal(uri)) web.loadUrl(uri.toString());
                    else openExternally(uri);
                    v.stopLoading();
                    v.post(v::destroy);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                    route(v, request.getUrl());
                    return true;
                }

                @Override
                public void onPageStarted(WebView v, String url, Bitmap favicon) {
                    route(v, url == null ? null : Uri.parse(url));
                }
            });
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(probe);
            resultMsg.sendToTarget();
            return true;
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                Intent chooser = Intent.createChooser(params.createIntent(), getString(R.string.choose_file));
                startActivityForResult(chooser, REQ_FILE);
                return true;
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
        }
    }

    // ---------------------------------------------------------------- downloads

    private class ShellDownloads implements DownloadListener {
        @Override
        public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                    String mimeType, long contentLength) {
            String guessed = URLUtil.guessFileName(url, contentDisposition, mimeType);
            if (url.startsWith("blob:")) {
                String js = "(function(u,n){fetch(u).then(function(r){return r.blob();}).then(function(b){" +
                        "var f=new FileReader();f.onloadend=function(){NSApp.saveFile(f.result,window.__nsDl||n,b.type||'');" +
                        "window.__nsDl=null;};f.readAsDataURL(b);}).catch(function(){NSApp.saveFile('',n,'');});})(" +
                        jsString(url) + "," + jsString(guessed) + ");";
                web.evaluateJavascript(js, null);
                return;
            }
            if (url.startsWith("data:")) {
                new Bridge().saveFile(url, guessed, mimeType);
                return;
            }
            try {
                DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) req.addRequestHeader("Cookie", cookie);
                req.addRequestHeader("User-Agent", userAgent);
                req.setMimeType(mimeType);
                req.setTitle(guessed);
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, guessed);
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                dm.enqueue(req);
                Toast.makeText(MainActivity.this, R.string.download_started, Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                openExternally(Uri.parse(url));
            }
        }
    }

    private static String jsString(String s) {
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "") + "'";
    }

    /** Methods the page can call through window.NSApp. */
    class Bridge {
        @JavascriptInterface
        public void setRefreshAllowed(boolean allowed) {
            runOnUiThread(() -> swipe.setEnabled(allowed));
        }

        /** The site heard a realtime "something changed" ping: check for news right away. */
        @JavascriptInterface
        public void checkNow() {
            FeedWorker.checkNow(getApplicationContext());
        }

        /** Shows a sample notification, to confirm notifications reach this phone. */
        @JavascriptInterface
        public boolean testNotification() {
            Notifier.ensureChannels(MainActivity.this);
            if (!androidx.core.app.NotificationManagerCompat.from(MainActivity.this).areNotificationsEnabled()) {
                runOnUiThread(MainActivity.this::openNotificationSettings);
                return false;
            }
            Notifier.post(MainActivity.this, "test-" + System.currentTimeMillis(), Notifier.CHANNEL_COMMISSION,
                    getString(R.string.test_title), getString(R.string.test_body), "/account");
            return true;
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            runOnUiThread(MainActivity.this::openNotificationSettings);
        }

        /** {"enabled":true,"lastCheckAt":1730900000000,"lastStatus":"ok-0","version":"1.0.9"} */
        @JavascriptInterface
        public String status() {
            android.content.SharedPreferences prefs = getSharedPreferences("ns_app", MODE_PRIVATE);
            try {
                return new org.json.JSONObject()
                        .put("enabled", androidx.core.app.NotificationManagerCompat.from(MainActivity.this).areNotificationsEnabled())
                        .put("lastCheckAt", prefs.getLong("last_check_at", 0))
                        .put("lastStatus", prefs.getString("last_status", ""))
                        .put("version", BuildConfig.VERSION_NAME)
                        .toString();
            } catch (org.json.JSONException e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void saveFile(String dataUrl, String name, String mime) {
            int comma = dataUrl == null ? -1 : dataUrl.indexOf(',');
            if (comma < 0) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, R.string.download_failed, Toast.LENGTH_LONG).show());
                return;
            }
            byte[] bytes;
            try {
                bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, R.string.download_failed, Toast.LENGTH_LONG).show());
                return;
            }
            String safeName = (name == null || name.trim().isEmpty() ? "download" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
            String type = mime == null || mime.isEmpty() ? "application/octet-stream" : mime.split(";")[0];
            runOnUiThread(() -> writeToDownloads(bytes, safeName, type));
        }
    }

    private void writeToDownloads(byte[] bytes, String name, String mime) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri item = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (item == null) throw new IllegalStateException("insert failed");
                try (OutputStream out = resolver.openOutputStream(item)) {
                    if (out == null) throw new IllegalStateException("no stream");
                    out.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(item, values, null, null);
            } else {
                if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    pendingBytes = bytes;
                    pendingName = name;
                    pendingMime = mime;
                    requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
                    return;
                }
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("no downloads dir");
                File file = uniqueFile(dir, name);
                try (FileOutputStream out = new FileOutputStream(file)) {
                    out.write(bytes);
                }
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                dm.addCompletedDownload(file.getName(), file.getName(), true, mime,
                        file.getAbsolutePath(), file.length(), true);
                name = file.getName();
            }
            Toast.makeText(this, getString(R.string.download_saved, name), Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, R.string.download_failed, Toast.LENGTH_LONG).show();
        }
    }

    private static File uniqueFile(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 1; ; i++) {
            f = new File(dir, base + " (" + i + ")" + ext);
            if (!f.exists()) return f;
        }
    }

    // ---------------------------------------------------------------- activity plumbing

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_STORAGE && pendingBytes != null) {
            byte[] b = pendingBytes;
            String n = pendingName;
            String m = pendingMime;
            pendingBytes = null;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                writeToDownloads(b, n, m);
            } else {
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE) {
            if (fileCallback != null) {
                fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                fileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri uri = intent.getData();
        if (isInternal(uri)) web.loadUrl(uri.toString());
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (errorView.getVisibility() == View.VISIBLE && web.canGoBack()) {
            errorView.setVisibility(View.GONE);
            web.goBack();
            return;
        }
        if (web.canGoBack()) {
            web.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastBackAt < 2000) {
            super.onBackPressed();
        } else {
            lastBackAt = now;
            Toast.makeText(this, R.string.press_back_again, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        applyStatusBarBackground();
        web.onResume();
    }

    @Override
    protected void onPause() {
        web.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.stopLoading();
            web.destroy();
        }
        super.onDestroy();
    }
}
