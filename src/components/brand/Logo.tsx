// Swap this component to rebrand the app icon everywhere.
export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Recharge Scanner logo">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#lg)" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="15.5" fill="none" stroke="var(--primary-foreground)" strokeOpacity=".35" />
      <path d="M16 24v-6h6M42 18h6v6M48 40v6h-6M22 46h-6v-6" stroke="var(--primary-foreground)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M34 20l-10 14h8l-2 10 10-14h-8z" fill="var(--primary-foreground)" />
    </svg>
  );
}

export const BRAND = { name: "PinScan", credit: "Built by Raven" };
