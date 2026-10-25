import { useEffect, useRef } from 'react';
import yandexImage from '../../images/yandex.png';
import yandexCover from '../../images/cover.png';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Turntable feel: 33⅓ rpm, a quick spin-up and a long coast to a stop.
// Speed changes linearly, like a platter under constant motor torque or
// bearing friction, and the angle is kept between hovers so the record
// picks up from wherever it came to rest.
const SPIN_SPEED = 200; // deg/s
const SPIN_UP = 0.8; // s from rest to full speed
const SPIN_DOWN = 4; // s from full speed to rest

// Background equalizer. Its energy follows the platter's speed, so the bars
// swell as the record spins up and sink as it coasts down. Each bar mixes two
// slow waves of its own with a shared kick at BEAT_RATE that lands hardest on
// the bass end, which reads as music rather than noise.
const EQ_BARS = 320; // 2px each, enough to span a 640px card; the card clips any extra
const BEAT_RATE = 2; // kicks per second, 120 bpm
const EQ_VOICES = Array.from({ length: EQ_BARS }, (_, i) => {
  const hash = (k) => {
    const x = Math.sin((i + 1) * k) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    bass: 1 - i / (EQ_BARS - 1),
    rate1: 3 + hash(12.9898) * 5,
    rate2: 7 + hash(78.233) * 9,
    phase1: hash(39.425) * Math.PI * 2,
    phase2: hash(93.989) * Math.PI * 2,
  };
});

// Peaks are softened three ways: a curve that rounds off the tallest values,
// a blend with the neighbouring bars so no single bar spikes on its own, and a
// short lag so a kick swells in rather than snapping to its height.
const EQ_SMOOTHING = [1, 2, 3, 2, 1];
const EQ_SMOOTHING_SUM = EQ_SMOOTHING.reduce((a, b) => a + b, 0);
const EQ_LAG = 10; // 1/s, higher follows the beat more tightly

function eqLevel(voice, t, energy) {
  const kick = Math.exp(-((t * BEAT_RATE) % 1) * 6);
  const wave =
    (0.5 + 0.5 * Math.sin(t * voice.rate1 + voice.phase1)) * (0.6 + 0.4 * Math.sin(t * voice.rate2 + voice.phase2));
  const level = 0.1 + 0.45 * wave * (0.75 + 0.25 * voice.bass) + 0.12 * kick * voice.bass;
  const capped = Math.min(1, level);
  return capped * (1 - 0.4 * capped) * energy;
}

export default function YandexCard({ onPointerEnter, onPointerLeave, ...props }) {
  const coverRef = useRef(null);
  const eqRef = useRef(null);
  const spin = useRef({ hovered: false, angle: 0, speed: 0, frame: 0, last: 0 });
  const levels = useRef({ target: new Float32Array(EQ_BARS), shown: new Float32Array(EQ_BARS) });

  useEffect(() => () => cancelAnimationFrame(spin.current.frame), []);

  const tick = (now) => {
    const s = spin.current;
    const dt = Math.min((now - s.last) / 1000, 0.1);
    s.last = now;

    s.speed = s.hovered
      ? Math.min(SPIN_SPEED, s.speed + (SPIN_SPEED / SPIN_UP) * dt)
      : Math.max(0, s.speed - (SPIN_SPEED / SPIN_DOWN) * dt);
    s.angle = (s.angle + s.speed * dt) % 360;
    if (coverRef.current) coverRef.current.style.transform = `rotate(${s.angle}deg)`;

    const energy = s.speed / SPIN_SPEED;
    const bars = eqRef.current?.children ?? [];
    const { target, shown } = levels.current;
    for (let i = 0; i < EQ_BARS; i += 1) target[i] = eqLevel(EQ_VOICES[i], now / 1000, energy);
    const follow = 1 - Math.exp(-EQ_LAG * dt);
    const reach = (EQ_SMOOTHING.length - 1) / 2;
    for (let i = 0; i < bars.length; i += 1) {
      let blended = 0;
      for (let k = 0; k < EQ_SMOOTHING.length; k += 1) {
        const neighbour = Math.min(EQ_BARS - 1, Math.max(0, i + k - reach));
        blended += target[neighbour] * EQ_SMOOTHING[k];
      }
      shown[i] += (blended / EQ_SMOOTHING_SUM - shown[i]) * follow;
      bars[i].style.transform = `scaleY(${shown[i]})`;
    }

    s.frame = s.hovered || s.speed > 0 ? requestAnimationFrame(tick) : 0;
  };

  const handleEnter = (event) => {
    onPointerEnter?.(event);
    const s = spin.current;
    s.hovered = true;
    if (s.frame || window.matchMedia(MOTION_QUERY).matches) return;
    s.last = performance.now();
    s.frame = requestAnimationFrame(tick);
  };

  const handleLeave = (event) => {
    onPointerLeave?.(event);
    spin.current.hovered = false;
  };

  return (
    <HomeCardShell
      variant="yandex"
      bgDuration="3000ms"
      {...cards.yandex}
      {...props}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <div ref={eqRef} className="home-card__eq" aria-hidden="true">
        {EQ_VOICES.map((_, i) => (
          <span key={i} className="home-card__eq-bar" />
        ))}
      </div>
      <img className="home-card__image" src={yandexImage} alt="" />
      <img ref={coverRef} className="home-card__disc" src={yandexCover} alt="" />
    </HomeCardShell>
  );
}
