# BjeyFlow Android

The Capacitor Android app loads `https://bjeyflow.space/` and requires an internet connection. It does not provide native push notifications. Remote content runs with Capacitor's bridge, so only deploy trusted code to that origin.

Install JDK 21 and the Android SDK required by the generated Android project, then:

```sh
cd apps/mobile
npm ci
npm run sync
cd android
./gradlew assembleDebug
```

The debug APK is at `app/build/outputs/apk/debug/app-debug.apk`. Debug signing is for testing only. A release requires a private signing key and distribution setup; never commit those credentials.
