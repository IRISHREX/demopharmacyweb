import { useEffect, useRef } from "react";

export default function LiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    const spacing = 28;
    let cols = 0;
    let rows = 0;

    let cursor = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
    };

    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    };
    const onLeave = () => {
      cursor.x = -9999;
      cursor.y = -9999;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", (ev: TouchEvent) => {
      if (ev.touches && ev.touches[0]) {
        cursor.x = ev.touches[0].clientX;
        cursor.y = ev.touches[0].clientY;
      }
    }, { passive: true });

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);

      // ensure the net remains visible on light and dark backgrounds
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      ctx.fillRect(0, 0, width, height);

      // neon green net lines
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";

      const centerX = cursor.x;
      const centerY = cursor.y;

      for (let row = -1; row <= rows; row++) {
        ctx.beginPath();
        for (let col = -1; col <= cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 260);
          const wave = Math.sin((col + row) * 0.35 + t * 0.02) * 6;
          const offsetY = wave * (0.25 + influence * 2.2);
          const drawX = x;
          const drawY = y + offsetY;

          if (col === -1) ctx.moveTo(drawX, drawY);
          else ctx.lineTo(drawX, drawY);
        }

        // stroke with neon gradient
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, "rgba(120,255,160,0.18)");
        grad.addColorStop(0.5, "rgba(90,255,140,0.32)");
        grad.addColorStop(1, "rgba(120,255,160,0.18)");
        ctx.strokeStyle = grad as unknown as string;
        ctx.globalCompositeOperation = "lighter";
        ctx.stroke();
      }

      // vertical lines
      for (let col = -1; col <= cols; col++) {
        ctx.beginPath();
        for (let row = -1; row <= rows; row++) {
          const x = col * spacing;
          const y = row * spacing;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 260);
          const wave = Math.cos((col + row) * 0.35 + t * 0.02) * 6;
          const offsetX = wave * (0.25 + influence * 2.2);
          const drawX = x + offsetX;
          const drawY = y;

          if (row === -1) ctx.moveTo(drawX, drawY);
          else ctx.lineTo(drawX, drawY);
        }
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "rgba(120,255,160,0.18)");
        grad.addColorStop(0.5, "rgba(90,255,140,0.32)");
        grad.addColorStop(1, "rgba(120,255,160,0.18)");
        ctx.strokeStyle = grad as unknown as string;
        ctx.globalCompositeOperation = "lighter";
        ctx.stroke();
      }

      // neon cursor glow
      if (centerX > -9000) {
        const glowR = 120;
        const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowR);
        g.addColorStop(0, "rgba(255,200,120,0.26)");
        g.addColorStop(0.12, "rgba(90,200,255,0.22)");
        g.addColorStop(0.28, "rgba(30,120,255,0.08)");
        g.addColorStop(1, "rgba(5,10,30,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g as unknown as string;
        ctx.fillRect(centerX - glowR, centerY - glowR, glowR * 2, glowR * 2);
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 live-background-canvas" />;
}
