import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';

interface MessageOptions {
  type: 'info' | 'success' | 'error';
  text: string | React.ReactNode;
  duration?: number;
}

interface CustomMessageOptions {
  type: 'custom';
  text: string | React.ReactNode;
  duration?: number;
  icon: React.ReactNode;
}

function MessageBox(props: MessageOptions | CustomMessageOptions) {
  const { type = 'info', text } = props;
  return (
    <div
      className={`wyx-ui_message wyx-ui wyx-ui_message--${type}`}
    >
      <div className="wyx-message_icon">
        {type === 'info' && <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="var(--primary-text)" strokeWidth="5" fill="none" />
          <path d="M 50,45 L 50,70" strokeLinecap="round" stroke="var(--primary-text)" strokeWidth="7" />
          <circle cx="50" cy="30" r="4" fill="var(--primary-text)" />
        </svg>}
        {type === 'success' && <svg viewBox="0 0 150 150">
          <path className="wyx-message_check-path" d="M40,75 L65,100 L110,55" />
        </svg>}
        {type === 'error' && <svg viewBox="0 0 150 150">
          <path stroke="red" strokeWidth="10" className="wyx-message_x-path1" d="M40,40 L110,110" />
          <path stroke="red" strokeWidth="10" className="wyx-message_x-path2" d="M110,40 L40,110" />
        </svg>}
        {type === 'custom' && (props as CustomMessageOptions).icon}
      </div>
      <span>{text}</span>
    </div>
  );
}

function ensureContainer() {
  const cls = 'wyx-ui-message_container';
  let container = document.querySelector(`.${cls}`) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.classList.add(cls);
    document.body.appendChild(container);
  }
  return container;
}

function Message(options: MessageOptions | CustomMessageOptions) {
  const { duration = 3000 } = options;
  const container = ensureContainer();
  const host = document.createElement('div');
  host.classList.add('wyx-ui-message_wrapper');
  container.appendChild(host);

  const root = createRoot(host);
  root.render(<MessageBox {...options} />);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      host.classList.add('wyx-ui-message_enter');
    });
  });

  window.setTimeout(() => {
    host.style.height = `${host.offsetHeight}px`;
    // Force reflow
    host.offsetHeight; 
    
    host.classList.remove('wyx-ui-message_enter');
    requestAnimationFrame(() => {
      host.style.height = '0px';
    });
    
    host.addEventListener('transitionend', (e) => {
      if (e.target === host) {
        root.unmount();
        host.remove();
        if (container.childNodes.length === 0) {
          container.remove();
        }
      }
    });
  }, duration);
}

function sendMessage(text: string | React.ReactNode, type: MessageOptions['type'], duration?: number) {
  Message({ type, text, duration });
}

export default {
  info: (text: string | React.ReactNode, duration?: number) => sendMessage(text, 'info', duration),
  success: (text: string | React.ReactNode, duration?: number) => sendMessage(text, 'success', duration),
  error: (text: string | React.ReactNode, duration?: number) => sendMessage(text, 'error', duration),
  custom: (options: Omit<CustomMessageOptions, 'type'>) => Message({ type: 'custom', ...options }),
};
