# Keep Kotlin / Compose / Tink (EncryptedSharedPreferences) / WorkManager rules
-keepattributes *Annotation*,InnerClasses,Signature,EnclosingMethod
-dontwarn com.google.crypto.tink.**
-keep class com.google.crypto.tink.** { *; }
-keep class com.naguibselim.commissionsapp.notify.FeedWorker { *; }
