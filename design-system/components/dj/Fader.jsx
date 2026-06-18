import React from 'react';

/**
 * AURUM Fader — vertical channel volume fader.
 * Recessed center groove with tick scale, machined cap with a grip line.
 * Drag the cap. Use Crossfader (horizontal) variant via `orientation`.
 */
export function Fader({
  value = 75, min = 0, max = 100, onChange,
  height = 200, label = null, accent = 'gold', disabled = false,
  ticks = 11, style = {},
}) {
  const ref = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const pct = (value - min) / (max - min);
  const accentColor = accent === 'ice' ? 'var(--color-ice-500)' : 'var(--color-gold-500)';
  const glow = accent === 'ice' ? 'var(--glow-ice)' : 'var(--glow-gold)';
  const CAP_H = 28;

  const setFromY = (clientY) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let p = 1 - (clientY - r.top - CAP_H / 2) / (r.height - CAP_H);
    p = Math.max(0, Math.min(1, p));
    onChange && onChange(Math.round(min + p * (max - min)));
  };

  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => setFromY(e.touches ? e.touches[0].clientY : e.clientY);
    const up = () => setDrag(false);
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
  }, [drag]);

  const tickEls = Array.from({ length: ticks }).map((_, i) => {
    const major = i === 0 || i === ticks - 1 || i === (ticks - 1) / 2;
    return (
      <div key={i} style={{
        width: major ? 12 : 7, height: 1.5,
        background: major ? 'var(--border-strong)' : 'var(--border-hairline)',
      }} />
    );
  });

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: disabled ? 0.4 : 1, ...style }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', height }}>
        {/* scale */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', padding: `${CAP_H/2}px 0` }}>{tickEls}</div>
        {/* track */}
        <div
          ref={ref}
          onMouseDown={(e) => { if (disabled) return; setDrag(true); setFromY(e.clientY); }}
          onTouchStart={(e) => { if (disabled) return; setDrag(true); setFromY(e.touches[0].clientY); }}
          style={{ position: 'relative', width: 30, height: '100%', cursor: disabled ? 'not-allowed' : 'pointer', touchAction: 'none' }}
        >
          {/* groove */}
          <div style={{
            position: 'absolute', left: '50%', top: CAP_H/2, bottom: CAP_H/2, width: 6, transform: 'translateX(-50%)',
            borderRadius: 'var(--radius-full)', background: 'var(--surface-well)',
            boxShadow: 'inset 0 0 4px rgba(0,0,0,0.9), inset 0 1px 2px rgba(0,0,0,0.8)',
          }} />
          {/* fill below cap */}
          <div style={{
            position: 'absolute', left: '50%', width: 6, transform: 'translateX(-50%)',
            bottom: CAP_H/2, height: `calc(${pct * 100}% - ${pct * CAP_H}px)`,
            borderRadius: 'var(--radius-full)', background: accentColor,
            boxShadow: drag ? `0 0 8px ${accentColor}` : 'none',
            transition: drag ? 'none' : 'height var(--motion-fast) var(--ease-standard)',
          }} />
          {/* cap */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            bottom: `calc(${pct * 100}% - ${pct * CAP_H}px)`, width: 30, height: CAP_H, borderRadius: 5,
            background: 'linear-gradient(180deg, var(--color-obsidian-400), var(--color-obsidian-700) 55%, var(--color-obsidian-900))',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.6)${drag ? ', ' + glow : ''}`,
            transition: drag ? 'none' : 'bottom var(--motion-fast) var(--ease-standard)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 18, height: 2, borderRadius: 2, background: accentColor, boxShadow: `0 0 5px ${accentColor}` }} />
          </div>
        </div>
      </div>
      {label && <div style={{ font: 'var(--type-caps)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>{label}</div>}
    </div>
  );
}
