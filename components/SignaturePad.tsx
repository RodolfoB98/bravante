"use client";

import { useRef, useEffect, useState } from "react";

export default function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [vazio, setVazio] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#10233f";
  }, []);

  function ponto(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = ponto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = ponto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function terminar() {
    if (!drawing.current) return;
    drawing.current = false;
    setVazio(false);
    onChange(canvasRef.current!.toDataURL("image/png"));
  }
  function limpar() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setVazio(true);
    onChange(null);
  }

  return (
    <div className="sigwrap">
      <canvas
        ref={canvasRef}
        className="sigpad"
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerLeave={terminar}
      />
      <div className="sigbar">
        <span className="muted">
          {vazio ? "Assine no quadro acima com o dedo" : "Assinatura capturada ✓"}
        </span>
        <button type="button" className="btn ghost" onClick={limpar}>
          Limpar
        </button>
      </div>
    </div>
  );
}
