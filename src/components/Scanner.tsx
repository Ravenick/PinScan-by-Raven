import { useCallback, useEffect, useRef, useState } from "react";
import { Flashlight, FlashlightOff, X, Loader2, ScanLine } from "lucide-react";
import { initializeOcr, recognizeImage } from "@/lib/ocr";
import { extractPin, extractPinFromLines, type Settings } from "@/lib/store";

type State = "starting" | "ready" | "scanning" | "found" | "error";

export function Scanner({
  settings,
  onClose,
  onPin,
}: {
  settings: Settings;
  onClose: () => void;
  onPin: (p: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const busy = useRef(false);
  const [state, setState] = useState<State>("starting");
  const [ocrStatus, setOcrStatus] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("Starting camera…");
  const [torch, setTorch] = useState(false);
  const [torchOk, setTorchOk] = useState(false);

  const initializeOcr = useCallback(async () => {
    setOcrStatus("loading");
    setMsg("Preparing on-device OCR…");
    try {
      await initializeOcr((status, progress) => {
        const percent = Math.round(progress * 100);
        setMsg(`${status} ${percent}%`);
      });
      setOcrStatus("ready");
      setMsg("Align the PIN inside the frame");
    } catch {
      setOcrStatus("error");
      setMsg("OCR unavailable — tap Retry OCR");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (!alive) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play();
        }
        const caps = (s.getVideoTracks()[0]?.getCapabilities?.() ?? {}) as { torch?: boolean };
        setTorchOk(!!caps.torch);
        setState("ready");
        void initializeOcr();
      } catch (e) {
        if (alive) {
          setState("error");
          setMsg(
            e instanceof Error && e.name === "NotAllowedError"
              ? "Camera permission denied"
              : "Camera unavailable",
          );
        }
      }
    })();
    return () => {
      alive = false;
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [initializeOcr]);

  const toggleTorch = async () => {
    const t = stream.current?.getVideoTracks()[0];
    if (!t) return;
    try {
      await t.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(!torch);
    } catch {
      setTorchOk(false);
    }
  };

  const scan = useCallback(async () => {
    const v = video.current;
    if (!v || busy.current || !v.videoWidth || ocrStatus !== "ready") return;
    busy.current = true;
    setState("scanning");
    setMsg("Reading PIN…");
    try {
      const cw = v.videoWidth * 0.85,
        ch = v.videoHeight * 0.28;
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext("2d")!;
      ctx.filter = "grayscale(1) contrast(1.6)";
      ctx.drawImage(v, (v.videoWidth - cw) / 2, (v.videoHeight - ch) / 2, cw, ch, 0, 0, cw, ch);
      const recognized = await recognizeImage(c);
      const pin = recognized.lines?.length
        ? extractPinFromLines(recognized.lines, settings)
        : extractPin(recognized.text, settings);
      if (pin) {
        setState("found");
        setMsg("PIN detected!");
        navigator.vibrate?.(60);
        setTimeout(() => onPin(pin), 500);
      } else {
        setState("ready");
        setMsg("No PIN found — hold steady and try again");
      }
    } catch (error) {
      setState("error");
      const detail = error instanceof Error ? error.message.slice(0, 48) : "Recognition failed";
      setMsg(`OCR failed: ${detail}`);
    }
    busy.current = false;
  }, [settings, onPin, ocrStatus]);

  // Auto-scan loop
  useEffect(() => {
    if (state !== "ready" || ocrStatus !== "ready") return;
    const id = setTimeout(scan, 1400);
    return () => clearTimeout(id);
  }, [state, ocrStatus, scan, msg]);

  const frameColor =
    state === "found"
      ? "border-success"
      : state === "error"
        ? "border-destructive"
        : "border-primary";

  return (
    <div className="fixed inset-0 z-40 bg-scrim">
      <video
        ref={video}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative aspect-[3.2/1] w-[85%] max-w-md rounded-2xl border-2 ${frameColor} shadow-[0_0_0_9999px_var(--scrim)] transition-colors`}
        >
          {(state === "ready" || state === "scanning") && (
            <div className="scanline absolute inset-x-2 h-0.5 rounded bg-primary" />
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="glass-btn h-12 w-12" aria-label="Close scanner">
          <X />
        </button>
        <span className="glass-btn px-4 py-2 text-sm">{msg}</span>
        <button
          onClick={toggleTorch}
          disabled={!torchOk}
          aria-label="Toggle flashlight"
          className={`glass-btn h-14 w-14 ${torch ? "!bg-primary !text-primary-foreground" : ""} disabled:opacity-40`}
        >
          {torch ? <Flashlight /> : <FlashlightOff />}
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {!torchOk && state !== "starting" && (
          <p className="text-xs text-overlay-foreground/70">
            Flashlight not supported on this device/browser
          </p>
        )}
        <button
          onClick={ocrStatus === "error" ? initializeOcr : scan}
          disabled={
            state === "scanning" ||
            state === "starting" ||
            state === "found" ||
            ocrStatus === "loading"
          }
          className="btn-primary flex items-center gap-2 px-8 py-4 text-base disabled:opacity-60"
        >
          {state === "scanning" || state === "starting" || ocrStatus === "loading" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ScanLine />
          )}
          {state === "scanning"
            ? "Reading PIN…"
            : state === "starting"
              ? "Starting camera…"
              : ocrStatus === "loading"
                ? "Preparing OCR…"
                : ocrStatus === "error"
                  ? "Retry OCR"
                  : state === "error"
                    ? "Retry"
                    : "Capture now"}
        </button>
        <button onClick={onClose} className="text-sm text-overlay-foreground/80 underline">
          Enter PIN manually
        </button>
      </div>
    </div>
  );
}
