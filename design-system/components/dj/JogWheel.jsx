import React from 'react';

/**
 * AURUM JogWheel — the platter. Brushed-metal concentric rings with a rotating
 * position marker and a center readout. Spins when `playing`. Drag to nudge
 * (scratch) — reports a delta in degrees via onScrub.
 */
export function JogWheel({
  size = 220, playing = false, bpm = 124, deck = 'A',
  onScrub, center = null, style = {},
}) {
  const [angle, setAngle] = React.useState(0);
  const raf = React.useRef(null);
  const dragRef = React.useRef(null);
  const accent = deck === 'B' ? 'var(--color-ice-500)' : 'var(--color-gold-500)';
  const accentGlow = deck === 'B' ? 'var(--color-ice-400)' : 'var(--color-gold-400)';

  React.useEffect(() => {
    if (!playing) { if (raf.current) cancelAnimationFrame(raf.current); return; }
    // ~ one rotation per (60/bpm * 2) seconds, slowed for elegance
    const degPerMs = (360 / ((60 / bpm) * 1000)) / 2;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      setAngle((a) => (a + degPerMs * dt) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [playing, bpm]);

  const startDrag = (clientX, clientY, rect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    dragRef.current = { lastAngle: Math.atan2(clientY - cy, clientX - cx), cx, cy };
  };

  React.useEffect(() => {
    const move = (e) => {
      if (!dragRef.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const a = Math.atan2(y - dragRef.current.cy, x - dragRef.current.cx);
      let d = (a - dragRef.current.lastAngle) * (180 / Math.PI);
      if (d > 180) d -= 360; if (d < -180) d += 360;
      dragRef.current.lastAngle = a;
      setAngle((p) => (p + d + 360) % 360);
      onScrub && onScrub(d);
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [onScrub]);

  const platterSize = size;
  const labelSize = size * 0.46;

  return (
    <div style={{ position: 'relative', width: platterSize, height: platterSize, ...style }}
      onMouseDown={(e) => startDrag(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect())}
    >
      {/* outer rim */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #2a2a33, #14141b, #2a2a33, #101016, #2a2a33, #14141b, #2a2a33)',
        boxShadow: '0 14px 40px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.08), inset 0 -3px 8px rgba(0,0,0,0.8)',
        cursor: 'grab',
      }} />
      {/* brushed platter */}
      <div style={{
        position: 'absolute', inset: size * 0.07, borderRadius: '50%',
        background: `repeating-conic-gradient(from 0deg, rgba(255,255,255,0.02) 0deg 2deg, rgba(0,0,0,0.06) 2deg 4deg), radial-gradient(circle at 50% 50%, var(--color-obsidian-700), var(--color-obsidian-900))`,
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.7)',
        transform: `rotate(${angle}deg)`,
      }}>
        {/* rotation marker */}
        <div style={{
          position: 'absolute', left: '50%', top: '6%', width: 4, height: size * 0.13,
          transform: 'translateX(-50%)', borderRadius: 3,
          background: accent, boxShadow: `0 0 10px ${accentGlow}`,
        }} />
      </div>
      {/* center label disc */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: labelSize, height: labelSize,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, var(--color-obsidian-600), var(--color-obsidian-850))',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.6), 0 0 0 1px ${deck==='B'?'rgba(70,174,220,0.35)':'rgba(214,164,49,0.35)'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        {center || (
          <>
            <div style={{ font: 'var(--type-caps)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Deck {deck}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: labelSize * 0.26, color: accentGlow, lineHeight: 1 }}>{bpm.toFixed(1)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>BPM</div>
          </>
        )}
      </div>
    </div>
  );
}
