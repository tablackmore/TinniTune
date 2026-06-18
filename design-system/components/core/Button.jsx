import React from 'react';

/**
 * AURUM Button — the primary action control.
 * Gold "fill" for the one primary action; "outline" and "ghost" for the rest.
 * Machined depth via inset highlight + drop shadow; presses physically downward.
 */
export function Button({
  variant = 'fill',
  size = 'md',
  full = false,
  disabled = false,
  icon = null,
  iconRight = null,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = {
    sm: { h: 32, px: 14, fs: 12, gap: 7 },
    md: { h: 44, px: 20, fs: 14, gap: 9 },
    lg: { h: 56, px: 28, fs: 16, gap: 11 },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.h,
    padding: `0 ${s.px}px`,
    width: full ? '100%' : 'auto',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: s.fs,
    letterSpacing: '0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all var(--motion-fast) var(--ease-standard)',
    transform: active && !disabled ? 'translateY(1px)' : 'translateY(0)',
    whiteSpace: 'nowrap',
    ...style,
  };

  const variants = {
    fill: {
      background: hover && !disabled
        ? 'linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500))'
        : 'linear-gradient(180deg, var(--color-gold-400), var(--color-gold-600))',
      color: 'var(--text-on-gold)',
      boxShadow: active
        ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
        : 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.5)',
    },
    outline: {
      background: hover && !disabled ? 'var(--surface-control)' : 'transparent',
      color: 'var(--color-gold-300)',
      boxShadow: 'inset 0 0 0 1px var(--color-gold-700)',
    },
    ghost: {
      background: hover && !disabled ? 'var(--surface-control)' : 'transparent',
      color: 'var(--text-secondary)',
      boxShadow: hover && !disabled ? 'inset 0 0 0 1px var(--border-hairline)' : 'none',
    },
    danger: {
      background: hover && !disabled ? 'var(--color-meter-high)' : 'rgba(255,82,71,0.14)',
      color: hover && !disabled ? 'var(--color-white)' : 'var(--color-meter-high)',
      boxShadow: 'inset 0 0 0 1px rgba(255,82,71,0.5)',
    },
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{ ...base, ...(variants[variant] || variants.fill) }}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
