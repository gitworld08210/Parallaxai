# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Firebase - keep necessary classes
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# Firebase Analytics
-keep class com.google.firebase.analytics.** { *; }

# Firebase Firestore
-keep class com.google.firebase.firestore.** { *; }

# Firebase Auth
-keep class com.google.firebase.auth.** { *; }

# Firebase Storage
-keep class com.google.firebase.storage.** { *; }

# Keep enum classes
-keep class * implements java.lang.Enum { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep View classes
-keep class android.widget.** { *; }
-keep class androidx.appcompat.widget.** { *; }

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep classes that are used by Capacitor
-keep class com.getcapacitor.** { *; }

# Keep LiveKit classes
-keep class io.livekit.android.** { *; }
-keep class io.livekit.** { *; }
-keep class livekit.client.** { *; }

# Keep Supabase classes
-keep class io.github.jan.supabase.** { *; }
-keep class io.github.jan.supabase.** { *; }

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# Keep data class for serialization
-keepclassmembers class * {
    @com.fasterxml.jackson.annotation.JsonCreator *;
    @com.fasterxml.jackson.annotation.JsonProperty *;
}

# Firebase generated classes
-keep class com.google.firebase.firestore.util.** { *; }
-keep class com.google.firebase.firestore.gapic.** { *; }
