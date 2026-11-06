# Methods called from JavaScript must keep their names.
-keepclassmembers class com.naguibselim.commissions.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
