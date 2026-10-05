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
