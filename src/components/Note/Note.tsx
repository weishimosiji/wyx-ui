import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import './index.scss';
import { getBoxRect, addRecord, setBoxDragOver, getBoxBodyRect } from '../NoteBox/api';
import { spawnFlipGhost } from '../../utils/flip';
import DeleteIcon from '../Icons/DeleteIcon';

export interface NoteProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  draggable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  createdAt?: number | Date;
}

const Note: React.FC<NoteProps> = ({
  open,
  onClose,
  title,
  children,
  width = 360,
  height,
  draggable = true,
  className,
  style,
  priority = 'normal',
  createdAt
}) => {
  const [priorityState, setPriorityState] = useState(priority);
  const noteRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    width: number;
    height: number;
  } | null>(null);
  const [justOpened, setJustOpened] = useState(true);
  const [overBox, setOverBox] = useState(false);
  const createdAtRef = useRef<number>(
    typeof createdAt === 'number' ? createdAt : createdAt instanceof Date ? createdAt.getTime() : Date.now()
  );

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

  useEffect(() => {
    if (open) {
      setPos(null); // Default top-right positioning when opened
      const t = window.setTimeout(() => setJustOpened(false), 240);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

  const onMouseDownHeader = (e: React.MouseEvent) => {
    if (!draggable || !noteRef.current) return;
    e.preventDefault();
    const rect = noteRef.current.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      width: rect.width,
      height: rect.height,
    };
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      const maxX = window.innerWidth - dragState.current.width;
      const maxY = window.innerHeight - dragState.current.height;
      const next = {
        x: clamp(dragState.current.origX + dx, 0, Math.max(0, maxX)),
        y: clamp(dragState.current.origY + dy, 0, Math.max(0, maxY)),
      };
      setPos(next);
      // Highlight NoteBox during dragging
      try {
        const boxRect = getBoxRect();
        if (boxRect) {
          const overlaps = next.x < boxRect.right && next.x + dragState.current.width > boxRect.left && next.y < boxRect.bottom && next.y + dragState.current.height > boxRect.top;
          setBoxDragOver(!!overlaps);
          setOverBox(!!overlaps);
        }
      } catch {}
    };

    const onUp = () => {
      // Detect if dragged onto NoteBox, if so record and play FLIP animation
      try {
        const boxRect = getBoxRect();
      if (boxRect && noteRef.current) {
          const rect = noteRef.current.getBoundingClientRect();
          const overlaps = rect.left < boxRect.right && rect.right > boxRect.left && rect.top < boxRect.bottom && rect.bottom > boxRect.top;
          if (overlaps) {
            const titleText = typeof title === 'string' ? title : 'Note';
            const contentEl = noteRef.current.querySelector('.wyx-ui_note-content') as HTMLElement | null;
            const contentText = contentEl ? (contentEl as HTMLElement).innerText?.trim() || (contentEl as HTMLElement).textContent?.trim() || '' : '';
            addRecord({ id: `note-${Date.now()}`, title: titleText, content: contentText, time: createdAtRef.current, priority: priorityState });
            const targetRect = getBoxBodyRect() || boxRect;
            spawnFlipGhost(noteRef.current, targetRect);
            onClose?.();
          }
        }
      } catch {}
      setBoxDragOver(false);
      setOverBox(false);
      dragState.current = null;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (!open) return null;

  const node = (
    <div className="wyx-ui_note-root">
      <div
        ref={noteRef}
        className={`wyx-ui_note ${className || ''} ${justOpened ? 'wyx-ui_note--enter' : ''} ${overBox ? 'wyx-ui_note--over-box' : ''}`}
        style={{
          position: 'fixed',
          width,
          height,
          top: pos ? pos.y : 24,
          left: pos ? pos.x : undefined,
          right: pos ? undefined : 24,
          ...style,
        }}
        role="dialog"
        aria-modal="false"
      >
        <div
          className={`wyx-ui_note-header ${draggable ? 'wyx-ui_note-header--draggable' : ''}`}
          onMouseDown={onMouseDownHeader}
        >
          <div className="wyx-ui_note-title-wrap">
            <div className="wyx-ui_note-title">{title}</div>
            <span
              className={`wyx-ui_note-priority wyx-ui_note-priority--${priorityState}`}
            role="button"
            tabIndex={0}
            title="Toggle Priority"
            onClick={() => setPriorityState(cyclePriority(priorityState))}
          >
            {priorityState === 'urgent' ? 'Urgent' : priorityState === 'high' ? 'High' : priorityState === 'low' ? 'Low' : 'Normal'}
          </span>
          </div>
          {onClose && (
            <button
              type="button"
              className="wyx-ui_note-close"
              aria-label="Close"
              onClick={onClose}
            >
              <DeleteIcon />
            </button>
          )}
        </div>
        <div className="wyx-ui_note-body">
          <div className="wyx-ui_note-content">{children}</div>
          <span className="wyx-ui_note-date">{formatDate(createdAtRef.current)}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};


export function openNote(options: Omit<NoteProps, 'open'>) {
  const containerId = 'wyx-ui-note-root';
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

  const { ...restOptions } = options;

  root.render(
    <Note
      open={true}
      {...restOptions}
      onClose={handleClose}
    />
  );

  return { close: handleClose };
}

export default Note;
  const cyclePriority = (p: 'low' | 'normal' | 'high' | 'urgent') => {
    switch (p) {
      case 'low': return 'normal';
      case 'normal': return 'high';
      case 'high': return 'urgent';
      case 'urgent': return 'low';
      default: return 'normal';
    }
  };
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };