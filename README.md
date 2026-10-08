# GradeTracker

A responsive starter app with one web interface packaged for Windows (Electron) and Android (Capacitor).

## Included

- Responsive desktop and mobile dashboard
- Course cards, grade averages, GPA and credit summaries
- Add-course dialog with local persistence
- Light and dark themes
- Windows NSIS installer configuration (`.exe`)
- Android Capacitor configuration (`.apk`)

## Run locally

```powershell
pnpm install
pnpm dev
```

## Connect Supabase

1. In Supabase, enable **Anonymous Sign-Ins** under Authentication → Providers.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env` and enter your project URL and publishable/anon key.
4. Restart the development server.

The app creates an anonymous authenticated session and Row Level Security ensures each installation can access only its own courses. Never place a `service_role` key in this app.

## Create the Windows installer

```powershell
pnpm desktop:build
```

The installer will be created in `release/GradeTracker-Setup-1.0.0.exe`.

## Create the Android APK

Install Android Studio and its Android SDK first. The first time only:

```powershell
pnpm android:init
```

Then build:

```powershell
pnpm android:build
```

The debug APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

For a production release, configure an Android signing key and build a signed release bundle in Android Studio.
