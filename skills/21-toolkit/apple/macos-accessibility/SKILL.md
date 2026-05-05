---
name: macos-accessibility
description: 'USE THIS SKILL for automating macOS apps via the Accessibility API (AXUIElement) — TCC permission handling, element discovery, safe action execution, code-signature verification, and the security boundaries you must respect.'
---

# macOS Accessibility Automation

Build automations that drive other macOS apps through `AXUIElement` (the Accessibility API) without bypassing the platform's security model.

## When to Use This Skill

- Automating a macOS app that exposes accessibility (most native apps do)
- Building a UI testing harness that drives real apps
- Reading window state, button labels, or focus across apps
- Simulating clicks, keypresses, or text entry into another app
- Anything that needs to call `AXUIElementCreateApplication`, `AXUIElementCopyAttributeValue`, or `AXUIElementPerformAction`

## Granting Accessibility Permission

The user must grant your process Accessibility access in:

**System Settings → Privacy & Security → Accessibility** _(Apple renamed System Preferences → System Settings in macOS Ventura 13)_

Your process should detect the missing permission and show a clear instruction rather than silently failing:

```python
from ApplicationServices import (
    AXIsProcessTrustedWithOptions,
    kAXTrustedCheckOptionPrompt,
)

def has_accessibility_permission(prompt: bool = False) -> bool:
    """Check whether this process is trusted for accessibility.

    Set prompt=True once at startup to surface the system permission dialog.
    Don't call with prompt=True repeatedly — it's annoying.
    """
    options = {kAXTrustedCheckOptionPrompt: prompt}
    return AXIsProcessTrustedWithOptions(options)


def ensure_accessibility() -> None:
    if not has_accessibility_permission():
        raise PermissionError(
            "Accessibility permission required.\n"
            "Open System Settings > Privacy & Security > Accessibility and enable this app."
        )
```

Notes:

- `kAXTrustedCheckOptionPrompt` triggers the system dialog on first call. Don't poll — just call it once at startup.
- Querying the TCC SQLite database directly requires SIP disabled. Don't bother — `AXIsProcessTrustedWithOptions` is the supported API.
- You can't programmatically add yourself to Accessibility; user has to do it.

## Core Principles

1. **Validate the target app, not just the bundle ID.** A malicious app can claim any bundle ID. Use `codesign -v` to verify the on-disk bundle.
2. **Never automate password fields, Keychain Access, or SecurityAgent.** These exist behind a hard line in the macOS security model.
3. **Always set timeouts.** AX calls can hang indefinitely if the target app is unresponsive.
4. **Cache element references with a TTL.** Elements become stale when windows close, panes switch, or the target app restarts.
5. **Audit every action.** Especially in elevated tiers — log who did what, when, against which bundle.

## Permission Tiers (Recommended Pattern)

When building a general automation tool, model three tiers so callers can declare what they need:

| Tier        | Allowed Attributes                                        | Allowed Actions                         | Use Case               |
| ----------- | --------------------------------------------------------- | --------------------------------------- | ---------------------- |
| `read-only` | `AXTitle`, `AXRole`, `AXChildren`, `AXPosition`, `AXSize` | none                                    | Inspection, monitoring |
| `standard`  | All non-sensitive                                         | `AXPress`, `AXIncrement`, `AXDecrement` | Most app automation    |
| `elevated`  | All except blocked apps                                   | All except destructive                  | UI testing harnesses   |

Keep `AXValue`, `AXSelectedText`, and `AXDocument` out of `read-only` — they leak content.

## Discovering Elements Securely

```python
from ApplicationServices import (
    AXUIElementCreateApplication,
    AXUIElementCopyAttributeValue,
    AXUIElementCopyMultipleAttributeValues,
)
from Quartz import kAXErrorSuccess
from AppKit import NSRunningApplication
import logging

class SecureAXAutomation:
    BLOCKED_BUNDLES = {
        'com.apple.keychainaccess',     # Keychain Access
        'com.apple.systempreferences',  # System Settings
        'com.apple.SecurityAgent',      # auth dialogs
        'com.1password.1password',
        'com.agilebits.onepassword7',
        'com.bitwarden.desktop',
    }

    def __init__(self, tier: str = 'read-only'):
        if tier not in ('read-only', 'standard', 'elevated'):
            raise ValueError(f"Unknown tier: {tier}")
        self.tier = tier
        self.log = logging.getLogger('macos.ax')
        if not has_accessibility_permission():
            raise PermissionError("Accessibility permission required")

    def app_for_pid(self, pid: int):
        bundle_id = self._bundle_id_for_pid(pid)
        if bundle_id in self.BLOCKED_BUNDLES:
            self.log.warning('blocked_app_access', extra={'bundle_id': bundle_id})
            raise PermissionError(f"Access to {bundle_id} is blocked")
        if not self._verify_signature(pid):
            raise PermissionError(f"Code signature invalid for pid={pid}")
        element = AXUIElementCreateApplication(pid)
        self.log.info('app_attached', extra={'bundle_id': bundle_id, 'pid': pid})
        return element

    def get_attr(self, element, name: str):
        sensitive = {'AXValue', 'AXSelectedText', 'AXDocument'}
        if name in sensitive and self.tier == 'read-only':
            raise PermissionError(f"Reading {name} requires standard tier or higher")
        err, value = AXUIElementCopyAttributeValue(element, name, None)
        if err != kAXErrorSuccess:
            return None
        # never return password-like content even if requested
        if 'password' in name.lower():
            return '[REDACTED]'
        return value

    def _bundle_id_for_pid(self, pid: int) -> str:
        app = NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
        return app.bundleIdentifier() if app else ''

    def _verify_signature(self, pid: int) -> bool:
        import subprocess
        app = NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
        if not app:
            return False
        path = app.bundleURL().path()
        result = subprocess.run(['codesign', '-v', path],
                              capture_output=True, timeout=5)
        return result.returncode == 0
```

## Performing Actions

```python
from ApplicationServices import AXUIElementPerformAction

class SafeActionExecutor:
    # Actions blocked at lower tiers
    BLOCKED_BY_TIER = {
        'read-only': {'AXPress', 'AXIncrement', 'AXDecrement', 'AXConfirm', 'AXCancel'},
        'standard':  {'AXDelete'},
        'elevated':  set(),
    }

    def __init__(self, tier: str):
        self.tier = tier

    def perform(self, element, action: str) -> None:
        if action in self.BLOCKED_BY_TIER[self.tier]:
            raise PermissionError(f"Action {action} not allowed in {self.tier} tier")
        err = AXUIElementPerformAction(element, action)
        if err != kAXErrorSuccess:
            raise RuntimeError(f"AX action {action} failed: error {err}")
```

Common actions:

- `AXPress` — clicks a button or activates a control
- `AXOpen` — opens a document or URL
- `AXShowMenu` — opens a contextual menu

## Performance: Batch Attribute Queries

A single round-trip per attribute adds up fast. The Accessibility API has a batch call:

```python
from ApplicationServices import AXUIElementCopyMultipleAttributeValues

# Bad: 4 IPCs
title = get_attr(element, 'AXTitle')
role  = get_attr(element, 'AXRole')
pos   = get_attr(element, 'AXPosition')
size  = get_attr(element, 'AXSize')

# Good: 1 IPC
attrs = ['AXTitle', 'AXRole', 'AXPosition', 'AXSize']
err, values = AXUIElementCopyMultipleAttributeValues(element, attrs, 0, None)
info = dict(zip(attrs, values)) if err == kAXErrorSuccess else {}
```

## Performance: Element Caching with TTL

```python
import time

class ElementCache:
    def __init__(self, ttl: float = 5.0):
        self._cache: dict[tuple, tuple] = {}
        self.ttl = ttl

    def get_or_create(self, key: tuple, factory):
        now = time.monotonic()
        if key in self._cache:
            element, created = self._cache[key]
            if now - created < self.ttl:
                return element
        element = factory()
        self._cache[key] = (element, now)
        return element
```

5 seconds is a reasonable default. UI state changes faster than humans notice — caching past that produces phantom interactions.

## Limiting Hierarchy Search Depth

Searching the entire AX tree of a complex app (e.g. Xcode) can take seconds. Bound the depth:

```python
def find_role(element, target_role: str, max_depth: int = 5):
    def walk(el, depth: int):
        if depth > max_depth:
            return
        role = get_attr(el, 'AXRole')
        if role == target_role:
            yield el
            return  # don't descend into matched subtree
        for child in get_attr(el, 'AXChildren') or []:
            yield from walk(child, depth + 1)
    return list(walk(element, 0))
```

## Observers and Debouncing

For long-running automations, attach `AXObserver` instead of polling:

```python
class DebouncedObserver:
    def __init__(self, app_element, notifications: list[str]):
        self._last: dict[str, float] = {}
        self.debounce_s = 0.1
        for n in notifications:
            add_ax_observer(app_element, n, self._on_event)

    def _on_event(self, notification: str, element):
        now = time.monotonic()
        if now - self._last.get(notification, 0) < self.debounce_s:
            return
        self._last[notification] = now
        self.handle(notification, element)
```

The debounce matters because `AXValueChanged` fires on every keystroke in a text field — without it your handler will be called hundreds of times per second.

## Security Threats to Know

| CVE / CWE      | Severity | What                                 | Mitigation                                |
| -------------- | -------- | ------------------------------------ | ----------------------------------------- |
| CVE-2023-32364 | CRITICAL | TCC bypass via symlinks              | Update macOS, validate resolved paths     |
| CVE-2023-28206 | HIGH     | AX privilege escalation in IOSurface | Update macOS to current security release  |
| CWE-290        | HIGH     | Bundle ID spoofing                   | Verify code signature, not just bundle ID |
| CWE-74         | HIGH     | Input injection via SecurityAgent    | Block `com.apple.SecurityAgent`           |

OWASP mapping:

- A01 Broken Access Control — TCC validation, app blocklist
- A02 Cryptographic Failures (signature verification) — `codesign -v` before attaching
- A07 Identification & Authentication Failures — never trust bundle ID alone

## Common Mistakes

| Mistake                                                        | Why it hurts                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Running automation without checking `AXIsProcessTrusted` first | Cryptic failures when permission is missing or revoked           |
| Trusting bundle ID without verifying code signature            | Any process can claim `com.apple.Mail`                           |
| Automating password fields or Keychain Access                  | Crosses the platform security boundary; will be flagged by Apple |
| No timeouts on AX operations                                   | A frozen target app freezes your tool too                        |
| Caching elements without TTL                                   | Phantom interactions, mysterious crashes                         |
| Searching the whole AX tree                                    | Multi-second hangs on complex apps                               |

## Pre-Deployment Checklist

- [ ] `AXIsProcessTrustedWithOptions` is checked before any AX call
- [ ] Code signature verified for every target app
- [ ] Blocked bundles list includes Keychain Access, SecurityAgent, password managers
- [ ] All AX operations have a timeout
- [ ] Element cache has a TTL
- [ ] Audit logging captures bundle ID, pid, action, tier
- [ ] Tested against current macOS version (verify your code on the target release)
- [ ] Tested with Accessibility permission revoked — gives a clear error, not a stack trace

## References

- `references/xcode-permissions-guide.md` — **Xcode 26 / Swift 6 / macOS 14–26.** Per-permission table (plist key, entitlement, Xcode UI path, preflight/request/live-state APIs), step-by-step Xcode UI walkthrough for adding Hardened Runtime capabilities, version-specific behavior changes, anti-patterns, authoritative `developer.apple.com` source links. Use this whenever adding or auditing macOS permissions on a non-sandboxed Hardened Runtime app.
- `references/advanced-patterns.md` — async observer patterns, multi-app coordination, sandbox interactions
- `references/security-examples.md` — full CVE mitigations and exploit walkthroughs
- `references/threat-model.md` — STRIDE analysis for an automation tool
