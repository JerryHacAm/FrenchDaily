"use client";

import { useEffect, useState } from "react";
import { cx } from "./ui";

// Audio with the browser's own French voice (README 3.2: browser speech first).
// Free and instant; quality depends on the device.

function frenchVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "fr-FR") ?? voices.find((v) => v.lang.startsWith("fr"));
}

export function Speak({ text, label = "Listen", className }: { text: string; label?: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    // Only known in the browser, after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("speechSynthesis" in window);
  }, []);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "fr-FR";
        const voice = frenchVoice();
        if (voice) u.voice = voice;
        u.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }}
      className={cx(
        "inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-accent hover:bg-accent-soft",
        className,
      )}
      aria-label={`${label}: ${text}`}
    >
      <span aria-hidden>🔊</span>
      <span>{label}</span>
    </button>
  );
}
