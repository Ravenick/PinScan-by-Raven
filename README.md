# PinScan v1

**An offline recharge-card PIN scanner for Android.** Point your camera at a recharge card, review the detected PIN, and generate the recharge code ready to copy or dial.

**Built by Raven.**

## Download

**APK release:** [Download PinScan v1.0.0](https://github.com/Ravenick/PinScan-by-Raven/releases/download/v1.0.0/PinScan-v1.0.0.apk)

## Features

- Scan recharge cards with the camera using on-device Google ML Kit text recognition.
- Prioritize the large, prominent PIN over smaller printed numbers on the card.
- Use the flashlight while scanning when the device supports it.
- Review and edit the detected PIN before confirming it.
- Generate the USSD code, copy it, or open the phone dialer with the code prefilled.
- Customize the USSD prefix and suffix, PIN length limits, and digit grouping.
- View recent recharge codes in local history.
- Choose dark or light appearance and a blue, silver, or black accent.
- Keep scanning private and available offline: recognition and app data are stored and processed on-device. No account or app backend is needed.

## Recharge format

The default code format is `*311*PIN#`. Update the prefix and suffix in **Settings** to match your carrier. You can edit and confirm each PIN before using its code.

## Build the Android APK

### Requirements

- Node.js and npm
- Android SDK and Android SDK Platform 36
- Java 21 (Android Studio's bundled JBR works)

### Build commands

```sh
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

On Windows, run the Gradle wrapper from the `android` directory using `gradlew.bat`. Set `JAVA_HOME` to a Java 21 installation before building.

The debug APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For more Android setup notes, see [ANDROID.md](ANDROID.md).
