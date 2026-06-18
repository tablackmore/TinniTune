import React from 'react';

/**
 * AURUM Slider — horizontal value control (gain trim, FX depth, etc).
 * Recessed track, gold fill to the thumb, machined thumb. For channel volume
 * use the vertical Fader instead.
 */
export function Slider({
  value = 50, min = 0, max = 100, step = 1, onChange,
  accent = 'gold', disabled = false, showFill = true, style = {},
}) {
  const ref = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  const accentColor = accent === 'ice' ? 'var(--color-ice-500)' : 'var(--color-gold-500)';

  const setFromClientX = (clientX) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let p = (clientX - r.left) / r.width;
    p = Math.max(0, Math.min(1, p));
    let v = min + p * (max - min);
    v = Math.round(v / step) * step;
    onChange && onChange(Math.max(min, Math.min(max, v)));
  };

  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => setFromClientX(e.touches ? e.touches[0].clientX : e.clientX);
    const up = () => setDrag(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag]);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => { if (disabled) return; setDrag(true); setFromClientX(e.clientX); }}
      onTouchStart={(e) => { if (disabled) return; setDrag(true); setFromClientX(e.touches[0].clientX); }}
      style={{
        position: 'relative', height: 28, display: 'flex', alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        touchAction: 'none', ...style,
      }}
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 'var(--radius-full)',
        background: 'var(--surface-well)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
      }} />
      {showFill && (
        <div style={{
          position: 'absolute', left: 0, width: `${pct}%`, height: 6, borderRadius: 'var(--radius-full)',
          background: accentColor,
          boxShadow: drag ? `0 0 10px ${accentColor}` : 'none',
          transition: drag ? 'none' : 'width var(--motion-fast) var(--ease-standard)',
        }} />
      )}
      <div style={{
        position: 'absolute', left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, var(--color-obsidian-200), var(--color-obsidian-700))',
        boxShadow: `0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)${drag ? ', ' + (accent === 'ice' ? 'var(--glow-ice)' : 'var(--glow-gold)') : ''}`,
        transition: drag ? 'none' : 'left var(--motion-fast) var(--ease-standard)',
      }} />
    </div>
  );
}
