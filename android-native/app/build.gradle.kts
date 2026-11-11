plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val ciBuild = (System.getenv("GITHUB_RUN_NUMBER") ?: "21").toIntOrNull() ?: 21
val apiBaseUrl = (System.getenv("API_BASE_URL")?.trim()?.removeSuffix("/"))
    ?.takeIf { it.isNotEmpty() }
    ?: "https://ns-sales-rep-commissions.vercel.app"

val ksPath = System.getenv("ANDROID_KEYSTORE_PATH")
val localKsFile = rootProject.file("../android-signing-key/ns-commissions-release.jks")
val resolvedKsFile = when {
    !ksPath.isNullOrBlank() && file(ksPath).exists() -> file(ksPath)
    localKsFile.exists() -> localKsFile
    else -> null
}

android {
    namespace = "com.naguibselim.commissionsapp"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.naguibselim.commissionsapp"
        minSdk = 24
        targetSdk = 35
        versionCode = ciBuild
        versionName = "2.0.$ciBuild"

        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        resourceConfigurations += listOf("en", "ar")
    }

    signingConfigs {
        create("release") {
            if (resolvedKsFile != null) {
                storeFile = resolvedKsFile
                storePassword = (System.getenv("ANDROID_KEYSTORE_PASSWORD")?.trim())
                    ?.takeIf { it.isNotEmpty() } ?: "shT3M4WbQA7JOS3cz0buuPGg"
                keyAlias = (System.getenv("ANDROID_KEY_ALIAS")?.trim())
                    ?.takeIf { it.isNotEmpty() } ?: "ns-commissions"
                keyPassword = (System.getenv("ANDROID_KEY_PASSWORD")?.trim())
                    ?.takeIf { it.isNotEmpty() } ?: "shT3M4WbQA7JOS3cz0buuPGg"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = if (resolvedKsFile != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
