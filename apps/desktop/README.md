# BjeyFlow desktop

The Electron app loads the hosted BjeyFlow application at `https://bjeyflow.space/`.
It uses the same account and server as the web app and requires an internet connection.
The app does not bundle credentials or expose Node.js to the web application.

## Run locally

```sh
cd apps/desktop
npm ci
npm start
```

## Build for Linux

On an x86-64 Linux machine:

```sh
cd apps/desktop
npm ci
npm run dist:linux
```

The outputs are `dist/BjeyFlow-linux-x64.AppImage` and
`dist/BjeyFlow-linux-x64.deb`. The DEB installs an application-menu shortcut.
For AppImage launcher and icon setup, see `AppImage-README.txt`; the release
also publishes the icon as a separate file. AppImage may require FUSE 2.

## Build for Windows

On a Windows x86-64 machine:

```powershell
cd apps/desktop
npm ci
npm run dist:windows
```

This creates `BjeyFlow-Windows-x64-Setup.exe` and
`BjeyFlow-Windows-x64-Portable.exe`. These builds target x86-64 only and are not
code-signed, so Windows SmartScreen may warn when launching them. There is no
automatic updater. Only install builds from a trusted release.

## Publish a release

After merging, push a tag such as `desktop-v1.0.0`. The desktop release workflow
builds and publishes the Linux and Windows assets. The version in
`package.json` must match the tag. The Settings download button is enabled only
when a published desktop release contains the corresponding asset.
