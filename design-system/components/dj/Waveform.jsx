import React from 'react';

/**
 * AURUM Waveform — the signature track display.
 * Monochrome obsidian waveform; the played portion fills with the deck accent.
 * A precise playhead line + beat-grid ticks. Deterministic from `seed` so it
 * renders identically every time (no audio decode needed for mockups).
 * Click to scrub (reports 0–1 via onSeek).
 */
export function Waveform({
  seed = 7, progress = 0.34, accent = 'gold',
  height = 96, bars = 200, beatEvery = 16, onSeek, style = {},
}) {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const accentColor = accent === 'ice' ? '#46AEDC' : '#D6A431';
  const accentBright = accent === 'ice' ? '#A6E0F7' : '#F2D484';

  // deterministic pseudo-random
  const amps = React.useMemo(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const out = [];
    for (let i = 0; i < bars; i++) {
      // layered envelope: gives musical-looking dynamics
      const env = 0.45
        + 0.32 * Math.sin(i / bars * Math.PI * 3 + seed)
        + 0.18 * Math.sin(i / 7 + seed)
        + 0.25 * (rnd() - 0.2);
      out.push(Math.max(0.08, Math.min(1, Math.abs(env))));
    }
    return out;
  }, [seed, bars]);

  const draw = React.useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const wrap = wrapRef.current;
    const W = wrap.clientWidth, H = height;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    const mid = H / 2;
    const bw = W / bars;
    const playX = progress * W;

    for (let i = 0; i < bars; i++) {
      const x = i * bw;
      const a = amps[i];
      const h = a * (H * 0.46);
      const played = x < playX;
      if (played) {
        const g = ctx.createLinearGradient(0, mid - h, 0, mid + h);
        g.addColorStop(0, accentBright); g.addColorStop(0.5, accentColor); g.addColorStop(1, accentBright);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = '#3C3C4A';
      }
      ctx.fillRect(x + bw * 0.12, mid - h, bw * 0.76, h * 2);
    }

    // beat grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < bars; i += beatEvery) {
      const x = i * bw;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // playhead
    ctx.fillStyle = accentBright;
    ctx.fillRect(playX - 1, 0, 2, H);
    ctx.fillStyle = accentBright;
    ctx.beginPath();
    ctx.moveTo(playX - 5, 0); ctx.lineTo(playX + 5, 0); ctx.lineTo(playX, 6); ctx.closePath(); ctx.fill();
  }, [amps, progress, height, bars, beatEvery, accentColor, accentBright]);

  React.useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div
      ref={wrapRef}
      onClick={(e) => {
        if (!onSeek) return;
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
      }}
      style={{
        position: 'relative', width: '100%', height,
        background: 'var(--surface-well)', borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--material-inset)', overflow: 'hidden',
        cursor: onSeek ? 'text' : 'default', ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
