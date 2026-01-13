# EAS Build Guide - Internal Distribution

This guide covers how to build and distribute Bob University to testers using Expo Application Services (EAS).

## Prerequisites

- Node.js installed
- Expo account ([expo.dev](https://expo.dev))
- Apple Developer account (for iOS) - $99/year
- Access to Apple Developer team (or be the account owner)

## Initial Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure Project (First Time Only)

```bash
eas build:configure
```

This links your project to your Expo account.

---

## iOS Setup

### Register Test Devices

iOS requires all test devices to be registered with Apple before they can install internal builds.

```bash
eas device:create
```

This generates a URL. Send it to your testers:
1. Tester opens URL on their iPhone
2. Tester installs the provisioning profile
3. Device UDID is automatically registered

**Note**: You need to do this BEFORE building, or rebuild after adding new devices.

### Apple Credentials

On first iOS build, EAS will prompt for Apple credentials:

| Credential | Where to Find |
|------------|---------------|
| Apple ID | Your developer account email |
| Team ID | [developer.apple.com](https://developer.apple.com) → Account → Membership |
| App-specific password | [appleid.apple.com](https://appleid.apple.com) → Security → App-Specific Passwords |

EAS can manage certificates and provisioning profiles automatically (recommended).

---

## Building

### Build for Internal Distribution

```bash
# Both platforms
eas build --profile preview --platform all

# iOS only
eas build --profile preview --platform ios

# Android only
eas build --profile preview --platform android
```

### Build Profiles

| Profile | Purpose | Output |
|---------|---------|--------|
| `development` | Dev builds with debugging tools | APK / Ad-hoc IPA |
| `preview` | Test builds for testers | APK / Ad-hoc IPA |
| `production` | App Store / Play Store release | AAB / IPA |

### Monitor Build Progress

```bash
# Check build status
eas build:list

# View build logs
eas build:view
```

Or visit [expo.dev](https://expo.dev) → Your Project → Builds

---

## Distributing to Testers

### After Build Completes

1. Go to [expo.dev](https://expo.dev) → Your Project → Builds
2. Click on the completed build
3. Share the install link with testers

### iOS Installation
- Tester must have registered their device first
- Open link on iPhone → Install

### Android Installation
- Open link on Android device → Download APK → Install
- May need to enable "Install from unknown sources" in settings

---

## Adding New iOS Testers

When a new tester needs access:

```bash
# Register their device
eas device:create
```

Send them the link, then rebuild:

```bash
eas build --profile preview --platform ios
```

The new build will include the newly registered device.

---

## Updating the App

To send testers a new version:

```bash
# Full rebuild (required for native changes)
eas build --profile preview --platform all

# OR use EAS Update for JS-only changes (faster)
eas update --branch preview --message "Description of changes"
```

### When to Use Each

| Change Type | Method |
|-------------|--------|
| JavaScript/TypeScript code | `eas update` (fast, ~1 min) |
| New npm packages with native code | `eas build` (slow, ~15 min) |
| Changed app.json config | `eas build` |
| New native modules/plugins | `eas build` |

---

## Environment Variables

For sensitive values (API keys), use EAS Secrets:

```bash
# Set a secret
eas secret:create --name MY_SECRET --value "secret-value" --scope project

# List secrets
eas secret:list
```

Access in code via `process.env.MY_SECRET` (requires configuration).

---

## Troubleshooting

### "Device not registered"
Run `eas device:create` and have the tester register, then rebuild.

### "Provisioning profile doesn't include device"
New device was added after the build. Rebuild with `eas build --profile preview --platform ios`.

### "Apple credentials invalid"
Generate a new app-specific password at [appleid.apple.com](https://appleid.apple.com).

### Build fails with dependency error
```bash
# Clear cache and rebuild
eas build --profile preview --platform all --clear-cache
```

### iOS build stuck on "waiting for Apple"
Apple's servers can be slow. Wait 5-10 minutes, or check [Apple System Status](https://developer.apple.com/system-status/).

---

## Useful Commands Reference

```bash
# Login/logout
eas login
eas logout
eas whoami

# Device management
eas device:create          # Register new device
eas device:list            # List registered devices

# Building
eas build --profile preview --platform ios
eas build --profile preview --platform android
eas build --profile preview --platform all
eas build:list             # List recent builds
eas build:cancel           # Cancel running build

# Credentials
eas credentials            # Manage iOS/Android credentials

# Updates (OTA)
eas update --branch preview --message "Bug fixes"
eas update:list            # List published updates

# Secrets
eas secret:create --name KEY --value "value" --scope project
eas secret:list
```

---

## Quick Start Checklist

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Configure project: `eas build:configure`
- [ ] Register iOS devices: `eas device:create`
- [ ] Build: `eas build --profile preview --platform all`
- [ ] Share build URL with testers
