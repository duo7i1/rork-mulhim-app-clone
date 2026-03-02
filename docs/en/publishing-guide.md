# Mulhim App - Publishing Guide for iOS & Android

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [App Configuration](#2-app-configuration)
3. [Building for iOS (App Store)](#3-building-for-ios-app-store)
4. [Building for Android (Google Play)](#4-building-for-android-google-play)
5. [App Store Submission (iOS)](#5-app-store-submission-ios)
6. [Google Play Submission (Android)](#6-google-play-submission-android)
7. [Post-Submission Checklist](#7-post-submission-checklist)
8. [Common Issues & Troubleshooting](#8-common-issues--troubleshooting)

---

## 1. Prerequisites

### 1.1 Accounts Required

| Account | Purpose | URL |
|---------|---------|-----|
| Apple Developer Account | iOS App Store publishing | https://developer.apple.com |
| Google Play Console | Android publishing | https://play.google.com/console |
| Expo Account | Build service (EAS) | https://expo.dev |

### 1.2 Costs

| Item | Cost |
|------|------|
| Apple Developer Program | $99/year |
| Google Play Console | $25 one-time |
| Expo (EAS Build) | Free tier available (30 builds/month) |

### 1.3 Tools Required

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify login
eas whoami
```

---

## 2. App Configuration

### 2.1 Current `app.json` Configuration

The app is already configured with the following identifiers:

```json
{
  "expo": {
    "name": "Mulhim",
    "slug": "mulhim-app-clone",
    "version": "1.0.0",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "app.rork.mulhim-app-clone"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "app.rork.mulhim_app_clone"
    }
  }
}
```

### 2.2 Before Publishing Checklist

Before building, ensure the following are updated:

- [ ] **App name**: Update `"name"` in `app.json` to your final app name
- [ ] **Version**: Update `"version"` to appropriate release version (e.g., `"1.0.0"`)
- [ ] **Bundle Identifier** (iOS): Ensure `bundleIdentifier` is unique and matches your Apple Developer account
- [ ] **Package Name** (Android): Ensure `package` is unique and matches your Google Play Console listing
- [ ] **Icons**: Ensure `icon.png` (1024x1024), `adaptive-icon.png`, and `favicon.png` are production-ready
- [ ] **Splash Screen**: Ensure `splash-icon.png` is production-ready
- [ ] **Privacy Policy URL**: Required by both stores

### 2.3 Create `eas.json`

Create an `eas.json` file in the project root:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## 3. Building for iOS (App Store)

### 3.1 Initialize EAS for Your Project

```bash
eas init
```

### 3.2 Configure iOS Credentials

EAS can manage your iOS credentials automatically:

```bash
eas credentials
```

This will guide you through:
- Creating/selecting a Distribution Certificate
- Creating/selecting a Provisioning Profile
- Setting up push notification keys (if needed)

### 3.3 Build for iOS

```bash
# Production build for App Store
eas build --platform ios --profile production
```

This will:
1. Upload your code to Expo's build servers
2. Build an `.ipa` file
3. Sign it with your certificates
4. Provide a download link when complete

The build typically takes 15-30 minutes.

### 3.4 Download the Build

Once complete, download the `.ipa` from:
- The terminal link provided after build
- Or from https://expo.dev → Your project → Builds

---

## 4. Building for Android (Google Play)

### 4.1 Build for Android

```bash
# Production build for Google Play (.aab format)
eas build --platform android --profile production
```

This generates an `.aab` (Android App Bundle) file, which is the required format for Google Play.

### 4.2 Download the Build

Download the `.aab` file from the link provided after the build completes.

---

## 5. App Store Submission (iOS)

### 5.1 Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Mulhim (ملهم)
   - **Primary Language**: Arabic
   - **Bundle ID**: Select `app.rork.mulhim-app-clone`
   - **SKU**: `mulhim-app-v1`

### 5.2 App Information

Fill in the following in App Store Connect:

#### General Information
- **Category**: Health & Fitness
- **Secondary Category**: Lifestyle (optional)
- **Content Rights**: Does not contain third-party content
- **Age Rating**: Complete the questionnaire (likely rated 4+)

#### App Privacy
- **Privacy Policy URL**: Required - provide your privacy policy URL
- **Data Collection**: Declare what data you collect:
  - Email address (for authentication)
  - Health & Fitness data (weight, exercise logs)
  - Usage data (app interactions)

### 5.3 Prepare Screenshots

You need screenshots for the following device sizes:

| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | Yes |
| iPhone 6.5" (11 Pro Max) | 1284 x 2778 | Yes |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | Optional |
| iPad Pro 12.9" | 2048 x 2732 | Only if supporting iPad |

**Recommended Screenshots** (minimum 3, maximum 10):
1. Workout Plan screen
2. Nutrition/Meal Plan screen
3. AI Coach screen
4. Profile/Progress screen
5. Onboarding screen

### 5.4 App Description

#### Short Description (Subtitle)
```
Your AI-Powered Saudi Fitness Coach
```

#### Full Description (Example)
```
Mulhim is your personal AI-powered fitness coach designed specifically 
for the Saudi lifestyle. Get personalized workout plans, nutrition 
guidance based on traditional Saudi meals, and AI coaching - all in 
Arabic and English.

Features:
- Personalized workout plans based on your goals and fitness level
- Nutrition planning with traditional Saudi meals
- AI coach for workout and meal suggestions
- Progress tracking (weight, workouts, streaks)
- Works at the gym, home, or with minimal equipment
- Full Arabic and English support

Start your fitness journey today with Mulhim!
```

### 5.5 Submit via EAS

```bash
# Automatic submission to App Store Connect
eas submit --platform ios --latest
```

Or manually:
1. Download the `.ipa` file
2. Open **Transporter** app on macOS
3. Drag the `.ipa` into Transporter
4. Click **Deliver**

### 5.6 TestFlight (Recommended First)

Before public release, test via TestFlight:
1. In App Store Connect → TestFlight
2. The build appears automatically after upload
3. Add internal testers (up to 25)
4. Or create external test group (up to 10,000)
5. Test thoroughly on real devices

### 5.7 Submit for Review

1. In App Store Connect → App Store tab
2. Select the build from TestFlight
3. Fill in all required fields
4. Click **Submit for Review**
5. Review typically takes 24-48 hours

---

## 6. Google Play Submission (Android)

### 6.1 Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - **App name**: Mulhim (ملهم)
   - **Default language**: Arabic
   - **App type**: App
   - **Free or paid**: Free

### 6.2 Store Listing

#### App Details
- **Short description** (80 chars max): Your AI-Powered Saudi Fitness Coach
- **Full description** (4000 chars max): Same as iOS description above
- **Category**: Health & Fitness

#### Graphics
| Asset | Size | Required |
|-------|------|----------|
| App icon | 512 x 512 | Yes |
| Feature graphic | 1024 x 500 | Yes |
| Phone screenshots | Min 2, max 8 | Yes |
| 7-inch tablet screenshots | Min 0 | Recommended |
| 10-inch tablet screenshots | Min 0 | Recommended |

### 6.3 Content Rating

1. Go to **Policy** → **App content** → **Content rating**
2. Complete the IARC questionnaire
3. Likely result: Rated for Everyone

### 6.4 Data Safety

Declare your data practices:
- **Data collected**: Email, fitness data, usage data
- **Data shared**: None (all data is user-only)
- **Security practices**: Data encrypted in transit, user can request deletion

### 6.5 Upload the Build

#### Via EAS Submit
```bash
eas submit --platform android --latest
```

#### Manual Upload
1. Go to **Production** → **Create new release**
2. Upload the `.aab` file
3. Add release notes
4. Click **Review release**

### 6.6 Internal Testing (Recommended First)

1. Go to **Testing** → **Internal testing**
2. Create a new release
3. Upload the `.aab`
4. Add testers by email
5. Share the opt-in link

### 6.7 Submit for Review

1. Go to **Production** → **Create new release**
2. Select the build
3. Add release notes
4. Click **Start rollout to Production**
5. Review typically takes a few hours to 3 days

---

## 7. Post-Submission Checklist

### 7.1 After Approval

- [ ] Verify the app appears in the store
- [ ] Download and test on a real device
- [ ] Verify Supabase connection works from store build
- [ ] Verify AI Coach features work
- [ ] Test authentication flow (signup, login, logout)
- [ ] Test onboarding flow
- [ ] Verify workout plan generation
- [ ] Verify nutrition plan generation
- [ ] Test language switching

### 7.2 Monitoring

- Monitor crash reports in App Store Connect / Google Play Console
- Check Supabase dashboard for database health
- Monitor user feedback and reviews

### 7.3 Updates

For future updates:
```bash
# Increment version in app.json
# Build new version
eas build --platform all --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## 8. Common Issues & Troubleshooting

### 8.1 iOS Build Failures

| Issue | Solution |
|-------|----------|
| Certificate expired | Run `eas credentials` to regenerate |
| Bundle ID conflict | Ensure bundle ID is unique in Apple Developer portal |
| Missing privacy manifest | Add required privacy manifest entries in app config |

### 8.2 Android Build Failures

| Issue | Solution |
|-------|----------|
| Keystore issues | EAS manages keystores automatically; use `eas credentials` |
| Version code conflict | Set `autoIncrement: true` in `eas.json` |
| AAB too large | Check for unnecessary assets in the bundle |

### 8.3 App Review Rejections

| Common Reason | Solution |
|---------------|----------|
| Missing privacy policy | Add a privacy policy URL in app settings |
| Incomplete metadata | Fill in all required fields in store listing |
| Crashes on launch | Test thoroughly on TestFlight/Internal testing first |
| Login required without guest mode | Mulhim already supports guest mode |
| Guideline 4.2 (Minimum Functionality) | Ensure all features are functional and well-documented |

### 8.4 Environment Variables

Ensure your production build has access to the required environment variables:
- `EXPO_PUBLIC_RORK_DB_ENDPOINT`
- `EXPO_PUBLIC_RORK_DB_NAMESPACE`
- `EXPO_PUBLIC_RORK_DB_TOKEN`

These should be configured in your EAS build secrets:
```bash
eas secret:create --name EXPO_PUBLIC_RORK_DB_ENDPOINT --value "your-value"
eas secret:create --name EXPO_PUBLIC_RORK_DB_NAMESPACE --value "your-value"
eas secret:create --name EXPO_PUBLIC_RORK_DB_TOKEN --value "your-value"
```

---

## Summary

The publishing process follows these main steps:

```
1. Configure app.json & eas.json
2. Build with EAS (eas build)
3. Test via TestFlight (iOS) / Internal Testing (Android)
4. Create store listings with screenshots, descriptions
5. Submit for review
6. Monitor and iterate
```

Both stores typically review within 24-48 hours for iOS and a few hours to 3 days for Android. Plan accordingly for your launch timeline.
