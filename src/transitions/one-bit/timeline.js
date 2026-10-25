// Maps time to a frame. Pure, so the live player and the Storybook scrubber
// produce the same frame for the same time.
//
// Every frame is described in forward terms ({ name, t }); reverse simply walks
// the phases backwards with t running 1 → 0, so it is the same mechanism played back.
//
// Forward:
//   dither    the source page flips to 1-bit through a Bayer mask
//   out       the source's content disappears pixel by pixel; the background starts changing
//   in        the destination's content appears pixel by pixel; the background finishes changing
//   undither  the destination flips from 1-bit to the live page through the same mask
// The two pages never share the screen, and the background moves in one smooth
// fade across out + in.

export const PHASES = ['dither', 'out', 'in', 'undither'];

/**
 * @param {{ dither:number, out:number, in:number, undither:number, crossfade:number }} durations ms
 * @param {'forward'|'reverse'|'crossfade'} mode
 */
export function buildTimeline(durations, mode = 'forward') {
  const reversed = mode === 'reverse';
  let names;
  if (mode === 'crossfade') names = ['fade'];
  else names = reversed ? [...PHASES].reverse() : PHASES;

  let time = 0;
  const phases = [];
  for (const name of names) {
    const duration = Math.max(0, Number(name === 'fade' ? durations.crossfade : durations[name]) || 0);
    if (duration === 0) continue;
    phases.push({ name, start: time, end: time + duration, duration });
    time += duration;
  }

  // The page swaps once the overlay fully covers the screen, and the new page
  // must be captured before the frames that show its content.
  //   forward: swap after the dither; the destination is needed from 'in'.
  //   reverse: swap after the source has turned 1-bit; the destination is
  //            needed from 'out' (its content appearing, played backwards).
  // Crossfade swaps before the first frame.
  const end = (name) => phases.find((p) => p.name === name)?.end ?? 0;
  const start = (name) => phases.find((p) => p.name === name)?.start ?? time;
  let commitAt = 0;
  let gateAt = 0;
  if (mode === 'forward') {
    commitAt = end('dither');
    gateAt = start('in');
  } else if (reversed) {
    commitAt = end('undither');
    gateAt = start('out');
  }
  return { mode, reversed, phases, total: time, commitAt, gateAt };
}

/** The frame at `ms` into the timeline: { name, t, index }, with t in forward terms. */
export function frameAt(timeline, ms) {
  const { phases, total, reversed } = timeline;
  if (!phases.length) return { name: 'done', t: 1, index: -1 };
  const time = Math.min(total, Math.max(0, ms));
  let index = phases.findIndex((p) => time < p.end);
  if (index === -1) index = phases.length - 1;
  const phase = phases[index];
  const local = Math.min(1, (time - phase.start) / phase.duration);
  return { name: phase.name, t: reversed ? 1 - local : local, index };
}

/** The frame at a 0–1 position across the whole timeline (the scrubber). */
export function frameAtProgress(timeline, progress) {
  return frameAt(timeline, Math.min(1, Math.max(0, progress)) * timeline.total);
}
