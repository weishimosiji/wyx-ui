import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import './index.scss';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  draggable?: boolean;
  maskClosable?: boolean;
  mask?: boolean;
  className?: string;
  style?: React.CSSProperties;
  footer?: React.ReactNode;
  okText?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  width = 520,
  height,
  draggable = true,
  maskClosable = true,
  mask = true,
  className,
  style,
  footer,
  okText = 'Confirm'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    width: number;
    height: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // useEffect(() => {
  //   if (open) {
  //     setPos(null); // Reset position to default center when opening
  //   }
  // }, [open]);

  const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

  const onMouseDownHeader = (e: React.MouseEvent) => {
    if (!draggable || !modalRef.current) return;
    e.preventDefault();
    const rect = modalRef.current.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setDragging(true);
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      const maxX = window.innerWidth - dragState.current.width;
      const maxY = window.innerHeight - dragState.current.height;
      setPos({
        x: clamp(dragState.current.origX + dx, 0, Math.max(0, maxX)),
        y: clamp(dragState.current.origY + dy, 0, Math.max(0, maxY)),
      });
    };

    const onUp = () => {
      setDragging(false);
      dragState.current = null;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (!open) return null;

  const modalNode = (
    <div className={`wyx-ui_modal-root ${mask ? 'wyx-ui_modal-root--mask' : ''}`}>
      {mask && (
        <div
          className="wyx-ui_modal-overlay"
          onClick={() => maskClosable && onClose?.()}
        />
      )}
      <div
        ref={modalRef}
        className={`wyx-ui_modal ${className || ''} ${dragging ? 'wyx-ui_modal--dragging' : ''}`}
        style={{
          position: 'fixed',
          width,
          height,
          top: pos ? pos.y : '20vh',
          left: pos ? pos.x : '50%',
          transform: pos ? undefined : 'translateX(-50%)',
          ...style,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`wyx-ui_modal-header ${draggable ? 'wyx-ui_modal-header--draggable' : ''}`}
          onMouseDown={onMouseDownHeader}
        >
          <div className="wyx-ui_modal-title">{title}</div>
          {onClose && (
            <button
              type="button"
              className="wyx-ui_modal-close"
              aria-label="Close"
              onClick={onClose}
            >
              <svg className="wyx-icon_fail" viewBox="0 0 150 150">
                <path d="M50,50 L100,100" />
                <path d="M100,50 L50,100" />
              </svg>
            </button>
          )}
        </div>
        <div className="wyx-ui_modal-body">{children}</div>
        
        {footer !== undefined ? (
          <div className="wyx-ui_modal-footer">{footer}</div>
        ) : (<div className="wyx-ui_modal-footer">
          <button onClick={() => onClose?.()} className="wyx-modal_footer-btn">{okText}</button>
        </div>)}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

// Functional Call API
export interface OpenModalOptions extends Omit<ModalProps, 'open' | 'footer'> {
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode);
}

export function openModal(options: OpenModalOptions) {
  const containerId = 'wyx-ui-modal-container';
  let container = document.getElementById(containerId) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  const host = document.createElement('div');
  container.appendChild(host);

  const root = createRoot(host);

  const handleClose = () => {
    try { root.unmount(); } catch {}
    try { host.remove(); } catch {}
    if (container && container.childElementCount === 0) {
      container.remove();
    }
    options.onClose?.();
  };

  const { footer, ...restOptions } = options;
  const footerNode = typeof footer === 'function' ? footer(handleClose) : footer;

  root.render(
    <Modal
      open={true}
      {...restOptions}
      footer={footerNode}
      onClose={handleClose}
    />
  );

  return { close: handleClose };
}

export default Modal;