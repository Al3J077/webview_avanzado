import React, { useRef, useEffect, useState } from "react";

// Pixel Garden
// Una app visual e interactiva: plantas "semillas" haciendo click/tap en el lienzo.
// Cada semilla crece procedimentalmente en forma de 'bioma' de píxeles que se expanden
// y cambian color. Ideal para experimentar con patrones generativos y jugar.

export default function App() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [brush, setBrush] = useState(12);
  const [showGrid, setShowGrid] = useState(false);
  const [seeds, setSeeds] = useState([]); // array of seeds
  const [paletteSeed, setPaletteSeed] = useState(Math.random());

  // Seed structure: { x, y, size, life, hueBase, id }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = canvas.width = canvas.clientWidth * devicePixelRatio;
    let height = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const draw = (t) => {
      if (!running) return;
      // clear with slight alpha to create trailing effect
      ctx.fillStyle = "rgba(3,6,12,0.12)"; // very dark translucent
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // optional grid
      if (showGrid) drawGrid(ctx, canvas.clientWidth, canvas.clientHeight);

      // update seeds
      const now = performance.now();
      let updated = false;
      for (let i = seeds.length - 1; i >= 0; i--) {
        const s = seeds[i];
        s.life += 0.02 * speed;
        // growth algorithm: size grows with diminishing returns
        s.size += (0.3 * speed) * (1 - s.size / 150) * (s.life < 10 ? 1 : 0.1);

        // spawn micro-pixels around seed probabilistically
        const spawnCount = Math.floor((Math.random() + s.life * 0.05) * (speed * 0.5));
        for (let k = 0; k < spawnCount; k++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * s.size * 0.9;
          const px = s.x + Math.cos(angle) * dist;
          const py = s.y + Math.sin(angle) * dist;
          const alpha = Math.min(1, 0.8 * (1 - dist / (s.size + 1)));
          const hue = (s.hueBase * 360 + (Math.sin(s.life + k) * 20)) % 360;
          drawPixel(ctx, px, py, Math.max(1, brush * (0.3 + Math.random() * 0.8)), hue, alpha);
        }

        // subtle pulsing ring
        if (Math.random() < 0.08 * speed) {
          drawRing(ctx, s.x, s.y, s.size * (0.9 + Math.random() * 0.4), s.hueBase * 360, 0.08);
        }

        // remove seed when size too big or life too long
        if (s.life > 120 || s.size > 220) {
          seeds.splice(i, 1);
          updated = true;
        }
      }

      // background stars / noise
      for (let i = 0; i < 2 * speed; i++) {
        if (Math.random() < 0.05) {
          const x = Math.random() * canvas.clientWidth;
          const y = Math.random() * canvas.clientHeight;
          ctx.globalAlpha = Math.random() * 0.08;
          ctx.fillStyle = "#0ea5e9";
          ctx.fillRect(x, y, 1, 1);
          ctx.globalAlpha = 1;
        }
      }

      // if seeds changed state, update
      if (updated) setSeeds([...seeds]);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [running, seeds, speed, brush, showGrid]);

  function drawGrid(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#0ea5e9";
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPixel(ctx, x, y, size, hue, alpha = 1) {
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = `hsl(${hue}, 90%, ${Math.random() * 10 + 45}%)`;
    ctx.arc(x, y, size * (0.35 + Math.random() * 0.85), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRing(ctx, x, y, radius, hue, alpha = 0.08) {
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
    ctx.arc(x, y, Math.max(2, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const plantSeed = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);
    const seed = {
      x,
      y,
      size: 2 + Math.random() * 6,
      life: 0,
      hueBase: (paletteSeed + Math.random() * 0.6) % 1,
      id: Math.random().toString(36).slice(2, 9),
    };
    setSeeds((s) => [seed, ...s]);
  };

  const handleCanvasDown = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    plantSeed(clientX, clientY);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#03060c";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setSeeds([]);
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixel-garden-${Date.now()}.png`;
    a.click();
  };

  return (
  <div className="min-h-screen flex flex-col bg-[#03060c] text-slate-100">
      <header className="flex items-center justify-between p-4 border-b border-slate-800">
        <h1 className="text-xl font-semibold text-white">Pixel Garden</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRunning(r => !r); if (!running) { setRunning(true); } }}
            className="px-3 py-1 rounded-2xl border border-slate-700 hover:bg-slate-800"
          >
            {running ? 'Pausar' : 'Reanudar'}
          </button>
          <button onClick={() => { setPaletteSeed(Math.random()); }} className="px-3 py-1 rounded-2xl border border-slate-700 hover:bg-slate-800">Paleta</button>
          <button onClick={clear} className="px-3 py-1 rounded-2xl border border-slate-700 hover:bg-slate-800">Limpiar</button>
          <button onClick={exportPNG} className="px-3 py-1 rounded-2xl bg-[#0ea5e9] text-black font-semibold">Exportar</button>
        </div>
      </header>

      <main className="flex-1 p-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          <div className="lg:col-span-3 bg-[#03060c] rounded-lg overflow-hidden shadow-inner" style={{minHeight: 480}}>
            <div
              onMouseDown={handleCanvasDown}
              onTouchStart={handleCanvasDown}
              className="w-full h-full relative"
              style={{cursor: 'crosshair'}}
            >
              <canvas ref={canvasRef} className="w-full h-[60vh] lg:h-[72vh] block" />
              <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm p-2 rounded-md border border-slate-800">
                <div className="text-xs text-slate-300">Semillas: {seeds.length}</div>
                <div className="text-xs text-slate-400">Tip: haz click arrastrando para plantar múltiples</div>
              </div>
            </div>
          </div>
          <aside className="p-4 bg-[#040619] rounded-lg border border-slate-800">
            <h2 className="font-medium mb-2">Controles</h2>
            <label className="block text-sm mb-2">Velocidad: <span className="font-semibold">{speed.toFixed(1)}x</span></label>
            <input type="range" min="0.2" max="3" step="0.1" value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} className="w-full" />
            <label className="block text-sm mt-3">Tamaño pincel: <span className="font-semibold">{brush}</span></label>
            <input type="range" min="2" max="40" step="1" value={brush} onChange={(e)=>setBrush(Number(e.target.value))} className="w-full" />
            <label className="flex items-center gap-2 mt-3">
              <input type="checkbox" checked={showGrid} onChange={(e)=>setShowGrid(e.target.checked)} />
              <span>Mostrar grid</span>
            </label>
          </aside>
        </div>
      </main>
    </div>
  );
}