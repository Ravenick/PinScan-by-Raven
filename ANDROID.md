# PinScan — Android APK build (offline)

Everything (OCR engine + English language data) ships inside `public/tesseract/`, so the APK works with no internet.

## Build

```bash
npm install
npm run build              # outputs static SPA to .output/public
npx cap add android        # first time only
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Shortcut: `npm run android:apk` (after the first `npx cap add android`).

## Signed release APK

Keep the release keystore outside the repository and never commit it. Create it once with `keytool`, back it up securely, and use the same key for every future app update. For a signed build, set these environment variables only in the build shell: `PINSCAN_KEYSTORE`, `PINSCAN_STORE_PASSWORD`, `PINSCAN_KEY_ALIAS`, and `PINSCAN_KEY_PASSWORD`. The release build uses them when all four are set; otherwise it remains unsigned.

On Windows PowerShell, set the keystore path and alias, then enter the passwords as secure prompts before running Gradle:

```powershell
$env:PINSCAN_KEYSTORE = "$HOME\.android\pinscan-release.jks"
$env:PINSCAN_KEY_ALIAS = "pinscan-release"
$store = Read-Host "Keystore password" -AsSecureString
$key = Read-Host "Key password" -AsSecureString
$env:PINSCAN_STORE_PASSWORD = [System.Net.NetworkCredential]::new('', $store).Password
$env:PINSCAN_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', $key).Password
cd android
.\gradlew.bat assembleRelease
```

Remove the two password environment variables from the shell after the build. The signed APK is generated at `android/app/build/outputs/apk/release/app-release.apk`.

## Camera permission
After `cap add android`, ensure `android/app/src/main/AndroidManifest.xml` contains:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-permission android:name="android.permission.CALL_PHONE" />
```

## Customizing
- Splash: `src/components/brand/Splash.tsx`
- Logo / name / credit: `src/components/brand/Logo.tsx`
- Default prefix/suffix/PIN length: `DEFAULTS` in `src/lib/store.ts`

Note: some Android dialers strip `#` from `tel:` links; the code is URL-encoded (`%23`) to keep it. Use Copy as fallback.
