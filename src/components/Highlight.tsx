import { Fragment } from "react";
import { cx } from "./ui";

/** Shows text with some parts marked (mistakes in red, fixes in green). */
export function Highlight({ text, parts, tone }: { text: string; parts: string[]; tone: "bad" | "good" }) {
  const wanted = parts.map((p) => p.trim()).filter(Boolean);
  if (wanted.length === 0) return <>{text}</>;
  const escaped = wanted
    .sort((a, b) => b.length - a.length)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pieces = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  const lower = new Set(wanted.map((p) => p.toLowerCase()));
  return (
    <>
      {pieces.map((piece, i) =>
        lower.has(piece.toLowerCase()) ? (
          <mark
            key={i}
            className={cx(
              "rounded px-0.5",
              tone === "bad" ? "bg-bad-soft text-bad line-through decoration-1" : "bg-good-soft font-medium text-good",
            )}
          >
            {piece}
          </mark>
        ) : (
          <Fragment key={i}>{piece}</Fragment>
        ),
      )}
    </>
  );
}
