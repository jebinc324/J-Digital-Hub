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
- J Media Player: Android Open with/Share media router and relevant filters added to GitHub; test build runs. Repo lacks original release signing configuration, so it is not yet safe to replace the existing public APK.
- J Archive Manager: archive Open with/Share handler added to GitHub; test build passed. Repo lacks original release signing configuration, so original public APK remains unchanged.
- All other J Apps still require app-specific support when their code next receives updates.
