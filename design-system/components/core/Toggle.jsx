import React from 'react';

/**
 * AURUM Toggle — a tactile on/off switch.
 * Recessed track (inset shadow) with a machined knob that slides and glows gold when on.
 */
export function Toggle({ checked = false, onChange, disabled = false, label = null, size = 'md', style = {} }) {
  const dims = size === 'sm' ? { w: 40, h: 22, k: 16 } : { w: 52, h: 28, k: 22 };
  const pad = (dims.h - dims.k) / 2;

  const track = {
    position: 'relative',
    width: dims.w,
    height: dims.h,
    flex: 'none',
    borderRadius: 'var(--radius-full)',
    background: checked ? 'linear-gradient(180deg, var(--color-gold-600), var(--color-gold-500))' : 'var(--surface-well)',
    boxShadow: checked
      ? 'var(--glow-gold), inset 0 1px 2px rgba(0,0,0,0.3)'
      : 'inset 0 2px 5px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.04)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all var(--motion-base) var(--ease-standard)',
  };
  const knob = {
    position: 'absolute',
    top: pad,
    left: checked ? dims.w - dims.k - pad : pad,
    width: dims.k,
    height: dims.k,
    borderRadius: '50%',
    background: checked
      ? 'radial-gradient(circle at 35% 30%, #fff, var(--color-obsidian-050))'
      : 'radial-gradient(circle at 35% 30%, var(--color-obsidian-300), var(--color-obsidian-600))',
    boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
    transition: 'left var(--motion-base) var(--ease-spring)',
  };

  const sw = (
    <div role="switch" aria-checked={checked} style={track}
      onClick={() => !disabled && onChange && onChange(!checked)}>
      <div style={knob} />
    </div>
  );

  if (!label) return sw;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {sw}
      <span style={{ font: 'var(--type-label)', color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}
