// Lightweight haptic feedback. Safari on iOS does not implement the
// Vibration API, so this is a no-op on iPhone — but it's still useful on
// Android PWA installs and harmless to call. We keep the surface tiny so we
// can swap in a real Web Haptics API or Capacitor plugin later without
// touching call sites.

type Intensity = "light" | "medium" | "heavy" | "select";

const PATTERNS: Record<Intensity, number | number[]> = {
  select: 8,
  light: 12,
  medium: 20,
  heavy: 35,
};

export function haptic(intensity: Intensity = "light") {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & {
    vibrate?: (pattern: number | number[]) => boolean;
  };
  try {
    nav.vibrate?.(PATTERNS[intensity]);
  } catch {
    /* ignore */
  }
}
