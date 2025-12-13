export interface FlipOptions {
  duration?: number;
  easing?: string;
  fadeOut?: boolean;
  zIndex?: number;
}

export function spawnFlipGhost(sourceEl: HTMLElement, toRect: DOMRect, options: FlipOptions = {}) {
  const { duration = 320, easing = 'ease', fadeOut = true, zIndex = 2000 } = options;
  const rect = sourceEl.getBoundingClientRect();

  const ghost = sourceEl.cloneNode(true) as HTMLElement;
  const style = ghost.style as CSSStyleDeclaration;
  style.position = 'fixed';
  style.top = rect.top + 'px';
  style.left = rect.left + 'px';
  style.width = rect.width + 'px';
  style.height = rect.height + 'px';
  style.margin = '0';
  style.zIndex = String(zIndex);
  style.pointerEvents = 'none';
  style.transformOrigin = 'top left';
  if (fadeOut) style.opacity = '1';

  document.body.appendChild(ghost);

  const dx = toRect.left - rect.left;
  const dy = toRect.top - rect.top;
  const sx = toRect.width / rect.width;
  const sy = toRect.height / rect.height;

  ghost.animate([
    { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: fadeOut ? 0 : 1 }
  ], {
    duration,
    easing,
    fill: 'forwards'
  }).onfinish = () => {
    try { ghost.remove(); } catch {}
  };
}