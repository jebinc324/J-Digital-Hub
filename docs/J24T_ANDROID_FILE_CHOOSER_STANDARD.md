# J24T Android Open with / Sharesheet standard

Applies to future native Android builds. These are Android OS integrations; merely placing an APK on the website does not make an app appear in external choosers.

## By app type
- **Media Player:** handle ACTION_VIEW for `content://` video/* and audio/*, and relevant ACTION_SEND streams. Forward the sender's temporary URI read grant to the real player. Play the shared URI directly (do not request whole-storage permission merely to open one file).
- **Archive Manager:** handle ACTION_VIEW and ACTION_SEND for supported ZIP/RAR/7Z/TAR/GZ/BZ2/XZ MIME types. Resolve the OpenableColumns display name, validate the extension, forward the URI permission to the extractor. Offer to choose a destination; no surprise extraction.
- **J Share:** handle ACTION_SEND and ACTION_SEND_MULTIPLE via an exported Sharesheet receiver, accept file content URIs, show what is queued, and require manual pairing + explicit Send action before transfer.
- **Future PDF / Image / Document apps:** implement only the actions and MIME types their current code genuinely supports, routing into the corresponding editor/viewer. Do not claim universal ability with a wildcard intent filter without validation.

## Security & behavior
1. Register explicit `android:exported="true"` only on dedicated external entry activities. Keep playback/extraction/transfer activities private.
2. Use `android.intent.category.DEFAULT` on matching filters, preserve read permission with `FLAG_GRANT_READ_URI_PERMISSION` and `ClipData`, and support `content://` first.
3. Limit import sizes and the number of shared items, reject unsupported content politely, and never start file upload without user confirmation.
4. Use ACTION_VIEW to appear in **Open with** and ACTION_SEND/ACTION_SEND_MULTIPLE for the Android **Sharesheet**. Appearance depends on sender MIME type, platform/share UI, and package installed on the phone; third-party apps can use their own media viewer instead.
5. Preserve original application ID and update signing certificate. Increment versionCode for user-installable upgrades; do not publish a new public APK signed with an unknown temporary debug key.
6. Run Gradle compile checks, then validate at least two real intent sources such as WhatsApp and Samsung My Files; compile tests do not prove chooser appearance.
7. Keep J24T splash copyright `© 2026 Just24Things. All rights reserved.` on branded releases.

## 2026-11-09 implementation state
- J Share v0.4.1: source updated for Android Share intents; signed APK build passed with preserved signing configuration, and public APK website listing updated.
- J Media Player: Android Open with/Share media routing is present in **v1.3.2** on the original October stable-release source branch. The new APK is **signed with the exact same certificate as `J-Media-Player-v1.3.1-Stable-Offline.apk`** (certificate SHA-256 `93823ab0f2ded987ac1e4cc320cbe9ceef6fd8edfcad5d005f33eec432d21462`, versionCode raised from 7 to 8). A separate verified APK `j-media-player-v1.3.2-stable-key.apk` is available on the website. The older `j-media-player.apk` website asset uses a different signing key and remains unchanged for users of that legacy distribution. Never claim both update each other.
- J Archive Manager: Android Open with/Share support compiles, but the original v1.0.2 certificate SHA-256 `745fdd80b214d83b87d24cb94383621606699ec389c603e710937e229dcf72ce` cannot be used without its PRIVATE signing key. The found general J Apps keystore and Archive preview debug keystore do not match it. Original public download remains unchanged; the mismatched preview download was removed from the app-details listing to avoid accidental uninstall/reinstall. Restore the exact original keystore before releasing a compatible upgrade.
- All other J Apps still require app-specific support when their code next receives updates.
