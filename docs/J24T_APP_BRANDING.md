# J24T application branding standard

Applies to all newly developed Just24Things apps and future releases of existing J Apps, when each app next receives a build update.

## Identity and attribution
- Preserve each application's own name. For the universal sharing app, the approved exact display name is **J Share**.
- On the splash/loading screen, show the app's icon, its name and the Just24Things branding.
- Show the exact notice **© 2026 Just24Things. All rights reserved.** on the splash screen and under **Settings → About** (or the equivalent About page).
- Do not display ® unless the corresponding mark is registered. A copyright notice is not a security certification or app-store verification.

## User experience
- Keep splash branding brief (typically about one second), smooth and accessible. Avoid artificial multi-second delays.
- Support the existing light/dark theme and Android window insets. Never overlap status bars, camera cutouts or navigation gestures.
- Opening an active transfer from a notification must not restart the transfer or unnecessarily block it with a splash.
- Keep titles/subtitles compact; avoid adding large branding cards throughout the main UI.

## Release safety
- Preserve app package names, version-code upgrade ordering, and the **original signing identity** when distributing an update.
- Do not change working transfer code solely for branding.
- Do not mark a public release as security-audited unless it actually was.
- Update app-store/web listings only after a corresponding signed build exists and the downloadable asset is verified.
- Update the copyright year in future new builds as appropriate.

## J Share
The v0.3.1 branding foundation kept the original package ID, signing identity, and iPhone/desktop browser sharing. In v0.4.0, J Share adds a **native Android-to-Android app interface**: nearby service discovery using Android NSD (mDNS), six-digit PIN pairing against the existing receiver, direct in-app file upload, list and download, and private-IP manual connection fallback. Both phones must share a local Wi-Fi/hotspot network. **Wi-Fi Direct without an established shared network** and merging the old WiFi Share source code are **not included**. The app-to-app behavior has compiled successfully but still requires real two-phone testing. The LAN protocol remains unencrypted HTTP; only use trusted private networks. Continue showing the Just24Things copyright notice, without appending the developer name to the app title.
