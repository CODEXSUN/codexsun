plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val appBrandName = providers.environmentVariable("APP_BRAND_NAME")
    .orNull ?: error("Set --client-name for CRM mobile builds.")

val appApplicationId = providers.environmentVariable("ANDROID_APPLICATION_ID")
    .orNull ?: error("Set --application-id for CRM mobile builds.")

val appAndroidBrandAsset = providers.environmentVariable("MOBILE_ANDROID_BRAND_ASSET")
    .orNull ?: error("Set --android-brand-asset for CRM mobile builds.")

val releaseKeystorePath = providers.environmentVariable("CODEXSUN_ANDROID_KEYSTORE_PATH").orNull
val releaseKeystorePassword = providers.environmentVariable("CODEXSUN_ANDROID_KEYSTORE_PASSWORD").orNull
val releaseKeyAlias = providers.environmentVariable("CODEXSUN_ANDROID_KEY_ALIAS").orNull
val releaseKeyPassword = providers.environmentVariable("CODEXSUN_ANDROID_KEY_PASSWORD").orNull
val releaseBuildRequested = gradle.startParameter.taskNames.any {
    it.contains("release", ignoreCase = true)
}

if (releaseBuildRequested) {
    require(
        !releaseKeystorePath.isNullOrBlank() &&
            !releaseKeystorePassword.isNullOrBlank() &&
            !releaseKeyAlias.isNullOrBlank() &&
            !releaseKeyPassword.isNullOrBlank()
    ) {
        "Release builds require CODEXSUN_ANDROID_KEYSTORE_PATH, CODEXSUN_ANDROID_KEYSTORE_PASSWORD, CODEXSUN_ANDROID_KEY_ALIAS, and CODEXSUN_ANDROID_KEY_PASSWORD."
    }
    require(file(releaseKeystorePath!!).isFile) {
        "CODEXSUN_ANDROID_KEYSTORE_PATH must point to an existing keystore file."
    }
}

require(appAndroidBrandAsset.matches(Regex("[a-z][a-z0-9_]*"))) {
    "MOBILE_ANDROID_BRAND_ASSET must be a lowercase Android resource profile name."
}

android {
    namespace = "in.codexsun.crm_mobile"
    compileSdk = flutter.compileSdkVersion
    // Use the Android NDK already provisioned on this workstation. This avoids
    // an SDK Manager download during local emulator builds.
    ndkVersion = "28.2.13676358"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    buildFeatures {
        resValues = true
    }

    sourceSets {
        getByName("main").res.srcDir("src/main/branding/$appAndroidBrandAsset/res")
    }

    signingConfigs {
        create("release") {
            storeFile = releaseKeystorePath?.let { file(it) }
            storePassword = releaseKeystorePassword
            keyAlias = releaseKeyAlias
            keyPassword = releaseKeyPassword
        }
    }

    defaultConfig {
        applicationId = appApplicationId
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        resValue("string", "app_name", appBrandName)
        resValue("string", "mobile_channel_prefix", appApplicationId)
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("com.google.code.findbugs:jsr305:3.0.2")
    implementation("com.google.errorprone:error_prone_annotations:2.28.0")
    implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0")
}
