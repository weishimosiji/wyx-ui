import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

export interface ImagePreviewProps {
  open: boolean;
  src: string;
  alt?: string;
  onClose?: () => void;
  preOpen?: boolean;
  disableFlip?: boolean;
  targetW?: number;
  targetH?: number;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ open, src, alt, onClose, preOpen, disableFlip, targetW, targetH }) => {
  const [closing, setClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!(open || preOpen)) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setClosing(true); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, preOpen]);

  useEffect(() => {
    if (!closing) return;
    const el = overlayRef.current;
    if (!el) { onClose?.(); return; }
    const onEnd = () => onClose?.();
    el.addEventListener('transitionend', onEnd, { once: true });
    const t = window.setTimeout(() => onClose?.(), 360);
    return () => window.clearTimeout(t);
  }, [closing, onClose]);

  if (!open && !preOpen && !closing) return null;

  const isOpen = (open || preOpen) && !closing;

  return (
    <div
      ref={overlayRef}
      className={`wyx-ui_image-preview ${isOpen ? 'wyx-ui_image-preview--open' : ''} ${closing ? 'wyx-ui_image-preview--closing' : ''} ${disableFlip ? 'wyx-ui_image-preview--no-flip' : ''} ${preOpen ? 'wyx-ui_image-preview--pre' : ''}`}
      onClick={() => { if (open && !closing) setClosing(true); }}
      aria-hidden={!open}
    >
      {(open || preOpen) && (
        <img
          src={src}
          alt={alt}
          style={typeof targetW === 'number' && typeof targetH === 'number' ? { width: targetW, height: targetH } : undefined}
        />
      )}
    </div>
  );
};

export interface OpenImagePreviewOptions {
  src: string;
  alt?: string;
  originRect?: DOMRect;
}

export function openImagePreview({ src, alt, originRect }: OpenImagePreviewOptions) {
  const containerId = 'wyx-ui-image-preview-root';
  let container = document.getElementById(containerId) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  const host = document.createElement('div');
  container.appendChild(host);
  const root = createRoot(host);

  const close = () => {
    try { root.unmount(); } catch {}
    try { host.remove(); } catch {}
    if (container && container.childElementCount === 0) {
      try { container.remove(); } catch {}
    }
  };

  const mountOverlay = (pre = false, size?: { w: number; h: number }) => {
    root.render(<ImagePreview open={!pre} preOpen={pre} disableFlip={true} src={src} alt={alt} onClose={close} targetW={size?.w} targetH={size?.h} />);
  };

  if (originRect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxW = vw * 0.92;
    const maxH = vh * 0.92;

    const ghost = document.createElement('img');
    ghost.src = src;
    ghost.className = 'wyx-ui_image-ghost';
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${originRect.left}px`,
      top: `${originRect.top}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transform: `translate3d(0,0,0) scale(1)`,
      zIndex: '1004',
    } as CSSStyleDeclaration);
    ghost.style.transformOrigin = 'top left';
    ghost.style.transition = 'transform 420ms cubic-bezier(.22, 1, .36, 1)';
    document.body.appendChild(ghost);
    const startTransform = (natW: number, natH: number) => {
      const ratio = natW > 0 && natH > 0 ? (natW / natH) : (originRect.width / Math.max(1, originRect.height));
      let finalW = maxW;
      let finalH = finalW / ratio;
      if (finalH > maxH) {
        finalH = maxH;
        finalW = finalH * ratio;
      }
      mountOverlay(true, { w: finalW, h: finalH });

      requestAnimationFrame(() => {
        const imgEl = document.querySelector('.wyx-ui_image-preview img') as HTMLImageElement | null;
        const r = imgEl ? imgEl.getBoundingClientRect() : null;
        const dx = (r ? r.left : (vw - finalW) / 2) - originRect.left;
        const dy = (r ? r.top : (vh - finalH) / 2) - originRect.top;
        const sx = (r ? r.width : finalW) / originRect.width;
        const sy = (r ? r.height : finalH) / originRect.height;
        requestAnimationFrame(() => {
          ghost.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
        });
      });
      const onEnd = () => {
        mountOverlay(false, { w: finalW, h: finalH });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try { ghost.remove(); } catch {}
          });
        });
      };
      ghost.addEventListener('transitionend', onEnd, { once: true });
      const t = window.setTimeout(onEnd, 460);
    };

    if (ghost.complete && ghost.naturalWidth && ghost.naturalHeight) {
      startTransform(ghost.naturalWidth, ghost.naturalHeight);
    } else {
      ghost.addEventListener('load', () => startTransform(ghost.naturalWidth || 0, ghost.naturalHeight || 0), { once: true });
      // fallback if load fails
      window.setTimeout(() => startTransform(0, 0), 300);
    }

    return { close };
  }

  mountOverlay(false);

  return { close };
}

export default ImagePreview;