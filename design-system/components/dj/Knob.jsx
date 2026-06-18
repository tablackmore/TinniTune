import React from 'react';

/**
 * AURUM Knob — machined rotary control (EQ, filter, gain, FX).
 * Drag vertically to turn. 270° sweep, gold value arc, brushed-metal cap with
 * an indicator notch. Optional center detent for bipolar EQ.
 */
export function Knob({
  value = 50, min = 0, max = 100, onChange,
  size = 64, label = null, unit = '', accent = 'gold',
  bipolar = false, disabled = false, style = {},
}) {
  const [drag, setDrag] = React.useState(false);
  const startRef = React.useRef({ y: 0, v: value });
  const range = max - min;
  const pct = (value - min) / range;
  const SWEEP = 270;
  const angle = -135 + pct * SWEEP; // degrees
  const accentColor = accent === 'ice' ? 'var(--color-ice-500)' : 'var(--color-gold-500)';
  const glow = accent === 'ice' ? 'var(--glow-ice)' : 'var(--glow-gold)';

  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const dy = startRef.current.y - y;
      const next = startRef.current.v + (dy / 160) * range;
      onChange && onChange(Math.max(min, Math.min(max, Math.round(next))));
    };
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
  }, [drag, range, min, max, onChange]);

  const start = (clientY) => { if (disabled) return; startRef.current = { y: clientY, v: value }; setDrag(true); };

  // value arc via conic gradient (starts at bottom -135deg => 225deg in conic terms)
  const arcStart = 225;
  const sweepDeg = pct * SWEEP;
  const arcBg = bipolar
    ? `conic-gradient(from 0deg, transparent 0deg, transparent 360deg)`
    : `conic-gradient(from ${arcStart}deg, ${accentColor} 0deg, ${accentColor} ${sweepDeg}deg, var(--surface-well) ${sweepDeg}deg, var(--surface-well) ${SWEEP}deg, transparent ${SWEEP}deg)`;

  // bipolar fill: from center
  let bipolarArc = null;
  if (bipolar) {
    const center = 0.5;
    const from = Math.min(pct, center);
    const to = Math.max(pct, center);
    const a0 = arcStart + from * SWEEP;
    const len = (to - from) * SWEEP;
    bipolarArc = `conic-gradient(from ${a0}deg, ${accentColor} 0deg, ${accentColor} ${len}deg, transparent ${len}deg)`;
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: disabled ? 0.4 : 1, ...style }}>
      <div
        onMouseDown={(e) => start(e.clientY)}
        onTouchStart={(e) => start(e.touches[0].clientY)}
        style={{ position: 'relative', width: size, height: size, cursor: disabled ? 'not-allowed' : 'ns-resize', touchAction: 'none' }}
      >
        {/* track ring backdrop */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `var(--surface-well)`,
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
        }} />
        {/* value arc */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: bipolar
            ? `conic-gradient(from ${arcStart}deg, var(--surface-well) 0deg, var(--surface-well) ${SWEEP}deg, transparent ${SWEEP}deg)`
            : arcBg,
          WebkitMask: `radial-gradient(circle, transparent ${size/2 - 6}px, #000 ${size/2 - 6}px)`,
          mask: `radial-gradient(circle, transparent ${size/2 - 6}px, #000 ${size/2 - 6}px)`,
          filter: drag ? `drop-shadow(0 0 4px ${accentColor})` : 'none',
        }} />
        {bipolar && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: bipolarArc,
            WebkitMask: `radial-gradient(circle, transparent ${size/2 - 6}px, #000 ${size/2 - 6}px)`,
            mask: `radial-gradient(circle, transparent ${size/2 - 6}px, #000 ${size/2 - 6}px)`,
            filter: drag ? `drop-shadow(0 0 4px ${accentColor})` : 'none',
          }} />
        )}
        {/* machined cap */}
        <div style={{
          position: 'absolute', inset: 9, borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 30%, var(--color-obsidian-500), var(--color-obsidian-800) 70%, var(--color-obsidian-900))',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 6px rgba(0,0,0,0.7), 0 3px 8px rgba(0,0,0,0.55)${drag ? ', ' + glow : ''}`,
          transform: `rotate(${angle}deg)`,
          transition: drag ? 'none' : 'transform var(--motion-fast) var(--ease-standard)',
        }}>
          {/* indicator notch */}
          <div style={{
            position: 'absolute', left: '50%', top: 5, width: 3, height: size * 0.22,
            transform: 'translateX(-50%)', borderRadius: 2,
            background: accentColor, boxShadow: `0 0 6px ${accentColor}`,
          }} />
        </div>
      </div>
      {label && <div style={{ font: 'var(--type-caps)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>{label}</div>}
      {unit !== null && unit !== '' && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{value}{unit}</div>
      )}
    </div>
  );
}
