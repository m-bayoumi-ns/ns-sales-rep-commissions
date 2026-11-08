plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

// Version: CI passes the run number so every build installs over the previous one.
val ciBuild = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

// The website whose /api/app/* endpoints the app reads. Override with the API_BASE_URL environment variable.
val apiBaseUrl: String = (System.getenv("API_BASE_URL")?.trim()?.takeIf { it.isNotEmpty() }
    ?: "https://ns-sales-rep-commissions.vercel.app").trimEnd('/')

// Release signing comes from environment variables (GitHub Actions secrets).
// Without them the release build falls back to the debug key, which still installs fine.
val ksPath: String? = System.getenv("ANDROID_KEYSTORE_PATH")
val hasReleaseKey = ksPath != null && file(ksPath).exists()

android {
    namespace = "com.naguibselim.commissionsapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.naguibselim.commissionsapp"
        minSdk = 24
        targetSdk = 34
        versionCode = ciBuild
        versionName = "1.0.$ciBuild"
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        resourceConfigurations += listOf("en", "ar")
    }

    signingConfigs {
        create("release") {
            if (hasReleaseKey) {
                storeFile = file(ksPath!!)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")?.trim()
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")?.trim()
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")?.trim()
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = if (hasReleaseKey) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.03")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-core")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.2")
}
