import './home-cards.css';
import { resolveLogo } from './logos';
import { toBackground, FONT_VARS as FONT } from './cardSchema';
import Button from '../button/Button';
import { spaceVar } from '../../tokens/spacing/spacing.js';

const JUSTIFY = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
const ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end' };

export default function HomeCardShell({
  variant,
  bgDuration,
  visible = true,
  fontFamily = 'inter',
  title,
  headlineVisible = true,
  headlineType,
  description,
  descriptionSize,
  descriptionFontFamily = 'inter',
  descriptionWeight = 'regular',
  textColor,
  logo,
  logoUrl,
  logoAlt = '',
  logoSize,
  width,
  height,
  textPosition,
  textAlign,
  textWidth,
  textWidthUnit = 'px',
  padding,
  hoverPadding = padding,
  logoGap = '16',
  textGap = '8',
  buttonGap = '24',
  radius,
  hoverRadius,
  buttonRadius = 12,
  buttonHoverRadius = 50,
  buttonOpacity = 50,
  buttonLabel = 'View case study',
  buttonFontFamily = 'inter',
  buttonSize = descriptionSize,
  buttonWeight = 'semibold',
  background,
  backgroundEnd,
  hoverBackground,
  hoverBackgroundEnd,
  gradientAngle,
  // Rendered after the description, above the button, for card-specific
  // content that belongs with the text rather than the artwork.
  afterDescription,
  children,
  ...rest
}) {
  if (!visible) return null;
  const Headline = headlineType;
  const logoSrc = logoUrl ?? resolveLogo(logo);
  const style = {
    width,
    height,
    // Narrow screens let the card grow taller than this instead of cutting off text (home-cards.css).
    '--card-height': `${height}px`,
    // Spacing settings are token names from Tokens/Spacing.
    '--card-padding': spaceVar(padding),
    '--card-padding-hover': spaceVar(hoverPadding),
    '--card-logo-gap': spaceVar(logoGap),
    '--card-text-gap': spaceVar(textGap),
    '--card-button-gap': spaceVar(buttonGap),
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
    // The outer box stays square and takes the hover; the surface inside does the
    // rounding. Pointers outside a rounded corner don't count as over an element,
    // so rounding the hover target itself makes the corner flicker on and off.
    <div className={`home-card home-card--${variant}`} style={style} {...rest}>
      <div className="home-card__surface">
        {children}
        <div className="home-card__details">
          {logoSrc && (
            <img
              className="home-card__logo"
              src={logoSrc}
              // The company the logo shows, e.g. "Bolt". Empty marks it decorative.
              alt={logoAlt}
              height={logoSize}
              style={{ alignSelf: ALIGN[textAlign] }}
            />
          )}
          <div
            className="home-card__text"
            // A percentage resolves against the details box's content area, which
            // is the card minus its padding — so the padding is already left out.
            style={{ width: textWidthUnit === 'percent' ? `${textWidth}%` : textWidth, justifyContent: JUSTIFY[textPosition], textAlign, alignItems: ALIGN[textAlign], fontFamily: FONT[fontFamily] }}
          >
            {headlineVisible && (
              <Headline
                style={{
                  fontSize: `var(--font-size-${headlineType})`,
                  lineHeight: `var(--line-height-${headlineType})`,
                  fontWeight: `var(--font-weight-${headlineType})`,
                }}
              >
                {title}
              </Headline>
            )}
            <p
              style={{
                fontSize: `var(--font-size-body-${descriptionSize})`,
                lineHeight: `var(--line-height-body-${descriptionSize})`,
                fontWeight: `var(--font-weight-${descriptionWeight})`,
                fontFamily: FONT[descriptionFontFamily],
              }}
            >
              {description}
            </p>
            {afterDescription}
          </div>
          <Button
            label={buttonLabel}
            // Every card's button reads the same, so the accessible name adds the
            // card title (it starts with the visible text, as WCAG 2.5.3 asks).
            aria-label={title ? `${buttonLabel}: ${title}` : undefined}
            size={buttonSize}
            weight={buttonWeight}
            radius={buttonRadius}
            hoverRadius={buttonHoverRadius}
            opacity={buttonOpacity}
            className="home-card__button"
            style={{ alignSelf: ALIGN[textAlign], fontFamily: FONT[buttonFontFamily] }}
          />
        </div>
      </div>
    </div>
  );
}
