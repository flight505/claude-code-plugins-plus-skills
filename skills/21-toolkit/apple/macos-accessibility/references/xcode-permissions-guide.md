# Xcode Permissions Guide — Xcode 26 / Swift 6 / macOS 14–26

Authoritative current-Apple-docs guide for declaring and requesting macOS permissions. Sourced from `developer.apple.com` only; verified against Apple Developer Forums advisories. Use this when adding any of the five common TCC permissions to a non-sandboxed macOS app with Hardened Runtime enabled.

---

## Verdict

**For non-sandboxed apps with Hardened Runtime, the Xcode UI is the preferred surface for the permissions that have entitlements.** The Signing & Capabilities tab → "Hardened Runtime" capability exposes checkboxes that write directly to `.entitlements`. **Three of the five common permissions have NO entitlement — they are Info.plist usage descriptions only.**

| Permission                | Has entitlement?                                   | Xcode UI?                                            |
| ------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Microphone                | Yes (`com.apple.security.device.audio-input`)      | ✅ Hardened Runtime → Resource Access → Audio Input  |
| Apple Events (Automation) | Yes (`com.apple.security.automation.apple-events`) | ✅ Hardened Runtime → Resource Access → Apple Events |
| Input Monitoring          | **No**                                             | ❌ Hand-edit Info.plist usage description only       |
| Accessibility             | **No**                                             | ❌ Hand-edit Info.plist usage description only       |
| Screen Recording          | **No**                                             | ❌ Hand-edit Info.plist usage description only       |

---

## Per-permission table

| Permission                    | `Info.plist` key (required)         | Hardened Runtime entitlement                 | Xcode capability path                             | Preflight (poll-safe)                              | Request                                                               | Live-state read                                                                | Notes                                                                                                                                                                               |
| ----------------------------- | ----------------------------------- | -------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Microphone**                | `NSMicrophoneUsageDescription`      | `com.apple.security.device.audio-input`      | Hardened Runtime → Resource Access → Audio Input  | `AVCaptureDevice.authorizationStatus(for: .audio)` | `AVCaptureDevice.requestAccess(for: .audio)`                          | Same as preflight — updates live                                               | If both Sandbox and Hardened Runtime are on, also need `com.apple.security.device.microphone`.                                                                                      |
| **Input Monitoring**          | `NSInputMonitoringUsageDescription` | None                                         | None — hand-edit plist                            | `CGPreflightListenEventAccess()`                   | `CGRequestListenEventAccess()`                                        | Same as preflight                                                              | `CGEvent.tapCreate(.listenOnly)` requires this; `.defaultTap` requires Accessibility instead (commonly confused). `NSEvent.addGlobalMonitorForEvents` requires Accessibility.       |
| **Accessibility**             | `NSAccessibilityUsageDescription`   | None                                         | None — hand-edit plist                            | `AXIsProcessTrusted()` (no prompt)                 | `AXIsProcessTrustedWithOptions(["AXTrustedCheckOptionPrompt": true])` | Same as preflight                                                              | **Never call the prompt-firing variant in a poll loop.** It fires the dialog on every call when untrusted. Has known stale-read lag when toggled rapidly (Apple Dev Forums 727984). |
| **Screen Recording**          | `NSScreenCaptureUsageDescription`   | None                                         | None — hand-edit plist                            | `CGPreflightScreenCaptureAccess()`                 | `CGRequestScreenCaptureAccess()`                                      | Preflight **caches** first result until process exit (Apple Dev Forums 732726) | `CGWindowListCreateImage` and `CGDisplayStream` deprecated since Sonoma; trigger user-visible alerts on Sequoia+. Migrate to ScreenCaptureKit for macOS 15+.                        |
| **Automation (Apple Events)** | `NSAppleEventsUsageDescription`     | `com.apple.security.automation.apple-events` | Hardened Runtime → Resource Access → Apple Events | **No safe preflight**                              | Send a real Apple Event via `NSAppleScript` off main thread           | Catch error -1743 (`errAEEventNotPermitted`) from a real send                  | `AEDeterminePermissionToAutomateTarget` can hang indefinitely (Apple Dev Forums 666528, FB5345023). Never call on a timer.                                                          |

---

## Xcode UI walkthrough — adding the entitlement-backed capabilities

Only Microphone and Apple Events have Xcode Capabilities tab entries. Both live under **Hardened Runtime → Resource Access**.

### Adding the Hardened Runtime capability (prerequisite)

1. Open your project in Xcode.
2. Click your app target in the Project Navigator (left sidebar).
3. Click the **Signing & Capabilities** tab.
4. Click the **+ Capability** button (top-left of the tab).
5. Type `Hardened Runtime` in the search field.
6. Double-click **Hardened Runtime** to add it. Two collapsible sections appear: **Runtime Exceptions** and **Resource Access**.

### Adding Audio Input (Microphone)

1. Expand **Resource Access**.
2. Check **Audio Input**.
3. Xcode writes `com.apple.security.device.audio-input = true` to your `.entitlements` file.

### Adding Apple Events (Automation)

1. Under **Resource Access**, check **Apple Events**.
2. Xcode writes `com.apple.security.automation.apple-events = true` to your `.entitlements` file.

Other Resource Access checkboxes visible in this tab: Camera, Location, Contacts, Calendar, Photos, Bluetooth, USB, Print. Only check what your app actually uses — TCC will log noise for unused ones.

---

## Hand-edit fallback — capabilities NOT in the Xcode tab

The three TCC-only permissions (Input Monitoring, Accessibility, Screen Recording) have **no entitlement key** and **no Xcode Capabilities tab entry**. They require only an Info.plist usage description.

### Info.plist additions

```xml
<key>NSInputMonitoringUsageDescription</key>
<string>YourApp watches for global hotkeys to trigger commands from any app.</string>

<key>NSAccessibilityUsageDescription</key>
<string>YourApp reads the active window and selected text from other apps to provide context.</string>

<key>NSScreenCaptureUsageDescription</key>
<string>YourApp captures the screen to provide visual context for assistant interactions.</string>
```

These strings are user-visible — they appear in the system consent dialog. Apple's review team checks that they describe a real, user-comprehensible purpose. Vague text ("for our service") risks rejection.

---

## Version-specific behavior changes

### macOS 14 (Sonoma)

- `NSAccessibilityUsageDescription` became authoritative for the AX consent dialog text.
- `CGWindowListCreateImage` / `CGDisplayStream` soft-deprecated (warning only).
- `CGRequestListenEventAccess` / `CGPreflightListenEventAccess` confirmed stable.

### macOS 15 (Sequoia)

- `CGWindowListCreateImage` / `CGDisplayStream` now trigger active system alerts. Migrate to ScreenCaptureKit.
- `LSBackgroundOnly: true` blocks `CGEventTapCreate` even with Accessibility granted. Use `LSUIElement: true` instead — Apple Dev Forums 758554.
- XPC services no longer inherit parent app's screen recording grant; each XPC needs its own.
- Brief "Continue to Allow" Screen Recording loop (fixed in beta 5).

### macOS 26 (Tahoe)

- Plain (non-bundled) executables no longer appear in System Settings → Screen Recording UI. App bundles still work.
- `CGPreflightListenEventAccess()` returns false for ad-hoc-signed binaries even when the OS toggle shows ON. Developer ID signing unaffected.
- `com.apple.security.automation.apple-events` more strictly checked by tccd even for non-sandboxed Hardened Runtime apps — adding it is now strongly recommended.

---

## SwiftUI status

There is **no native SwiftUI API** for requesting macOS permissions. No environment values, view modifiers, property wrappers, or async/await sugar over the C permission APIs exist as of macOS 26. The pattern for all five permissions is to wrap the imperative framework APIs (`AVCaptureDevice`, `AXIsProcessTrustedWithOptions`, `CGRequestListenEventAccess`, `CGRequestScreenCaptureAccess`, `AEDeterminePermissionToAutomateTarget`) in `@MainActor` Swift wrappers exposed as an `ObservableObject` that SwiftUI views can observe.

Confirmed via Apple Developer Forums 124159 (April 2024) — no change through macOS 26.

---

## Anti-patterns to avoid

1. **Polling the prompt-firing AX variant.** `AXIsProcessTrustedWithOptions(prompt: true)` fires the consent dialog on every call when untrusted. Use the bare `AXIsProcessTrusted()` for polling; only call the prompt variant on explicit user action.
2. **Calling `AEDeterminePermissionToAutomateTarget` on a timer.** It can hang indefinitely (~1% of calls per FB5345023). Only call from explicit user-action paths, off the main thread, with a timeout.
3. **Trusting `CGPreflightScreenCaptureAccess` to update live.** It caches the first result until process exit. After grant, the user must restart your app — surface a "Restart" CTA rather than waiting for the cache to flip.
4. **Confusing Input Monitoring with Accessibility for CGEventTap.** `.listenOnly` taps need Input Monitoring; `.defaultTap` (filter/modify) needs Accessibility. Document this in your code; it trips up most third-party tutorials.
5. **Using `LSBackgroundOnly: true` with hotkey taps on macOS 15+.** Switch to `LSUIElement: true` or `.accessory` activation policy.
6. **Skipping Info.plist usage descriptions.** Apple's review team rejects apps that touch protected APIs without a user-facing description, even when the entitlement is set correctly.

---

## Authoritative sources

All `developer.apple.com`:

- [AVCaptureDevice.requestAccess(for:completionHandler:)](https://developer.apple.com/documentation/avfoundation/avcapturedevice/1624584-requestaccess)
- [AXIsProcessTrusted()](https://developer.apple.com/documentation/applicationservices/1460720-axisprocesstrusted)
- [AXIsProcessTrustedWithOptions(\_:)](https://developer.apple.com/documentation/applicationservices/1459186-axisprocesstrustedwithoptions)
- [CGPreflightListenEventAccess()](<https://developer.apple.com/documentation/coregraphics/cgpreflightlisteneventaccess()>)
- [CGRequestListenEventAccess()](<https://developer.apple.com/documentation/coregraphics/cgrequestlisteneventaccess()>)
- [CGPreflightScreenCaptureAccess()](<https://developer.apple.com/documentation/coregraphics/cgpreflightscreencaptureaccess()>)
- [CGRequestScreenCaptureAccess()](<https://developer.apple.com/documentation/coregraphics/cgrequestscreencaptureaccess()>)
- [Configuring the Hardened Runtime](https://developer.apple.com/documentation/xcode/configuring-the-hardened-runtime)
- [Apple Events Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.automation.apple-events)
- [Audio Input Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.device.audio-input)
- [ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit/)
- Forums: [Input Monitoring vs Accessibility for CGEventTap (122492)](https://developer.apple.com/forums/thread/122492)
- Forums: [AXIsProcessTrusted stale reads (727984)](https://developer.apple.com/forums/thread/727984)
- Forums: [LSBackgroundOnly blocks CGEventTap on Sequoia (758554)](https://developer.apple.com/forums/thread/758554)
- Forums: [CGRequestScreenCaptureAccess caching (732726)](https://developer.apple.com/forums/thread/732726)
- Forums: [AEDeterminePermissionToAutomateTarget hang (666528)](https://developer.apple.com/forums/thread/666528)
- Forums: [No SwiftUI permission API (124159)](https://developer.apple.com/forums/thread/124159)
