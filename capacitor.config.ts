import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.raven.pinscan",
  appName: "PinScan",
  // Static SPA output (vite build with SPA mode enabled)
  webDir: ".output/public",
  android: { allowMixedContent: false },
};

export default config;
