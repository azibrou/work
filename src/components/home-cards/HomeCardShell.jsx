import './home-cards.css';
import { resolveLogo } from './logos';
import { toBackground } from './cardSchema';

const JUSTIFY = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
const ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end' };

export default function HomeCardShell({
  variant,
  bgDuration,
  title,
  headlineType,
  description,
  descriptionSize,
  textColor,
  logo,
  logoUrl,
  logoSize,
  width,
  height,
  textPosition,
  textAlign,
  textWidth,
  padding,
  radius,
  hoverRadius,
  background,
  backgroundEnd,
  hoverBackground,
  hoverBackgroundEnd,
  gradientAngle,
  children,
  ...rest
}) {
  const Headline = headlineType;
  const logoSrc = logoUrl ?? resolveLogo(logo);
  const style = {
    width,
    height,
    '--card-radius': `${radius}px`,
    '--card-radius-hover': `${hoverRadius}px`,
    '--card-bg': toBackground(background, backgroundEnd, gradientAngle),
    '--card-bg-hover': toBackground(hoverBackground, hoverBackgroundEnd, gradientAngle),
    '--card-bg-duration': bgDuration,
    color: textColor === 'light' ? '#ffffff' : 'var(--color-text)',
  };

  return (
    <div className={`home-card home-card--${variant}`} style={style} {...rest}>
      {children}
      <div
        className="home-card__details"
        style={{ padding, justifyContent: JUSTIFY[textPosition] }}
      >
        <div
          className="home-card__text"
          style={{ width: textWidth, textAlign, alignItems: ALIGN[textAlign] }}
        >
          {logoSrc && <img src={logoSrc} alt={`${title} logo`} width={logoSize} height={logoSize} style={{ objectFit: 'contain' }} />}
          <Headline
            style={{
              fontSize: `var(--font-size-${headlineType})`,
              lineHeight: `var(--line-height-${headlineType})`,
              fontWeight: `var(--font-weight-${headlineType})`,
            }}
          >
            {title}
          </Headline>
          <p
            style={{
              fontSize: `var(--font-size-body-${descriptionSize})`,
              lineHeight: `var(--line-height-body-${descriptionSize})`,
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            {description}
          </p>
          <a
            className="home-card__link"
            href="#"
            style={{
              fontSize: `var(--font-size-body-${descriptionSize})`,
              lineHeight: `var(--line-height-body-${descriptionSize})`,
            }}
          >
            View case study
          </a>
        </div>
      </div>
    </div>
  );
}
