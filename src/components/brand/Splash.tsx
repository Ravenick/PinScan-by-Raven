import { useEffect, useState } from "react";
import { Logo, BRAND } from "./Logo";

// Customize the launch splash here.
export function Splash({ onDone, duration = 1800 }: { onDone: () => void; duration?: number }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), duration - 450);
    const b = setTimeout(onDone, duration);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [duration, onDone]);
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white transition-all duration-500 ${leaving ? "opacity-0 scale-105" : "opacity-100"}`}>
      <div className="absolute inset-0 splash-glow" />
      <div className="relative animate-[splashIn_.8s_cubic-bezier(.2,.9,.3,1.2)_both]"><Logo size={96} /></div>
      <h1 className="relative mt-6 font-display text-3xl font-bold tracking-tight animate-[fadeUp_.6s_.3s_both]">{BRAND.name}</h1>
      <p className="relative mt-1 text-sm text-white/65 animate-[fadeUp_.6s_.5s_both]">{BRAND.credit}</p>
      <div className="relative mt-8 h-1 w-32 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-1/3 rounded-full bg-primary animate-[loadbar_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
