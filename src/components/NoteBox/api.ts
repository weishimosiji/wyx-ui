export interface NoteRecord {
  id: string;
  title: string;
  content?: string;
  time: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

let records: NoteRecord[] = [];
const subscribers = new Set<(rs: NoteRecord[]) => void>();
let useStorage = false;
const STORAGE_KEY = 'wyx-ui-note-box-records';

export function subscribe(fn: (rs: NoteRecord[]) => void) {
  subscribers.add(fn);
  // Initial push
  try { fn(records.slice()); } catch {}
  return () => subscribers.delete(fn);
}

function notify() {
  const snapshot = records.slice();
  subscribers.forEach(fn => {
    try { fn(snapshot); } catch {}
  });
  if (useStorage) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
  }
}

export function addRecord(record: NoteRecord) {
  records.push(record);
  notify();
}

export function updateRecordPriority(id: string, priority: NoteRecord['priority']) {
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], priority };
    notify();
  }
}

export function removeRecord(id: string) {
  records = records.filter(r => r.id !== id);
  notify();
}

export function clearRecords() {
  records = [];
  notify();
}

export function getRecords() {
  return records.slice();
}

// Internal sorting APIs (moveRecord / swapRecord) have been removed

let mounted = false;
export function setBoxMounted(v: boolean) { mounted = v; }
export function isBoxMounted() { return mounted; }

export function getBoxElement(): HTMLElement | null {
  return document.getElementById('wyx-ui-note-box') || null;
}
export function getBoxRect(): DOMRect | null {
  const el = getBoxElement();
  return el ? el.getBoundingClientRect() : null;
}
export function getBoxBodyRect(): DOMRect | null {
  const el = getBoxElement();
  const body = el?.querySelector('.wyx-ui_note-box-body') as HTMLElement | null;
  return body ? body.getBoundingClientRect() : null;
}

export function setBoxDragOver(active: boolean) {
  const el = getBoxElement();
  if (!el) return;
  if (active) el.classList.add('wyx-ui_note-box--drag-over');
  else el.classList.remove('wyx-ui_note-box--drag-over');
}

export function setUseStorage(v: boolean) {
  useStorage = !!v;
  if (useStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          records = arr;
          notify();
        }
      }
    } catch {}
  }
}
export function getUseStorage() { return useStorage; }