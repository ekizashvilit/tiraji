// Client-side explicit-image check (NSFWJS + TensorFlow.js).
//
// tfjs and the model weights are imported lazily inside getModel() so they only
// download the first time a seller actually adds a photo — they never touch the
// server bundle or the initial page load. The model (MobileNetV2) ships inside
// the nsfwjs package, so there's no external CDN call and no cost.
import type { NSFWJS } from "nsfwjs";

let modelPromise: Promise<NSFWJS> | null = null;

async function getModel(): Promise<NSFWJS> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await import("@tensorflow/tfjs");
      const nsfwjs = await import("nsfwjs");
      return nsfwjs.load(); // bundled MobileNetV2 — no network fetch
    })();
  }
  return modelPromise;
}

export type NsfwVerdict = { safe: boolean; label: string; score: number };

// Reject clearly explicit imagery: strong Porn/Hentai, or a very high "Sexy".
// Thresholds are deliberately conservative so ordinary book photos (including
// art covers with some skin) pass; the report button + admin queue catch the rest.
export async function checkImageIsSafe(file: File): Promise<NsfwVerdict> {
  const model = await getModel();
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const predictions = await model.classify(img);

    const score: Record<string, number> = {};
    for (const p of predictions) score[p.className] = p.probability;
    const porn = score.Porn ?? 0;
    const hentai = score.Hentai ?? 0;
    const sexy = score.Sexy ?? 0;

    const explicit = Math.max(porn, hentai);
    if (explicit >= 0.6 || sexy >= 0.85) {
      const label =
        explicit >= sexy ? (porn >= hentai ? "Porn" : "Hentai") : "Sexy";
      return { safe: false, label, score: Math.max(explicit, sexy) };
    }
    return { safe: true, label: "Neutral", score: explicit };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
