import { useId, useSyncExternalStore } from 'react';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';
import {
  BLOB_KEY_SPLINES,
  BLOB_KEY_TIMES,
  BLOB_LAYERS,
  BLOB_VIEW_BOX,
} from './mghBlobs';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

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
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <HomeCardShell variant="mgh" bgDuration="150ms" {...cards.mgh} {...props}>
      {/* Background layer. The shape morphing below is driven by SMIL and is
          independent of the hover zoom, which is a CSS transform on this same
          element — the two run at once rather than replacing each other. */}
      <svg
        className="home-card__blobs"
        viewBox={BLOB_VIEW_BOX}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {BLOB_LAYERS.map((layer) => (
            <radialGradient key={layer.id} id={`mgh-blob-${layer.id}-${uid}`} cx="50%" cy="46%" r="64%">
              <stop offset="0%" stopColor={layer.from} />
              <stop offset="100%" stopColor={layer.to} />
            </radialGradient>
          ))}
        </defs>
        {BLOB_LAYERS.map((layer) => (
          <path
            key={layer.id}
            d={layer.values.slice(0, layer.values.indexOf(';'))}
            fill={`url(#mgh-blob-${layer.id}-${uid})`}
            opacity={layer.opacity}
          >
            {!prefersReducedMotion && (
              <animate
                attributeName="d"
                values={layer.values}
                dur={`${layer.duration}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes={BLOB_KEY_TIMES}
                keySplines={BLOB_KEY_SPLINES}
              />
            )}
          </path>
        ))}
      </svg>
    </HomeCardShell>
  );
}
