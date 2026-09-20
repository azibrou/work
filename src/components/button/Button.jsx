import './button.css';

export default function Button({
  label = 'View case study',
  size = 'm',
  radius = 12,
  hoverRadius = 50,
  opacity = 50,
  hovered = false,
  href = '#',
  className = '',
  style,
  ...rest
}) {
  return (
    <a
      className={['button', hovered && 'button--hovered', className].filter(Boolean).join(' ')}
      href={href}
      style={{
        fontSize: `var(--font-size-body-${size})`,
        lineHeight: `var(--line-height-body-${size})`,
        '--button-radius': `${radius}px`,
        '--button-radius-hover': hoverRadius,
        '--button-opacity': `${opacity}%`,
        '--button-height': `calc(var(--line-height-body-${size}) + 24px)`,
        ...style,
      }}
      {...rest}
    >
      {label}
    </a>
  );
}
