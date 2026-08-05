import { useRef, useState } from "react";
import { drawQuakeShareCard } from "../lib/shareCard";

export function ShareImageButton({ quake }) {
  const canvasRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const canvas = canvasRef.current;
      await drawQuakeShareCard(canvas, { quake });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("No se pudo generar la imagen");

      const file = new File([blob], `terrementor-sismo-${quake.id}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Último sismo en Guatemala",
          text: `Magnitud ${quake.magnitude} · ${quake.datetime}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `terrementor-sismo-${quake.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("No se pudo compartir la imagen", err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={handleClick} disabled={busy}>
        {busy ? "Generando…" : "Imagen"}
      </button>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}
