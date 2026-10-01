"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ConceptGalleryViewer({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, images.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="card"
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          overflow: "hidden",
          width: "100%",
          padding: 0,
          border: "none",
          cursor: "zoom-in",
          display: "block",
        }}
        aria-label={`${alt} — fotoğrafları büyüt`}
      >
        <Image src={images[0]} alt={alt} fill style={{ objectFit: "cover" }} priority />
        {hasMultiple && (
          <span
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              background: "rgba(60,44,26,0.72)",
              color: "#fff",
              fontSize: 13,
              padding: "5px 12px",
              borderRadius: 999,
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            1 / {images.length} fotoğraf — büyütmek için tıklayın
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(20,14,8,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 900, aspectRatio: "4 / 3" }}
          >
            <Image src={images[index]} alt={`${alt} - ${index + 1}`} fill style={{ objectFit: "contain" }} />

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                  aria-label="Önceki fotoğraf"
                  style={navButtonStyle("left")}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % images.length)}
                  aria-label="Sonraki fotoğraf"
                  style={navButtonStyle("right")}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}
            >
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  style={{
                    position: "relative",
                    width: 56,
                    height: 42,
                    borderRadius: 6,
                    overflow: "hidden",
                    border: i === index ? "2px solid var(--gold-light)" : "2px solid transparent",
                    opacity: i === index ? 1 : 0.6,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="56px" />
                </button>
              ))}
            </div>
          )}

          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 14 }}>
            {index + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}

function navButtonStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: -8,
    transform: "translate(0, -50%)",
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
  };
}
