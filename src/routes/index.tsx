import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Camera, Copy, Phone, Settings as Cog, History, Moon, Sun, Check, Trash2, RotateCcw } from "lucide-react";
import { Splash } from "@/components/brand/Splash";
import { Logo, BRAND } from "@/components/brand/Logo";
import { DEFAULTS, buildCode, groupPin, useHistory, useSettings, type Accent } from "@/lib/store";

const Scanner = lazy(() => import("@/components/Scanner").then((m) => ({ default: m.Scanner })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PinScan — Offline Recharge Card Scanner" },
      { name: "description", content: "Scan recharge card PINs offline with your camera and dial the USSD code in one tap." },
      { property: "og:title", content: "PinScan — Offline Recharge Card Scanner" },
      { property: "og:description", content: "On-device OCR for recharge PINs. No internet, no account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Tab = "home" | "history" | "settings";

function App() {
  const [splash, setSplash] = useState(true);
  const [s, setS] = useSettings();
  const [hist, setHist] = useHistory();
  const [tab, setTab] = useState<Tab>("home");
  const [scanning, setScanning] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const r = document.documentElement;
    r.classList.toggle("dark", s.theme === "dark");
    r.setAttribute("data-accent", s.accent);
  }, [s.theme, s.accent]);

  const endSplash = useCallback(() => setSplash(false), []);
  const digits = pin.replace(/\D/g, "");
  const valid = digits.length >= s.minLen && digits.length <= s.maxLen;
  const code = buildCode(s, digits);

  const record = () => setHist((h) => [{ pin: digits, code, at: Date.now() }, ...h.filter((x) => x.pin !== digits)].slice(0, 50));
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch {}
    setCopied(true); record(); setTimeout(() => setCopied(false), 1500);
  };
  const dial = () => { record(); window.location.href = `tel:${encodeURIComponent(code)}`; };

  return (
    <div className="min-h-screen bg-background text-foreground app-bg">
      {splash && <Splash onDone={endSplash} />}
      {scanning && (
        <Suspense fallback={null}>
          <Scanner settings={s} onClose={() => setScanning(false)} onPin={(p) => { setPin(p); setConfirmed(false); setScanning(false); setTab("home"); }} />
        </Suspense>
      )}

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3"><Logo size={40} /><div><p className="font-display text-lg font-bold leading-none">{BRAND.name}</p><p className="text-xs text-muted-foreground">{BRAND.credit}</p></div></div>
          <button className="glass-btn h-11 w-11" aria-label="Toggle theme" onClick={() => setS({ ...s, theme: s.theme === "dark" ? "light" : "dark" })}>
            {s.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {tab === "home" && (
          <main className="mt-4 flex flex-col gap-5 animate-[fadeUp_.4s_both]">
            <button onClick={() => setScanning(true)} className="glass-card group flex flex-col items-center gap-3 p-8 text-center transition active:scale-[.98]">
              <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-glow transition group-hover:scale-105"><Camera size={36} /></span>
              <span className="font-display text-xl font-semibold">Scan recharge card</span>
              <span className="text-sm text-muted-foreground">Works fully offline · on-device OCR</span>
            </button>

            <section className="glass-card p-5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recharge PIN</label>
              <input inputMode="numeric" value={groupPin(digits, s.groupBy)} onChange={(e) => { setPin(e.target.value); setConfirmed(false); }}
                placeholder="Scan or type the PIN"
                className="mt-2 w-full rounded-xl border bg-input/40 px-4 py-3 font-mono text-xl tracking-wider outline-none focus:ring-2 focus:ring-ring" />
              <p className={`mt-2 text-xs ${digits && !valid ? "text-destructive" : "text-muted-foreground"}`}>
                {digits.length} digits · expected {s.minLen}–{s.maxLen}
              </p>
              {!confirmed ? (
                <button disabled={!valid} onClick={() => setConfirmed(true)} className="btn-primary mt-4 w-full py-3 disabled:opacity-40">
                  <Check size={18} /> Confirm PIN
                </button>
              ) : (
                <div className="mt-4 animate-[fadeUp_.3s_both]">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">USSD code</p>
                  <p className="mt-1 break-all rounded-xl border bg-muted/50 p-3 font-mono text-lg">{code}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button onClick={copy} className="glass-btn py-3">{copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy"}</button>
                    <button onClick={dial} className="btn-primary py-3"><Phone size={18} /> Recharge</button>
                  </div>
                </div>
              )}
            </section>
          </main>
        )}

        {tab === "history" && (
          <main className="mt-4 flex flex-col gap-3 animate-[fadeUp_.4s_both]">
            <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">History</h2>
              {hist.length > 0 && <button onClick={() => setHist([])} className="text-sm text-destructive flex items-center gap-1"><Trash2 size={14} />Clear</button>}</div>
            {hist.length === 0 && <p className="glass-card p-6 text-center text-sm text-muted-foreground">No recharges yet.</p>}
            {hist.map((h) => (
              <button key={h.at} onClick={() => { setPin(h.pin); setConfirmed(true); setTab("home"); }} className="glass-card flex items-center justify-between p-4 text-left">
                <div><p className="font-mono">{h.code}</p><p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString()}</p></div>
                <Phone size={16} className="text-primary" />
              </button>
            ))}
          </main>
        )}

        {tab === "settings" && (
          <main className="mt-4 flex flex-col gap-4 animate-[fadeUp_.4s_both]">
            <h2 className="font-display text-xl font-semibold">Settings</h2>
            <div className="glass-card grid grid-cols-2 gap-3 p-5">
              <Field label="Prefix" value={s.prefix} onChange={(v) => setS({ ...s, prefix: v })} />
              <Field label="Suffix" value={s.suffix} onChange={(v) => setS({ ...s, suffix: v })} />
              <Field label="Min PIN length" type="number" value={String(s.minLen)} onChange={(v) => setS({ ...s, minLen: +v || 1 })} />
              <Field label="Max PIN length" type="number" value={String(s.maxLen)} onChange={(v) => setS({ ...s, maxLen: +v || 1 })} />
              <Field label="Group digits by (0 = off)" type="number" value={String(s.groupBy)} onChange={(v) => setS({ ...s, groupBy: +v || 0 })} />
              <div className="col-span-2 rounded-xl bg-muted/50 p-3 font-mono text-sm">Preview: {buildCode(s, "1234567890123456".slice(0, s.maxLen))}</div>
            </div>
            <div className="glass-card p-5">
              <p className="mb-3 text-sm font-medium">Accent</p>
              <div className="flex gap-3">
                {(["blue", "silver", "black"] as Accent[]).map((a) => (
                  <button key={a} data-accent={a} onClick={() => setS({ ...s, accent: a })}
                    className={`swatch h-12 flex-1 rounded-xl border-2 capitalize text-sm ${s.accent === a ? "border-ring" : "border-transparent"}`}>{a}</button>
                ))}
              </div>
              <p className="mb-3 mt-5 text-sm font-medium">Theme</p>
              <div className="grid grid-cols-2 gap-3">
                {(["dark", "light"] as const).map((t) => (
                  <button key={t} onClick={() => setS({ ...s, theme: t })} className={`glass-btn py-3 capitalize ${s.theme === t ? "ring-2 ring-ring" : ""}`}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setS({ ...DEFAULTS, theme: s.theme })} className="glass-btn py-3"><RotateCcw size={16} /> Reset to *311*PIN#</button>
          </main>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="glass-card flex justify-around p-2">
          {([["home", Camera, "Scan"], ["history", History, "History"], ["settings", Cog, "Settings"]] as const).map(([k, I, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs transition ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <I size={20} />{l}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border bg-input/40 px-3 py-2 font-mono text-base text-foreground outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
