"use client";

import { useEffect, useState } from "react";
import { cx } from "./ui";

// Audio with the browser's own French voice (README 3.2: browser speech first).
// Free and instant; quality depends on the device.

// Chrome loads its voice list a moment after the page opens: asking too early
// gives an empty list, and then an English voice reads the French. So the list
// is loaded on mount and kept up to date.
let voices: SpeechSynthesisVoice[] = [];

export function loadVoices() {
  if (!("speechSynthesis" in window) || voices.length) return;
  const refresh = () => {
    voices = window.speechSynthesis.getVoices();
  };
  refresh();
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
}

function frenchVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) voices = window.speechSynthesis.getVoices();
  const french = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("fr"));
  // Best first: France French, then the better-sounding online/natural voices.
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.replace("_", "-").toLowerCase() === "fr-fr" ? 2 : 0) + (/google|natural|online|premium|enhanced/i.test(v.name) ? 1 : 0);
  return french.sort((a, b) => score(b) - score(a))[0];
}

export const NO_FRENCH_VOICE =
  "This device has no French voice. On Windows: Settings → Time & language → Speech → Add voices → French. Or use Chrome or Edge.";

/** Reads French aloud. Returns false when the device has no French voice (an English one would only mangle it). */
export function speakFrench(text: string): boolean {
  if (!("speechSynthesis" in window)) return false;
  const voice = frenchVoice();
  if (!voice) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice.lang;
  u.voice = voice;
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

export function Speak({ text, label = "Listen", className }: { text: string; label?: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  useEffect(() => {
    // Only known in the browser, after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("speechSynthesis" in window);
    loadVoices();
  }, []);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => setNoVoice(!speakFrench(text))}
      title={noVoice ? NO_FRENCH_VOICE : undefined}
      className={cx(
        "inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-accent hover:bg-accent-soft",
        className,
      )}
      aria-label={`${label}: ${text}`}
    >
      <span aria-hidden>🔊</span>
      <span>{label}</span>
      {noVoice && <span className="text-xs text-warn">no French voice</span>}
    </button>
  );
}
