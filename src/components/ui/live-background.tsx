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

    // Detect page luminance and pick palette
    // - light bg  -> greenish grid
    // - dark bg   -> yellowish grid
    let palette = { a: "rgba(60,200,110,0.22)", b: "rgba(40,180,90,0.42)", cursor: "rgba(90,220,140,0.28)" };
    const detectPalette = () => {
      const bg = getComputedStyle(document.body).backgroundColor || "rgb(255,255,255)";
      const m = bg.match(/\d+(\.\d+)?/g);
      if (!m) return;
      const [r, g, b] = m.map(Number);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (lum < 0.5) {
        // dark -> yellow/amber neon
        palette = {
          a: "rgba(255,230,100,0.18)",
          b: "rgba(255,210,60,0.38)",
          cursor: "rgba(255,220,120,0.32)",
        };
      } else {
        // light -> green neon
        palette = {
          a: "rgba(60,200,110,0.20)",
          b: "rgba(40,180,90,0.40)",
          cursor: "rgba(90,220,140,0.30)",
        };
      }
    };
    detectPalette();
    const paletteInterval = window.setInterval(detectPalette, 1500);

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      const centerX = cursor.x;
      const centerY = cursor.y;

      const strokeLine = (vertical: boolean) => {
        const grad = vertical
          ? ctx.createLinearGradient(0, 0, 0, height)
          : ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, palette.a);
        grad.addColorStop(0.5, palette.b);
        grad.addColorStop(1, palette.a);
        ctx.strokeStyle = grad as unknown as string;
        ctx.globalCompositeOperation = "lighter";
        ctx.stroke();
      };

      for (let row = -1; row <= rows; row++) {
        ctx.beginPath();
        for (let col = -1; col <= cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 240);
          const wave = Math.sin((col + row) * 0.35 + t * 0.02) * 5;
          const offsetY = wave * (0.2 + influence * 2);
          if (col === -1) ctx.moveTo(x, y + offsetY);
          else ctx.lineTo(x, y + offsetY);
        }
        strokeLine(false);
      }

      for (let col = -1; col <= cols; col++) {
        ctx.beginPath();
        for (let row = -1; row <= rows; row++) {
          const x = col * spacing;
          const y = row * spacing;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 240);
          const wave = Math.cos((col + row) * 0.35 + t * 0.02) * 5;
          const offsetX = wave * (0.2 + influence * 2);
          if (row === -1) ctx.moveTo(x + offsetX, y);
          else ctx.lineTo(x + offsetX, y);
        }
        strokeLine(true);
      }

      // cursor glow (sky blue accent — reads as "on cards" everywhere)
      if (centerX > -9000) {
        const glowR = 130;
        const g = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowR);
        g.addColorStop(0, "rgba(120,200,255,0.30)");
        g.addColorStop(0.35, "rgba(80,160,240,0.14)");
        g.addColorStop(1, "rgba(0,0,0,0)");
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
      window.clearInterval(paletteInterval);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 live-background-canvas" style={{ zIndex: 0 }} />;
}
