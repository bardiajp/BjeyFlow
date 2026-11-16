# BjeyFlow mobile

This first React Native / Expo app uses a WebView to display the existing hosted
BjeyFlow UI at `https://bjeyflow.space/`. It shares the website's functionality
but has a separate app session and requires an internet connection. It does not
yet provide fully native screens or native background push notifications.

## Run in development

```sh
cd apps/mobile
npm ci
npm start
```

Open it with a compatible Expo Go device or a development build. Android and
iOS builds require the appropriate Android SDK or Xcode. The bundled app always
connects to the hosted server, not a local frontend.

## Build

The `preview` EAS profile produces an Android APK, while `production` produces
an Android App Bundle. An Expo account, an EAS-linked project, and Android
signing credentials are required; `npx eas-cli init` links the project and
`npx eas-cli build --platform android --profile preview` starts a build. iOS
builds also require Apple signing and distribution credentials. None are stored
in this repository. No mobile package is published automatically.
