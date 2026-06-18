import React from 'react';

/**
 * AURUM TransportButton — circular machined transport control.
 * Built-in glyphs: play, pause, cue, stop, rec, loop. Active state lifts to the
 * deck accent with a gold/ice glow. For arbitrary icons, pass `glyph`.
 */
export function TransportButton({
  kind = 'play', active = false, onClick, size = 56,
  accent = 'gold', glyph = null, label = null, disabled = false, style = {},
}) {
  const [press, setPress] = React.useState(false);
  const accentColor = accent === 'ice' ? 'var(--color-ice-500)' : 'var(--color-gold-500)';
  const glow = accent === 'ice' ? 'var(--glow-ice)' : 'var(--glow-gold)';
  const fg = active ? 'var(--text-on-gold)' : 'var(--color-obsidian-050)';
  const g = size * 0.34;

  const glyphs = {
    play: <div style={{ width: 0, height: 0, marginLeft: g * 0.18, borderTop: `${g/2}px solid transparent`, borderBottom: `${g/2}px solid transparent`, borderLeft: `${g}px solid ${fg}` }} />,
    pause: <div style={{ display: 'flex', gap: g * 0.32 }}><div style={{ width: g * 0.3, height: g, background: fg, borderRadius: 1 }} /><div style={{ width: g * 0.3, height: g, background: fg, borderRadius: 1 }} /></div>,
    stop: <div style={{ width: g * 0.82, height: g * 0.82, background: fg, borderRadius: 2 }} />,
    cue: <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size * 0.24, color: fg, letterSpacing: '0.06em' }}>CUE</div>,
    rec: <div style={{ width: g * 0.8, height: g * 0.8, borderRadius: '50%', background: active ? 'var(--color-meter-high)' : fg, boxShadow: active ? '0 0 8px var(--color-meter-high)' : 'none' }} />,
    loop: <div style={{ width: g, height: g, borderRadius: '50%', border: `2.5px solid ${fg}`, borderTopColor: 'transparent', transform: 'rotate(45deg)' }} />,
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 7, opacity: disabled ? 0.4 : 1, ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        onMouseLeave={() => setPress(false)}
        style={{
          width: size, height: size, borderRadius: '50%', border: 'none', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: active
            ? `radial-gradient(circle at 38% 30%, ${accent === 'ice' ? 'var(--color-ice-400)' : 'var(--color-gold-400)'}, ${accent === 'ice' ? 'var(--color-ice-600)' : 'var(--color-gold-600)'})`
            : 'radial-gradient(circle at 38% 30%, var(--color-obsidian-600), var(--color-obsidian-800))',
          boxShadow: active
            ? `${glow}, inset 0 1px 0 rgba(255,255,255,0.3)`
            : `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 5px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.55)`,
          transform: press ? 'translateY(1px) scale(0.97)' : 'none',
          transition: 'all var(--motion-fast) var(--ease-standard)',
        }}
      >
        {glyph || glyphs[kind]}
      </button>
      {label && <div style={{ font: 'var(--type-caps)', letterSpacing: 'var(--tracking-caps)', color: active ? accentColor : 'var(--text-muted)' }}>{label}</div>}
    </div>
  );
}
