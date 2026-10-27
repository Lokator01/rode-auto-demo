export const INTRO_HOLD_SECONDS = 1;
export const REVEAL_SECONDS = 5.8;
export const AUTO_ROTATION_SPEED = (Math.PI * 2) / 120;

export function revealProgress(elapsed) {
  const t = Math.max(0, Math.min(1, elapsed / REVEAL_SECONDS));
  return t * t * (3 - 2 * t);
}

export function rotationStep(delta, sinceInteraction) {
  const blend = Math.max(0, Math.min(1, (sinceInteraction - 2) / 1.2));
  return AUTO_ROTATION_SPEED * delta * blend * blend * (3 - 2 * blend);
}
