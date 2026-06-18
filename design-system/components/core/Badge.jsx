import React from 'react';

/**
 * AURUM Badge — compact status / metadata pill.
 * Tones: neutral, gold (active/featured), ice (deck B), live (pulsing), and meter states.
 */
export function Badge({ children, tone = 'neutral', dot = false, style = {} }) {
  const tones = {
    neutral: { bg: 'var(--surface-control)', fg: 'var(--text-secondary)', bd: 'var(--border-hairline)' },
    gold:    { bg: 'rgba(214,164,49,0.14)', fg: 'var(--color-gold-300)', bd: 'rgba(214,164,49,0.4)' },
    ice:     { bg: 'rgba(70,174,220,0.14)', fg: 'var(--color-ice-300)', bd: 'rgba(70,174,220,0.4)' },
    live:    { bg: 'rgba(255,82,71,0.16)', fg: 'var(--color-meter-high)', bd: 'rgba(255,82,71,0.45)' },
    success: { bg: 'rgba(52,209,127,0.14)', fg: 'var(--color-meter-low)', bd: 'rgba(52,209,127,0.4)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 22, padding: '0 10px', borderRadius: 'var(--radius-full)',
      background: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.bd}`,
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10,
      letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', ...style,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: t.fg,
          boxShadow: `0 0 6px ${t.fg}`,
          animation: tone === 'live' ? 'aurumPulse 1.4s var(--ease-standard) infinite' : 'none',
        }} />
      )}
      {children}
      <style>{`@keyframes aurumPulse{0%,100%{opacity:1}50%{opacity:0.25}}`}</style>
    </span>
  );
}
