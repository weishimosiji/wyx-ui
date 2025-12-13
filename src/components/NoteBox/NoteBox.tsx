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
  const [records, setRecords] = useState<NoteRecord[]>(getRecords());
  const [justOpened, setJustOpened] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(0);

  

  // NoteBox internal list drag sorting logic has been removed
  
  useEffect(() => {
    if (!open) return;
    setBoxMounted(true);
    setUseStorage(!!persist);
    const unsub = subscribe(rs => setRecords(rs));
    // Entrance animation state, removed after 240ms when opened
    setJustOpened(true);
    const t = window.setTimeout(() => setJustOpened(false), 240);
    return () => {
      setBoxMounted(false);
      unsub();
      window.clearTimeout(t);
    };
  }, [open, persist]);

  useEffect(() => {
    if (open) setMinimized(false);
  }, [open]);

  useEffect(() => {
    const m = () => {
      if (headerRef.current) {
        try { setHeaderH(headerRef.current.getBoundingClientRect().height || 0); } catch {}
      }
    };
    const id = window.setTimeout(m, 0);
    return () => window.clearTimeout(id);
  }, [open, title]);

  if (!open) return null;

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
        className={`wyx-ui_note-box ${className || ''} ${justOpened ? 'wyx-ui_note-box--enter' : ''} ${minimized ? 'wyx-ui_note-box--minimized' : ''}`}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: minimized ? minWidth : width,
          height: minimized ? headerMinH : height,
          ...style,
        }}
        aria-live="polite"
      >
        <div className="wyx-ui_note-box-header" ref={headerRef}>
          <div className="wyx-ui_note-box-title">{title}</div>
          <div className="wyx-ui_note-box-header-actions">
            <div
              className="wyx-ui_note-box-minimize"
              aria-label={minimized ? 'Restore' : 'Minimize'}
              onClick={() => setMinimized(v => !v)}
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
  const cyclePriority = (p: NoteRecord['priority'] | undefined) => {
    const val = p || 'normal';
    switch (val) {
      case 'low': return 'normal';
      case 'normal': return 'high';
      case 'high': return 'urgent';
      case 'urgent': return 'low';
      default: return 'normal';
    }
  };