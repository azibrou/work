import './home-cards.css';
import { resolveLogo } from './logos';
import { toBackground } from './cardSchema';
import Button from '../button/Button';

const JUSTIFY = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
const ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end' };
const FONT = {
  inter: 'var(--font-family-base)',
  'noto-serif': 'var(--font-family-serif)',
  'bricolage-grotesque': 'var(--font-family-bricolage)',
  'roboto-mono': 'var(--font-family-mono)',
};

export default function HomeCardShell({
  variant,
  bgDuration,
  visible = true,
  fontFamily = 'inter',
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
  hoverPadding = padding,
  radius,
  hoverRadius,
  buttonRadius = 12,
  buttonHoverRadius = 50,
  buttonOpacity = 50,
  background,
  backgroundEnd,
  hoverBackground,
  hoverBackgroundEnd,
  gradientAngle,
  children,
  ...rest
}) {
  if (!visible) return null;
  const Headline = headlineType;
  const logoSrc = logoUrl ?? resolveLogo(logo);
  const style = {
    width,
    height,
    '--card-padding': `${padding}px`,
    '--card-padding-hover': `${hoverPadding}px`,
    '--card-radius': `${radius}px`,
    '--card-radius-hover': `${hoverRadius}px`,
    '--card-bg': toBackground(background, backgroundEnd, gradientAngle),
    '--card-bg-hover': toBackground(hoverBackground, hoverBackgroundEnd, gradientAngle),
    '--card-bg-duration': bgDuration,
    // A flat stand-in for the card's own surface. The button tints against it
    // instead of against transparency, so it stays opaque over the artwork.
    '--card-surface': background,
    color: textColor === 'light' ? '#ffffff' : 'var(--color-text)',
  };

  return (
    <div className={`home-card home-card--${variant}`} style={style} {...rest}>
      {children}
      <div className="home-card__details">
        <div
          className="home-card__text"
          style={{ width: textWidth, justifyContent: JUSTIFY[textPosition], textAlign, alignItems: ALIGN[textAlign], fontFamily: FONT[fontFamily] }}
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
        </div>
        <Button
          size={descriptionSize}
          radius={buttonRadius}
          hoverRadius={buttonHoverRadius}
          opacity={buttonOpacity}
          className="home-card__button"
          style={{ alignSelf: ALIGN[textAlign], fontFamily: FONT[fontFamily] }}
        />
      </div>
    </div>
  );
}
