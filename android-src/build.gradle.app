plugins { id "com.android.application" }
android {
    namespace "com.r3dm.nexusia"
    compileSdk 34
    defaultConfig {
        applicationId "com.r3dm.nexusia"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    buildTypes { debug { minifyEnabled false } }
}
dependencies {
    implementation "androidx.webkit:webkit:1.9.0"
    implementation "androidx.appcompat:appcompat:1.6.1"
    implementation "com.google.android.gms:play-services-ads:23.0.0"
}