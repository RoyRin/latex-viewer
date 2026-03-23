"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { toPng, toSvg } from "html-to-image";

type ImageFormat = "png" | "svg";
type FontSize = "16" | "24" | "32" | "48" | "64";

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: "16", label: "Small (16px)" },
  { value: "24", label: "Medium (24px)" },
  { value: "32", label: "Large (32px)" },
  { value: "48", label: "X-Large (48px)" },
  { value: "64", label: "XX-Large (64px)" },
];

export default function Home() {
  const [latex, setLatex] = useState("\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}");
  const [fontSize, setFontSize] = useState<FontSize>("32");
  const [format, setFormat] = useState<ImageFormat>("png");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;
    try {
      katex.render(latex, previewRef.current, {
        throwOnError: true,
        displayMode: true,
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [latex, renderKey]);

  const handleRerender = () => setRenderKey((k) => k + 1);

  const exportImage = useCallback(async () => {
    if (!previewRef.current || error) return null;

    const container = previewRef.current;

    if (format === "svg") {
      return toSvg(container, { backgroundColor: "#ffffff" });
    } else {
      // Use 2x scale for crisp PNG
      return toPng(container, { pixelRatio: 2, backgroundColor: "#ffffff" });
    }
  }, [fontSize, format, error]);

  const handleCopy = async () => {
    const dataUrl = await exportImage();
    if (!dataUrl) return;

    if (format === "png") {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } else {
      // SVG: copy as text
      const svgText = decodeURIComponent(dataUrl.split(",")[1]);
      await navigator.clipboard.writeText(svgText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = async () => {
    const dataUrl = await exportImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `latex.${format}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-center">LaTeX Viewer</h1>

        <textarea
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="Enter LaTeX..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
          autoFocus
        />

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-500">Size:</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as FontSize)}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-foreground"
            >
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-500">Format:</label>
            {(["png", "svg"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-2 py-1 rounded uppercase ${
                  format === f
                    ? "bg-foreground text-background font-medium"
                    : "text-gray-400 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleRerender}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-foreground hover:border-foreground transition-colors"
          >
            Re-render
          </button>
        </div>

        {/* Live preview */}
        <div className="bg-white rounded-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[80px] flex items-center justify-center overflow-x-auto">
          {error ? (
            <p className="text-red-500 text-sm font-mono">{error}</p>
          ) : (
            <div ref={previewRef} className="text-black" style={{ fontSize: `${fontSize}px` }} />
          )}
        </div>

        {!error && latex.trim() && (
          <div className="flex justify-center gap-3">
            <button
              onClick={handleCopy}
              className="px-6 py-2 rounded-lg bg-foreground text-background font-medium hover:opacity-80 transition-opacity"
            >
              {copied ? "Copied!" : `Copy ${format.toUpperCase()}`}
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-2 rounded-lg border border-foreground text-foreground font-medium hover:opacity-80 transition-opacity"
            >
              Download {format.toUpperCase()}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
