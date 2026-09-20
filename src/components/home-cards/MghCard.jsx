import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';
import { BLOB_LAYERS, blobPathAt, parseBlobPath } from './mghBlobs';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Peak deviation from the resting outline, as a fraction of each blob's radius.
// Enough that bends travel along the outline and the silhouette reads as
// reshaping, but inside the tolerance where the layers keep their nesting.
// Measured against the rendered card over a full turn of the field: 0.15 is
// the last value with no contour crossing at all, 0.16 starts to breach. This
// sits a notch below that, since the card's width and height are adjustable
// and changing them changes the gaps between layers.
const MORPH_AMOUNT = 0.14;

function subscribeToMotionQuery(onChange) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionQuery,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
}

export default function MghCard(props) {
  const uid = useId();
  const pathsRef = useRef([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    // Geometry is parsed once; each frame only re-evaluates the field.
    const geometry = BLOB_LAYERS.map((layer) => parseBlobPath(layer.path));
    // A fresh offset per mount means the layers never start from the same
    // arrangement twice.
    const origin = Math.random() * 1000;
    let frame = 0;

    const draw = (now) => {
      const t = now / 1000 + origin;
      for (let i = 0; i < geometry.length; i += 1) {
        const layer = BLOB_LAYERS[i];
        const node = pathsRef.current[i];
        if (!node) continue;
        // `duration` now sets how far this layer lags the one outside it, not
        // how fast it runs. A lag keeps the contours from breathing in exact
        // lockstep; running them at different rates instead would drift them
        // out of register until an inner outline crossed the one around it.
        node.setAttribute('d', blobPathAt(geometry[i], t + layer.duration * 0.2, MORPH_AMOUNT));
      }
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  return (
    <HomeCardShell variant="mgh" bgDuration="150ms" {...cards.mgh} {...props}>
      {/* One positioned layer per exported blob, largest and faintest first.
          Each keeps its source viewBox so its gradient lands exactly where the
          artwork puts it. The `d` below is only the resting shape — the morph
          rewrites it per frame; the idle/hover placement is a CSS transform on
          the same element, so the two run at once rather than replacing each
          other. */}
      {BLOB_LAYERS.map((layer, index) => (
        <svg
          key={layer.id}
          className={`home-card__blob home-card__blob--${layer.id}`}
          viewBox={`0 0 ${layer.width} ${layer.height}`}
          width={layer.width}
          height={layer.height}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient
              id={`mgh-${layer.id}-${uid}`}
              gradientUnits="userSpaceOnUse"
              {...layer.gradient}
            >
              {layer.stops.map((stop, i) => (
                <stop
                  key={stop.color}
                  offset={i}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </linearGradient>
          </defs>
          <path
            ref={(node) => {
              pathsRef.current[index] = node;
            }}
            d={layer.path}
            fill={`url(#mgh-${layer.id}-${uid})`}
            fillRule="evenodd"
            clipRule="evenodd"
            opacity={layer.opacity}
          />
        </svg>
      ))}
    </HomeCardShell>
  );
}
