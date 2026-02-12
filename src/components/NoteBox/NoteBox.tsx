import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import './index.scss';
import { NoteRecord, subscribe, setBoxMounted, getRecords, isBoxMounted, getBoxElement, removeRecord, setUseStorage } from './api';
import { openNote } from '../Note/Note';
import IconBtn from '../AnimateBtns/IconBtn/IconBtn';
import CloseIcon from '../Icons/CloseIcon';
import DeleteIcon from '../Icons/DeleteIcon';
import MinimizeIcon from '../Icons/MinimizeIcon';
import MaximizeIcon from '../Icons/MaximizeIcon';
import ExportIcon from '../Icons/ExportIcon';
import EditIcon from '../Icons/EditIcon';

export interface NoteBoxProps {
  open: boolean;
  title?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
  persist?: boolean;
  emptyText?: React.ReactNode;
}

const NoteBox: React.FC<NoteBoxProps> = ({
  open,
  title = 'Note Box',
  width = 280,
  height = 280,
  className,
  style,
  onClose,
  persist,
  emptyText = 'No records yet. Drag Note here to add.',
}) => {
  type PinCorner = 'lt' | 'rt' | 'lb' | 'rb';
  type PinState = { corner: PinCorner; left?: number; top?: number; right?: number; bottom?: number } | null;

  const [records, setRecords] = useState<NoteRecord[]>(getRecords());
  const [justOpened, setJustOpened] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [pin, setPin] = useState<PinState>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    width: number;
    height: number;
  } | null>(null);
  const moveHandlerRef = useRef<((ev: MouseEvent) => void) | null>(null);
  const upHandlerRef = useRef<(() => void) | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(0);
  const isTitleEditable = typeof title === 'string' || typeof title === 'number';
  const [editingTitle, setEditingTitle] = useState(false);
  const editStartTitleRef = useRef('');
  const [titleText, setTitleText] = useState(() => (isTitleEditable ? String(title) : ''));

  useEffect(() => {
    if (!open) return;
    setBoxMounted(true);
    setUseStorage(!!persist);
    const unsub = subscribe(rs => setRecords(rs));
    setJustOpened(true);
    const t = window.setTimeout(() => setJustOpened(false), 240);
    return () => {
      setBoxMounted(false);
      unsub();
      window.clearTimeout(t);
    };
  }, [open, persist]);

  const resolveSizePx = (value: number | string | undefined, axis: 'x' | 'y') => {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    const v = value.trim();
    if (!v) return null;
    if (/^-?\d+(\.\d+)?px$/.test(v)) return parseFloat(v);
    if (/^-?\d+(\.\d+)?vw$/.test(v)) return (window.innerWidth * parseFloat(v)) / 100;
    if (/^-?\d+(\.\d+)?vh$/.test(v)) return (window.innerHeight * parseFloat(v)) / 100;
    if (/^-?\d+(\.\d+)?%$/.test(v)) {
      const ratio = parseFloat(v) / 100;
      return (axis === 'x' ? window.innerWidth : window.innerHeight) * ratio;
    }
    try {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      if (axis === 'x') el.style.width = v;
      else el.style.height = v;
      document.body.appendChild(el);
      const rect = el.getBoundingClientRect();
      el.remove();
      return axis === 'x' ? rect.width : rect.height;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (open) setMinimized(false);
  }, [open]);

  const getPinCornerByQuadrants = (x: number, y: number): PinCorner => {
    const isLeft = x < window.innerWidth / 2;
    const isTop = y < window.innerHeight / 2;
    if (isLeft && isTop) return 'lt';
    if (!isLeft && isTop) return 'rt';
    if (isLeft && !isTop) return 'lb';
    return 'rb';
  };

  const getTransformOriginForCorner = (corner: PinCorner): React.CSSProperties['transformOrigin'] => {
    switch (corner) {
      case 'lt': return 'left top';
      case 'rt': return 'right top';
      case 'lb': return 'left bottom';
      case 'rb': return 'right bottom';
      default: return 'left top';
    }
  };

  const getPinFromRect = (rect: DOMRect, corner: PinCorner): NonNullable<PinState> => {
    switch (corner) {
      case 'lt':
        return { corner, left: rect.left, top: rect.top };
      case 'rt':
        return { corner, right: window.innerWidth - rect.right, top: rect.top };
      case 'lb':
        return { corner, left: rect.left, bottom: window.innerHeight - rect.bottom };
      case 'rb':
        return { corner, right: window.innerWidth - rect.right, bottom: window.innerHeight - rect.bottom };
      default:
        return { corner: 'lt', left: rect.left, top: rect.top };
    }
  };

  const getComputedTransformOrigin = (): React.CSSProperties['transformOrigin'] => {
    if (pin) return getTransformOriginForCorner(pin.corner);
    const targetW = resolveSizePx(width, 'x');
    const targetH = resolveSizePx(height, 'y');

    if (targetW != null && targetH != null) {
      const anchor = { x: window.innerWidth - targetW - 24, y: window.innerHeight - targetH - 24 };
      return getTransformOriginForCorner(getPinCornerByQuadrants(anchor.x, anchor.y));
    }

    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      return getTransformOriginForCorner(getPinCornerByQuadrants(rect.left, rect.top));
    }

    return 'left top';
  };

  useEffect(() => {
    if (minimized) {
      setEditingTitle(false);
    }
  }, [minimized]);

  useEffect(() => {
    if (!pin) return;
    const raf = window.requestAnimationFrame(() => {
      if (!boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      const nextLeft = clamp(rect.left, 0, Math.max(0, maxX));
      const nextTop = clamp(rect.top, 0, Math.max(0, maxY));
      if (nextLeft !== rect.left || nextTop !== rect.top) {
        setPin(getPinFromRect(new DOMRect(nextLeft, nextTop, rect.width, rect.height), pin.corner));
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pin, minimized, width, height, headerH]);

  const toggleMinimized = () => {
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      const corner = getPinCornerByQuadrants(rect.left, rect.top);
      setPin(getPinFromRect(rect, corner));
    }
    if (!minimized) {
      setMinimized(true);
      return;
    }
    setMinimized(false);
  };

  useEffect(() => {
    if (isTitleEditable) setTitleText(String(title));
  }, [isTitleEditable, title]);

  useEffect(() => {
    return () => {
      if (moveHandlerRef.current) document.removeEventListener('mousemove', moveHandlerRef.current);
      if (upHandlerRef.current) document.removeEventListener('mouseup', upHandlerRef.current);
      document.body.style.userSelect = '';
    };
  }, []);

  useEffect(() => {
    const m = () => {
      if (headerRef.current) {
        try { setHeaderH(headerRef.current.getBoundingClientRect().height || 0); } catch {}
      }
    };
    const id = window.setTimeout(m, 0);
    return () => window.clearTimeout(id);
  }, [open, title, titleText, editingTitle]);

  if (!open) return null;

  const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

  const onMouseDownHeader = (e: React.MouseEvent) => {
    if (!boxRef.current) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('.wyx-ui_note-box-header-actions')) return;
    if (target?.closest('.wyx-ui_note-box-title-edit-btn')) return;
    if (!minimized) {
      if (target?.closest('.wyx-ui_note-box-title-input')) return;
      if (target?.closest('.wyx-ui_note-box-title-text')) return;
    }
    e.preventDefault();
    const rect = boxRef.current.getBoundingClientRect();
    setPin({ corner: 'lt', left: rect.left, top: rect.top });
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      width: rect.width,
      height: rect.height,
    };
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      const maxX = window.innerWidth - dragState.current.width;
      const maxY = window.innerHeight - dragState.current.height;
      const nextLeft = clamp(dragState.current.origX + dx, 0, Math.max(0, maxX));
      const nextTop = clamp(dragState.current.origY + dy, 0, Math.max(0, maxY));
      setPin({ corner: 'lt', left: nextLeft, top: nextTop });
    };

    const onUp = () => {
      dragState.current = null;
      document.body.style.userSelect = '';
      if (moveHandlerRef.current) document.removeEventListener('mousemove', moveHandlerRef.current);
      if (upHandlerRef.current) document.removeEventListener('mouseup', upHandlerRef.current);
      moveHandlerRef.current = null;
      upHandlerRef.current = null;
    };

    moveHandlerRef.current = onMove;
    upHandlerRef.current = onUp;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const priorityOrder: Record<NonNullable<NoteRecord['priority']>, number> = {
    urgent: 3,
    high: 2,
    normal: 1,
    low: 0,
  };
  const displayRecords = records.slice().sort((a, b) => {
    const pa = priorityOrder[(a.priority || 'normal') as NonNullable<NoteRecord['priority']>];
    const pb = priorityOrder[(b.priority || 'normal') as NonNullable<NoteRecord['priority']>];
    if (pb !== pa) return pb - pa;
    return (b.time || 0) - (a.time || 0);
  });

  const minWidth = typeof width === 'number' ? width / 2 : `calc(${width} / 2)`;
  const headerMinH = headerH || 42;

  const node = (
    <div className="wyx-ui_note-box-root">
      <div
        id="wyx-ui-note-box"
        ref={boxRef}
        className={`wyx-ui_note-box ${className || ''} ${justOpened ? 'wyx-ui_note-box--enter' : ''} ${minimized ? 'wyx-ui_note-box--minimized' : ''}`}
        style={{
          position: 'fixed',
          top: pin?.top,
          left: pin?.left,
          right: pin?.right ?? (pin ? undefined : 24),
          bottom: pin?.bottom ?? (pin ? undefined : 24),
          width: minimized ? minWidth : width,
          height: minimized ? headerMinH : height,
          transformOrigin: getComputedTransformOrigin(),
          ...style,
        }}
        aria-live="polite"
      >
        <div className="wyx-ui_note-box-header" ref={headerRef} onMouseDown={onMouseDownHeader}>
          <div className="wyx-ui_note-box-title">
            {!minimized && isTitleEditable ? (
              editingTitle ? (
                <input
                  className="wyx-ui_note-box-title-input"
                  value={titleText}
                  autoFocus
                  onChange={(ev) => setTitleText(ev.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                      (ev.target as HTMLInputElement).blur();
                    } else if (ev.key === 'Escape') {
                      setTitleText(editStartTitleRef.current);
                      setEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <span className="wyx-ui_note-box-title-edit">
                  <span className="wyx-ui_note-box-title-text">{titleText}</span>
                  <button
                    type="button"
                    className="wyx-ui_note-box-title-edit-btn"
                    aria-label="Edit title"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      editStartTitleRef.current = titleText;
                      setEditingTitle(true);
                    }}
                    onMouseDown={(ev) => ev.stopPropagation()}
                  >
                    <EditIcon width={14} height={14} />
                  </button>
                </span>
              )
            ) : (
              title
            )}
          </div>
          <div className="wyx-ui_note-box-header-actions">
            <div
              className="wyx-ui_note-box-minimize"
              aria-label={minimized ? 'Restore' : 'Minimize'}
              onClick={toggleMinimized}
            >{minimized
              ? <IconBtn width={24} height={24} icon={<MaximizeIcon />} />
              : <IconBtn width={24} height={24} icon={<MinimizeIcon />} />}</div>
            {onClose && (
              <div className="wyx-ui_note-box-close" aria-label="Close" onClick={onClose}>
                <IconBtn width={24} height={24} icon={<CloseIcon />} />
              </div>
            )}
          </div>
        </div>
        <div className="wyx-ui_note-box-body">
          {displayRecords.length === 0 ? (
            <div className="wyx-ui_note-box-empty">{emptyText}</div>
          ) : (
            <ul className="wyx-ui_note-box-list">
              {displayRecords.map(r => (
                <li
                  key={r.id}
                  className={`wyx-ui_note-box-record wyx-ui_note-box-record--priority-${(r.priority || 'normal')}`}
                  data-id={r.id}
                >
                  <div className="wyx-ui_note-box-record-title">
                    {r.title}
                  </div>
                  {r.content && <div className="wyx-ui_note-box-record-content">{r.content}</div>}
                  <div className="wyx-ui_note-box-record-meta">
                    <div className="wyx-ui_note-box-record-time">{new Date(r.time).toLocaleString()}</div>
                    <div className="wyx-ui_note-box-record-actions">
                      <div
                        className="wyx-ui_note-box-action wyx-ui_note-box-action--open"
                        onClick={() => { openNote({ title: r.title, children: r.content || '', priority: r.priority || 'normal', createdAt: r.time }); removeRecord(r.id); }}
                      >
                        <IconBtn width={24} height={24} icon={<ExportIcon />} />
                      </div>
                      <div
                        className="wyx-ui_note-box-action wyx-ui_note-box-action--delete"
                        onClick={() => removeRecord(r.id)}
                      >
                        <IconBtn width={24} height={24} icon={<DeleteIcon />} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export interface OpenNoteBoxOptions extends Omit<NoteBoxProps, 'open'> {}
export interface OpenNoteBoxResult { close?: () => void; existed?: boolean }

export function openNoteBox(options: OpenNoteBoxOptions = {}): OpenNoteBoxResult {
  if (isBoxMounted() || getBoxElement()) {
    if (typeof options.persist === 'boolean') setUseStorage(!!options.persist);
    return { existed: true };
  }
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
      try { container.remove(); } catch {}
    }
  };

  root.render(
    <NoteBox open={true} {...options} onClose={handleClose} />
  );

  return { close: handleClose };
}



export default NoteBox;
