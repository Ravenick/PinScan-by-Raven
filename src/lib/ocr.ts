// Browser-only, lazy-loaded on-device OCR. All assets are served from /tesseract (offline).
import { TextRecognition, Script } from "@capacitor-mlkit/text-recognition";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import type { RecognizedLine } from "@/lib/store";

type W = { recognize: (img: HTMLCanvasElement) => Promise<{ data: { text: string } }> };
let workerP: Promise<W> | null = null;

export function getWorker(onProgress?: (status: string, progress: number) => void) {
  if (!workerP) {
    let rejectInitialization: (error: Error) => void = () => {};
    let initialized = false;
    const initializationFailed = new Promise<W>((_, reject) => {
      rejectInitialization = (error) => reject(error);
    });
    const initialization = import("tesseract.js").then(async ({ createWorker }) => {
      const base = `${location.origin}${import.meta.env.BASE_URL ?? "/"}tesseract`.replace(
        /([^:])\/\//g,
        "$1/",
      );
      const w = await createWorker("eng", 1, {
        workerPath: `${base}/worker.min.js`,
        corePath: base,
        langPath: base,
        gzip: true,
        cacheMethod: "none",
        workerBlobURL: false,
        logger: ({ status, progress }) => onProgress?.(status, progress),
        errorHandler: (error) => {
          console.error("Tesseract worker failed:", error);
          if (!initialized) {
            rejectInitialization(new Error(String(error)));
          }
        },
      });
      await w.setParameters({ tessedit_char_whitelist: "0123456789 -OoIlSB" });
      initialized = true;
      return w as unknown as W;
    });
    workerP = Promise.race([initialization, initializationFailed]).catch((error: unknown) => {
      workerP = null;
      throw error;
    });
  }
  return workerP;
}

export async function initializeOcr(onProgress?: (status: string, progress: number) => void) {
  if (!Capacitor.isNativePlatform()) await getWorker(onProgress);
}

export type RecognitionResult = { text: string; lines?: RecognizedLine[] };

export async function recognizeImage(image: HTMLCanvasElement): Promise<RecognitionResult> {
  if (Capacitor.isNativePlatform()) {
    const path = `scanner-frame-${Date.now()}.jpg`;
    const data = image.toDataURL("image/jpeg", 0.92).split(",")[1];
    const file = await Filesystem.writeFile({ path, data, directory: Directory.Cache });
    try {
      const result = await TextRecognition.processImage({ path: file.uri, script: Script.Latin });
      return {
        text: result.text,
        lines: result.blocks.flatMap((block) =>
          block.lines.map((line) => ({
            text: line.text,
            height: line.boundingBox ? line.boundingBox.bottom - line.boundingBox.top : 0,
          })),
        ),
      };
    } finally {
      await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {});
    }
  }

  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  return { text: data.text };
}
