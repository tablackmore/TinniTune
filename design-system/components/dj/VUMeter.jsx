import React from 'react';

/**
 * AURUM VUMeter — segmented LED level meter (channel / master).
 * Green → amber → red ladder. Lit segments glow; unlit are recessed wells.
 * Vertical by default; pass orientation="horizontal".
 */
export function VUMeter({
  level = 0.6, peak = null, segments = 16,
  orientation = 'vertical', length = 180, thickness = 14, label = null, style = {},
}) {
  const lit = Math.round(level * segments);
  const peakIdx = peak != null ? Math.round(peak * segments) : -1;
  const vertical = orientation === 'vertical';

  const segColor = (i) => {
    const t = i / (segments - 1);
    if (t > 0.86) return 'var(--color-meter-high)';
    if (t > 0.66) return 'var(--color-meter-mid)';
    return 'var(--color-meter-low)';
  };

  const segs = Array.from({ length: segments }).map((_, i) => {
    const idx = i; // 0 = bottom/left
    const on = idx < lit;
    const isPeak = idx === peakIdx;
    const c = segColor(idx);
    return (
      <div key={i} style={{
        flex: 1,
        borderRadius: 2,
        background: on || isPeak ? c : 'var(--surface-well)',
        boxShadow: on
          ? `0 0 6px ${c}, inset 0 0 2px rgba(255,255,255,0.5)`
          : isPeak ? `0 0 6px ${c}` : 'inset 0 1px 2px rgba(0,0,0,0.8)',
        opacity: on || isPeak ? 1 : 0.5,
        transition: 'background var(--motion-fast) linear, box-shadow var(--motion-fast) linear',
      }} />
    );
  });

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...style }}>
      <div style={{
        display: 'flex',
        flexDirection: vertical ? 'column-reverse' : 'row',
        gap: 2,
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        padding: 3,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-page-outer)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
      }}>
        {segs}
      </div>
      {label && <div style={{ font: 'var(--type-caps)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>{label}</div>}
    </div>
  );
}
